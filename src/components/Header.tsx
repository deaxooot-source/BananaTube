import React from 'react';
import {
  Play,
  Search,
  X,
  Sparkles,
  Tv,
  Bookmark,
  RefreshCw,
  Zap,
  Plus,
  Palette,
  Flame,
  Shuffle
} from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  channelsCount: number;
  featuredCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenAddChannel: () => void;
  onOpenAddFeatured: () => void;
  onOpenThemeCustomizer: () => void;
  onShufflePlay?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  channelsCount,
  featuredCount,
  isLoading,
  onRefresh,
  settings,
  setSettings,
  onOpenAddChannel,
  onOpenAddFeatured,
  onOpenThemeCustomizer,
  onShufflePlay,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md transition-all">
      {/* Top Banner for Lite Mode if active */}
      {settings.liteMode && (
        <div className="bg-amber-500/20 text-amber-300 text-xs py-1 px-4 text-center border-b border-amber-500/30 flex items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>وضع الأجهزة القديمة مفعل: تأثيرات مخففة وأداء فائق السرعة</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              🍌
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  Banana<span className="text-amber-400">Tube</span>
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-bold">
                  بنانا تيوب
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                مشاهدة خفيفة ومباشرة لقنواتك المفضلة
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في المقاطع أو القنوات..."
                className="w-full bg-slate-950/80 border border-slate-750 focus:border-amber-400 rounded-xl py-2 pr-9 pl-9 text-sm text-slate-100 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="مسح البحث"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Customizer Button */}
            <button
              onClick={onOpenThemeCustomizer}
              title="تخصيص الواجهة والألوان والمظهر"
              className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">تخصيص الواجهة</span>
            </button>

            {/* Shuffle Random Video Button */}
            {onShufflePlay && (
              <button
                onClick={onShufflePlay}
                title="تشغيل فيديو عشوائي مفاجئ 🎲"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Shuffle className="w-4 h-4 text-accent-secondary" />
                <span className="hidden md:inline">عشوائي 🎲</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="تحديث قائمة المقاطع"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            {/* Lite Mode Toggle */}
            <button
              onClick={() => setSettings((s) => ({ ...s, liteMode: !s.liteMode }))}
              title={settings.liteMode ? 'إيقاف وضع الأجهزة القديمة' : 'تفعيل وضع الأجهزة القديمة فائق السرعة'}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors ${
                settings.liteMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">وضع خفيف</span>
            </button>

            {/* Quick Add Dropdown / Buttons */}
            {activeTab === 'featured' ? (
              <button
                onClick={onOpenAddFeatured}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إدخال رابط</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddChannel}
                className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                title="إضافة قناة جديدة بالمعرف أو الرابط"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">إضافة قناة</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 text-sm">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs sm:text-sm ${
              activeTab === 'feed'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>المقاطع المستمرة</span>
          </button>

          {/* Shorts Tab */}
          <button
            onClick={() => setActiveTab('shorts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs sm:text-sm ${
              activeTab === 'shorts'
                ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30'
                : 'text-slate-300 hover:text-red-400 hover:bg-slate-800/80'
            }`}
          >
            <Flame className="w-4 h-4 text-red-500 fill-current" />
            <span>شورتس Shorts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 font-bold">
              جديد 🔥
            </span>
          </button>

          <button
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs sm:text-sm ${
              activeTab === 'featured'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>فيديوهات مميزة برابط</span>
            {featuredCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'featured'
                    ? 'bg-slate-950 text-amber-300 font-bold'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {featuredCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs sm:text-sm ${
              activeTab === 'channels'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-sky-400" />
            <span>القنوات المتابعة</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'channels'
                  ? 'bg-slate-950 text-amber-300 font-bold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {channelsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs sm:text-sm ${
              activeTab === 'library'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>المشاهدة لاحقاً والسجل</span>
          </button>

          {/* Direct Customizer tab button */}
          <button
            onClick={onOpenThemeCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-amber-300 hover:text-white hover:bg-slate-800/80 transition-all text-xs font-semibold mr-auto border border-amber-400/30"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>تخصيص المظهر 🎨</span>
          </button>
        </div>
      </div>
    </header>
  );
};
