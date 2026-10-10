import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Play,
  Sparkles,
  Tv,
  Bookmark,
  Settings as SettingsIcon,
  RefreshCw,
  Zap,
  Plus,
  Filter,
  EyeOff,
  AlertCircle,
  Palette,
  Shuffle,
  Check
} from 'lucide-react';
import { VideoItem, ChannelItem, FeaturedVideoItem, ActiveTab, AppSettings, ThemeSettings, DEFAULT_THEME_SETTINGS } from './types';
import { DEFAULT_CHANNELS, INITIAL_FEATURED_VIDEOS } from './data/defaultChannels';
import { resolveAccentHex, getDarkenedSecondaryColor, getContrastTextColor } from './utils/theme';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { FeaturedVideosView } from './components/FeaturedVideosView';
import { ChannelsManagerModal } from './components/ChannelsManagerModal';
import { WatchLaterView } from './components/WatchLaterView';
import { SettingsModal } from './components/SettingsModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { ShortsView } from './components/ShortsView';
import { fetchChannelFeed } from './utils/youtube';

const STORAGE_CHANNELS_KEY = 'banana_tube_channels_v2';
const STORAGE_FEATURED_KEY = 'banana_tube_featured_v2';
const STORAGE_WATCH_LATER_KEY = 'banana_tube_watch_later_v2';
const STORAGE_HISTORY_KEY = 'banana_tube_history_v2';
const STORAGE_SETTINGS_KEY = 'banana_tube_settings_v2';
const STORAGE_THEME_KEY = 'banana_tube_theme_v2';
const STORAGE_VIDEOS_CACHE_KEY = 'banana_tube_videos_cache_v2';

export default function App() {
  // 1. Persistence states
  const [channels, setChannels] = useState<ChannelItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHANNELS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse channels from storage:', e);
    }
    return DEFAULT_CHANNELS;
  });

  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FEATURED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse featured from storage:', e);
    }
    return INITIAL_FEATURED_VIDEOS;
  });

  const [watchLaterList, setWatchLaterList] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WATCH_LATER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [watchHistory, setWatchHistory] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [theme, setTheme] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_THEME_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_THEME_SETTINGS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          hideShorts: false,
          liteMode: false,
          autoplayNext: true,
          ...parsed,
          theme: DEFAULT_THEME_SETTINGS,
        };
      }
    } catch {}
    return {
      hideShorts: false,
      liteMode: false,
      autoplayNext: true,
      theme: DEFAULT_THEME_SETTINGS,
    };
  });

  // 2. Feed videos state
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIDEOS_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // UI States
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Modals
  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // New features: Channel notification toast and quick feed filter type
  const [channelToast, setChannelToast] = useState<string | null>(null);
  const [feedFilterType, setFeedFilterType] = useState<'all' | 'recent' | 'long' | 'shorts'>('all');

  // Synchronize Theme & Colors on documentElement (supports 24 colors + custom picker + darkened secondary)
  useEffect(() => {
    localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(theme));
    const root = document.documentElement;

    const accentHex = resolveAccentHex(theme.accentColor);
    const secondaryHex = getDarkenedSecondaryColor(accentHex, theme.secondaryDarkness);
    const contrastText = getContrastTextColor(accentHex);

    // Apply inline CSS variables for primary and darkened secondary colors
    root.style.setProperty('--accent-main', accentHex);
    root.style.setProperty('--accent-hover', accentHex);
    root.style.setProperty('--accent-secondary', secondaryHex);
    root.style.setProperty('--accent-secondary-bg', `${secondaryHex}26`);
    root.style.setProperty('--accent-secondary-border', `${secondaryHex}66`);
    root.style.setProperty('--accent-secondary-text', secondaryHex);
    root.style.setProperty('--accent-bg', `${accentHex}1f`);
    root.style.setProperty('--accent-border', `${accentHex}4d`);
    root.style.setProperty('--accent-contrast', contrastText);

    // Apply theme mode (dark, light, oled, sepia, navy, forest)
    root.setAttribute('data-theme', theme.mode);
    if (theme.mode === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    // Apply font family & size
    root.setAttribute('data-font', theme.fontFamily || 'cairo');
    root.setAttribute('data-font-size', theme.fontSize || 'normal');
    root.setAttribute('data-border-intensity', theme.borderIntensity || 'hairline');

    // Apply ambient glow preference
    if (theme.ambientGlow) {
      root.classList.add('ambient-glow-enabled');
    } else {
      root.classList.remove('ambient-glow-enabled');
    }

    // Apply glassmorphism preference
    if (!theme.enableGlassmorphism) {
      root.classList.add('no-glass');
    } else {
      root.classList.remove('no-glass');
    }
  }, [theme]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FEATURED_KEY, JSON.stringify(featuredVideos));
  }, [featuredVideos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_WATCH_LATER_KEY, JSON.stringify(watchLaterList));
  }, [watchLaterList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(watchHistory));
  }, [watchHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    if (settings.liteMode) {
      document.documentElement.classList.add('low-spec-mode');
    } else {
      document.documentElement.classList.remove('low-spec-mode');
    }
  }, [settings]);

  // Fetch feeds for channels (safe against stale closures)
  const fetchFeeds = useCallback(
    async (forceFresh = false) => {
      // Read current channels from localStorage/state to avoid any stale closure
      let currentChannels = channels;
      try {
        const stored = localStorage.getItem(STORAGE_CHANNELS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) currentChannels = parsed;
        }
      } catch {}

      if (currentChannels.length === 0) return;
      setIsLoading(true);
      setFetchError(null);

      try {
        const uniqueChannels = Array.from(new Map(currentChannels.map((channel) => [channel.id, channel])).values());
        const channelFeeds: Awaited<ReturnType<typeof fetchChannelFeed>>[] = [];
        for (let index = 0; index < uniqueChannels.length; index += 6) {
          const chunk = uniqueChannels.slice(index, index + 6);
          channelFeeds.push(
            ...(await Promise.all(
              chunk.map((channel) => fetchChannelFeed(channel.id, forceFresh, channel.title))
            ))
          );
        }
        if (channelFeeds.length === 0) {
          throw new Error('تعذر جلب خلاصة أي قناة عبر البروكسي');
        }

        if (channelFeeds.length > 0) {
          const allFetchedVideos: VideoItem[] = [];
          const fetchedChannelsInfo = new Map<string, { title?: string; avatar?: string; count?: number }>();
          const failedChannels = channelFeeds.filter((channel) => channel.error);

          for (const ch of channelFeeds) {
            fetchedChannelsInfo.set(ch.channelId, {
              title: ch.channelTitle,
              avatar: ch.avatar,
              count: ch.videos?.length || 0,
            });

            if (Array.isArray(ch.videos)) {
              allFetchedVideos.push(...ch.videos);
            }
          }

          const activeChannelIds = new Set(uniqueChannels.map((channel) => channel.id));
          const resolvedChannelTitles = new Map(
            channelFeeds.map((channel) => [channel.channelId, channel.channelTitle])
          );
          setVideos((previousVideos) => {
            const videosById = new Map<string, VideoItem>();
            previousVideos
              .filter((video) => activeChannelIds.has(video.channelId))
              .forEach((video) => {
                const channelTitle = resolvedChannelTitles.get(video.channelId) || video.channelTitle;
                videosById.set(video.videoId, {
                  ...video,
                  channelTitle,
                  author: video.author === video.channelTitle ? channelTitle : video.author,
                });
              });
            allFetchedVideos.forEach((video) => videosById.set(video.videoId, video));
            const mergedVideos = Array.from(videosById.values());
            mergedVideos.sort((a, b) => {
              const timeA = new Date(a.published).getTime() || 0;
              const timeB = new Date(b.published).getTime() || 0;
              return timeB - timeA;
            });
            try {
              localStorage.setItem(STORAGE_VIDEOS_CACHE_KEY, JSON.stringify(mergedVideos));
            } catch {}
            return mergedVideos;
          });
          setLastRefreshed(new Date());

          // Update channel metadata without removing any newly added channels!
          setChannels((prevChannels) => {
            const updated = prevChannels.map((c) => {
              const info = fetchedChannelsInfo.get(c.id);
              if (info) {
                return {
                  ...c,
                  title: c.customName || info.title || c.title,
                  avatar: info.avatar || c.avatar,
                  videoCount: info.count ?? c.videoCount,
                };
              }
              return c;
            });
            localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(updated));
            return updated;
          });

          setFetchError(
            failedChannels.length > 0
              ? `تعذر تحديث ${failedChannels.length} من ${channelFeeds.length} قناة. تم الإبقاء على بياناتها المحفوظة.`
              : null
          );
        }
      } catch (err: any) {
        console.error('Error fetching feeds:', err);
        setFetchError('تعذر تحديث بعض المقاطع حالياً. سيتم عرض المقاطع المحفوظة مؤقتاً.');
      } finally {
        setIsLoading(false);
      }
    },
    [channels]
  );

  // Initial load if no cached videos
  useEffect(() => {
    if (videos.length === 0) {
      fetchFeeds(false);
    }
  }, []);

  // Filtered videos based on active channel, shorts toggle, and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // 1. Channel filter
      if (selectedChannelId !== 'all' && video.channelId !== selectedChannelId) {
        return false;
      }

      // 2. Hide shorts filter
      if (settings.hideShorts && video.isShort) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = video.title.toLowerCase().includes(query);
        const matchAuthor = (video.channelTitle || video.author).toLowerCase().includes(query);
        if (!matchTitle && !matchAuthor) return false;
      }

      // 4. Quick Feed Filter Type (All, Recent, Long videos, Shorts)
      if (feedFilterType === 'long' && video.isShort) return false;
      if (feedFilterType === 'shorts' && !video.isShort) return false;
      if (feedFilterType === 'recent') {
        const publishedDate = new Date(video.published).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (publishedDate < sevenDaysAgo) return false;
      }

      return true;
    });
  }, [videos, selectedChannelId, settings.hideShorts, searchQuery, feedFilterType]);

  // Video playback handler
  const handlePlayVideo = useCallback((video: VideoItem) => {
    setActiveVideo(video);

    // Add to history (deduplicated)
    setWatchHistory((prev) => {
      const filtered = prev.filter((v) => v.videoId !== video.videoId);
      return [video, ...filtered].slice(0, 50); // Keep last 50
    });
  }, []);

  // Shuffle play handler: picks a random video and plays it immediately
  const handleShufflePlay = useCallback(() => {
    const pool = filteredVideos.length > 0 ? filteredVideos : videos;
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    handlePlayVideo(pool[randomIndex]);
  }, [filteredVideos, videos, handlePlayVideo]);

  // Watch later handlers
  const handleToggleWatchLater = useCallback((video: VideoItem) => {
    setWatchLaterList((prev) => {
      const exists = prev.some((v) => v.videoId === video.videoId);
      if (exists) {
        return prev.filter((v) => v.videoId !== video.videoId);
      } else {
        return [video, ...prev];
      }
    });
  }, []);

  const handleRemoveWatchLater = useCallback((videoId: string) => {
    setWatchLaterList((prev) => prev.filter((v) => v.videoId !== videoId));
  }, []);

  // Featured videos handlers
  const handleAddFeatured = useCallback((item: FeaturedVideoItem) => {
    setFeaturedVideos((prev) => {
      const filtered = prev.filter((f) => f.videoId !== item.videoId);
      return [item, ...filtered];
    });
  }, []);

  const handleAddVideoToFeatured = useCallback((video: VideoItem) => {
    const newItem: FeaturedVideoItem = {
      id: `${video.videoId}_${Date.now()}`,
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnail,
      addedAt: Date.now(),
      tag: 'مفضل',
    };
    handleAddFeatured(newItem);
  }, [handleAddFeatured]);

  const handleRemoveFeatured = useCallback((id: string) => {
    setFeaturedVideos((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Channel manager handlers - ROCK SOLID IMPLEMENTATION:
  const handleAddChannel = useCallback(async (newChannel: ChannelItem) => {
    // 1. Immediately persist to state & localStorage
    setChannels((prev) => {
      if (prev.some((c) => c.id === newChannel.id)) return prev;
      const updated = [newChannel, ...prev];
      localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(updated));
      return updated;
    });

    // 2. Show celebratory feedback toast
    setChannelToast(`تمت إضافة القناة "${newChannel.title}" بنجاح! 🎉 جاري عرض وتحديث مقاطعها.`);
    setTimeout(() => setChannelToast(null), 5000);

    // 3. Make this channel active and go to feed
    setSelectedChannelId(newChannel.id);
    setActiveTab('feed');

    // 4. Immediately fetch this newly added channel's videos!
    try {
      setIsLoading(true);
      const data = await fetchChannelFeed(newChannel.id, true);

      // Update channel metadata
      setChannels((prev) =>
        prev.map((c) =>
          c.id === newChannel.id
            ? {
                ...c,
                title: c.customName || data.channelTitle || c.title,
                avatar: data.avatar || c.avatar,
                videoCount: data.videos.length,
              }
            : c
        )
      );

      // Merge new videos into main feed (prepend so they are visible right away)
      setVideos((prev) => {
        const newVideoIds = new Set(data.videos.map((v) => v.videoId));
        const remaining = prev.filter((v) => !newVideoIds.has(v.videoId));
        const merged = [...data.videos, ...remaining];
        merged.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        try {
          localStorage.setItem(STORAGE_VIDEOS_CACHE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    } catch (err) {
      console.error('Failed to fetch new channel videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRemoveChannel = useCallback((channelId: string) => {
    setChannels((prev) => {
      const updated = prev.filter((c) => c.id !== channelId);
      localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(updated));
      return updated;
    });
    setVideos((prev) => {
      const updated = prev.filter((v) => v.channelId !== channelId);
      try {
        localStorage.setItem(STORAGE_VIDEOS_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (selectedChannelId === channelId) {
      setSelectedChannelId('all');
    }
  }, [selectedChannelId]);

  const handleUpdateChannelName = useCallback((channelId: string, customName: string) => {
    setChannels((prev) => {
      const updated = prev.map((c) => (c.id === channelId ? { ...c, customName } : c));
      localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleResetDefaultChannels = useCallback(() => {
    setChannels(DEFAULT_CHANNELS);
    localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(DEFAULT_CHANNELS));
    localStorage.removeItem(STORAGE_VIDEOS_CACHE_KEY);
    setVideos([]);
    setTimeout(() => {
      fetchFeeds(true);
    }, 100);
  }, [fetchFeeds]);

  const handleImportChannels = useCallback((imported: ChannelItem[]) => {
    setChannels(imported);
    localStorage.setItem(STORAGE_CHANNELS_KEY, JSON.stringify(imported));
    setTimeout(() => {
      fetchFeeds(true);
    }, 100);
  }, [fetchFeeds]);

  // Playlist navigation in modal
  const currentVideoIndex = useMemo(() => {
    if (!activeVideo) return -1;
    return filteredVideos.findIndex((v) => v.videoId === activeVideo.videoId);
  }, [activeVideo, filteredVideos]);

  const handleNextVideo = useCallback(() => {
    if (currentVideoIndex !== -1 && currentVideoIndex < filteredVideos.length - 1) {
      handlePlayVideo(filteredVideos[currentVideoIndex + 1]);
    }
  }, [currentVideoIndex, filteredVideos, handlePlayVideo]);

  const handlePrevVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      handlePlayVideo(filteredVideos[currentVideoIndex - 1]);
    }
  }, [currentVideoIndex, filteredVideos, handlePlayVideo]);

  // Grid layout class based on theme.cardLayout
  const gridContainerClass = useMemo(() => {
    switch (theme.cardLayout) {
      case 'compact':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3';
      case 'list':
        return 'flex flex-col gap-3.5';
      case 'cinema':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'grid':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  }, [theme.cardLayout]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        channelsCount={channels.length}
        featuredCount={featuredVideos.length}
        isLoading={isLoading}
        onRefresh={() => fetchFeeds(true)}
        settings={settings}
        setSettings={setSettings}
        onOpenAddChannel={() => setIsChannelsModalOpen(true)}
        onOpenAddFeatured={() => setActiveTab('featured')}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
        onShufflePlay={handleShufflePlay}
      />

      {/* Celebratory Channel Toast */}
      {channelToast && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3">
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-bold">{channelToast}</span>
            </div>
            <button
              onClick={() => setChannelToast(null)}
              className="p-1 rounded-lg hover:bg-emerald-900/50 text-emerald-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Tab 1: Feed (المقاطع المستمرة) */}
        {activeTab === 'feed' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
            {/* Horizontal Channel Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedChannelId('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedChannelId === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>الكل (كل القنوات)</span>
                <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full">
                  {videos.length}
                </span>
              </button>

              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedChannelId === ch.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{ch.customName || ch.title}</span>
                </button>
              ))}

              <button
                onClick={() => setIsChannelsModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 transition-all"
                title="إدارة القنوات وإضافة قنوات جديدة"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إدارة القنوات ({channels.length})</span>
              </button>

              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-900 hover:bg-slate-850 text-amber-300 border border-slate-800 flex items-center gap-1 transition-all mr-auto"
                title="تخصيص الواجهة واللون والمظهر"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>تخصيص المظهر</span>
              </button>
            </div>

            {/* Quick Content Type Filter Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'كل المقاطع' },
                  { id: 'recent', label: 'أحدث مقاطع الأسبوع' },
                  { id: 'long', label: 'فيديوهات كاملة فقط' },
                  { id: 'shorts', label: 'مقاطع شورتس فقط' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFeedFilterType(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      feedFilterType === f.id
                        ? 'bg-accent-secondary text-white font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Quick Shuffle in feed */}
              <button
                onClick={handleShufflePlay}
                title="تشغيل فيديو عشوائي 🎲"
                className="p-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 text-xs font-medium flex items-center gap-1 flex-shrink-0 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5 text-accent-secondary" />
                <span className="hidden sm:inline">فيديو عشوائي</span>
              </button>
            </div>

            {/* Sub-header status and toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">
                  {filteredVideos.length} مقطع متوفر
                </span>
                {selectedChannelId !== 'all' && (
                  <button
                    onClick={() => setSelectedChannelId('all')}
                    className="text-amber-400 hover:underline"
                  >
                    (عرض كل القنوات)
                  </button>
                )}
                {lastRefreshed && (
                  <span className="hidden sm:inline text-slate-400 text-[11px]">
                    • آخر تحديث: {lastRefreshed.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Shorts toggle */}
                <button
                  onClick={() => setSettings((s) => ({ ...s, hideShorts: !s.hideShorts }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                    settings.hideShorts
                      ? 'bg-red-950/40 border-red-500/40 text-red-300 font-bold'
                      : 'bg-slate-900 border-slate-800 hover:text-white'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{settings.hideShorts ? 'مخفي الشورتس' : 'إخفاء الشورتس'}</span>
                </button>

                {/* Theme Customizer Quick Link */}
                <button
                  onClick={() => setIsThemeModalOpen(true)}
                  className="flex items-center gap-1 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-900 transition-colors text-amber-400 font-medium"
                  title="تخصيص ألوان وشكل الواجهة"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">الألوان والمظهر</span>
                </button>

                {/* Settings button */}
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="flex items-center gap-1 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
                  title="الإعدادات ووضع الأداء"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">الإعدادات</span>
                </button>
              </div>
            </div>

            {/* Error notice if any */}
            {fetchError && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={() => fetchFeeds(true)}
                  className="underline hover:text-white font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Videos Grid with selected layout */}
            {isLoading && videos.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse"
                  >
                    <div className="aspect-video bg-slate-800"></div>
                    <div className="p-4 space-y-2.5">
                      <div className="h-3.5 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-850 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                  🍌
                </div>
                <h3 className="text-base font-bold text-white">لا توجد مقاطع لعرضها حالياً</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'لم يتم العثور على أي مقطع يطابق كلمة البحث.'
                    : 'جاري تحميل مقاطع القنوات أو يمكنك الضغط على تحديث في الأعلى.'}
                </p>
                <button
                  onClick={() => fetchFeeds(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  تحديث المقاطع الآن 🔄
                </button>
              </div>
            ) : (
              <div className={gridContainerClass}>
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={`${video.channelId}_${video.videoId}`}
                    video={video}
                    onPlay={handlePlayVideo}
                    onSelectChannel={(chId) => setSelectedChannelId(chId)}
                    onAddToFeatured={handleAddVideoToFeatured}
                    onToggleWatchLater={handleToggleWatchLater}
                    isWatchLater={watchLaterList.some((v) => v.videoId === video.videoId)}
                    isFeatured={featuredVideos.some((f) => f.videoId === video.videoId)}
                    liteMode={settings.liteMode}
                    themeSettings={theme}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Shorts View (شورتس مخصص حصراً من قنواتك المضافة) */}
        {activeTab === 'shorts' && (
          <ShortsView
            videos={videos}
            channels={channels}
            onAddToFeatured={handleAddVideoToFeatured}
            onToggleWatchLater={handleToggleWatchLater}
            watchLaterList={watchLaterList}
            liteMode={settings.liteMode}
          />
        )}

        {/* Tab 3: Featured Videos View (فيديوهات مميزة برابط) */}
        {activeTab === 'featured' && (
          <FeaturedVideosView
            featuredVideos={featuredVideos}
            onPlayVideo={handlePlayVideo}
            onAddFeatured={handleAddFeatured}
            onRemoveFeatured={handleRemoveFeatured}
            liteMode={settings.liteMode}
          />
        )}

        {/* Tab 3: Channels Manager (قنواتي) */}
        {activeTab === 'channels' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-sky-400" />
                  <span>القنوات المتابعة في بنانا تيوب</span>
                  <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {channels.length} قناة
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  يمكنك إضافة أي عدد تريده من القنوات بالمعرّف ID أو الرابط وتصفح مقاطعها مباشرة
                </p>
              </div>

              <button
                onClick={() => setIsChannelsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أو إدارة القنوات</span>
              </button>
            </div>

            {/* Grid of Channels */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {channels.map((channel, i) => (
                <div
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setActiveTab('feed');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-102 group flex flex-col items-center justify-between"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-amber-400 overflow-hidden flex items-center justify-center text-amber-400 font-bold text-lg mb-3 shadow-md">
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>▶</span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-300 line-clamp-1 mb-1">
                    {channel.customName || channel.title}
                  </h3>

                  <span className="text-[10px] text-slate-400 font-mono truncate w-full block">
                    {channel.id.slice(0, 12)}...
                  </span>

                  <span className="mt-2 text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full border border-slate-800 group-hover:border-amber-400/30">
                    عرض المقاطع →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Library (المشاهدة لاحقاً والسجل) */}
        {activeTab === 'library' && (
          <WatchLaterView
            watchLaterList={watchLaterList}
            watchHistory={watchHistory}
            onPlayVideo={handlePlayVideo}
            onRemoveWatchLater={handleRemoveWatchLater}
            onClearHistory={() => setWatchHistory([])}
            onAddToFeatured={handleAddVideoToFeatured}
            liteMode={settings.liteMode}
          />
        )}
      </main>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
        onNext={handleNextVideo}
        onPrev={handlePrevVideo}
        hasNext={currentVideoIndex !== -1 && currentVideoIndex < filteredVideos.length - 1}
        hasPrev={currentVideoIndex > 0}
        onAddToFeatured={handleAddVideoToFeatured}
        onToggleWatchLater={handleToggleWatchLater}
        isWatchLater={activeVideo ? watchLaterList.some((v) => v.videoId === activeVideo.videoId) : false}
        isFeatured={activeVideo ? featuredVideos.some((f) => f.videoId === activeVideo.videoId) : false}
      />

      {/* Channels Manager Modal */}
      <ChannelsManagerModal
        channels={channels}
        onAddChannel={handleAddChannel}
        onRemoveChannel={handleRemoveChannel}
        onUpdateChannelName={handleUpdateChannelName}
        onResetDefaultChannels={handleResetDefaultChannels}
        onImportChannels={handleImportChannels}
        isOpen={isChannelsModalOpen}
        onClose={() => setIsChannelsModalOpen(false)}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        setSettings={setSettings}
        onClearCache={() => {
          localStorage.removeItem(STORAGE_VIDEOS_CACHE_KEY);
          fetchFeeds(true);
        }}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🍌</span>
            <span className="font-bold text-slate-300">Banana Tube • بنانا تيوب</span>
            <span>- منصة يوتيوب بديلة وخفيفة مخصصة للأجهزة القديمة</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>تخصيص الألوان والمظهر</span>
            </button>
            <span>•</span>
            <span>مشغل Embed سريع</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-white"
            >
              إعدادات الأداء
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
