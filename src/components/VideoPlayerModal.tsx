import React, { useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Sparkles,
  Bookmark,
  Share2,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { VideoItem } from '../types';
import { formatArabicDate } from '../utils/youtube';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onAddToFeatured?: (video: VideoItem) => void;
  onToggleWatchLater?: (video: VideoItem) => void;
  isWatchLater?: boolean;
  isFeatured?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  onAddToFeatured,
  onToggleWatchLater,
  isWatchLater = false,
  isFeatured = false,
}) => {
  const [isTheater, setIsTheater] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowLeft' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasNext, hasPrev, onNext, onPrev]);

  if (!video) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://www.youtube.com/watch?v=${video.videoId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full bg-slate-900 border border-slate-850 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all my-auto ${
          isTheater ? 'max-w-6xl' : 'max-w-4xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800 text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
              {video.channelTitle || video.author}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Prev Video */}
            {hasPrev && (
              <button
                onClick={onPrev}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 transition-colors"
                title="المقطع السابق (السهم الأيمن)"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">السابق</span>
              </button>
            )}

            {/* Next Video */}
            {hasNext && (
              <button
                onClick={onNext}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 transition-colors"
                title="المقطع التالي (السهم الأيسر)"
              >
                <span className="hidden sm:inline">التالي</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheater(!isTheater)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={isTheater ? 'تصغير المشغل' : 'تكبير المشغل'}
            >
              {isTheater ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
              title="إغلاق المشغل (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Frame */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Info & Controls Panel */}
        <div className="p-4 sm:p-5 bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {video.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-slate-400">
                <span className="text-amber-400 font-bold">{video.channelTitle}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md badge-secondary border font-bold">
                  <Clock className="w-3.5 h-3.5 text-accent-secondary" />
                  <span>{formatArabicDate(video.published)}</span>
                </span>
                {video.views && (
                  <>
                    <span>•</span>
                    <span>{video.views} مشاهدة</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Add to Featured */}
              {onAddToFeatured && (
                <button
                  onClick={() => onAddToFeatured(video)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isFeatured
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isFeatured ? 'في المميزة ⭐' : 'إضافة للمميزة'}</span>
                </button>
              )}

              {/* Watch Later */}
              {onToggleWatchLater && (
                <button
                  onClick={() => onToggleWatchLater(video)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isWatchLater
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isWatchLater ? 'محفوظ' : 'المشاهدة لاحقاً'}</span>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>

              {/* Open in YouTube (optional external) */}
              <a
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-all"
                title="فتح الرابط الأصلي"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description Section if available */}
          {video.description && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => setShowDesc(!showDesc)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                <span>{showDesc ? 'إخفاء وصف الفيديو' : 'عرض وصف الفيديو'}</span>
                {showDesc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDesc && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {video.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
