import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { userAtom } from "@/atoms/user";

export function useLogout() {
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_e) {
      console.log("ログアウト処理中にエラーが発生しました");
    } finally {
      setUser(null); // クライアント側の状態もリセット
      router.push("/login");
    }
  };

  return logout;
}
