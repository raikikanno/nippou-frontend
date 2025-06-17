import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { userAtom, authInitializedAtom } from "@/atoms/user";
import { authService } from "@/services/auth";
import { useCallback } from "react";

export function useLogout() {
  const setUser = useSetAtom(userAtom);
  const setAuthInitialized = useSetAtom(authInitializedAtom);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("ログアウト処理中にエラーが発生しました:", error);
    } finally {
      setUser(null);
      setAuthInitialized(false);
      router.push("/login");
    }
  }, [setUser, setAuthInitialized, router]);

  return logout;
}
