"use client";

import { atom } from "jotai";

export type User = {
  id: string;
  name: string;
  team: string;
};

export const userAtom = atom<User | null>(null);
