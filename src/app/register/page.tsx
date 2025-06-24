"use client";

import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Alert, Link } from "@mui/material";
import { useAtom } from "jotai";
import { authAtom } from "@/atoms/auth";
import { RegisterAuth } from "@/components/RegisterAuth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [auth, setAuth] = useAtom(authAtom);

  useEffect(() => {
    // 認証状態を初期化
    if (!auth.isInitialized) {
      setAuth({ isAuthenticated: false, isInitialized: true });
    }
  }, [auth.isInitialized, setAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, team }),
      });
      const text = await res.text();
      setMessage(text);
      if (!res.ok) {
        setIsError(true);
      }
    } catch (_e) {
      setMessage("登録に失敗しました");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!auth.isAuthenticated) {
    return <RegisterAuth />;
  }

  return (
    <Box p={4}>
      <Typography variant="h4" component="h1" gutterBottom>
        ユーザー登録
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
        <TextField
          label="名前"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
          disabled={isLoading}
        />
        
        <TextField
          label="チーム"
          type="text"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          fullWidth
          margin="normal"
          required
          disabled={isLoading}
        />
        
        <TextField
          label="メールアドレス"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
          disabled={isLoading}
        />
        
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
          disabled={isLoading}
        />
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              処理中です...
            </>
          ) : (
            "登録"
          )}
        </Button>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link href="/login" color="primary">
          すでにアカウントをお持ちの方はこちら
        </Link>
      </Typography>
      
      {message && (
        <Alert 
          severity={isError ? "error" : "success"} 
          sx={{ mt: 2, maxWidth: 400 }}
        >
          {message}
        </Alert>
      )}
    </Box>
  );
}
