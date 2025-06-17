import { API_BASE_URL, REQUEST_CONFIG } from '@/constants/api';
import { ApiResponse } from '@/types';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || statusText);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...REQUEST_CONFIG.WITH_CREDENTIALS,
      headers: {
        ...REQUEST_CONFIG.DEFAULT_HEADERS,
        ...options?.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // エラーステータスの場合
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          response.statusText,
          errorData.message || errorData.error
        );
      }

      // レスポンスが空の場合（204 No Content等）
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { data: null as T };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.message };
      }
      
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string, 
    body?: unknown, 
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(
    endpoint: string, 
    body?: unknown, 
    headers?: HeadersInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      ...REQUEST_CONFIG.WITH_CREDENTIALS,
      method: 'POST',
      body: formData,
      // multipart/form-dataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    };

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          response.statusText,
          errorData.message || errorData.error
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.message };
      }
      
      return { 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }
}

// シングルトンインスタンス
export const apiClient = new ApiClient(); 