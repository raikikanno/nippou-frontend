/**
 * HTMLコンテンツから削除ボタンを除去する関数
 */
export const cleanHtmlContent = (content: string): string => {
  if (!content) return '';
  
  return content
    .replace(/<button[^>]*class="image-delete-button"[^>]*>.*?<\/button>/gi, '')
    .replace(/×/g, '') // 単体の×文字も除去
    .trim();
};

/**
 * HTMLコンテンツが空かどうかを判定する関数
 */
export const isEmptyContent = (html: string): boolean => {
  return html === '<p></p>' || html === '<p><br></p>' || html.trim() === '';
}; 