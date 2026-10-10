import { ThemeSettings, SecondaryDarkness, PresetAccentId } from '../types';

export interface AccentOption {
  id: string;
  name: string;
  hex: string;
  category: 'حيوية ودافئة' | 'سينما وجرأة' | 'بنفسج وأناقة' | 'بحار وسماء' | 'طبيعة وزمرد' | 'كلاسيكية وفخامة';
  emoji: string;
}

export const ACCENT_PALETTE: AccentOption[] = [
  // 1. حيوية ودافئة
  { id: 'banana', name: 'أصفر بنانا ذهبي', hex: '#facc15', category: 'حيوية ودافئة', emoji: '🍌' },
  { id: 'amber', name: 'مانجو مشرق', hex: '#f97316', category: 'حيوية ودافئة', emoji: '🥭' },
  { id: 'blaze', name: 'برتقالي ناري', hex: '#ea580c', category: 'حيوية ودافئة', emoji: '🔥' },
  { id: 'peach', name: 'خوخ دافئ', hex: '#fb923c', category: 'حيوية ودافئة', emoji: '🍑' },
  { id: 'honey', name: 'عسل كهرماني', hex: '#d97706', category: 'حيوية ودافئة', emoji: '🍯' },

  // 2. سينما وجرأة
  { id: 'ruby', name: 'أحمر سينمائي', hex: '#ef4444', category: 'سينما وجرأة', emoji: '🔴' },
  { id: 'crimson', name: 'قرمزي كلاسيكي', hex: '#dc2626', category: 'سينما وجرأة', emoji: '🍷' },
  { id: 'rose', name: 'وردي نيون ساطع', hex: '#f43f5e', category: 'سينما وجرأة', emoji: '🌸' },
  { id: 'fuchsia', name: 'فوشيا فاقع', hex: '#ec4899', category: 'سينما وجرأة', emoji: '💖' },
  { id: 'magenta', name: 'ماجنتا ملكي', hex: '#d946ef', category: 'سينما وجرأة', emoji: '✨' },

  // 3. بنفسج وأناقة
  { id: 'violet', name: 'بنفسجي نيون', hex: '#8b5cf6', category: 'بنفسج وأناقة', emoji: '🟣' },
  { id: 'indigo', name: 'أرجواني ديب', hex: '#6366f1', category: 'بنفسج وأناقة', emoji: '🔮' },
  { id: 'cosmic', name: 'كوزميك فضائي', hex: '#7c3aed', category: 'بنفسج وأناقة', emoji: '🌌' },

  // 4. بحار وسماء
  { id: 'sapphire', name: 'أزرق ملكي سافاير', hex: '#3b82f6', category: 'بحار وسماء', emoji: '🔷' },
  { id: 'sky', name: 'سماوي نقي', hex: '#0ea5e9', category: 'بحار وسماء', emoji: '☁️' },
  { id: 'cyan', name: 'تركواز مائي', hex: '#06b6d4', category: 'بحار وسماء', emoji: '💎' },
  { id: 'teal', name: 'فيروزي بحري', hex: '#14b8a6', category: 'بحار وسماء', emoji: '🌊' },
  { id: 'cobalt', name: 'كوبالت كهربائي', hex: '#2563eb', category: 'بحار وسماء', emoji: '⚡' },

  // 5. طبيعة وزمرد
  { id: 'emerald', name: 'أخضر زمردي فاخر', hex: '#10b981', category: 'طبيعة وزمرد', emoji: '🟢' },
  { id: 'lime', name: 'ليموني نيون مشع', hex: '#84cc16', category: 'طبيعة وزمرد', emoji: '🍋' },
  { id: 'olive', name: 'زيتوني تكتيكي', hex: '#65a30d', category: 'طبيعة وزمرد', emoji: '🫒' },
  { id: 'mint', name: 'نعناعي منعش', hex: '#34d399', category: 'طبيعة وزمرد', emoji: '🌿' },

  // 6. كلاسيكية وفخامة
  { id: 'bronze', name: 'نحاسي برونزي عتيق', hex: '#b45309', category: 'كلاسيكية وفخامة', emoji: '🥉' },
  { id: 'platinum', name: 'بلاتيني تيتانيوم', hex: '#94a3b8', category: 'كلاسيكية وفخامة', emoji: '🪙' },
];

// Helper to convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper to convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Helper to convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// DARKEN COLOR DYNAMICALLY:
// Takes the base accent color and produces a darkened shade of the EXACT same hue
export function getDarkenedSecondaryColor(baseHex: string, level: SecondaryDarkness = 'balanced'): string {
  try {
    const rgb = hexToRgb(baseHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Percentage reduction based on user preference
    const reduction = level === 'subtle' ? 18 : level === 'deep' ? 42 : 28;

    // Reduce lightness while slightly bumping saturation for rich color tone
    const newL = Math.max(12, Math.min(85, hsl.l - reduction));
    const newS = Math.min(100, hsl.s * 1.08);

    return hslToHex(hsl.h, newS, newL);
  } catch {
    return '#ca8a04'; // Safe fallback
  }
}

// Get primary color hex from preset ID or custom hex
export function resolveAccentHex(accentColor: string): string {
  if (accentColor.startsWith('#')) return accentColor;
  const found = ACCENT_PALETTE.find((a) => a.id === accentColor);
  return found ? found.hex : '#facc15';
}

// Determine if dark text or light text is needed for high contrast
export function getContrastTextColor(hex: string): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#0f172a' : '#ffffff';
  } catch {
    return '#0f172a';
  }
}

// 8 Curated 1-Click Presets
export const THEME_PRESETS: {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  settings: Partial<ThemeSettings>;
}[] = [
  {
    id: 'banana_classic',
    name: 'بنانا الذهبي الأصلي',
    desc: 'النمط الأصلي المفضل لبنانا تيوب بألوان صفراء براقة وخلفية ليلية',
    emoji: '🍌',
    settings: {
      mode: 'dark',
      accentColor: 'banana',
      secondaryDarkness: 'balanced',
      cardLayout: 'grid',
      fontFamily: 'cairo',
      ambientGlow: true,
    },
  },
  {
    id: 'cinema_ruby',
    name: 'سينما هوليوود الحمراء',
    desc: 'مظهر أحمر سينمائي فخم لمحبي شاشات السينما واليوتيوب الكلاسيكي',
    emoji: '🎬',
    settings: {
      mode: 'oled',
      accentColor: 'ruby',
      secondaryDarkness: 'deep',
      cardLayout: 'cinema',
      fontFamily: 'tajawal',
      ambientGlow: true,
    },
  },
  {
    id: 'cyber_neon',
    name: 'سايبر نيون بنفسجي',
    desc: 'ألوان بنفسجية مشعة وأضواء نيون حديثة بتقنية عالية',
    emoji: '⚡',
    settings: {
      mode: 'dark',
      accentColor: 'violet',
      secondaryDarkness: 'balanced',
      cardLayout: 'grid',
      fontFamily: 'tajawal',
      ambientGlow: true,
    },
  },
  {
    id: 'royal_emerald',
    name: 'الزمرد الملكي الفاخر',
    desc: 'أخضر زمردي هادئ ومريح مع خلفية سوداء عميقة',
    emoji: '👑',
    settings: {
      mode: 'oled',
      accentColor: 'emerald',
      secondaryDarkness: 'deep',
      cardLayout: 'grid',
      fontFamily: 'almarai',
      ambientGlow: true,
    },
  },
  {
    id: 'ocean_cyan',
    name: 'أعماق المحيط الفيروزي',
    desc: 'تركواز بحري نقي مع تدرجات أمواج المحيط الزرقاء',
    emoji: '🌊',
    settings: {
      mode: 'navy',
      accentColor: 'cyan',
      secondaryDarkness: 'balanced',
      cardLayout: 'grid',
      fontFamily: 'cairo',
      ambientGlow: true,
    },
  },
  {
    id: 'sunset_blaze',
    name: 'غروب الشمس الدافئ',
    desc: 'ألوان برتقالية نارية مفعمة بالحيوية والدفء',
    emoji: '🌅',
    settings: {
      mode: 'dark',
      accentColor: 'blaze',
      secondaryDarkness: 'balanced',
      cardLayout: 'grid',
      fontFamily: 'cairo',
      ambientGlow: true,
    },
  },
  {
    id: 'warm_sepia',
    name: 'ورق القهوة والموكا',
    desc: 'مظهر ورقي بني دافئ مريح جداً للعين أثناء المشاهدة الليلية',
    emoji: '☕',
    settings: {
      mode: 'sepia',
      accentColor: 'honey',
      secondaryDarkness: 'deep',
      cardLayout: 'list',
      fontFamily: 'almarai',
      ambientGlow: false,
    },
  },
  {
    id: 'pure_light',
    name: 'النهار الأبيض النقي',
    desc: 'مظهر نهاري مشرق ونظيف تماماً مناسب للقراءة والإضاءة العالية',
    emoji: '☀️',
    settings: {
      mode: 'light',
      accentColor: 'sapphire',
      secondaryDarkness: 'deep',
      cardLayout: 'grid',
      fontFamily: 'cairo',
      ambientGlow: false,
    },
  },
];
