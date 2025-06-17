import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { uploadService } from '@/services/upload';

interface UseImageUploadProps {
  editor: Editor | null;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export const useImageUpload = ({ editor, onSuccess, onError }: UseImageUploadProps) => {
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    try {
      const result = await uploadService.uploadFile(file);
      
      if (result.error) {
        onError?.(result.error);
        return;
      }

      if (result.data?.url) {
        editor.chain().focus().insertContent({
          type: 'customImage',
          attrs: { src: result.data.url },
        }).run();
        
        onSuccess?.(result.data.url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '画像のアップロードに失敗しました';
      onError?.(errorMessage);
    }
  }, [editor, onSuccess, onError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // ファイル選択をリセット（同じファイルを再選択可能にする）
    event.target.value = '';
  }, [handleImageUpload]);

  return {
    handleImageUpload,
    handleFileSelect,
  };
}; 