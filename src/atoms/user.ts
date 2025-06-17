"use client";

import { atom } from "jotai";
import { User, LoadingState } from "@/types";

// クッキーベースの認証なので、ローカルストレージは使用しない
// サーバーから認証状態を取得する
const baseUserAtom = atom<User | null>(null);

export const userAtom = atom(
  (get) => get(baseUserAtom),
  (get, set, user: User | null) => {
    set(baseUserAtom, user);
  }
);

// ローディング状態を管理するatom
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
