import { ProductMarkDetail } from '@/types/ProductMark';

// Encode JSON safely into a compact base64 string suitable for URLs
export function encodeStateToParam(marks: ProductMarkDetail[]): string {
  const json = JSON.stringify(marks);
  // Encode as UTF-8 safe base64
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
  const b64 = btoa(utf8);
  // URL-safe base64 (optional)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeStateFromParam(param: string): ProductMarkDetail[] | null {
  try {
    // Restore padding for base64
    let b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const utf8 = atob(b64);
    const json = decodeURIComponent(Array.prototype.map.call(utf8, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json) as ProductMarkDetail[];
  } catch (e) {
    console.error('Failed to decode URL state:', e);
    return null;
  }
}

export function createShareLink(marks: ProductMarkDetail[]): string {
  const base = `${window.location.origin}${window.location.pathname}`; // keeps /product-marks-service/
  const s = encodeStateToParam(marks);
  const url = new URL(base);
  url.searchParams.set('s', s);
  return url.toString();
}

export function extractStateFromLocation(): ProductMarkDetail[] | null {
  const url = new URL(window.location.href);
  const s = url.searchParams.get('s');
  if (!s) return null;
  return decodeStateFromParam(s);
}

// Shorten URL using TinyURL API (free, no registration required)
export async function shortenUrl(longUrl: string): Promise<string> {
  try {
    // TinyURL API endpoint (free, no auth required)
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`TinyURL API error: ${response.status}`);
    }
    
    const shortUrl = await response.text();
    
    // TinyURL returns the short URL as plain text
    // If it starts with 'http', it's successful
    if (shortUrl.startsWith('http')) {
      return shortUrl.trim();
    } else {
      throw new Error('Invalid response from TinyURL');
    }
  } catch (error) {
    console.warn('URL shortening failed:', error);
    // Return original URL as fallback
    return longUrl;
  }
}

// Create and shorten share link in one function
export async function createShortShareLink(marks: ProductMarkDetail[]): Promise<string> {
  const longUrl = createShareLink(marks);
  return await shortenUrl(longUrl);
}
