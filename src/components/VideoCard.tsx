import React, { useState } from 'react';
import { Play, Sparkles, Bookmark, Check, Share2, Clock } from 'lucide-react';
import { VideoItem, ThemeSettings } from '../types';
import { formatArabicDate, formatViews } from '../utils/youtube';

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  onSelectChannel?: (channelId: string) => void;
  onAddToFeatured?: (video: VideoItem) => void;
  onToggleWatchLater?: (video: VideoItem) => void;
  isWatchLater?: boolean;
  isFeatured?: boolean;
  liteMode?: boolean;
  themeSettings?: ThemeSettings;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlay,
  onSelectChannel,
  onAddToFeatured,
  onToggleWatchLater,
  isWatchLater = false,
  isFeatured = false,
  liteMode = false,
  themeSettings,
}) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  // Settings fallbacks
  const showTimeAgo = themeSettings?.showTimeAgo ?? true;
  const showViews = themeSettings?.showViews ?? true;
  const showShortsBadge = themeSettings?.showShortsBadge ?? true;
  const enableHoverZoom = (themeSettings?.enableHoverZoom ?? true) && !liteMode;
  const isListView = themeSettings?.cardLayout === 'list';
  const cornerClass =
    themeSettings?.cardCorner === 'sharp'
      ? 'rounded-none'
      : themeSettings?.cardCorner === 'medium'
      ? 'rounded-xl'
      : 'rounded-2xl';

  const thumbUrl = imgError
    ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
    : video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const timeAgoArabic = formatArabicDate(video.published);

  return (
    <article
      onClick={() => onPlay(video)}
      className={`group flex ${
        isListView ? 'flex-col sm:flex-row' : 'flex-col'
      } bg-slate-900 border border-slate-800/80 hover:border-amber-400/50 ${cornerClass} overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/5`}
    >
      {/* Thumbnail Container */}
      <div
        className={`relative aspect-video ${
          isListView ? 'w-full sm:w-64 sm:flex-shrink-0' : 'w-full'
        } bg-slate-950 overflow-hidden`}
      >
        <img
          src={thumbUrl}
          alt={video.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            enableHoverZoom ? 'group-hover:scale-105' : ''
          }`}
        />

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
            <Play className="w-6 h-6 fill-current mr-[-2px]" />
          </div>
        </div>

        {/* Video Tags / Indicators */}
        {showShortsBadge && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {video.isShort ? (
              <span className="bg-red-600/90 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                شورتس
              </span>
            ) : (
              <span className="bg-black/80 text-amber-300 font-semibold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-700/50">
                HD
              </span>
            )}
          </div>
        )}

        {/* Published Date Badge on image if enabled */}
        {showTimeAgo && !isListView && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/85 text-slate-200 text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm font-medium border border-slate-750">
              {timeAgoArabic}
            </span>
          </div>
        )}
      </div>

      {/* Info Section Under Video */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Channel Name and Views */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectChannel) onSelectChannel(video.channelId);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold truncate hover:underline text-right"
            >
              {video.channelTitle || video.author}
            </button>

            {showViews && video.views && (
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {formatViews(video.views)}
              </span>
            )}
          </div>

          {/* Video Title */}
          <h3
            title={video.title}
            className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors"
          >
            {video.title}
          </h3>

          {/* Time Ago Display Under Video: (منذ ...) with darkened secondary color */}
          {showTimeAgo && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs badge-secondary border px-2 py-1 rounded-lg w-fit transition-colors">
              <Clock className="w-3.5 h-3.5 text-accent-secondary flex-shrink-0" />
              <span className="font-bold text-[11px]">{timeAgoArabic}</span>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-slate-400 text-xs">
          {/* Watch later toggle */}
          {onToggleWatchLater && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchLater(video);
              }}
              className={`flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                isWatchLater ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
              }`}
              title={isWatchLater ? 'إزالة من المشاهدة لاحقاً' : 'حفظ للمشاهدة لاحقاً'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWatchLater ? 'fill-current' : ''}`} />
              <span className="text-[11px]">{isWatchLater ? 'محفوظ' : 'لاحقاً'}</span>
            </button>
          )}

          {/* Add to Featured button */}
          {onAddToFeatured && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToFeatured(video);
              }}
              className={`flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                isFeatured ? 'text-amber-400 font-bold' : 'hover:text-amber-300'
              }`}
              title={isFeatured ? 'موجود في الفيديوهات المميزة' : 'إضافة إلى الفيديوهات المميزة'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isFeatured ? 'fill-current' : ''}`} />
              <span className="text-[11px]">{isFeatured ? 'مميز' : 'تمييز'}</span>
            </button>
          )}

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="نسخ رابط الفيديو"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">نسخ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
