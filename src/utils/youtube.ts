import type { ShortComment, VideoItem } from '../types';
import { DEFAULT_CHANNELS } from '../data/defaultChannels';

const DEFAULT_CHANNEL_TITLES = new Map(DEFAULT_CHANNELS.map((channel) => [channel.id, channel.title]));

export function getFallbackChannelTitle(channelId: string, fallbackTitle?: string): string {
  const suppliedTitle = fallbackTitle?.trim();
  if (suppliedTitle && isUsableChannelTitle(suppliedTitle)) return suppliedTitle;
  return DEFAULT_CHANNEL_TITLES.get(channelId) || suppliedTitle || `قناة ${channelId.slice(0, 8)}`;
}

function isUsableChannelTitle(title: string): boolean {
  return Boolean(title) && !/^YouTube$/i.test(title) && !/^قناة(?:\s+[A-Z0-9_-]{1,8})?$/i.test(title);
}

export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already a raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
    /[?&]v=([^&#]+)/i,
    /youtu\.be\/([^?&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

/**
 * Helper function to fetch YouTube data through a CORS proxy for static hosting
 */
export function fetchYouTubeData(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  return fetch(proxyUrl, init);
}

interface ChannelFeed {
  channelId: string;
  channelTitle: string;
  avatar: string;
  videos: VideoItem[];
  error?: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#([0-9]+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)));
}

function parseChannelFeed(xml: string, channelId: string, fallbackTitle: string): ChannelFeed {
  const titleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
  const parsedTitle = titleMatch
    ? decodeXml(titleMatch[1].trim()).replace(/^YouTube\s*-\s*/i, '').trim()
    : '';
  const channelTitle = isUsableChannelTitle(parsedTitle) ? parsedTitle : fallbackTitle;
  const videos: VideoItem[] = [];
  const entries = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);

  for (const entry of entries) {
    const entryXml = entry[1];
    const videoIdMatch =
      entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i) ||
      entryXml.match(/<id>yt:video:([^<]+)<\/id>/i);
    if (!videoIdMatch) continue;

    const videoId = videoIdMatch[1].trim();
    const entryTitle = entryXml.match(/<title>([\s\S]*?)<\/title>/i);
    const published = entryXml.match(/<published>([^<]+)<\/published>/i);
    const author = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/i);
    const thumbnail = entryXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    const description = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/i);
    const views = entryXml.match(/<media:statistics[^>]+views=["']([^"']+)["']/i);
    const title = entryTitle ? decodeXml(entryTitle[1].trim()) : 'فيديو بدون عنوان';
    const descriptionText = description ? decodeXml(description[1].trim()) : '';
    const shortText = `${title} ${descriptionText}`.toLowerCase();

    videos.push({
      id: videoId,
      videoId,
      channelId,
      channelTitle,
      title,
      author: author ? decodeXml(author[1].trim()) : channelTitle,
      published: published ? published[1].trim() : new Date().toISOString(),
      thumbnail: thumbnail ? thumbnail[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: descriptionText,
      views: views?.[1],
      isShort: ['#shorts', '#short', 'shorts', 'شورتس', '#reels'].some((marker) => shortText.includes(marker)),
    });
  }

  return {
    channelId,
    channelTitle,
    avatar: `https://unavatar.io/youtube/${channelId}`,
    videos,
  };
}

export async function fetchChannelFeed(
  channelId: string,
  forceFresh = false,
  channelTitle?: string
): Promise<ChannelFeed> {
  const fallbackTitle = getFallbackChannelTitle(channelId, channelTitle);
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const response = await fetchYouTubeData(url, forceFresh ? { cache: 'no-store' } : undefined);
    if (!response.ok) {
      throw new Error(`تعذر جلب خلاصة القناة (${response.status})`);
    }

    const xml = await response.text();
    if (!/<feed(?:\s|>)/i.test(xml)) {
      throw new Error('استجابة خلاصة القناة غير صالحة');
    }
    return parseChannelFeed(xml, channelId, fallbackTitle);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`تعذر جلب خلاصة القناة ${channelId}:`, message);
    return {
      channelId,
      channelTitle: fallbackTitle,
      avatar: `https://unavatar.io/youtube/${channelId}`,
      videos: [],
      error: message,
    };
  }
}

export async function fetchChannelShorts(channelId: string): Promise<VideoItem[]> {
  const url = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/shorts`;
  const response = await fetchYouTubeData(url);
  if (!response.ok) {
    throw new Error(`تعذر جلب الشورتس (${response.status})`);
  }

  const html = await response.text();
  const foundIds = new Set<string>();
  for (const pattern of [
    /"reelWatchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/g,
    /\/shorts\/([a-zA-Z0-9_-]{11})/g,
    /"entityId":"shorts-shelf-item-([a-zA-Z0-9_-]{11})"/g,
  ]) {
    for (const match of html.matchAll(pattern)) foundIds.add(match[1]);
  }

  const channelTitle = getChannelTitleFromPage(html, channelId);
  const now = Date.now();
  return Array.from(foundIds).map((videoId, index) => {
    let title = 'مقطع شورتس';
    let views: string | undefined;
    const indexOfId = html.indexOf(videoId);
    if (indexOfId !== -1) {
      const chunk = html.substring(Math.max(0, indexOfId - 400), Math.min(html.length, indexOfId + 2600));
      const primaryMatch = chunk.match(/"primaryText":\{"content":"([^"]+)"\}/);
      const accessibilityMatch = chunk.match(/"accessibilityText":"([^"]+)"/);
      if (primaryMatch?.[1].trim()) {
        title = decodeXml(primaryMatch[1].trim());
      } else if (accessibilityMatch?.[1].trim()) {
        const accessibilityText = decodeXml(accessibilityMatch[1].trim());
        title =
          accessibilityText.replace(/,?\s*[0-9.,]+\s*(?:ألف|مليون|views|مشاهدة|k|m).*/i, '').trim() ||
          accessibilityText;
      }
      const viewsMatch = accessibilityMatch?.[1].match(/([0-9.,]+\s*(?:ألف|مليون|views|مشاهدة|k|m))/i);
      if (viewsMatch) views = viewsMatch[1];
    }

    return {
      id: videoId,
      videoId,
      channelId,
      channelTitle,
      title,
      author: channelTitle,
      published: new Date(now - (index + 1) * 6 * 60 * 60 * 1000).toISOString(),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: title,
      views,
      isShort: true,
    };
  });
}

function getChannelTitleFromPage(html: string, channelId: string): string {
  const titleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const parsedTitle = titleMatch
    ? decodeXml(titleMatch[1].trim()).replace(/\s*-\s*YouTube\s*$/i, '').trim()
    : '';
  return isUsableChannelTitle(parsedTitle) ? parsedTitle : getFallbackChannelTitle(channelId);
}

export async function resolveYouTubeChannel(query: string): Promise<{
  channelId: string;
  channelTitle: string;
  avatar: string;
}> {
  const directId = query.match(/^(UC[a-zA-Z0-9_-]{22})$/);
  const urlChannelId = query.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  let channelId = directId?.[1] || urlChannelId?.[1];

  if (!channelId) {
    const urlHandle = query.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
    const handle = urlHandle?.[1] || (query.startsWith('@') ? query : `@${query}`);
    const targetUrl = /^https?:\/\//i.test(query)
      ? query
      : `https://www.youtube.com/${handle}`;
    const target = new URL(targetUrl);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(target.hostname)) {
      throw new Error('يُرجى إدخال رابط قناة على YouTube.');
    }
    const response = await fetchYouTubeData(targetUrl);
    if (!response.ok) throw new Error(`تعذر التحقق من القناة (${response.status})`);

    const html = await response.text();
    const idMatch =
      html.match(/itemprop=["']channelId["']\s+content=["'](UC[a-zA-Z0-9_-]{22})["']/i) ||
      html.match(/"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/i) ||
      html.match(/"browseId":\s*"(UC[a-zA-Z0-9_-]{22})"/i) ||
      html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
    channelId = idMatch?.[1];
  }

  if (!channelId) throw new Error('لم نتمكن من العثور على معرّف القناة.');
  const feed = await fetchChannelFeed(channelId);
  return { channelId, channelTitle: feed.channelTitle, avatar: feed.avatar };
}

export async function fetchYouTubeVideoInfo(url: string): Promise<{
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
}> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('رابط يوتيوب غير صالح');
  const oembedUrl = new URL('https://www.youtube.com/oembed');
  oembedUrl.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`);
  oembedUrl.searchParams.set('format', 'json');
  const response = await fetchYouTubeData(oembedUrl.toString());
  if (!response.ok) throw new Error(`تعذر جلب معلومات الفيديو (${response.status})`);
  const data = await response.json();
  return {
    videoId,
    title: data.title || `فيديو ${videoId}`,
    author: data.author_name || 'YouTube',
    thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export async function fetchVideoComments(videoId: string): Promise<ShortComment[]> {
  const instances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
  for (const instance of instances) {
    try {
      const response = await fetchYouTubeData(`${instance}/api/v1/comments/${encodeURIComponent(videoId)}`);
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data.comments) || data.comments.length === 0) continue;
      return data.comments.slice(0, 30).map((comment: any) => ({
        id: comment.commentId || `${videoId}-${Math.random()}`,
        author: comment.author || 'مستخدم',
        text: comment.content || comment.contentHtml || '',
        timeAgo: comment.publishedText || 'مؤخراً',
        likes: comment.likeCount || 0,
        avatar: comment.authorThumbnails?.[0]?.url || '',
      }));
    } catch (error) {
      console.warn(`Unable to fetch comments from ${instance}:`, error);
    }
  }
  return [];
}

/**
 * Calculates exact time difference and formats it in Arabic as:
 * "منذ (المدة الي الفيديو نازل منها)"
 */
export function formatArabicDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'منذ وقت قريب';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'منذ لحظات';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Minutes
    if (diffMinutes < 1) {
      return 'منذ لحظات';
    }
    if (diffMinutes === 1) {
      return 'منذ دقيقة واحدة';
    }
    if (diffMinutes === 2) {
      return 'منذ دقيقتين';
    }
    if (diffMinutes >= 3 && diffMinutes <= 10) {
      return `منذ ${diffMinutes} دقائق`;
    }
    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    }

    // Hours
    if (diffHours === 1) {
      return 'منذ ساعة واحدة';
    }
    if (diffHours === 2) {
      return 'منذ ساعتين';
    }
    if (diffHours >= 3 && diffHours <= 10) {
      return `منذ ${diffHours} ساعات`;
    }
    if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    }

    // Days
    if (diffDays === 1) {
      return 'منذ يوم واحد (أمس)';
    }
    if (diffDays === 2) {
      return 'منذ يومين';
    }
    if (diffDays >= 3 && diffDays <= 10) {
      return `منذ ${diffDays} أيام`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      if (weeks === 1) return 'منذ أسبوع واحد';
      if (weeks === 2) return 'منذ أسبوعين';
      if (weeks >= 3) return `منذ ${weeks} أسابيع`;
      return `منذ ${diffDays} يوماً`;
    }

    // Months
    if (diffMonths === 1) {
      return 'منذ شهر واحد';
    }
    if (diffMonths === 2) {
      return 'منذ شهرين';
    }
    if (diffMonths >= 3 && diffMonths <= 10) {
      return `منذ ${diffMonths} أشهر`;
    }
    if (diffMonths < 12) {
      return `منذ ${diffMonths} شهراً`;
    }

    // Years
    if (diffYears === 1) {
      return 'منذ سنة واحدة';
    }
    if (diffYears === 2) {
      return 'منذ سنتين';
    }
    if (diffYears >= 3 && diffYears <= 10) {
      return `منذ ${diffYears} سنوات`;
    }
    return `منذ ${diffYears} سنة`;
  } catch {
    return 'منذ وقت قريب';
  }
}

export function formatViews(viewsStr?: string): string {
  if (!viewsStr) return '';
  const num = parseInt(viewsStr, 10);
  if (isNaN(num)) return '';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} مليون مشاهدة`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} ألف مشاهدة`;
  }
  return `${num} مشاهدة`;
}