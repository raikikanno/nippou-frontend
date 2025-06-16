"use client";

import { useParams, useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { reportsAtom } from "@/atoms/reports";
import { userAtom } from "@/atoms/user";
import { useEffect, useState } from "react";
import { Box, Typography, Stack, TextField, Button, Autocomplete, Chip, CircularProgress } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportSchema } from "@/schema/reportSchema";
import { ReportInput } from "@/types/report";
import { ReportEditor } from "@/components/ReportEditor";
import { z } from "zod";

type FormData = z.input<typeof reportSchema>;

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [reports, setReports] = useAtom(reportsAtom);
  const [isMounted, setIsMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reportId = params.id?.toString();
  const report = Array.isArray(reports) ? reports.find((r) => r.id === reportId) : undefined;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      tags: [] as { name: string }[],
      content: "",
    },
    mode: "onChange"
  });

  // 初期化とログインチェック
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push("/login");
    }
  }, [isMounted, user, router]);

  // レポートデータの初期化を別のuseEffectで管理
  useEffect(() => {
    if (report) {
      reset({
        tags: report.tags.map((t) => ({ name: t.name })),
        content: report.content,
      });
    }
  }, [report, reset]);

  if (!isMounted || !user || !report) return null;

  const onSubmit = async (data: FormData) => {
    if (!report) return;

    setIsLoading(true);
    const updated: ReportInput = {
      ...report,
      tags: data.tags || [],
      content: data.content,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("更新失敗");

      const fetchRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`);
      const updatedList = await fetchRes.json();
      setReports(updatedList);

      router.push("/reports");
    } catch (err) {
      console.error("更新エラー:", err);
      alert("更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };
  
  const uniqueTagNames = Array.from(new Set(Array.isArray(reports) ? reports.flatMap((r) => r.tags.map((t) => t.name)) : []));
  const allTags = uniqueTagNames.map((name) => ({ name }));
  
  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        日報編集
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3} maxWidth={600}>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => {
              // 未確定の文字列をタグとして確定する関数
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
                    options={allTags} 
                    getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt.name)}
                    isOptionEqualToValue={(opt, val) => (typeof opt === "string" ? opt : opt.name) === (typeof val === "string" ? val : val.name)}
                    filterSelectedOptions
                    disabled={isLoading}
                    inputValue={inputValue}
                    onInputChange={(_, newInput) => {
                      setInputValue(newInput);
                    }}
                    // フォーカスが外れたときにも未確定文字を確定
                    onBlur={() => {
                      commitInputValue();
                    }}
                    // 選択済みタグは上で Chip に表示しているため、常に空配列を渡す
                    value={[]}
                    onChange={(_, value) => {
                      // Enter 押下や候補クリックで来る onChange
                      const mapped: { name: string }[] = value.map((tag) => (typeof tag === "string" ? { name: tag } : tag));
                      field.onChange([...(field.value || []), ...mapped]);
                      setInputValue("");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="タグ"
                        error={!!errors.tags}
                        helperText={errors.tags?.message as string}
                        // Enter キーで未確定文字を確定
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
            initialContent={report.content}
          />

          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : undefined}
          >
            {isLoading ? "処理中です..." : "更新"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
