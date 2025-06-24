"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Box, Button, TextField, Typography, CircularProgress, Link } from "@mui/material";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!token) return;
    // トークンの有効性を確認
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-reset-token?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        setConfirmed(true);
      })
      .catch(() => {
        setError("このトークンは無効または期限切れです。");
      });
  }, [token]);

  const handleSubmit = async () => {
    setMessage("");
    setError("");
    if (!password) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const text = await res.text();
      if (res.ok) {
        setMessage(text);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(text);
      }
    } catch (_e) {
      setMessage("パスワードリセットに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  if (!token) {
    return (
      <Box p={4}>
        <Typography variant="h5" gutterBottom>
          パスワードリセット
        </Typography>
        <Typography color="error" gutterBottom>
          無効なリセットリンクです。
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <Link href="/login" color="primary">
            ログインページに戻る
          </Link>
        </Typography>
      </Box>
    );
  }

  if (!confirmed) {
    return (
      <Box p={4}>
        <Typography variant="h5" gutterBottom>
          パスワードリセット
        </Typography>
        {error ? (
          <>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <Link href="/login" color="primary">
                ログインページに戻る
              </Link>
            </Typography>
          </>
        ) : (
          <Typography>トークンを確認中...</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        新しいパスワードを設定
      </Typography>
      <TextField
        label="新しいパスワード"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        {isLoading ? "処理中です..." : "パスワードを変更"}
      </Button>
      {message && <Typography mt={2}>{message}</Typography>}
      {error && <Typography mt={2} color="error">{error}</Typography>}
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
