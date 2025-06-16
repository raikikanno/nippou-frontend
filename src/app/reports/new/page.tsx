"use client";

import { Box, Button, TextField, Typography, Autocomplete, Chip, Stack, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useSetAtom } from "jotai";
import { userAtom } from "@/atoms/user";
import { reportSchema } from "@/schema/reportSchema";
import { reportsAtom } from "@/atoms/reports";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ReportEditor } from "@/components/ReportEditor";

type TagType = { name: string };
type FormData = z.input<typeof reportSchema>;

export default function NewReportPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [user] = useAtom(userAtom);
  const [suggestedTags, setSuggestedTags] = useState<TagType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setReports = useSetAtom(reportsAtom);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      tags: [] as { name: string }[],
      content: "",
    },
    mode: "onChange"
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const newReport = {
      id: String(Date.now()),
      userId: user?.id,
      userName: user?.name,
      team: user?.team,
      date: new Date().toISOString().split("T")[0],
      tags: data.tags, // { name: string }[] 
      content: data.content,
    };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      });
      if (!res.ok) throw new Error("投稿失敗");

      const fetchRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
      const allReports = await fetchRes.json();
      setReports(allReports);

      alert("投稿成功");
      router.push("/reports");
    } catch (err) {
      console.error("送信エラー:", err);
      alert("投稿に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // 既存タグ取得（String[]を{ name: string }[] に変換）
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/tags`);
        if (!res.ok) throw new Error("タグ取得失敗");
        const data: string[] = await res.json();
        setSuggestedTags(data.map((name) => ({ name })));
      } catch (err) {
        console.error("タグ取得エラー:", err);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (isMounted && !user) {
      router.push("/login");
    }
  }, [isMounted, user, router]);

  if (!isMounted || !user) return null;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} p={4}>
      <Typography variant="h5" gutterBottom>
        日報投稿フォーム
      </Typography>

      <Stack spacing={3} maxWidth={600}>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => {
            // 未確定の文字列を確定してタグ配列に追加する関数
            const commitInputValue = () => {
              const trimmed = inputValue.trim();
              if (
                trimmed === "" ||
                // すでに同じ名前のタグが存在していれば追加しない
                (field.value || []).some((t) => t.name === trimmed)
              ) {
                setInputValue("");
                return;
              }
              field.onChange([...(field.value || []), { name: trimmed }]);
              setInputValue(""); 
            };

            return (
              <Box>
                {field.value && field.value.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    {field.value.map((option, index) => (
                      <Chip
                        key={`${option.name}_${index}`}
                        label={option.name}
                        onDelete={() => {
                          const newValue = field.value?.filter((_, i) => i !== index) || [];
                          field.onChange(newValue);
                        }}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}

                <Autocomplete
                  multiple
                  freeSolo
                  options={suggestedTags} // { name: string }[]
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
                  isOptionEqualToValue={(opt, val) =>
                    (typeof opt === "string" ? opt : opt.name) ===
                    (typeof val === "string" ? val : val.name)
                  }
                  filterSelectedOptions
                  disabled={isLoading}

        
                  inputValue={inputValue}
                  onInputChange={(_, newInput) => {
                    setInputValue(newInput);
                  }}

                  // onBlurでも未確定文字を確定して追加
                  onBlur={() => {
                    commitInputValue();
                  }}

                  value={[]} // 選択されたものは既に Chips で表示しているので常に空
                  onChange={(_, value) => {
                    // エンターや候補選択したときに来る onChange
                    const mapped: TagType[] = value.map((tag) =>
                      typeof tag === "string" ? { name: tag } : tag
                    );
                    // 既にあるタグに新規を追加
                    field.onChange([...(field.value || []), ...mapped]);
                    setInputValue(""); 
                  }}

                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="タグ"
                      error={!!errors.tags}
                      helperText={errors.tags?.message as string}
                      // サブミットしたときに未確定のテキストも確定させる
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitInputValue();
                        }
                      }}
                    />
                  )}
                />
              </Box>
            );
          }}
        />

        <ReportEditor
          control={control}
          name="content"
          error={errors.content?.message as string}
        />

        <Button 
          type="submit" 
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
        >
          {isLoading ? "処理中です..." : "投稿"}
        </Button>
      </Stack>
    </Box>
  );
}
