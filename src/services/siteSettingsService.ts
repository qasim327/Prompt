import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteSettings } from '../types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroBadge: 'Discover Curated AI Art & Prompts',
  heroHeadline: 'Supercharge Your AI Visuals with',
  heroHeadlineHighlight: 'One-Click Prompts',
  heroSubtitle:
    'Explore high-quality image prompts designed for ChatGPT, Gemini, Leonardo AI, Midjourney, and Flux. Copy instantly or launch directly into your favorite generator.',
  announcementEnabled: false,
  announcementText: '✨ PromptVault 2.0 is live! Browse new trending prompts across all major AI engines.',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, 'settings', 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_SITE_SETTINGS, ...snap.data() } as SiteSettings;
    }
  } catch (err) {
    console.warn('Could not read site settings from Firestore, using defaults:', err);
  }
  return DEFAULT_SITE_SETTINGS;
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'general');
  await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeSiteSettings(callback: (settings: SiteSettings) => void) {
  const docRef = doc(db, 'settings', 'general');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_SITE_SETTINGS, ...snap.data() } as SiteSettings);
      } else {
        callback(DEFAULT_SITE_SETTINGS);
      }
    },
    (err) => {
      console.warn('Settings listener fallback to default:', err);
      callback(DEFAULT_SITE_SETTINGS);
    }
  );
}
