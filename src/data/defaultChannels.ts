import { ChannelItem, FeaturedVideoItem } from '../types';

export const INITIAL_CHANNEL_IDS: string[] = [
  "UCmwCQKTjqUbmH2pcEdpC11w", // كابتن ماجد Gaming
  "UC8gfuntXFc6fzYLx6Zi5B8Q",
  "UCCtXn_Exz6vQ06O8BjV4N2g",
  "UC9ckQV4_B6ZUv_b5seS--bA",
  "UC0cphbBpef1VGMr0Isf2AYw",
  "UCZgy2HZAbq_KoBH0X-mGUIw",
  "UCvZKYQfNtoIDaEJ5HybMTZw",
  "UCkUEthM6nQe--OdWmxQS66w",
  "UCQOFdQYNnIzuvVz29uiL-xA",
  "UCq8cjGVDfkiOtqpGeLZl6QQ",
  "UCdhVrLGMHvpvNhMNy-pRO8g",
  "UCC5MTU1ljNu3c9opp4lpEHA"
];

// Initial channels list with default labels
export const DEFAULT_CHANNELS: ChannelItem[] = [
  { id: "UCmwCQKTjqUbmH2pcEdpC11w", title: "كابتن ماجد Gaming" },
  { id: "UC8gfuntXFc6fzYLx6Zi5B8Q", title: "قناة 1" },
  { id: "UCCtXn_Exz6vQ06O8BjV4N2g", title: "قناة 2" },
  { id: "UC9ckQV4_B6ZUv_b5seS--bA", title: "قناة 3" },
  { id: "UC0cphbBpef1VGMr0Isf2AYw", title: "قناة 4" },
  { id: "UCZgy2HZAbq_KoBH0X-mGUIw", title: "قناة 5" },
  { id: "UCvZKYQfNtoIDaEJ5HybMTZw", title: "قناة 6" },
  { id: "UCkUEthM6nQe--OdWmxQS66w", title: "قناة 7" },
  { id: "UCQOFdQYNnIzuvVz29uiL-xA", title: "قناة 8" },
  { id: "UCq8cjGVDfkiOtqpGeLZl6QQ", title: "قناة 9" },
  { id: "UCdhVrLGMHvpvNhMNy-pRO8g", title: "قناة 10" },
  { id: "UCC5MTU1ljNu3c9opp4lpEHA", title: "قناة 11" }
];

export const INITIAL_FEATURED_VIDEOS: FeaturedVideoItem[] = [
  {
    id: 'dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    title: 'فيديو تجريبي مميز - جودة عالية وعرض مباشر',
    channelTitle: 'Banana Tube Picks',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    note: 'مقطع تجريبي لتجربة سرعة المشغل المدمج',
    tag: 'موسيقى / ترفيه',
    addedAt: Date.now() - 3600000,
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
];
