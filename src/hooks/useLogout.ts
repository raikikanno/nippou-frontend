import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { userAtom } from "@/atoms/user";
import { authService } from "@/services/auth";
import { useCallback } from "react";

export function useLogout() {
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("ログアウト処理中にエラーが発生しました:", error);
    } finally {
      setUser(null); // クライアント側の状態もリセット
      router.push("/login");
    }
  }, [setUser, router]);

  return logout;
}
