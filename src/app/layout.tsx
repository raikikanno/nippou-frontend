"use client";

import "./globals.css";
import { ReactNode, useEffect, useState } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { userAtom } from "@/atoms/user";
import { useRouter, usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const user = useAtomValue(userAtom);
  const router = useRouter();
  const pathname = usePathname();


  const [isFetchingUser, setIsFetchingUser] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include", // Cookie を送るために必須
    })
      .then(async (res) => {
        if (!res.ok) {
          // 401, 403 などが返った場合は「未ログイン」と判断
          return null;
        }
        return res.json();
      })
      .then((userData) => {
        setUser(userData); // userData が null の場合も setUser(null) になる
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsFetchingUser(false); 
      });
  }, [setUser]);


  useEffect(() => {
    if (isFetchingUser) return;
    const loginRequired = pathname.startsWith("/reports");
    if (!user && loginRequired) {
      router.replace("/login");
    }
  }, [isFetchingUser, user, pathname, router]);

  if (isFetchingUser) {
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
