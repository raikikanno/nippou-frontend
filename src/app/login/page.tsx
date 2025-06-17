"use client";

import { userAtom, authInitializedAtom } from "@/atoms/user";
import { authService } from "@/services/auth";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [, setUser] = useAtom(userAtom);
  const setAuthInitialized = useSetAtom(authInitializedAtom);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleLogin = async () => {
    setMessage("");
    if (!email || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      return;
    }
    
    setIsLoading(true);
    try {
      // authServiceを使用してログイン
      const loginResult = await authService.login(email, password);
      
      if (loginResult.error) {
        setMessage("メールアドレスもしくはパスワードが間違っています");
        return;
      }

      // ログイン成功後、最新のユーザー情報を取得
      const userResult = await authService.getMe();
      
      if (userResult.error) {
        setMessage("ユーザー情報の取得に失敗しました");
        return;
      }
      
      // ユーザー情報をatomに保存（自動的にローカルストレージにも保存される）
      setUser(userResult.data || null);
      
      // 認証が初期化されたことをマーク
      setAuthInitialized(true);
      
      // レポートページにリダイレクト
      router.push("/reports");
      
    } catch (error) {
      console.error("ログインエラー:", error);
      setMessage("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isMounted) return null;

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        ログイン
      </Typography>
      <TextField 
        label="メールアドレス" 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        fullWidth 
        margin="normal" 
        disabled={isLoading}
      />
      <TextField 
        label="パスワード" 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        fullWidth 
        margin="normal" 
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleLogin();
          }
        }}
      />
      <Button 
        variant="contained" 
        onClick={handleLogin} 
        sx={{ mt: 2 }}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
      >
        {isLoading ? "処理中です..." : "ログイン"}
      </Button>
      <Typography variant="body2" sx={{ mt: 2 }}>
        <a href="/register" style={{ textDecoration: "none", color: "#1976d2" }}>
          新規登録はこちら
        </a>
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        <a href="/forgot-password" style={{ textDecoration: "none", color: "#1976d2" }}>
          パスワードを忘れた方はこちら
        </a>
      </Typography>
      {message && (
        <Typography color="error" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
