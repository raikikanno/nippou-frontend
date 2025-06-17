"use client";

import "./globals.css";
import { ReactNode, useEffect } from "react";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import { userAtom, userLoadingAtom } from "@/atoms/user";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth";

export default function RootLayout({ children }: { children: ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const user = useAtomValue(userAtom);
  const [userLoading, setUserLoading] = useAtom(userLoadingAtom);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      setUserLoading({ isLoading: true, error: null });
      
      try {
        const result = await authService.getMe();
        
        if (result.error) {
          setUser(null);
        } else {
          setUser(result.data || null);
        }
      } catch (error) {
        console.error("認証情報の取得に失敗しました:", error);
        setUser(null);
      } finally {
        setUserLoading({ isLoading: false, error: null });
      }
    };

    initializeAuth();
  }, [setUser, setUserLoading]);

  useEffect(() => {
    if (userLoading.isLoading) return;
    
    const loginRequired = pathname.startsWith("/reports");
    if (!user && loginRequired) {
      router.replace("/login");
    }
  }, [userLoading.isLoading, user, pathname, router]);

  if (userLoading.isLoading) {
    return (
      <html lang="ja">
        <body>
          <div style={{ textAlign: "center", marginTop: "20vh" }}>
            認証情報を確認中…
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
