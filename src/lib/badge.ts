/**
 * Web Badging API integration for PWA and supported browsers
 * Displays unread chat count directly on app icon.
 */
export function updateAppBadge(count: number): void {
  if (typeof window === 'undefined') return;

  try {
    const nav = navigator as any;
    if ('setAppBadge' in nav && typeof nav.setAppBadge === 'function') {
      if (count > 0) {
        nav.setAppBadge(count).catch(() => {});
      } else {
        nav.clearAppBadge().catch(() => {});
      }
    }
  } catch {
    // Unsupported platform, silently ignore
  }
}

export function clearAppBadge(): void {
  updateAppBadge(0);
}
