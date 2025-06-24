"use client";

import "./globals.css";
import { ReactNode, useEffect } from "react";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import { userAtom, userLoadingAtom, authInitializedAtom, isAuthenticatedAtom } from "@/atoms/user";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [userLoading, setUserLoading] = useAtom(userLoadingAtom);
  const [authInitialized, setAuthInitialized] = useAtom(authInitializedAtom);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      // すでに初期化済みの場合はスキップ
      if (authInitialized) return;
      
      setUserLoading({ isLoading: true, error: null });
      
      try {
        // サーバーからクッキーベースで認証状態を取得
        const result = await authService.getMe();
        
        if (result.error) {
          // 認証に失敗した場合（クッキーが無効など）
          console.warn("認証確認時にエラーが発生:", result.error);
          setUser(null);
          setUserLoading({ isLoading: false, error: result.error });
        } else {
          // 成功時は最新のユーザー情報を保存
          setUser(result.data || null);
          setUserLoading({ isLoading: false, error: null });
        }
      } catch (error) {
        console.error("認証情報の取得に失敗しました:", error);
        // ネットワークエラーなどの場合
        setUser(null);
        setUserLoading({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : "認証確認に失敗しました" 
        });
      } finally {
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, [setUser, setUserLoading, setAuthInitialized, authInitialized]);

  useEffect(() => {
    // 認証が初期化されていない間は、ルートガードを実行しない
    if (!authInitialized || userLoading.isLoading) return;
    
    const loginRequired = pathname.startsWith("/reports");
    if (!isAuthenticated && loginRequired) {
      router.replace("/login");
    }
  }, [authInitialized, userLoading.isLoading, isAuthenticated, pathname, router]);

  // 初期化中は読み込み画面を表示
  if (!authInitialized || userLoading.isLoading) {
    return (
      <html lang="ja">
        <body>
          <ThemeProvider>
            <div style={{ textAlign: "center", marginTop: "20vh" }}>
              <div>認証情報を確認中…</div>
              {userLoading.error && (
                <div style={{ color: "orange", marginTop: "10px", fontSize: "14px" }}>
                  {userLoading.error.includes("認証") ? 
                    "ログインが必要です" : 
                    "ネットワークエラーが発生しています"
                  }
                </div>
              )}
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="ja">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
