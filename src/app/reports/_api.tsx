import { ReportInput } from "@/types/report";

export const fetchReports = async (): Promise<ReportInput[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
  if (!res.ok) throw new Error("取得失敗");
  return res.json();
};

export const createReport = async (data: ReportInput): Promise<void> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("作成失敗");
};

export const updateReport = async (id: string, data: ReportInput): Promise<void> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("更新失敗");
};

export const deleteReport = async (id: string): Promise<void> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("削除失敗");
};
