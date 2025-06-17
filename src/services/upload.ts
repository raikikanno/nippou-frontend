import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types';

export type UploadResponse = {
  url: string;
  filename: string;
};

export const uploadService = {
  async uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.upload<UploadResponse>(API_ENDPOINTS.UPLOAD, formData);
  },
}; 