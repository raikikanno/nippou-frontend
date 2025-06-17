import { atom } from "jotai";
import { AuthState } from "@/types";

export const authAtom = atom<AuthState>({
  isAuthenticated: false,
  isInitialized: false,
}); 