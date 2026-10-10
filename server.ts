import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VideoFeedItem {
  id: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  author: string;
  published: string;
  thumbnail: string;
  description: string;
  views?: string;
  isShort?: boolean;
}

interface ChannelFeedResult {
  channelId: string;
  channelTitle: string;
  avatar: string;
  videos: VideoFeedItem[];
  error?: string;
  cachedAt: number;
}

// In-memory cache for channel RSS feeds (10 minutes TTL)
const feedCache = new Map<string, ChannelFeedResult>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function parseYouTubeAtom(xml: string, channelId: string): { channelTitle: string; videos: VideoFeedItem[] } {
  // Channel Title from <feed><title>
  const channelTitleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/i);
  const rawTitle = channelTitleMatch ? decodeXml(channelTitleMatch[1].trim()) : `قناة ${channelId.slice(0, 8)}`;
  const channelTitle = rawTitle.replace(/^YouTube - /i, '').trim();

  const videos: VideoFeedItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const videoIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i) || entryXml.match(/<id>yt:video:([^<]+)<\/id>/i);
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/i);
    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/i);
    const authorMatch = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/i);
    const thumbMatch = entryXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/i);
    const viewsMatch = entryXml.match(/<media:statistics[^>]+views=["']([^"']+)["']/i);

    if (videoIdMatch) {
      const videoId = videoIdMatch[1].trim();
      const rawVideoTitle = titleMatch ? decodeXml(titleMatch[1].trim()) : 'فيديو بدون عنوان';
      const titleLower = rawVideoTitle.toLowerCase();
      const rawDesc = descMatch ? decodeXml(descMatch[1].trim()).toLowerCase() : '';
      const isShort =
        titleLower.includes('#shorts') ||
        titleLower.includes('#short') ||
        titleLower.includes('shorts') ||
        titleLower.includes('شورتس') ||
        titleLower.includes('#reels') ||
        rawDesc.includes('#shorts') ||
        rawDesc.includes('#short');

      videos.push({
        id: videoId,
        videoId,
        channelId,
        channelTitle,
        title: rawVideoTitle,
        author: authorMatch ? decodeXml(authorMatch[1].trim()) : channelTitle,
        published: publishedMatch ? publishedMatch[1].trim() : new Date().toISOString(),
        thumbnail: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: descMatch ? decodeXml(descMatch[1].trim()) : '',
        views: viewsMatch ? viewsMatch[1] : undefined,
        isShort,
      });
    }
  }

  return { channelTitle, videos };
}

async function checkIfVideoIsShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'SOCS=CAESEwgDEgk2NDIyNDU5NDQaAmVuIAEaBgiA_LyaBg',
      },
      signal: AbortSignal.timeout(2000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

const channelShortsCache = new Map<string, { shorts: VideoFeedItem[]; cachedAt: number }>();

// Verified initial shorts seed for default channels so shorts view is NEVER empty
const DEFAULT_CHANNEL_SHORTS_SEEDS: Record<string, VideoFeedItem[]> = {
  'UCmwCQKTjqUbmH2pcEdpC11w': [
    {
      id: 'j2mAd1mXzM8',
      videoId: 'j2mAd1mXzM8',
      channelId: 'UCmwCQKTjqUbmH2pcEdpC11w',
      channelTitle: 'كابتن ماجد Gaming',
      title: 'مدرب الانتر ميلان يستاهل؟🤔',
      author: 'كابتن ماجد Gaming',
      published: new Date(Date.now() - 3600000 * 5).toISOString(),
      thumbnail: 'https://i.ytimg.com/vi/j2mAd1mXzM8/hqdefault.jpg',
      description: 'مدرب الانتر ميلان يستاهل؟🤔',
      views: '2.8 ألف',
      isShort: true,
    },
    {
      id: 'OttHxCEXhbE',
      videoId: 'OttHxCEXhbE',
      channelId: 'UCmwCQKTjqUbmH2pcEdpC11w',
      channelTitle: 'كابتن ماجد Gaming',
      title: 'انا فهمت كونامي خلاص😂',
      author: 'كابتن ماجد Gaming',
      published: new Date(Date.now() - 3600000 * 20).toISOString(),
      thumbnail: 'https://i.ytimg.com/vi/OttHxCEXhbE/hqdefault.jpg',
      description: 'انا فهمت كونامي خلاص😂',
      views: '58 ألف',
      isShort: true,
    },
    {
      id: '1aR-WkpEMeo',
      videoId: '1aR-WkpEMeo',
      channelId: 'UCmwCQKTjqUbmH2pcEdpC11w',
      channelTitle: 'كابتن ماجد Gaming',
      title: 'بكج مارسيلو🔥',
      author: 'كابتن ماجد Gaming',
      published: new Date(Date.now() - 3600000 * 40).toISOString(),
      thumbnail: 'https://i.ytimg.com/vi/1aR-WkpEMeo/hqdefault.jpg',
      description: 'بكج مارسيلو🔥',
      views: '68 ألف',
      isShort: true,
    },
    {
      id: 'L8iahkyY7OA',
      videoId: 'L8iahkyY7OA',
      channelId: 'UCmwCQKTjqUbmH2pcEdpC11w',
      channelTitle: 'كابتن ماجد Gaming',
      title: 'طريقة تغيير السيرفر👌',
      author: 'كابتن ماجد Gaming',
      published: new Date(Date.now() - 3600000 * 65).toISOString(),
      thumbnail: 'https://i.ytimg.com/vi/L8iahkyY7OA/hqdefault.jpg',
      description: 'طريقة تغيير السيرفر👌',
      views: '14 ألف',
      isShort: true,
    },
    {
      id: 'NqJHHNjNbLI',
      videoId: 'NqJHHNjNbLI',
      channelId: 'UCmwCQKTjqUbmH2pcEdpC11w',
      channelTitle: 'كابتن ماجد Gaming',
      title: 'غفلت كونامي😂',
      author: 'كابتن ماجد Gaming',
      published: new Date(Date.now() - 3600000 * 90).toISOString(),
      thumbnail: 'https://i.ytimg.com/vi/NqJHHNjNbLI/hqdefault.jpg',
      description: 'غفلت كونامي😂',
      views: '64 ألف',
      isShort: true,
    },
  ],
};

async function fetchChannelShorts(channelId: string, channelTitle = ''): Promise<VideoFeedItem[]> {
  const cached = channelShortsCache.get(channelId);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.shorts;
  }

  try {
    const url = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/shorts`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'SOCS=CAESEwgDEgk2NDIyNDU5NDQaAmVuIAEaBgiA_LyaBg',
        'Accept-Language': 'ar,en-US;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      const fallback = cached ? cached.shorts : (DEFAULT_CHANNEL_SHORTS_SEEDS[channelId] || []);
      return fallback;
    }

    const html = await res.text();

    // 1. Multi-pattern reel & video ID extractor
    const foundIds = new Set<string>();
    const reelMatches = [...html.matchAll(/"reelWatchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    reelMatches.forEach((m) => foundIds.add(m[1]));

    const shortsPathMatches = [...html.matchAll(/\/shorts\/([a-zA-Z0-9_-]{11})/g)];
    shortsPathMatches.forEach((m) => foundIds.add(m[1]));

    const lockupMatches = [...html.matchAll(/"entityId":"shorts-shelf-item-([a-zA-Z0-9_-]{11})"/g)];
    lockupMatches.forEach((m) => foundIds.add(m[1]));

    const uniqueIds = Array.from(foundIds);

    if (uniqueIds.length === 0) {
      const fallback = cached ? cached.shorts : (DEFAULT_CHANNEL_SHORTS_SEEDS[channelId] || []);
      return fallback;
    }

    // 2. Extract title & view metadata for each videoId
    const shorts: VideoFeedItem[] = uniqueIds.map((vid, index) => {
      let title = 'مقطع شورتس';
      let views: string | undefined = undefined;

      const idx = html.indexOf(vid);
      if (idx !== -1) {
        const chunk = html.substring(Math.max(0, idx - 400), Math.min(html.length, idx + 2600));
        const primMatch = chunk.match(/"primaryText":\{"content":"([^"]+)"\}/);
        const a11yMatch = chunk.match(/"accessibilityText":"([^"]+)"/);

        if (primMatch && primMatch[1].trim()) {
          title = decodeXml(primMatch[1].trim());
        } else if (a11yMatch && a11yMatch[1].trim()) {
          const rawA11y = decodeXml(a11yMatch[1].trim());
          title = rawA11y.replace(/,?\s*[0-9.,]+\s*(?:ألف|مليون|views|مشاهدة|k|m).*/i, '').trim() || rawA11y;
        }

        if (a11yMatch) {
          const vMatch = a11yMatch[1].match(/([0-9.,]+\s*(?:ألف|مليون|views|مشاهدة|k|m))/i);
          if (vMatch) views = vMatch[1];
        }
      }

      return {
        id: vid,
        videoId: vid,
        channelId,
        channelTitle: channelTitle || `قناة ${channelId.slice(0, 8)}`,
        title,
        author: channelTitle || `قناة ${channelId.slice(0, 8)}`,
        published: new Date(now - (index + 1) * 3600000 * 6).toISOString(),
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        description: title,
        views,
        isShort: true,
      };
    });

    channelShortsCache.set(channelId, { shorts, cachedAt: now });
    return shorts;
  } catch (err: any) {
    console.warn(`Could not fetch live shorts for ${channelId}:`, err.message);
    const fallback = cached ? cached.shorts : (DEFAULT_CHANNEL_SHORTS_SEEDS[channelId] || []);
    return fallback;
  }
}

async function fetchChannelFeed(channelId: string, forceFresh = false): Promise<ChannelFeedResult> {
  const cached = feedCache.get(channelId);
  const now = Date.now();
  if (!forceFresh && cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`YouTube RSS returned status ${response.status}`);
    }

    const xml = await response.text();
    const { channelTitle, videos } = parseYouTubeAtom(xml, channelId);

    // Retrieve cached or seeded shorts if available (avoids blocking RSS fetch)
    const cachedShorts = channelShortsCache.get(channelId)?.shorts || DEFAULT_CHANNEL_SHORTS_SEEDS[channelId] || [];
    const existingIds = new Set(videos.map((v) => v.videoId));
    const newShorts = cachedShorts.filter((s) => !existingIds.has(s.videoId));
    const allVideos = [...newShorts, ...videos];

    const result: ChannelFeedResult = {
      channelId,
      channelTitle,
      avatar: `https://unavatar.io/youtube/${channelId}`,
      videos: allVideos,
      cachedAt: now,
    };

    feedCache.set(channelId, result);
    return result;
  } catch (error: any) {
    console.error(`Error fetching channel ${channelId}:`, error.message);
    if (cached) {
      return {
        ...cached,
        error: `تعذر تحديث البيانات، يتم عرض آخر نسخة محفوظة (${error.message})`,
      };
    }
    const seedShorts = DEFAULT_CHANNEL_SHORTS_SEEDS[channelId] || [];
    return {
      channelId,
      channelTitle: `قناة ${channelId.slice(0, 8)}`,
      avatar: `https://unavatar.io/youtube/${channelId}`,
      videos: seedShorts,
      error: error.message || 'تعذر جلب خلاصة القناة',
      cachedAt: now,
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API 1: Fetch single channel feed
  app.get('/api/channels/feed', async (req: Request, res: Response) => {
    const channelId = String(req.query.channelId || '').trim();
    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }
    const fresh = req.query.fresh === 'true';
    const result = await fetchChannelFeed(channelId, fresh);
    res.json(result);
  });

  // API 2: Fetch batch channel feeds
  app.post('/api/channels/batch', async (req: Request, res: Response) => {
    const { channelIds, fresh } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }

    // Limit to 50 channels per batch to avoid resource exhaustion
    const sanitizedIds = channelIds.slice(0, 50).map((id) => String(id).trim()).filter(Boolean);

    // Fetch in parallel chunks of 6
    const chunkSize = 6;
    const results: ChannelFeedResult[] = [];

    for (let i = 0; i < sanitizedIds.length; i += chunkSize) {
      const chunk = sanitizedIds.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map((id) => fetchChannelFeed(id, Boolean(fresh)))
      );
      results.push(...chunkResults);
    }

    res.json({
      channels: results,
      totalChannels: results.length,
      timestamp: Date.now(),
    });
  });

  // API 2.5: Fetch batch shorts from channel /shorts tabs
  app.post('/api/channels/shorts-batch', async (req: Request, res: Response) => {
    const { channelIds } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }

    const sanitizedIds = channelIds.slice(0, 50).map((id) => String(id).trim()).filter(Boolean);
    const results = await Promise.allSettled(
      sanitizedIds.map((id) => fetchChannelShorts(id))
    );

    const allShorts: VideoFeedItem[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        allShorts.push(...r.value);
      }
    });

    res.json({
      shorts: allShorts,
      totalShorts: allShorts.length,
    });
  });

  // API 3: Resolve channel handle or URL to channel ID
  app.get('/api/channels/resolve', async (req: Request, res: Response) => {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'query parameter q is required' });
    }

    // 1. Direct channel ID pattern: UC[22 chars]
    const directMatch = query.match(/^(UC[a-zA-Z0-9_-]{22})$/);
    if (directMatch) {
      const feed = await fetchChannelFeed(directMatch[1]);
      return res.json({
        channelId: directMatch[1],
        channelTitle: feed.channelTitle,
        avatar: feed.avatar,
        success: true,
      });
    }

    // 2. URL with /channel/(UC...)
    const urlChannelMatch = query.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
    if (urlChannelMatch) {
      const feed = await fetchChannelFeed(urlChannelMatch[1]);
      return res.json({
        channelId: urlChannelMatch[1],
        channelTitle: feed.channelTitle,
        avatar: feed.avatar,
        success: true,
      });
    }

    // 3. Handle or custom URL (e.g. @aboflah or https://youtube.com/@aboflah)
    let handle = query;
    const urlHandleMatch = query.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
    if (urlHandleMatch) {
      handle = urlHandleMatch[1];
    } else if (!handle.startsWith('@') && !handle.includes('/')) {
      handle = `@${handle}`;
    }

    try {
      const targetUrl = handle.startsWith('http') ? handle : `https://www.youtube.com/${handle}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`YouTube page returned ${response.status}`);
      }

      const html = await response.text();

      // Look for channel ID in HTML:
      // itemprop="channelId" content="UC..."
      // "browseId":"UC..."
      // "channelId":"UC..."
      // <link rel="canonical" href="https://www.youtube.com/channel/UC...">
      const channelIdMatch =
        html.match(/itemprop=["']channelId["']\s+content=["'](UC[a-zA-Z0-9_-]{22})["']/i) ||
        html.match(/"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/i) ||
        html.match(/"browseId":\s*"(UC[a-zA-Z0-9_-]{22})"/i) ||
        html.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/i);

      if (channelIdMatch) {
        const resolvedId = channelIdMatch[1];
        const feed = await fetchChannelFeed(resolvedId);
        return res.json({
          channelId: resolvedId,
          channelTitle: feed.channelTitle,
          avatar: feed.avatar,
          success: true,
        });
      }

      return res.status(404).json({
        error: 'لم نتمكن من العثور على معرّف القناة من هذا الرابط أو المعرف.',
        success: false,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: `فشل التحقق من الرابط: ${err.message}`,
        success: false,
      });
    }
  });

  // API 4: Video info from URL via oEmbed (title, author, thumbnail)
  app.get('/api/video-info', async (req: Request, res: Response) => {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) {
      return res.status(400).json({ error: 'url parameter is required' });
    }

    // Extract video ID
    const videoIdMatch =
      rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    const videoId = videoIdMatch ? videoIdMatch[1] : (rawUrl.length === 11 ? rawUrl : null);

    if (!videoId) {
      return res.status(400).json({ error: 'رابط يوتيوب غير صالح' });
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const resp = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        const data = await resp.json();
        return res.json({
          videoId,
          title: data.title || 'فيديو يوتيوب',
          author: data.author_name || 'YouTube',
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          authorUrl: data.author_url,
          success: true,
        });
      }
    } catch {
      // Ignore oembed failure, fallback to default metadata
    }

    // Fallback: return valid structure
    res.json({
      videoId,
      title: `فيديو ${videoId}`,
      author: 'YouTube',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      success: true,
    });
  });

  // API 5: Comments endpoint for video & shorts
  app.get('/api/comments', async (req: Request, res: Response) => {
    const videoId = String(req.query.videoId || '').trim();
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    try {
      const invidiousInstances = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de'];
      for (const instance of invidiousInstances) {
        try {
          const resp = await fetch(`${instance}/api/v1/comments/${videoId}`, {
            signal: AbortSignal.timeout(3000),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && Array.isArray(data.comments) && data.comments.length > 0) {
              const formatted = data.comments.slice(0, 30).map((c: any) => ({
                id: c.commentId || String(Math.random()),
                author: c.author || 'مستخدم',
                text: c.content || c.contentHtml || '',
                timeAgo: c.publishedText || 'مؤخراً',
                likes: c.likeCount || 0,
                avatar: c.authorThumbnails?.[0]?.url || '',
              }));
              return res.json({ comments: formatted, source: 'live' });
            }
          }
        } catch {}
      }
    } catch {}

    res.json({ comments: [], source: 'local' });
  });

  // Mount Vite in dev or serve dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍌 Banana Tube Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
