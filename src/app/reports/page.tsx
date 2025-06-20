"use client";

import { userAtom } from "@/atoms/user";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { reportsAtom } from "@/atoms/reports";
import { Report } from "@/types";
import { fetchReports, deleteReport } from "./_api";
import { useLogout } from "@/hooks/useLogout";
import sanitizeHtml from 'sanitize-html';
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/ui/Toast";

type TagType = {
  id?: number;
  name: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useAtom(reportsAtom);
  const [user] = useAtom(userAtom);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const logout = useLogout();
  const { toast, showSuccess, hideToast } = useToast();

  // フィルター用ステート
  const [team, setTeam] = useState("全チーム");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // HTMLコンテンツから削除ボタンを除去する関数
  const cleanHtmlContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/<button[^>]*class="image-delete-button"[^>]*>.*?<\/button>/gi, '')
      .replace(/×/g, '') // 単体の×文字も除去
      .trim();
  };

  // キーワード検索用の関数
  const searchInContent = (content: string, keyword: string) => {
    if (!keyword.trim()) return true;
    
    // HTMLタグを除去してテキストのみを取得
    const cleanContent = cleanHtmlContent(content);
    const textContent = cleanContent.replace(/<[^>]*>/g, '');
    
    // 完全一致検索（大文字小文字を区別しない）
    return textContent.toLowerCase().includes(keyword.toLowerCase());
  };

  // ハイドレーションチェック
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 未ログイン時のリダイレクト&ハイドレーションチェック
  useEffect(() => {
    if (isMounted && !user) {
      router.push("/login");
    }
  }, [isMounted, user, router]);

  // 成功メッセージの表示
  useEffect(() => {
    const successMessage = searchParams.get('success');
    if (successMessage) {
      showSuccess(successMessage);
      // URLパラメータをクリア
      router.replace('/reports');
    }
  }, [searchParams, showSuccess, router]);

  // データ取得
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchReports();
        setReports(data as Report[]);
      } catch (err) {
        console.error("日報の取得エラー:", err);
      }
    };
    load();
  }, [setReports]);

  if (!isMounted || !user) return null;

  // 全チームリスト（「全チーム」を先頭に追加）
  const allTeams = ["全チーム", ...Array.from(new Set(reports.map((r) => r.team)))];

  // 全タグリスト（オブジェクト配列から重複なしで一意の配列を作る）
  const allTags: TagType[] = Array.from(
    new Map(
      reports
        .flatMap((r) => r.tags)
        .map((t) => [t.name, t] as [string, TagType])
    ).values()
  );

  // 全ユーザー
  const allUsers = Array.from(new Set(reports.map((r) => r.userName)));

  // フィルター後の全レポート
  const filteredReports = reports
    .filter((report) => {
      if (team !== "全チーム" && report.team !== team) return false;
      if (selectedUser && report.userName !== selectedUser) return false;

      if (
        selectedTags.length > 0 &&
        !selectedTags.every((selT) =>
          report.tags.some((rt) => rt.name === selT.name)
        )
      ) {
        return false;
      }

      // キーワード検索
      if (searchKeyword && !searchInContent(report.content, searchKeyword)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      await deleteReport(id);
      const refreshed = await fetchReports();
      setReports(refreshed as Report[]);
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  return (
    <Box p={4}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Typography variant="h5">
          日報一覧ページ - {user.name}（{user.team}）
        </Typography>
        <Button onClick={logout} variant="outlined">
          ログアウト
        </Button>
        <Button
          variant="contained"
          onClick={() => router.push("/reports/new")}
        >
          新規投稿
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          select
          label="チーム"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        >
          {allTeams.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        {/* タグ選択 (複数選択) */}
        <Autocomplete
          multiple
          options={allTags}                 
          getOptionLabel={(option) => option.name}
          value={selectedTags}            
          onChange={(_, newValue) => setSelectedTags(newValue)}
          renderInput={(params) => <TextField {...params} label="タグ" />}
          sx={{ minWidth: 200 }}
        />

        {/* ユーザー選択 */}
        <Autocomplete
          options={allUsers}
          value={selectedUser}
          onChange={(_, newValue) => setSelectedUser(newValue || "")}
          renderInput={(params) => <TextField {...params} label="ユーザー" />}
          sx={{ minWidth: 200 }}
        />

        {/* キーワード検索 */}
        <TextField
          label="キーワード検索"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="投稿内容から検索"
          sx={{ minWidth: 250 }}
        />
      </Stack>

      <Stack spacing={2}>
        {filteredReports.map((report) => (
          <Card key={report.id}>
            <CardContent>
              <Typography variant="subtitle2">
                {report.date} {report.createdAt && new Date(report.createdAt).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </Typography>
              <Typography variant="h6">
                {report.userName}（{report.team}）
              </Typography>

              <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                {report.tags.map((tagObj, index) => (
                  <Chip
                    key={`${report.id}-${index}`}
                    label={tagObj.name}
                    size="small"
                  />
                ))}
              </Stack>

              {/* WYSIWYGエディタの内容を表示 */}
              <Box
                sx={{
                  '& p': { my: 1,wordBreak: 'break-word' },
                  '& ul, & ol': { pl: 2, my: 1 },
                  '& li': { my: 0.5 },
                  '& strong': { fontWeight: 'bold' },
                  '& em': { fontStyle: 'italic' },
                  '& a': { color: 'blue', textDecoration: 'underline' },
                  '& img': { maxWidth: '300px', height: 'auto' },
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(cleanHtmlContent(report.content), {
                    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img'],
                    allowedAttributes: {
                      'a': ['href', 'target', 'rel'],
                      'img': ['src', 'alt', 'title', 'width', 'height']
                    },
                  }),
                }}
              />

              {user.id === report.userId && report.id && (
                <Stack direction="row" spacing={1} mt={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/reports/${report.id}/edit`)}
                  >
                    編集
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(report.id!)}
                  >
                    削除
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Toast通知 */}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </Box>
  );
}
