import { Box, Paper, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { mergeAttributes, Node } from '@tiptap/core';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import { useState, useRef, useEffect } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface ReportEditorProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  error?: string;
  initialContent?: string;
}

// カスタム画像ノードの定義
const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
      {
        tag: 'div[class="custom-image-wrapper"] img[src]',
        getAttrs: (element) => {
          const img = element instanceof HTMLElement ? element.querySelector('img') || element : element;
          return img instanceof HTMLElement ? { src: img.getAttribute('src') } : {};
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'custom-image-wrapper' }, ['img', mergeAttributes(HTMLAttributes, { class: 'custom-image' })]];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.className = 'custom-image-wrapper';
      
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.className = 'custom-image';
      dom.appendChild(img);

      const button = document.createElement('button');
      button.className = 'image-delete-button';
      button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          editor.commands.deleteRange({ from: getPos(), to: getPos() + 1 });
        }
      };
      dom.appendChild(button);

      return {
        dom,
        update: (newNode) => {
          if (newNode.type !== this.type) {
            return false;
          }
          img.src = newNode.attrs.src;
          return true;
        },
      };
    };
  },
});

export function ReportEditor<T extends FieldValues>({ control, name, error, initialContent }: ReportEditorProps<T>) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 既存HTMLから削除ボタンを除去する関数
  const cleanInitialContent = (content: string) => {
    if (!content) return '';
    // 削除ボタンのHTMLを除去
    return content
      .replace(/<button[^>]*class="image-delete-button"[^>]*>.*?<\/button>/gi, '')
      .replace(/×/g, '') // 単体の×文字も除去
      .trim();
  };

  const editor = useEditor({
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
    content: cleanInitialContent(initialContent || ''),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const isEmpty = html === '<p></p>' || html === '<p><br></p>' || html.trim() === '';
      control._formValues[name] = isEmpty ? '' : html;
    },
  });

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }

      const data = await response.json();
      editor?.chain().focus().insertContent({
        type: 'customImage',
        attrs: { src: data.url },
      }).run();
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      alert('画像のアップロードに失敗しました');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  };

  useEffect(() => {
    const addDeleteButtonToImages = () => {
      const wrappers = document.querySelectorAll('.custom-image-wrapper:not(:has(.image-delete-button))');
      wrappers.forEach((wrapper) => {
        const img = wrapper.querySelector('.custom-image');
        if (!img) return;
        
        const button = document.createElement('button');
        button.className = 'image-delete-button';
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const pos = editor?.view.posAtDOM(wrapper, 0);
          if (pos !== undefined) {
            editor?.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
          }
        };
        wrapper.appendChild(button);
      });
    };

    // エディタの更新を監視
    const handleTransaction = () => {
      requestAnimationFrame(addDeleteButtonToImages);
    };

    if (editor) {
      editor.on('transaction', handleTransaction);
    }

    // 初期化時にも実行
    requestAnimationFrame(addDeleteButtonToImages);

    // MutationObserverも併用
    const observer = new MutationObserver((mutations) => {
      let shouldAddButtons = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          shouldAddButtons = true;
        }
      });
      if (shouldAddButtons) {
        requestAnimationFrame(addDeleteButtonToImages);
      }
    });

    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }

    return () => {
      observer.disconnect();
      if (editor) {
        editor.off('transaction', handleTransaction);
      }
    };
  }, [editor]);

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field: _field }) => (
          <Box mb={2}>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
              <ToggleButtonGroup size="small" sx={{ mb: 1 }}>
                <ToggleButton
                  value="bold"
                  selected={editor?.isActive('bold')}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <FormatBoldIcon />
                </ToggleButton>
                <ToggleButton
                  value="italic"
                  selected={editor?.isActive('italic')}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <FormatItalicIcon />
                </ToggleButton>
                <ToggleButton
                  value="bulletList"
                  selected={editor?.isActive('bulletList')}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <FormatListBulletedIcon />
                </ToggleButton>
                <ToggleButton
                  value="orderedList"
                  selected={editor?.isActive('orderedList')}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  <FormatListNumberedIcon />
                </ToggleButton>
                <ToggleButton
                  value="link"
                  selected={editor?.isActive('link')}
                  onClick={() => setLinkDialogOpen(true)}
                >
                  <LinkIcon />
                </ToggleButton>
                <ToggleButton
                  value="image"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon />
                </ToggleButton>
              </ToggleButtonGroup>

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
                  '& p': { margin: '0.5em 0' },
                  '& ul, & ol': { 
                    paddingLeft: '20px',
                    marginLeft: '8px',
                    margin: '0.5em 0' 
                  },
                  '& li': { 
                    marginBottom: '0.25em' 
                  },
                  '& .editor-link': { color: 'blue', textDecoration: 'underline' },
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
                <label htmlFor="editor-content" style={{display: 'block', marginBottom: 4}}>内容</label>
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
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>キャンセル</Button>
          <Button onClick={addLink}>挿入</Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 