import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { Report, ReportFormData, ApiResponse } from '@/types';

export const reportsService = {
  async getReports(): Promise<ApiResponse<Report[]>> {
    return apiClient.get<Report[]>(API_ENDPOINTS.REPORTS);
  },

  async getReport(id: string): Promise<ApiResponse<Report>> {
    return apiClient.get<Report>(API_ENDPOINTS.REPORT_BY_ID(id));
  },

  async createReport(reportData: ReportFormData): Promise<ApiResponse<Report>> {
    return apiClient.post<Report>(API_ENDPOINTS.REPORTS, reportData);
  },

  async updateReport(id: string, reportData: ReportFormData): Promise<ApiResponse<Report>> {
    return apiClient.put<Report>(API_ENDPOINTS.REPORT_BY_ID(id), reportData);
  },

  async deleteReport(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(API_ENDPOINTS.REPORT_BY_ID(id));
  },
}; 