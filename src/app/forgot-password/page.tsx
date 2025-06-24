"use client";

import { useEffect, useState } from "react";
import { Box, Button, TextField, Typography, CircularProgress, Link } from "@mui/material";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.text();
      if (response.ok) {
        setMessage(data);
      } else {
        setError(data);
      }
    } catch (_err) {
      setError("パスワードリセットに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isMounted) return null;

  return (
    <Box p={4}>
      <Typography variant="h5">パスワード再設定</Typography>
      <TextField
        label="登録メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
      <Button 
        variant="contained" 
        onClick={handleSubmit}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        sx={{ mt: 2 }}
      >
        {isLoading ? "処理中です..." : "メール送信"}
      </Button>
      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link href="/login" color="primary">
          ログインページに戻る
        </Link>
      </Typography>
      {message && <Typography mt={2}>{message}</Typography>}
      {error && <Typography mt={2} color="error">{error}</Typography>}
    </Box>
  );
}
