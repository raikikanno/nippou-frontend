import { atom } from "jotai";

export const registerAuthAtom = atom<{
  isAuthenticated: boolean;
  isInitialized: boolean;
}>({
  isAuthenticated: false,
  isInitialized: false,
}); 