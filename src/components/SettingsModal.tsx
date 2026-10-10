import React from 'react';
import { X, Settings as SettingsIcon, Zap, EyeOff, RotateCw, Palette, Smartphone } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClearCache: () => void;
  onOpenThemeCustomizer: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  onClearCache,
  onOpenThemeCustomizer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">إعدادات بنانا تيوب</h2>
              <p className="text-xs text-slate-400">تحكم بالأداء وتخصيص تجربة المشاهدة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Theme Customizer Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-slate-950 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  استوديو تخصيص الواجهة والمظهر
                </h4>
                <p className="text-[11px] text-slate-300">
                  تغيير النمط الداكن/الفاتح، لون الهوية، توزيع المقاطع، والخطوط
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenThemeCustomizer();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
            >
              تخصيص الآن 🎨
            </button>
          </div>

          {/* Option 1: Lite Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  وضع الأجهزة القديمة والضعيفة (Ultra Lite)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  يلغي المؤثرات الثقيلة والحركات لتسريع التصفح وتوفير استهلاك المعالج والرام على الهواتف القديمة.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSettings((s) => ({ ...s, liteMode: !s.liteMode }))}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                settings.liteMode ? 'bg-amber-500 justify-end' : 'bg-slate-750 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950"></div>
            </button>
          </div>

          {/* Option 2: Hide Shorts */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-850 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 mt-0.5">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  إخفاء مقاطع شورتس القصيرة (Hide Shorts)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  عرض الفيديوهات الكاملة فقط واستبعاد مقاطع اليوتيوب القصيرة.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSettings((s) => ({ ...s, hideShorts: !s.hideShorts }))}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                settings.hideShorts ? 'bg-amber-500 justify-end' : 'bg-slate-750 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950"></div>
            </button>
          </div>

          {/* Device & Phone Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>مصمم خصيصاً لهاتفك القديم</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تم برمجة Banana Tube ليعمل بدون أي إعلانات منبثقة، وبدون مكتبات ثقيلة، ويستخدم مشغل الـ Embed الخفيف جداً، ليعمل بسلاسة حتى على متصفحات الهواتف التي توقف عنها دعم تطبيق يوتيوب الرسمي.
            </p>
          </div>

          {/* Clear Cache */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClearCache();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الذاكرة المؤقتة وتحديث المقاطع كلياً</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
