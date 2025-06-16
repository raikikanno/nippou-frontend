"use client";

import { userAtom } from "@/atoms/user";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [, setUser] = useAtom(userAtom);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (res.ok) {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include",
        });
        const userData = await userRes.json();
        setUser(userData);
        router.push("/reports");
      } else {
        await res.text();
        setMessage("メールアドレスもしくはパスワードが間違っています");
      }
    } catch (_err) {
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
