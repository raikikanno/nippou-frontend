import { reportSchema } from "@/schema/reportSchema";
import { z } from "zod";

export type User = {
  id: string;
  name: string;
  team: string;
};

export type Tag = {
  id?: number;
  name: string;
};

// Zodスキーマから型を生成（Single Source of Truth）
export type Report = z.infer<typeof reportSchema>;

// フォーム用の型（バリデーション必要な項目のみ）
export type ReportFormData = z.input<typeof reportSchema>;

export type AuthState = {
  isAuthenticated: boolean;
  isInitialized: boolean;
};

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
};

export type LoadingState = {
  isLoading: boolean;
  error: string | null;
}; 