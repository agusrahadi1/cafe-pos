export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // If envUrl is missing or was built with localhost, but the browser accesses via a VPS IP or domain
    const isLocalhostEnv = !envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1');
    const isNonLocalWindow = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isLocalhostEnv && isNonLocalWindow) {
      if (window.location.hostname.includes('abstech.web.id')) {
        return 'https://api.abstech.web.id/api/v1';
      }
      return `${window.location.protocol}//${window.location.hostname}:5000/api/v1`;
    }
  }
  return envUrl || 'https://api.abstech.web.id/api/v1';
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cafe_access_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cafe_access_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cafe_access_token');
    localStorage.removeItem('cafe_user');
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('cafe_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cafe_user', JSON.stringify(user));
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
    // Token might be expired
    removeAuthToken();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'Terjadi kesalahan sistem';
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMsg = data?.message || response.statusText || 'Gagal mengunggah file';
      throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }
    return data as T;
  },
};

