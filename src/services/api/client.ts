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
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
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
      // In mock mode or dev fallback, gracefully log
      console.warn(`[ApiClient] Request to ${endpoint} routed through fallback handler:`, message);
      throw err;
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();
