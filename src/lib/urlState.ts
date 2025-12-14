import { ProductMarkDetail } from '@/types/ProductMark';

export function encodeStateToParam(marks: ProductMarkDetail[]): string {
  const json = JSON.stringify(marks);
  const utf8 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
  const b64 = btoa(utf8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeStateFromParam(param: string): ProductMarkDetail[] | null {
  try {
    // Restore padding for base64 encoding
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
  const base = `${window.location.origin}${window.location.pathname}`;
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

export async function shortenUrl(longUrl: string): Promise<string> {
  try {
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`TinyURL API error: ${response.status}`);
    }
    
    const shortUrl = await response.text();
    
    if (shortUrl.startsWith('http')) {
      return shortUrl.trim();
    } else {
      throw new Error('Invalid response from TinyURL');
    }
  } catch (error) {
    console.warn('URL shortening failed:', error);
    return longUrl;
  }
}

export async function createShortShareLink(marks: ProductMarkDetail[]): Promise<string> {
  const longUrl = createShareLink(marks);
  return await shortenUrl(longUrl);
}

function getGitHubToken(): string | null {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  return token && typeof token === 'string' && token.trim() !== '' ? token : null;
}

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

export async function createGistShareLink(marks: ProductMarkDetail[]): Promise<string> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('GitHub token is not configured. Please set VITE_GITHUB_TOKEN in your .env file.');
  }

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(gistData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `GitHub API error: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'GitHub token is invalid or expired. Please check your VITE_GITHUB_TOKEN.';
      } else if (response.status === 403) {
        errorMessage = 'GitHub API rate limit exceeded or token lacks gist scope. Please check your token permissions.';
      } else if (errorData.message) {
        errorMessage = `GitHub API error: ${errorData.message}`;
      } else {
        errorMessage = `GitHub API error: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const gist = await response.json();
    const gistId = gist.id;
    
    const base = `${window.location.origin}${window.location.pathname}`;
    const url = new URL(base);
    url.searchParams.set('gist', gistId);
    
    return url.toString();
  } catch (error) {
    console.error('Failed to create Gist:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create Gist: ${error.message}`);
    }
    throw new Error('Failed to create Gist: Unknown error');
  }
}

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
      if (response.status === 404) {
        console.error('Gist not found:', gistId);
      } else if (response.status === 401 || response.status === 403) {
        console.error('Failed to fetch Gist: Authentication issue. Token may be invalid or expired.');
      } else {
        console.error('Failed to fetch Gist:', response.status, response.statusText);
      }
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
      if (error instanceof Error) {
      if (error.message.includes('token') || 
          error.message.includes('VITE_GITHUB_TOKEN') || 
          error.message.includes('not configured') ||
          error.message.includes('invalid or expired')) {
        throw error;
      }
      throw error;
    }
    throw new Error('Failed to create Gist. Please try again.');
  }
}
