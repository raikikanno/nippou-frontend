import { z } from "zod";

// レポートのバリデーションスキーマ
export const reportSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    userName: z.string().optional(),
    team: z.string().optional(),
    date: z.string().optional(),
    tags: z.array(z.object({ name: z.string() })).default([]),
    content: z.string().min(1, "内容を入力してください"),
    createdAt: z.string().optional(),
  })
  .passthrough();

// フォーム用のバリデーションスキーマ（必要な項目のみ）
export const reportFormSchema = z.object({
  tags: z.array(z.object({ name: z.string() })).default([]),
  content: z.string().min(1, "内容を入力してください"),
});
