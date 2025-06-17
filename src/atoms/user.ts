"use client";

import { atom } from "jotai";
import { User, LoadingState } from "@/types";

export const userAtom = atom<User | null>(null);

export const userLoadingAtom = atom<LoadingState>({
  isLoading: false,
  error: null,
});
