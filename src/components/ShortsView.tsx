import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Plus,
  Send,
  X,
  Sparkles,
  Check,
  RotateCw,
  Clock,
  Tv,
  Film
} from 'lucide-react';
import { VideoItem, ShortComment, ChannelItem } from '../types';
import {
  extractVideoId,
  fetchChannelShorts,
  fetchVideoComments,
  formatArabicDate,
} from '../utils/youtube';

interface ShortsViewProps {
  videos: VideoItem[];
  channels: ChannelItem[];
  onAddToFeatured?: (video: VideoItem) => void;
  onToggleWatchLater?: (video: VideoItem) => void;
  watchLaterList?: VideoItem[];
  liteMode?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

const VERIFIED_SEEDS: VideoItem[] = [
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
];

export const ShortsView: React.FC<ShortsViewProps> = ({
  videos,
  channels,
  onAddToFeatured,
  onToggleWatchLater,
  watchLaterList = [],
  liteMode = false,
}) => {
  // Selected channel filter (all or specific channel ID from user's channels)
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [isFetchingShorts, setIsFetchingShorts] = useState<boolean>(false);

  // Directly fetched shorts from the channels' /shorts tab with initial verified seed
  const [fetchedChannelShorts, setFetchedChannelShorts] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('banana_tube_fetched_shorts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return VERIFIED_SEEDS;
  });

  // Fetch shorts for user's subscribed channels
  const loadChannelShorts = useCallback(async () => {
    if (channels.length === 0) return;
    setIsFetchingShorts(true);
    try {
      const results = await Promise.allSettled(channels.map((channel) => fetchChannelShorts(channel.id)));
      const channelsMap = new Map(channels.map((c) => [c.id, c.customName || c.title]));
      const fetchedShorts = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : []
      );
      const enriched = fetchedShorts.map((short) => ({
        ...short,
        channelTitle: channelsMap.get(short.channelId) || short.channelTitle,
        author: channelsMap.get(short.channelId) || short.author,
      }));

      if (enriched.length > 0) {
        setFetchedChannelShorts(enriched);
        try {
          localStorage.setItem('banana_tube_fetched_shorts_v2', JSON.stringify(enriched));
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching channel shorts:', err);
    } finally {
      setIsFetchingShorts(false);
    }
  }, [channels]);

  // Initial fetch if empty or when channels change
  useEffect(() => {
    loadChannelShorts();
  }, [channels, loadChannelShorts]);

  // ONLY SHORTS FROM THE USER'S SUBSCRIBED CHANNELS - STRICTLY NO RANDOM VIDEOS!
  const shortsList = useMemo(() => {
    // 1. Get shorts from RSS videos
    const rssShorts = videos.filter((v) => v.isShort);

    // 2. Combine with shorts fetched directly from channel /shorts tabs
    const combined = [...fetchedChannelShorts, ...rssShorts];

    // Deduplicate by videoId
    const uniqueMap = new Map<string, VideoItem>();
    const channelsMap = new Map(channels.map((c) => [c.id, c.customName || c.title]));

    combined.forEach((v) => {
      // Ensure it belongs to a subscribed channel
      if (channelsMap.has(v.channelId)) {
        uniqueMap.set(v.videoId, {
          ...v,
          channelTitle: channelsMap.get(v.channelId) || v.channelTitle,
          author: channelsMap.get(v.channelId) || v.author,
        });
      }
    });

    let filtered = Array.from(uniqueMap.values());

    if (selectedChannelId !== 'all') {
      filtered = filtered.filter((v) => v.channelId === selectedChannelId);
    }

    return filtered;
  }, [videos, fetchedChannelShorts, channels, selectedChannelId]);

  // Current active short index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Likes state: videoId -> boolean
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('banana_tube_liked_shorts_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Like counts: videoId -> number
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('banana_tube_like_counts_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Muted state
  const [isMuted, setIsMuted] = useState(false);

  // Copied link toast
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Floating heart particles for double-tap
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  // Comments drawer state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, ShortComment[]>>(() => {
    try {
      const saved = localStorage.getItem('banana_tube_shorts_comments_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const lastTapRef = useRef<number>(0);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedChannelId]);

  // Sync likes to storage
  useEffect(() => {
    localStorage.setItem('banana_tube_liked_shorts_v2', JSON.stringify(likes));
  }, [likes]);

  useEffect(() => {
    localStorage.setItem('banana_tube_like_counts_v2', JSON.stringify(likeCounts));
  }, [likeCounts]);

  useEffect(() => {
    localStorage.setItem('banana_tube_shorts_comments_v2', JSON.stringify(commentsMap));
  }, [commentsMap]);

  const currentShort = shortsList[currentIndex];

  // Fetch comments when comments sheet opens
  useEffect(() => {
    if (isCommentsOpen && currentShort) {
      const vid = currentShort.videoId;
      if (!commentsMap[vid] || commentsMap[vid].length === 0) {
        setIsLoadingComments(true);
        fetchVideoComments(vid)
          .then((comments) => {
            if (comments.length > 0) {
              setCommentsMap((prev) => ({
                ...prev,
                [vid]: comments,
              }));
            } else {
              // Community fallback comments
              const defaultComments: ShortComment[] = [
                {
                  id: 'c1',
                  author: 'مشاهد من بنانا تيوب',
                  text: 'مقطع رائع جداً من القناة، ننتظر المزيد من الشورتس! 🔥',
                  timeAgo: 'مؤخراً',
                  likes: 15,
                },
                {
                  id: 'c2',
                  author: 'متابع وفي',
                  text: 'أفضل لقطة نزلتها القناة، استمر يا بطل 👏❤️',
                  timeAgo: 'مؤخراً',
                  likes: 8,
                },
              ];
              setCommentsMap((prev) => ({
                ...prev,
                [vid]: defaultComments,
              }));
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingComments(false));
      }
    }
  }, [isCommentsOpen, currentShort]);

  // Navigate to next / previous short
  const goToNext = useCallback(() => {
    if (currentIndex < shortsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, shortsList.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommentsOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, isCommentsOpen]);

  // Toggle Like
  const handleToggleLike = (videoId: string) => {
    setLikes((prev) => {
      const isCurrentlyLiked = !prev[videoId];
      setLikeCounts((c) => ({
        ...c,
        [videoId]: (c[videoId] || 120) + (isCurrentlyLiked ? 1 : -1),
      }));
      return { ...prev, [videoId]: isCurrentlyLiked };
    });
  };

  // Double tap heart animation handler on video screen
  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newHeart: FloatingHeart = {
        id: Date.now() + Math.random(),
        x,
        y,
      };
      setHearts((prev) => [...prev, newHeart]);

      // Automatically set like
      if (currentShort) {
        setLikes((prev) => {
          if (!prev[currentShort.videoId]) {
            setLikeCounts((c) => ({
              ...c,
              [currentShort.videoId]: (c[currentShort.videoId] || 120) + 1,
            }));
            return { ...prev, [currentShort.videoId]: true };
          }
          return prev;
        });
      }

      // Remove heart after animation finishes
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 900);
    }

    lastTapRef.current = now;
  };

  // Copy link
  const handleCopyLink = (videoId: string) => {
    const url = `https://www.youtube.com/shorts/${videoId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(videoId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Post comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentShort) return;

    const newComment: ShortComment = {
      id: `usr_${Date.now()}`,
      author: 'أنت (مستخدم بنانا تيوب)',
      text: newCommentText.trim(),
      timeAgo: 'الآن',
      likes: 1,
      isUser: true,
    };

    setCommentsMap((prev) => ({
      ...prev,
      [currentShort.videoId]: [newComment, ...(prev[currentShort.videoId] || [])],
    }));

    setNewCommentText('');
  };

  const isLiked = currentShort ? !!likes[currentShort.videoId] : false;
  const currentLikesCount = currentShort ? likeCounts[currentShort.videoId] || 120 : 0;
  const currentComments = currentShort ? commentsMap[currentShort.videoId] || [] : [];
  const isSavedLater = currentShort
    ? watchLaterList.some((v) => v.videoId === currentShort.videoId)
    : false;

  return (
    <div className="relative w-full h-[calc(100vh-125px)] sm:h-[calc(100vh-140px)] flex flex-col items-center justify-between bg-[var(--bg-app)] overflow-hidden select-none transition-colors">
      {/* Channel Filter Chips at the top of Shorts */}
      <div className="w-full max-w-2xl px-3 py-2 z-20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedChannelId('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedChannelId === 'all'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>كل قنواتي</span>
            <span className="text-[10px] bg-black/25 px-1 rounded-full text-white">
              {shortsList.length}
            </span>
          </button>

          {channels.map((ch) => {
            const chShortsCount = (fetchedChannelShorts.length > 0 ? fetchedChannelShorts : videos).filter(
              (v) => v.channelId === ch.id && v.isShort
            ).length;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedChannelId === ch.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{ch.customName || ch.title}</span>
                {chShortsCount > 0 && (
                  <span className="text-[10px] bg-black/30 text-amber-300 px-1 rounded-full">
                    {chShortsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh Shorts Button */}
        <button
          onClick={loadChannelShorts}
          disabled={isFetchingShorts}
          title="تحديث وسحب مقاطع الشورتس من قنواتي"
          className="p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white text-xs flex items-center gap-1 flex-shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 text-amber-400 ${isFetchingShorts ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">تحديث الشورتس</span>
        </button>
      </div>

      {/* Main Shorts Display */}
      {isFetchingShorts && shortsList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3">
          <RotateCw className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">
            جاري فحص وسحب مقاطع الشورتس من قنواتك المضافة...
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            نقوم بمسح صفحات الشورتس الخاصة بقنواتك لجلب كل مقاطعها الرأسية مباشرة.
          </p>
        </div>
      ) : shortsList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 text-3xl mx-auto shadow-inner">
            🎬
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)]">
              {selectedChannelId === 'all'
                ? 'لم يتم العثور على مقاطع شورتس حالياً'
                : 'هذه القناة لم تنشر مقاطع شورتس في آخر منشوراتها'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              يقوم التطبيق بفحص قنواتك المضافة فقط دون جلب مقاطع عشوائية. اضغط على تحديث لسحب كل الشورتس من قنواتك.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadChannelShorts}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>فحص وتحديث شورتس قنواتي 🔄</span>
            </button>

            {selectedChannelId !== 'all' && (
              <button
                onClick={() => setSelectedChannelId('all')}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                عرض كل القنوات
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden py-1">
          {/* Main 9:16 Shorts Container */}
          <div
            onClick={handleVideoAreaClick}
            className="relative w-full h-full sm:max-w-[420px] bg-black sm:rounded-3xl sm:border border-[var(--border-color)] shadow-2xl overflow-hidden flex items-center justify-center"
          >
            {/* Floating Heart Particles (Burst Animation on Double-Tap) */}
            {hearts.map((h) => (
              <div
                key={h.id}
                style={{ left: `${h.x}px`, top: `${h.y}px` }}
                className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-heart-burst text-red-500 text-6xl drop-shadow-[0_10px_20px_rgba(239,68,68,0.7)]"
              >
                ❤️
              </div>
            ))}

            {/* Video Frame */}
            <div className="w-full h-full relative bg-black flex items-center justify-center">
              <iframe
                key={currentShort.videoId}
                src={`https://www.youtube-nocookie.com/embed/${currentShort.videoId}?autoplay=1&mute=${
                  isMuted ? '1' : '0'
                }&controls=1&loop=1&playlist=${currentShort.videoId}&modestbranding=1&playsinline=1&rel=0`}
                title={currentShort.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 object-cover"
              />
            </div>

            {/* Side Action Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-3 bottom-24 z-30 flex flex-col items-center gap-4 text-white"
            >
              {/* Like Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleToggleLike(currentShort.videoId)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-125 ${
                    isLiked
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                      : 'bg-black/50 hover:bg-black/70 text-white border border-white/20'
                  }`}
                  title={isLiked ? 'إلغاء الإعجاب' : 'إعجاب (أو اضغط مرتين على الشاشة)'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <span className="text-[11px] font-bold text-shadow">
                  {currentLikesCount}
                </span>
              </div>

              {/* Comments Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setIsCommentsOpen(true)}
                  className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                  title="عرض التعليقات"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <span className="text-[11px] font-bold text-shadow">
                  {currentComments.length > 0 ? currentComments.length : 'تعليق'}
                </span>
              </div>

              {/* Watch Later / Save */}
              {onToggleWatchLater && (
                <button
                  onClick={() => onToggleWatchLater(currentShort)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ${
                    isSavedLater
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-black/50 hover:bg-black/70 text-white border border-white/20'
                  }`}
                  title={isSavedLater ? 'محفوظ في لاحقاً' : 'حفظ للمشاهدة لاحقاً'}
                >
                  <Bookmark className={`w-5 h-5 ${isSavedLater ? 'fill-current' : ''}`} />
                </button>
              )}

              {/* Featured / Pin */}
              {onAddToFeatured && (
                <button
                  onClick={() => onAddToFeatured(currentShort)}
                  className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-amber-300 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                  title="إضافة إلى الفيديوهات المميزة"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              )}

              {/* Share / Copy Link */}
              <button
                onClick={() => handleCopyLink(currentShort.videoId)}
                className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                title="نسخ رابط الشورتس"
              >
                {copiedId === currentShort.videoId ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>

              {/* Sound Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Bottom Overlay Info (Channel & Title & Published Time) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-auto text-right"
            >
              {/* Channel Info */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs overflow-hidden border border-white/30">
                  {currentShort.channelTitle ? currentShort.channelTitle.charAt(0) : '▶'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white hover:text-amber-300 block leading-tight">
                      {currentShort.channelTitle || currentShort.author}
                    </span>
                    <span className="text-[9px] bg-red-600/80 text-white px-1.5 py-0.2 rounded font-bold">
                      قناتك 📺
                    </span>
                  </div>
                  <span className="text-[10px] text-accent-secondary font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatArabicDate(currentShort.published)}</span>
                  </span>
                </div>
              </div>

              {/* Title */}
              <p className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 leading-snug drop-shadow-md">
                {currentShort.title}
              </p>

              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                <span>💡 اضغط مرتين للإعجاب ❤️</span>
                <span>•</span>
                <span>الشورتس ({currentIndex + 1} من {shortsList.length})</span>
              </div>
            </div>

            {/* Desktop Navigation Arrows */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex absolute right-3 inset-y-0 flex-col justify-center gap-3 z-30"
            >
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
                title="الشورتس السابق"
              >
                <ChevronUp className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === shortsList.length - 1}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
                title="الشورتس التالي"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      {isCommentsOpen && currentShort && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setIsCommentsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[75vh] h-[550px] overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  التعليقات ({currentComments.length})
                </h3>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {isLoadingComments ? (
                <div className="text-center py-10 text-xs text-[var(--text-secondary)]">
                  <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  <span>جاري تحميل التعليقات...</span>
                </div>
              ) : currentComments.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-secondary)]">
                  لا توجد تعليقات حتى الآن. كن أول من يعلق! 💬
                </div>
              ) : (
                currentComments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-2xl border text-right space-y-1 transition-all ${
                      c.isUser
                        ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]'
                        : 'bg-[var(--bg-app)] border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-main)]">{c.author}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{c.timeAgo}</span>
                    </div>
                    <p className="text-xs text-[var(--text-main)] leading-relaxed">{c.text}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] pt-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      <span>{c.likes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form
              onSubmit={handlePostComment}
              className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex items-center gap-2"
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="أضف تعليقاً..."
                className="flex-1 bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
