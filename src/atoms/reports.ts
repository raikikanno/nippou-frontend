import { atom } from "jotai";
import { ReportInput } from "@/types/report";

export type ReportData = ReportInput;
export const reportsAtom = atom<ReportData[]>([]);
