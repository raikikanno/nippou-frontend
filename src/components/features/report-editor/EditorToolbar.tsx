import React, { memo } from 'react';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Editor } from '@tiptap/react';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';

interface EditorToolbarProps {
  editor: Editor | null;
  onLinkClick: () => void;
  onImageClick: () => void;
}

export const EditorToolbar = memo<EditorToolbarProps>(({ editor, onLinkClick, onImageClick }) => {
  if (!editor) return null;

  return (
    <ToggleButtonGroup size="small" sx={{ mb: 1 }}>
      <ToggleButton
        value="bold"
        selected={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="太字"
      >
        <FormatBoldIcon />
      </ToggleButton>
      <ToggleButton
        value="italic"
        selected={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="斜体"
      >
        <FormatItalicIcon />
      </ToggleButton>
      <ToggleButton
        value="bulletList"
        selected={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="箇条書き"
      >
        <FormatListBulletedIcon />
      </ToggleButton>
      <ToggleButton
        value="orderedList"
        selected={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="番号付きリスト"
      >
        <FormatListNumberedIcon />
      </ToggleButton>
      <ToggleButton
        value="link"
        selected={editor.isActive('link')}
        onClick={onLinkClick}
        aria-label="リンク挿入"
      >
        <LinkIcon />
      </ToggleButton>
      <ToggleButton
        value="image"
        onClick={onImageClick}
        aria-label="画像挿入"
      >
        <ImageIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
});

EditorToolbar.displayName = 'EditorToolbar'; 