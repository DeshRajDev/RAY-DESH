export interface ParsedReelUrl {
  platform: 'instagram' | 'facebook';
  shortcode?: string;
  sourceUrl: string;
}

export function parseAndValidateReelUrl(inputUrl: string): { valid: boolean; data?: ParsedReelUrl; error?: string } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = inputUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use secure HTTPS protocol' };
  }

  const host = parsed.hostname.toLowerCase();

  // Validate Instagram
  if (
    host === 'instagram.com' ||
    host === 'www.instagram.com' ||
    host === 'm.instagram.com' ||
    host.endsWith('.instagram.com')
  ) {
    const pathname = parsed.pathname;
    // Check for reel, reels, or post
    const reelMatch = pathname.match(/\/(?:reel|reels)\/([a-zA-Z0-9_-]+)/i);
    const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/i);

    const shortcode = reelMatch ? reelMatch[1] : (postMatch ? postMatch[1] : undefined);

    if (!shortcode) {
      return {
        valid: false,
        error: 'Please provide a valid Instagram Reel or Post link (e.g., https://www.instagram.com/reel/CODE/)',
      };
    }

    return {
      valid: true,
      data: {
        platform: 'instagram',
        shortcode,
        sourceUrl: trimmed,
      },
    };
  }

  // Validate Facebook
  if (
    host === 'facebook.com' ||
    host === 'www.facebook.com' ||
    host === 'm.facebook.com' ||
    host === 'web.facebook.com' ||
    host === 'fb.watch' ||
    host.endsWith('.facebook.com')
  ) {
    const pathname = parsed.pathname;
    const fbVideoMatch = pathname.match(/\/(?:videos|reel|watch)\/([0-9a-zA-Z_-]+)/i);
    const vParam = parsed.searchParams.get('v');
    const shortcode = fbVideoMatch ? fbVideoMatch[1] : (vParam || undefined);

    return {
      valid: true,
      data: {
        platform: 'facebook',
        shortcode,
        sourceUrl: trimmed,
      },
    };
  }

  return {
    valid: false,
    error: 'Unsupported platform. Only official Instagram Reels/Posts and Facebook video links are supported.',
  };
}
