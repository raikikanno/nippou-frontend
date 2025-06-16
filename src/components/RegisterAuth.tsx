import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { useAtom } from "jotai";
import { registerAuthAtom } from "@/atoms/auth";
import { useState } from "react";

export const RegisterAuth = () => {
  const [auth, setAuth] = useAtom(registerAuthAtom);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const authId = process.env.NEXT_PUBLIC_REGISTER_AUTH_ID;
    const authPassword = process.env.NEXT_PUBLIC_REGISTER_AUTH_PASSWORD;

    if (id === authId && password === authPassword) {
      setAuth({ isAuthenticated: true, isInitialized: true });
    } else {
      setError("アクセス権限がありません");
    }
  };

  if (auth.isAuthenticated) {
    return null;
  }

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        登録ページへのアクセス認証
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
        <TextField
          label="ID"
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="パスワード"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3, mb: 2 }}
        >
          認証
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 400 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}; 