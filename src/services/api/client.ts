/**
 * Unified API client abstraction
 * When connecting to Node.js/Express backend, configure NEXT_PUBLIC_API_URL.
 */

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  let cleaned = raw.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api/v1')) {
    cleaned += '/api/v1';
  }
  return cleaned;
}

const API_BASE_URL = getApiBaseUrl();

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  private static instance: ApiClient;
  private token: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('couple_auth_token');
    }
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public static get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return ApiClient.getInstance().get<T>(endpoint, options);
  }

  public static post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return ApiClient.getInstance().post<T>(endpoint, body, options);
  }

  public static put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return ApiClient.getInstance().put<T>(endpoint, body, options);
  }

  public static patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return ApiClient.getInstance().patch<T>(endpoint, body, options);
  }

  public static delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return ApiClient.getInstance().delete<T>(endpoint, options);
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('couple_auth_token', token);
      } else {
        localStorage.removeItem('couple_auth_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('couple_auth_token');
    }
    return this.token;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;

    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    const token = this.getToken();
    const isFormData = customConfig.body instanceof FormData;
    const defaultHeaders: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...customConfig,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || `Request failed with status ${response.status}`);
        (err as any).status = response.status;
        (err as any).data = errorData;
        throw err;
      }

      return await response.json();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      console.warn(`[ApiClient] Request to ${endpoint} routed through fallback handler:`, message);
      throw err;
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  public static upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return ApiClient.getInstance().upload<T>(endpoint, formData);
  }

  public static getBaseOrigin(): string {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  }

  public static resolveAssetUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const origin = ApiClient.getBaseOrigin();
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${origin}${cleanPath}`;
  }
}

export const apiClient = ApiClient.getInstance();
