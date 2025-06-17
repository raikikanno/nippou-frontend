import { atom } from "jotai";
import { Report, LoadingState } from "@/types";

export const reportsAtom = atom<Report[]>([]);

export const reportsLoadingAtom = atom<LoadingState>({
  isLoading: false,
  error: null,
});
