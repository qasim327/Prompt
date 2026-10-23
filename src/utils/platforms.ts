import { PlatformName, PlatformConfig } from '../types';

export const ALL_PLATFORMS: PlatformName[] = [
  'ChatGPT',
  'Gemini',
  'Leonardo AI',
  'Midjourney',
  'Flux',
  'Ideogram',
  'Stable Diffusion',
];

export const PLATFORM_CONFIGS: Record<PlatformName, PlatformConfig> = {
  ChatGPT: {
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    color: '#10a37f',
    bgColor: '#10a37f1a',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  Gemini: {
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    color: '#3b82f6',
    bgColor: '#3b82f61a',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  'Leonardo AI': {
    name: 'Leonardo AI',
    url: 'https://leonardo.ai/',
    color: '#8b5cf6',
    bgColor: '#8b5cf61a',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
  Midjourney: {
    name: 'Midjourney',
    url: 'https://www.midjourney.com/',
    color: '#f97316',
    bgColor: '#f973161a',
    badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  },
  Flux: {
    name: 'Flux',
    url: 'https://flux1.ai/',
    color: '#ec4899',
    bgColor: '#ec48991a',
    badgeClass: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  },
  Ideogram: {
    name: 'Ideogram',
    url: 'https://ideogram.ai/',
    color: '#06b6d4',
    bgColor: '#06b6d41a',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  },
  'Stable Diffusion': {
    name: 'Stable Diffusion',
    url: 'https://clipdrop.co/stable-diffusion',
    color: '#6366f1',
    bgColor: '#6366f11a',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  },
};
