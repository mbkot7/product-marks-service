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
