export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already a raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
    /[?&]v=([^&#]+)/i,
    /youtu\.be\/([^?&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

/**
 * Calculates exact time difference and formats it in Arabic as:
 * "منذ (المدة الي الفيديو نازل منها)"
 */
export function formatArabicDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'منذ وقت قريب';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'منذ لحظات';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Minutes
    if (diffMinutes < 1) {
      return 'منذ لحظات';
    }
    if (diffMinutes === 1) {
      return 'منذ دقيقة واحدة';
    }
    if (diffMinutes === 2) {
      return 'منذ دقيقتين';
    }
    if (diffMinutes >= 3 && diffMinutes <= 10) {
      return `منذ ${diffMinutes} دقائق`;
    }
    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    }

    // Hours
    if (diffHours === 1) {
      return 'منذ ساعة واحدة';
    }
    if (diffHours === 2) {
      return 'منذ ساعتين';
    }
    if (diffHours >= 3 && diffHours <= 10) {
      return `منذ ${diffHours} ساعات`;
    }
    if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    }

    // Days
    if (diffDays === 1) {
      return 'منذ يوم واحد (أمس)';
    }
    if (diffDays === 2) {
      return 'منذ يومين';
    }
    if (diffDays >= 3 && diffDays <= 10) {
      return `منذ ${diffDays} أيام`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      if (weeks === 1) return 'منذ أسبوع واحد';
      if (weeks === 2) return 'منذ أسبوعين';
      if (weeks >= 3) return `منذ ${weeks} أسابيع`;
      return `منذ ${diffDays} يوماً`;
    }

    // Months
    if (diffMonths === 1) {
      return 'منذ شهر واحد';
    }
    if (diffMonths === 2) {
      return 'منذ شهرين';
    }
    if (diffMonths >= 3 && diffMonths <= 10) {
      return `منذ ${diffMonths} أشهر`;
    }
    if (diffMonths < 12) {
      return `منذ ${diffMonths} شهراً`;
    }

    // Years
    if (diffYears === 1) {
      return 'منذ سنة واحدة';
    }
    if (diffYears === 2) {
      return 'منذ سنتين';
    }
    if (diffYears >= 3 && diffYears <= 10) {
      return `منذ ${diffYears} سنوات`;
    }
    return `منذ ${diffYears} سنة`;
  } catch {
    return 'منذ وقت قريب';
  }
}

export function formatViews(viewsStr?: string): string {
  if (!viewsStr) return '';
  const num = parseInt(viewsStr, 10);
  if (isNaN(num)) return '';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} مليون مشاهدة`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} ألف مشاهدة`;
  }
  return `${num} مشاهدة`;
}
