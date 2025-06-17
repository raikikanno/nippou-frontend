import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { User, ApiResponse } from '@/types';

export const authService = {
  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH_ME);
  },

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(API_ENDPOINTS.AUTH_LOGIN, {
      email,
      password,
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>(API_ENDPOINTS.AUTH_LOGOUT);
  },

  async register(userData: {
    email: string;
    password: string;
    name: string;
    team: string;
  }): Promise<ApiResponse<User>> {
    return apiClient.post<User>(API_ENDPOINTS.AUTH_REGISTER, userData);
  },
}; 