export type NavigationTab = 'home' | 'tools';

export type Language = 'EN' | 'TA' | 'KN' | 'TE' | 'ML' | 'HI';

export interface AuthUser {
  name: string;
  /** Phone number or email used to sign in. Empty for guest sessions. */
  contact: string;
  farmName?: string;
  avatarUrl?: string;
  isGuest?: boolean;
}

export interface CropItem {
  id: string;
  name: string;
  field: string;
  quadrant: string;
  day: number;
  status: 'Healthy' | 'Needs Water' | 'Nutrient Deficient' | 'Pest Alert' | 'Monitoring';
  moisturePercent: number;
  imageUrl: string;
  plantingDate: string;
  expectedHarvest: string;
  areaHa: number;
}

export interface ForumPost {
  id: string;
  author: {
    name: string;
    location: string;
    avatarUrl: string;
  };
  timeAgo: string;
  tag: string;
  tagType: 'yield' | 'success' | 'soil' | 'equipment' | 'general';
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  isBookmarked?: boolean;
  replies: Array<{
    id: string;
    author: string;
    avatarUrl: string;
    timeAgo: string;
    text: string;
  }>;
}

export interface MarketItem {
  id: string;
  title: string;
  price: string;
  description: string;
  distance: string;
  location: string;
  seller: string;
  imageUrl: string;
  category: 'Fertilizer & Soil' | 'Machinery' | 'Seeds' | 'Irrigation';
}

export interface LibraryArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  categoryType: 'cultivation' | 'disease' | 'weather' | 'video' | 'organic' | 'schemes';
  readTime: string;
  isVideo?: boolean;
  imageUrl: string;
  isBookmarked?: boolean;
  contentMarkdown?: string;
  sections?: Array<{
    heading: string;
    body: string;
  }>;
}

export interface DiagnosisSample {
  id: string;
  title: string;
  crop: string;
  diagnosis: string;
  confidence: number;
  severity: 'Low' | 'Moderate' | 'Critical';
  recommendations: string[];
  imageUrl: string;
}
