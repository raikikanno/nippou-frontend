"use client";

import { atom } from "jotai";
import { User, LoadingState } from "@/types";

// ローカルストレージからユーザー情報を読み込む関数
const getUserFromStorage = (): User | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("ローカルストレージからのユーザー情報読み込みに失敗:", error);
    return null;
  }
};

// ローカルストレージにユーザー情報を保存する関数
const setUserToStorage = (user: User | null) => {
  if (typeof window === "undefined") return;
  
  try {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  } catch (error) {
    console.error("ローカルストレージへのユーザー情報保存に失敗:", error);
  }
};

// 永続化されたユーザーAtom
const baseUserAtom = atom<User | null>(getUserFromStorage());

export const userAtom = atom(
  (get) => get(baseUserAtom),
  (get, set, user: User | null) => {
    set(baseUserAtom, user);
    setUserToStorage(user);
  }
);

export const userLoadingAtom = atom<LoadingState>({
  isLoading: false,
  error: null,
});

// 認証状態を確認するatom
export const isAuthenticatedAtom = atom<boolean>((get) => {
  const user = get(userAtom);
  return user !== null;
});

// 初期化状態を管理するatom
export const authInitializedAtom = atom<boolean>(false);
