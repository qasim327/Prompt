export interface PromptItem {
  id: string;
  title: string;
  promptText: string;
  negativePrompt?: string;
  imageUrl: string;
  platform: string[];
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  copyCount: number;
  views: number;
  likes: number;
  createdBy: string;
  uid: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface SiteSettings {
  heroBadge: string;
  heroHeadline: string;
  heroHeadlineHighlight: string;
  heroSubtitle: string;
  announcementText?: string;
  announcementEnabled?: boolean;
}

export type PlatformName = 
  | 'ChatGPT'
  | 'Gemini'
  | 'Midjourney'
  | 'Leonardo AI'
  | 'Flux'
  | 'Ideogram'
  | 'Stable Diffusion';

export interface PlatformConfig {
  name: PlatformName;
  url: string;
  color: string;
  bgColor: string;
  badgeClass: string;
}
