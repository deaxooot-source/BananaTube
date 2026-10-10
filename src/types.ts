export interface VideoItem {
  id: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  author: string;
  published: string;
  thumbnail: string;
  description?: string;
  views?: string;
  isShort?: boolean;
}

export interface ChannelItem {
  id: string;
  title: string;
  avatar?: string;
  videoCount?: number;
  customName?: string;
  addedAt?: number;
}

export interface FeaturedVideoItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  note?: string;
  tag?: string;
  addedAt: number;
  originalUrl?: string;
}

export type ActiveTab = 'feed' | 'shorts' | 'featured' | 'channels' | 'library';

export interface ShortComment {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
  likes: number;
  avatar?: string;
  isUser?: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'oled' | 'sepia' | 'navy' | 'forest';

export type PresetAccentId =
  | 'banana'
  | 'amber'
  | 'blaze'
  | 'peach'
  | 'honey'
  | 'ruby'
  | 'crimson'
  | 'rose'
  | 'fuchsia'
  | 'magenta'
  | 'violet'
  | 'indigo'
  | 'cosmic'
  | 'sapphire'
  | 'sky'
  | 'cyan'
  | 'teal'
  | 'cobalt'
  | 'emerald'
  | 'lime'
  | 'olive'
  | 'mint'
  | 'bronze'
  | 'platinum';

export type CardLayout = 'grid' | 'compact' | 'list' | 'cinema';
export type CardCorner = 'rounded' | 'medium' | 'sharp';
export type FontSizeScale = 'small' | 'normal' | 'large';
export type SecondaryDarkness = 'subtle' | 'balanced' | 'deep';
export type ArabicFont = 'cairo' | 'tajawal' | 'almarai' | 'system';
export type BorderIntensity = 'hairline' | 'bold' | 'none';
export type GridColumnCount = 'auto' | '2' | '3' | '4';

export interface ThemeSettings {
  mode: ThemeMode; // Dark, Light, OLED, Sepia, Navy, Forest
  accentColor: string; // Preset ID or custom hex code
  customAccentHex?: string; // Optional custom hex
  secondaryDarkness: SecondaryDarkness; // How much to darken secondary color (15%, 30%, 45%)
  cardLayout: CardLayout; // Standard Grid, Compact Grid, List, Cinema
  cardCorner: CardCorner; // Rounded, Medium, Sharp
  fontSize: FontSizeScale; // Small, Normal, Large
  fontFamily: ArabicFont; // Cairo, Tajawal, Almarai, System
  borderIntensity: BorderIntensity; // Hairline, Bold, None
  gridColumns: GridColumnCount; // Auto, 2, 3, 4
  ambientGlow: boolean; // Subtle glow around cards and players
  showViews: boolean;
  showTimeAgo: boolean;
  showShortsBadge: boolean;
  showChannelAvatarInCard: boolean;
  enableHoverZoom: boolean;
  enableGlassmorphism: boolean;
  highContrastText: boolean;
}

export interface AppSettings {
  hideShorts: boolean;
  liteMode: boolean; // For old phones: disables blurs, heavy animations
  autoplayNext: boolean;
  theme: ThemeSettings;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  accentColor: 'banana',
  secondaryDarkness: 'balanced',
  cardLayout: 'grid',
  cardCorner: 'rounded',
  fontSize: 'normal',
  fontFamily: 'cairo',
  borderIntensity: 'hairline',
  gridColumns: 'auto',
  ambientGlow: true,
  showViews: true,
  showTimeAgo: true,
  showShortsBadge: true,
  showChannelAvatarInCard: true,
  enableHoverZoom: true,
  enableGlassmorphism: true,
  highContrastText: false,
};
