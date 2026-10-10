import React, { useState } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  Play,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  Tag,
  Check,
  AlertCircle,
  Clock,
  Film
} from 'lucide-react';
import { FeaturedVideoItem, VideoItem } from '../types';
import { extractVideoId, fetchYouTubeVideoInfo, formatArabicDate } from '../utils/youtube';

interface FeaturedVideosViewProps {
  featuredVideos: FeaturedVideoItem[];
  onPlayVideo: (video: VideoItem) => void;
  onAddFeatured: (video: FeaturedVideoItem) => void;
  onRemoveFeatured: (id: string) => void;
  liteMode?: boolean;
}

const COMMON_TAGS = ['ألعاب', 'بودكاست', 'ترفيه', 'تقنية', 'تعليمي', 'وثائقي', 'مفضل'];

export const FeaturedVideosView: React.FC<FeaturedVideosViewProps> = ({
  featuredVideos,
  onPlayVideo,
  onAddFeatured,
  onRemoveFeatured,
  liteMode = false,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [note, setNote] = useState('');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterTag, setFilterTag] = useState('الكل');
  const [searchInFeatured, setSearchInFeatured] = useState('');

  // Live in-page player state
  const [inlineVideoId, setInlineVideoId] = useState<string | null>(null);

  // Check URL on input change to preview
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    setErrorMsg('');
    setSuccessMsg('');

    const vidId = extractVideoId(val);
    if (vidId && !customTitle) {
      // Auto fetch title through the CORS proxy
      setIsFetchingInfo(true);
      try {
        const data = await fetchYouTubeVideoInfo(val);
        if (data.title && !customTitle) {
          setCustomTitle(data.title);
        }
      } catch {
        // Fallback silently
      } finally {
        setIsFetchingInfo(false);
      }
    }
  };

  // Immediate Play
  const handleDirectPlay = () => {
    setErrorMsg('');
    const vidId = extractVideoId(urlInput);
    if (!vidId) {
      setErrorMsg('الرابط المدخل غير صالح، يرجى التأكد من رابط الفيديو.');
      return;
    }

    setInlineVideoId(vidId);

    // Also trigger modal play
    const videoItem: VideoItem = {
      id: vidId,
      videoId: vidId,
      channelId: 'custom',
      channelTitle: 'فيديو مميز برابط',
      title: customTitle || `فيديو يوتيوب (${vidId})`,
      author: 'رابط مباشر',
      published: new Date().toISOString(),
      thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
      description: note || 'فيديو مدخل برابط مباشر من قبلك',
    };

    onPlayVideo(videoItem);
  };

  // Save to Featured list
  const handleSaveFeatured = () => {
    setErrorMsg('');
    const vidId = extractVideoId(urlInput);
    if (!vidId) {
      setErrorMsg('الرجاء إدخال رابط يوتيوب صحيح أولاً (مثال: https://youtu.be/... أو رابط كامل)');
      return;
    }

    const newItem: FeaturedVideoItem = {
      id: `${vidId}_${Date.now()}`,
      videoId: vidId,
      title: customTitle.trim() || `فيديو مميز (${vidId})`,
      channelTitle: 'فيديو مميز محفوظ',
      thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
      note: note.trim() || undefined,
      tag: selectedTag || 'مفضل',
      addedAt: Date.now(),
      originalUrl: urlInput.trim(),
    };

    onAddFeatured(newItem);
    setSuccessMsg('تم حفظ الفيديو بنجاح في قائمتك المميزة! 🎉');
    setUrlInput('');
    setCustomTitle('');
    setNote('');
    setSelectedTag('');

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtered list
  const filteredList = featuredVideos.filter((item) => {
    const matchTag = filterTag === 'الكل' || item.tag === filterTag;
    const matchSearch =
      !searchInFeatured ||
      item.title.toLowerCase().includes(searchInFeatured.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchInFeatured.toLowerCase()));
    return matchTag && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Hero Intro for Featured section */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-slate-900 border border-amber-500/20 rounded-3xl p-5 sm:p-7 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مشغل الروابط المباشرة والمقاطع المميزة</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
            ضع أي رابط يوتيوب وشاهده فوراً <span className="text-amber-400">داخل بنانا تيوب</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            مخصص لأصحاب الهواتف والأجهزة القديمة: الصق أي رابط فيديو وستشاهده مباشرة وبأعلى سرعة وبدون الحاجة لفتح تطبيق يوتيوب أو متصفحه الثقيل، مع إمكانية حفظ مقاطعك المفضلة للرجوع إليها دائماً.
          </p>
        </div>
      </div>

      {/* URL Input & Quick Watch Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <LinkIcon className="w-4 h-4 text-amber-400" />
          <span>إدخال رابط فيديو يوتيوب جديد</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={urlInput}
              onChange={handleUrlChange}
              placeholder="ضع رابط الفيديو هنا (مثال: https://youtu.be/... أو https://www.youtube.com/watch?v=...)"
              className="w-full bg-slate-950 border border-slate-750 focus:border-amber-400 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {isFetchingInfo && (
              <span className="absolute left-3 top-3.5 text-xs text-amber-400 animate-pulse">
                جاري جلب معلومات الفيديو...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectPlay}
              disabled={!urlInput}
              className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>تشغيل فوري في الموقع</span>
            </button>

            <button
              onClick={handleSaveFeatured}
              disabled={!urlInput}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/40 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ في المميزة</span>
            </button>
          </div>
        </div>

        {/* Optional Custom Metadata fields (collapsible or neat row) */}
        {urlInput && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                عنوان مخصص للفيديو (اختياري)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="عنوان الفيديو..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                تصنيف / وسم (اختياري)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COMMON_TAGS.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                      selectedTag === tag
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                ملاحظة شخصية (اختياري)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثال: يبدأ المحتوى المهم في الدقيقة 4..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Inline Direct Player (if user clicked Play right here) */}
      {inlineVideoId && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-300">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>المشغل المباشر السريع لمقطعك المدخل</span>
            </div>
            <button
              onClick={() => setInlineVideoId(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              إغلاق المشغل المباشر
            </button>
          </div>

          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-850">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${inlineVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="مشغل بنانا تيوب المباشر"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Saved Featured Videos Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>مكتبة الفيديوهات المميزة المحفوظة</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {featuredVideos.length} فيديو
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مقاطعك التي أدخلت روابطها محفوظة هنا دائماً للمشاهدة السريعة
            </p>
          </div>

          {/* Search inside featured */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchInFeatured}
                onChange={(e) => setSearchInFeatured(e.target.value)}
                placeholder="ابحث في المميزة..."
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 pr-8 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['الكل', ...COMMON_TAGS].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterTag === t
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid of Featured Videos */}
        {filteredList.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto text-xl">
              ⭐
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              {featuredVideos.length === 0
                ? 'لا توجد فيديوهات مميزة حتى الآن'
                : 'لا توجد نتائج تطابق بحثك أو تصنيفك'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              الصق رابط أي مقطع تريده في الحقل أعلاه واضغط على "حفظ في المميزة" لتجده هنا دائماً!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all"
              >
                {/* Thumbnail */}
                <div
                  onClick={() =>
                    onPlayVideo({
                      id: item.videoId,
                      videoId: item.videoId,
                      channelId: 'custom',
                      channelTitle: item.channelTitle || 'فيديو مميز',
                      title: item.title,
                      author: item.channelTitle || 'فيديو مميز',
                      published: new Date(item.addedAt).toISOString(),
                      thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                      description: item.note,
                    })
                  }
                  className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                >
                  <img
                    src={item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current mr-[-2px]" />
                    </div>
                  </div>

                  {item.tag && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-md">
                      {item.tag}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    <h3
                      title={item.title}
                      onClick={() =>
                        onPlayVideo({
                          id: item.videoId,
                          videoId: item.videoId,
                          channelId: 'custom',
                          channelTitle: item.channelTitle || 'فيديو مميز',
                          title: item.title,
                          author: item.channelTitle || 'فيديو مميز',
                          published: new Date(item.addedAt).toISOString(),
                          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                          description: item.note,
                        })
                      }
                      className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 hover:text-amber-300 cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    {item.note && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                        💬 {item.note}
                      </p>
                    )}

                    {/* Time Ago Display Under Video with darkened secondary tone */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs badge-secondary border px-2 py-0.5 rounded-lg w-fit">
                      <Clock className="w-3 h-3 text-accent-secondary flex-shrink-0" />
                      <span className="font-bold text-[11px]">{formatArabicDate(new Date(item.addedAt).toISOString())}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-400">
                      <span>أضيف: {new Date(item.addedAt).toLocaleDateString('ar-EG')}</span>
                    </span>

                    <button
                      onClick={() => onRemoveFeatured(item.id)}
                      className="p-1 rounded-lg hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors"
                      title="حذف من الفيديوهات المميزة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
