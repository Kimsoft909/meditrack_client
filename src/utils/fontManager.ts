// Font loading and management utilities

import { FontFamily } from '@/types/settings';

export const FONT_URLS: Record<FontFamily, string | null> = {
  [FontFamily.CAMBRIA]: null, // System font
  [FontFamily.INTER]: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  [FontFamily.ROBOTO]: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  [FontFamily.OPEN_SANS]: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
  [FontFamily.SOURCE_SANS]: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap',
};

export function preloadFont(fontFamily: FontFamily): void {
  const url = FONT_URLS[fontFamily];
  if (!url) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = url;
  document.head.appendChild(link);
}

export function loadFont(fontFamily: FontFamily): Promise<void> {
  return new Promise((resolve) => {
    const url = FONT_URLS[fontFamily];
    if (!url) {
      resolve();
      return;
    }

    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export function getFontDisplayName(fontFamily: FontFamily): string {
  return fontFamily;
}
