import React, { useState } from 'react';
import { Bookmark, History, Trash2, Play, Clock, Sparkles } from 'lucide-react';
import { VideoItem } from '../types';
import { VideoCard } from './VideoCard';

interface WatchLaterViewProps {
  watchLaterList: VideoItem[];
  watchHistory: VideoItem[];
  onPlayVideo: (video: VideoItem) => void;
  onRemoveWatchLater: (videoId: string) => void;
  onClearHistory: () => void;
  onAddToFeatured: (video: VideoItem) => void;
  liteMode?: boolean;
}

export const WatchLaterView: React.FC<WatchLaterViewProps> = ({
  watchLaterList,
  watchHistory,
  onPlayVideo,
  onRemoveWatchLater,
  onClearHistory,
  onAddToFeatured,
  liteMode = false,
}) => {
  const [subTab, setSubTab] = useState<'later' | 'history'>('later');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Tab toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('later')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'later'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>المشاهدة لاحقاً ({watchLaterList.length})</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل المشاهدات ({watchHistory.length})</span>
          </button>
        </div>

        {subTab === 'history' && watchHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        )}
      </div>

      {/* Watch Later Sub-Tab */}
      {subTab === 'later' && (
        <div>
          {watchLaterList.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">قائمة المشاهدة لاحقاً فارغة</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                اضغط على زر "لاحقاً" على أي بطاقة فيديو لحفظه هنا ومشاهدته متى أردت.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchLaterList.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                  onToggleWatchLater={() => onRemoveWatchLater(video.videoId)}
                  onAddToFeatured={onAddToFeatured}
                  isWatchLater={true}
                  liteMode={liteMode}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Sub-Tab */}
      {subTab === 'history' && (
        <div>
          {watchHistory.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <History className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">سجل المشاهدة فارغ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                المقاطع التي تفتحها وتشاهدها ستظهر هنا تلقائياً لسهولة العودة إليها.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchHistory.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                  onAddToFeatured={onAddToFeatured}
                  liteMode={liteMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
