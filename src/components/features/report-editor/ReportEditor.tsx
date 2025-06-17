import React, { useRef, useCallback, useMemo } from 'react';
import { Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

import { CustomImage } from './CustomImageNode';
import { EditorToolbar } from './EditorToolbar';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import { cleanHtmlContent, isEmptyContent } from '@/utils/html';

interface ReportEditorProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  error?: string;
  initialContent?: string;
}

export function ReportEditor<T extends FieldValues>({ 
  control, 
  name, 
  error, 
  initialContent 
}: ReportEditorProps<T>) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, showError, showSuccess, hideToast } = useToast();

  // エディタの設定をメモ化
  const editorConfig = useMemo(() => ({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '本文を入力してください',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      CustomImage,
    ],
    content: cleanHtmlContent(initialContent || ''),
    onUpdate: ({ editor }: { editor: Editor }) => {
      const html = editor.getHTML();
      const isEmpty = isEmptyContent(html);
      control._formValues[name] = isEmpty ? '' : html;
    },
  }), [initialContent, control, name]);

  const editor = useEditor(editorConfig);

  // 画像アップロード処理
  const { handleFileSelect } = useImageUpload({
    editor,
    onSuccess: (_url) => showSuccess('画像をアップロードしました'),
    onError: (error) => showError(error),
  });

  // リンク挿入処理
  const handleAddLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [linkUrl, editor]);

  // ツールバーのイベントハンドラー
  const handleLinkClick = useCallback(() => {
    setLinkDialogOpen(true);
  }, []);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field: _field }) => (
          <Box mb={2}>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
              <EditorToolbar
                editor={editor}
                onLinkClick={handleLinkClick}
                onImageClick={handleImageClick}
              />

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
              />

              <Box sx={{ 
                '& .ProseMirror': { 
                  minHeight: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#1976d2',
                  },
                  '& p': { margin: '0.5em 0' },
                  '& ul, & ol': { 
                    paddingLeft: '20px',
                    marginLeft: '8px',
                    margin: '0.5em 0' 
                  },
                  '& li': { 
                    marginBottom: '0.25em' 
                  },
                  '& .editor-link': { 
                    color: '#1976d2', 
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#1565c0',
                    },
                  },
                  '& .custom-image-wrapper': {
                    display: 'inline-block',
                    position: 'relative',
                    margin: '4px',
                    '&:hover .image-delete-button': {
                      display: 'flex',
                    },
                  },
                  '& .custom-image': {
                    maxWidth: '200px',
                    height: 'auto',
                    borderRadius: '4px',
                    display: 'block',
                  },
                  '& .image-delete-button': {
                    display: 'none',
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '50%',
                    padding: '2px',
                    cursor: 'pointer',
                    border: 'none',
                    width: '20px',
                    height: '20px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                    '& svg': {
                      width: '16px',
                      height: '16px',
                    },
                  },
                }
              }}>
                <label htmlFor="editor-content" style={{ display: 'block', marginBottom: 4 }}>
                  内容
                </label>
                <EditorContent 
                  editor={editor} 
                  id="editor-content" 
                  aria-label="内容"
                />
              </Box>
            </Paper>
            {error && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}
      />

      {/* リンク挿入ダイアログ */}
      <Dialog 
        open={linkDialogOpen} 
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>リンクを挿入</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleAddLink} variant="contained">
            挿入
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast通知 */}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
} 