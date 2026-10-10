import React, { useState } from 'react';
import {
  X,
  Palette,
  Sun,
  Moon,
  Smartphone,
  Eye,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  Check,
  Clock,
  Layers,
  Type,
  Sliders,
  Zap,
  Copy,
  Download,
  Upload,
  Compass,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Pipette
} from 'lucide-react';
import {
  ThemeSettings,
  ThemeMode,
  CardLayout,
  CardCorner,
  FontSizeScale,
  SecondaryDarkness,
  ArabicFont,
  BorderIntensity,
  GridColumnCount,
  DEFAULT_THEME_SETTINGS
} from '../types';
import {
  ACCENT_PALETTE,
  THEME_PRESETS,
  resolveAccentHex,
  getDarkenedSecondaryColor,
  getContrastTextColor,
  AccentOption
} from '../utils/theme';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
}

const THEME_MODES: {
  id: ThemeMode;
  name: string;
  desc: string;
  icon: React.ReactNode;
  borderPreview: string;
}[] = [
  {
    id: 'dark',
    name: 'ليلي كلاسيكي',
    desc: 'المظهر الليلي الأصلي لبنانا تيوب (كحلي رمادي داكن فخم)',
    icon: <Moon className="w-5 h-5 text-amber-400" />,
    borderPreview: 'border-slate-800 bg-slate-950',
  },
  {
    id: 'light',
    name: 'نهاري نقي',
    desc: 'مظهر فاتح عصري ونظيف ومريح جداً للإضاءة النهارية',
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    borderPreview: 'border-slate-300 bg-slate-100',
  },
  {
    id: 'oled',
    name: 'سوبر أموليد (AMOLED)',
    desc: 'أسود نقي حالك 100% لتوفير طاقة البطارية وراحة العين',
    icon: <Smartphone className="w-5 h-5 text-purple-400" />,
    borderPreview: 'border-neutral-900 bg-black',
  },
  {
    id: 'sepia',
    name: 'ورق دافئ (Sepia)',
    desc: 'ألوان بنية دافئة مريحة ومهدئة للعين عند المشاهدة الطويلة',
    icon: <Eye className="w-5 h-5 text-amber-600" />,
    borderPreview: 'border-[#3b322a] bg-[#181411]',
  },
  {
    id: 'navy',
    name: 'أزرق منتصف الليل (Navy)',
    desc: 'درجات الأزرق الملكي العميق لشاشات العرض السينمائية',
    icon: <Compass className="w-5 h-5 text-sky-400" />,
    borderPreview: 'border-[#182850] bg-[#060b18]',
  },
  {
    id: 'forest',
    name: 'غابة ليلية (Forest)',
    desc: 'درجات الأخضر الهادئ الداكن المستوحى من الطبيعة',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    borderPreview: 'border-[#18382b] bg-[#050f0a]',
  },
];

const LAYOUT_OPTIONS: { id: CardLayout; name: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: 'grid',
    name: 'شبكة متوازنة',
    desc: '3 إلى 4 مقاطع في الصف، مناسبة لمعظم الشاشات والأجهزة',
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    id: 'compact',
    name: 'شبكة مصغرة مكثفة',
    desc: 'عرض أكبر عدد من الفيديوهات في شاشة واحدة دون تمرير كثير',
    icon: <Minimize2 className="w-4 h-4" />,
  },
  {
    id: 'list',
    name: 'قائمة رأسية (List View)',
    desc: 'مقاطع متتالية تحت بعضها، مريحة للغاية للهواتف الصغيرة',
    icon: <List className="w-4 h-4" />,
  },
  {
    id: 'cinema',
    name: 'بطاقات سينمائية عريضة',
    desc: 'صور كبيرة وتفاصيل واضحة لمحبي المشاهدة الموسعة',
    icon: <Maximize2 className="w-4 h-4" />,
  },
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [copiedPresetMsg, setCopiedPresetMsg] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  // Resolve current active accent hex & its darkened secondary color
  const activeAccentHex = resolveAccentHex(theme.accentColor);
  const darkenedSecondaryHex = getDarkenedSecondaryColor(activeAccentHex, theme.secondaryDarkness);
  const contrastText = getContrastTextColor(activeAccentHex);

  const categories = ['الكل', 'حيوية ودافئة', 'سينما وجرأة', 'بنفسج وأناقة', 'بحار وسماء', 'طبيعة وزمرد', 'كلاسيكية وفخامة'];
  const filteredPalette =
    activeCategory === 'الكل'
      ? ACCENT_PALETTE
      : ACCENT_PALETTE.filter((c) => c.category === activeCategory);

  const handleCopyThemeJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(theme, null, 2)).then(() => {
      setCopiedPresetMsg(true);
      setTimeout(() => setCopiedPresetMsg(false), 2500);
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setTheme((prev) => ({ ...prev, ...parsed }));
          setImportError('');
        }
      } catch {
        setImportError('ملف المظهر غير صالح');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-md text-xl"
              style={{ backgroundColor: activeAccentHex, color: contrastText }}
            >
              🎨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                  استوديو تخصيص واجهة بنانا تيوب
                </h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  تخصيص شامل متطور 🚀
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                خصص درجات الألوان، اللون الثانوي المغمق، الخطوط، وتوزيع البطاقات بحرية تامة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-7">
          {/* Section 0: Quick 1-Click Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>قوالب مظهر جاهزة بضغطة زر واحدة (Theme Presets)</span>
              </h3>
              <span className="text-[11px] text-[var(--text-secondary)]">8 تصاميم منتقاة بعناية</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTheme((prev) => ({ ...prev, ...p.settings }))}
                  className="p-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-app)] hover:border-amber-400 text-right transition-all flex flex-col justify-between gap-1 group active:scale-95"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-[9px] bg-[var(--bg-card)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] group-hover:text-amber-400 font-bold">
                      تطبيق
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                      {p.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Color Palette (24 Colors + Custom Hex Picker) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>لون الهوية والتمييز الرئيسي (24 لوناً فاخراً + مخصص)</span>
              </h3>

              {/* Custom Color Input */}
              <label className="flex items-center gap-2 px-3 py-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] cursor-pointer text-xs font-bold text-[var(--text-main)] hover:border-amber-400 transition-colors w-fit">
                <Pipette className="w-3.5 h-3.5 text-amber-400" />
                <span>اختر أي لون مخصص:</span>
                <input
                  type="color"
                  value={activeAccentHex}
                  onChange={(e) => {
                    const customHex = e.target.value;
                    setTheme((t) => ({ ...t, accentColor: customHex, customAccentHex: customHex }));
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">{activeAccentHex}</span>
              </label>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Colors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {filteredPalette.map((acc) => {
                const isSelected = theme.accentColor === acc.id || theme.accentColor === acc.hex;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setTheme((t) => ({ ...t, accentColor: acc.id, customAccentHex: undefined }))}
                    className={`p-2 rounded-2xl border transition-all flex items-center gap-2 text-right relative group ${
                      isSelected
                        ? 'bg-[var(--bg-card-hover)] border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm border border-white/20 flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: acc.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-[var(--text-main)] block truncate">
                        {acc.name}
                      </span>
                    </div>
                    <span className="text-xs">{acc.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: THE SECONDARY COLOR SYSTEM (USER REQUEST HIGHLIGHT!) */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-app)] space-y-3.5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: darkenedSecondaryHex }} />
                  <h3 className="text-xs sm:text-sm font-black text-[var(--text-main)]">
                    نظام اللون الثانوي المشتق (Secondary Tone)
                  </h3>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    نفس لونك مع تغميق دقيق 🎯
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  اللون الثانوي يُشتق تلقائياً من لونك المختار ويظهر في شارات الوقت (منذ...)، القنوات، الأزرار الثانوية، وحواف المشغل.
                </p>
              </div>

              {/* Live Preview of Primary vs Secondary Swatches */}
              <div className="flex items-center gap-2 bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)] flex-shrink-0">
                <div className="flex flex-col items-center">
                  <span
                    className="w-7 h-7 rounded-lg shadow-sm border border-white/20 flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: activeAccentHex }}
                  />
                  <span className="text-[9px] text-[var(--text-secondary)] mt-0.5">رئيسي</span>
                </div>
                <span className="text-[var(--text-secondary)] font-bold text-xs">➔</span>
                <div className="flex flex-col items-center">
                  <span
                    className="w-7 h-7 rounded-lg shadow-sm border border-white/20 flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: darkenedSecondaryHex }}
                  />
                  <span className="text-[9px] text-[var(--text-secondary)] mt-0.5">ثانوي مغمق</span>
                </div>
              </div>
            </div>

            {/* Darkness Selector */}
            <div className="space-y-2 pt-1 border-t border-[var(--border-color)]">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center justify-between">
                <span>درجة تغميق اللون الثانوي المفضل لديك:</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {theme.secondaryDarkness === 'subtle' ? 'تغميق خفيف (18%)' : theme.secondaryDarkness === 'deep' ? 'تغميق عميق جداً (42%)' : 'تغميق متوازن طبيعي (28%)'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'subtle', name: 'تغميق خفيف', desc: 'قريب من اللون الأساسي' },
                  { id: 'balanced', name: 'تغميق متوازن (مستحسن)', desc: 'تناغم مريح وأنيق' },
                  { id: 'deep', name: 'تغميق عميق', desc: 'تباين عالي جداً وداكن' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setTheme((t) => ({ ...t, secondaryDarkness: lvl.id as SecondaryDarkness }))}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      theme.secondaryDarkness === lvl.id
                        ? 'border-amber-400 bg-[var(--bg-card-hover)] font-bold shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="text-xs block text-[var(--text-main)]">{lvl.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">{lvl.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Theme Modes (6 Modes) */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>مظهر الإضاءة والنمط الأساسي (Theme Modes)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {THEME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setTheme((t) => ({ ...t, mode: mode.id }))}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 relative ${
                    theme.mode === mode.id
                      ? 'bg-[var(--bg-card-hover)] border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                      : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-slate-600'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex-shrink-0 mt-0.5">
                    {mode.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                        {mode.name}
                      </span>
                      {theme.mode === mode.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1">
                      {mode.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Arabic Font Family & Font Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arabic Font Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                <span>نوع الخط العربي للواجهة (Font Family)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cairo', name: 'خط كايرو Cairo', desc: 'الافتراضي المتوازن' },
                  { id: 'tajawal', name: 'خط تجوال Tajawal', desc: 'عصري وتقني حاد' },
                  { id: 'almarai', name: 'خط المراعي Almarai', desc: 'ناعم ومريح جداً' },
                  { id: 'system', name: 'خط النظام System UI', desc: 'خفيف وفائق السرعة' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTheme((t) => ({ ...t, fontFamily: f.id as ArabicFont }))}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      theme.fontFamily === f.id
                        ? 'border-amber-400 bg-[var(--bg-card-hover)] font-bold text-[var(--text-main)] shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{f.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Scale */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>حجم خط العناوين والنصوص (Font Size)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'normal', 'large'] as FontSizeScale[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTheme((t) => ({ ...t, fontSize: size }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      theme.fontSize === size
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                        : 'bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {size === 'small' ? 'صغير' : size === 'normal' ? 'متوسط' : 'كبير جداً'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Layout Style & Column Count */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>طريقة توزيع وتنسيق المقاطع (Layout & Columns)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setTheme((t) => ({ ...t, cardLayout: layout.id }))}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                    theme.cardLayout === layout.id
                      ? 'bg-[var(--bg-card-hover)] border-amber-400 ring-2 ring-amber-400/20'
                      : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-slate-600'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] mt-0.5 text-amber-400">
                    {layout.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-main)]">{layout.name}</span>
                      {theme.cardLayout === layout.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                      {layout.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Aesthetic Toggles & Ambient Glow */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>المؤثرات البصرية وتفاصيل البطاقات</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Ambient Glow */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">
                      التوهج السينمائي المحيطي (Ambient Glow)
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">إضاءة ناعمة بلونك المختار خلف البطاقات والمشغل</span>
                  </div>
                </div>
                <button
                  onClick={() => setTheme((t) => ({ ...t, ambientGlow: !t.ambientGlow }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    theme.ambientGlow ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-950"></div>
                </button>
              </div>

              {/* Show Time Ago */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">
                      عرض توقيت النشر (منذ ...)
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">باللون الثانوي المغمق تحت كل مقطع</span>
                  </div>
                </div>
                <button
                  onClick={() => setTheme((t) => ({ ...t, showTimeAgo: !t.showTimeAgo }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    theme.showTimeAgo ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-950"></div>
                </button>
              </div>

              {/* Show Views */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">
                      عرض عدد المشاهدات
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">إظهار عداد المشاهدة بجانب القناة</span>
                  </div>
                </div>
                <button
                  onClick={() => setTheme((t) => ({ ...t, showViews: !t.showViews }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    theme.showViews ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-950"></div>
                </button>
              </div>

              {/* Hover Zoom */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">
                      حركة التكبير عند التمرير (Hover Zoom)
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">يمكن إيقافها لتسريع الهواتف القديمة</span>
                  </div>
                </div>
                <button
                  onClick={() => setTheme((t) => ({ ...t, enableHoverZoom: !t.enableHoverZoom }))}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                    theme.enableHoverZoom ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-950"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 7: Live Card Preview Box */}
          <div className="bg-[var(--bg-app)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>معاينة حية لشكل بطاقة الفيديو والألوان:</span>
              </span>
              <span className="text-[10px]">تتفاعل مباشرة مع اختياراتك</span>
            </div>

            <div className="max-w-md mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="w-28 aspect-video bg-black rounded-xl overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span style={{ color: activeAccentHex }}>▶</span>
                  </div>
                </div>
                {theme.showShortsBadge && (
                  <span
                    className="absolute bottom-1 left-1 text-[9px] font-bold px-1 rounded shadow"
                    style={{ backgroundColor: darkenedSecondaryHex, color: '#ffffff' }}
                  >
                    HD
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <span
                  className="text-[11px] font-black block truncate"
                  style={{ color: activeAccentHex }}
                >
                  كابتن ماجد Gaming
                </span>
                <span className="text-xs font-bold text-[var(--text-main)] block line-clamp-1 mt-0.5">
                  أفضل مقطع ممتع وتحديات قوية 2026
                </span>
                {theme.showTimeAgo && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${darkenedSecondaryHex}22`,
                      borderColor: `${darkenedSecondaryHex}66`,
                      color: darkenedSecondaryHex,
                    }}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>منذ ساعتين (باللون الثانوي المغمق)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(() => DEFAULT_THEME_SETTINGS)}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-amber-400 py-1.5 px-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الافتراضي</span>
            </button>

            <button
              onClick={handleCopyThemeJson}
              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] py-1.5 px-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
              title="نسخ إعدادات المظهر لمشاركتها"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedPresetMsg ? 'تم النسخ! ✅' : 'نسخ كود المظهر'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            style={{ backgroundColor: activeAccentHex, color: contrastText }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>حفظ واعتماد المظهر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
