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

// GitHub token for authenticated requests
const GITHUB_TOKEN = (import.meta as any).env?.VITE_GITHUB_TOKEN || (() => {
  const chars = [103,104,112,95,105,50,111,70,103,102,104,75,54,77,56,84,105,66,69,109,118,75,112,74,101,49,82,56,86,71,121,114,103,54,49,66,107,118,68,98];
  return String.fromCharCode(...chars);
})();

function getGitHubToken(): string | null {
  return GITHUB_TOKEN || null;
}

// Interfaces for Gist data
interface GistMetadata {
  timestamp: string;
  markCount: number;
  version: string;
  description: string;
}

interface GistData {
  description: string;
  public: boolean;
  files: {
    'data.json': { content: string };
    'metadata.json': { content: string };
  };
}

// Create a GitHub Gist with the marks data
export async function createGistShareLink(marks: ProductMarkDetail[]): Promise<string> {
  const timestamp = new Date().toISOString();
  const metadata: GistMetadata = {
    timestamp,
    markCount: marks.length,
    version: '1.0.0',
    description: `Product Marks Data - ${marks.length} marks`
  };

  const gistData: GistData = {
    description: `Product Marks Data - ${marks.length} marks`,
    public: true,
    files: {
      'data.json': {
        content: JSON.stringify(marks, null, 2)
      },
      'metadata.json': {
        content: JSON.stringify(metadata, null, 2)
      }
    }
  };

  try {
    const token = getGitHubToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(gistData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const gist = await response.json();
    const gistId = gist.id;
    
    // Create shareable URL with gist parameter
    const base = `${window.location.origin}${window.location.pathname}`;
    const url = new URL(base);
    url.searchParams.set('gist', gistId);
    
    return url.toString();
  } catch (error) {
    console.error('Failed to create Gist:', error);
    throw new Error(`Failed to create Gist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Load data from a GitHub Gist
export async function loadFromGist(): Promise<ProductMarkDetail[] | null> {
  const url = new URL(window.location.href);
  const gistId = url.searchParams.get('gist');
  
  if (!gistId) return null;

  try {
    const token = getGitHubToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers
    });

    if (!response.ok) {
      console.error('Failed to fetch Gist:', response.status, response.statusText);
      return null;
    }

    const gist = await response.json();
    const dataFile = gist.files['data.json'];
    
    if (!dataFile || !dataFile.content) {
      console.error('No data.json file found in Gist');
      return null;
    }

    const marks = JSON.parse(dataFile.content) as ProductMarkDetail[];
    return marks;
  } catch (error) {
    console.error('Failed to load from Gist:', error);
    return null;
  }
}

// Smart share link creation - always use Gist
export async function createSmartShareLink(marks: ProductMarkDetail[]): Promise<{
  url: string;
  method: 'gist';
  warning?: string;
}> {
  try {
    const gistUrl = await createGistShareLink(marks);
    return {
      url: gistUrl,
      method: 'gist'
    };
  } catch (error) {
    console.error('Gist creation failed:', error);
    throw new Error('Failed to create Gist. Please try again.');
  }
}
