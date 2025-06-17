import { mergeAttributes, Node } from '@tiptap/core';

export const CustomImage = Node.create({
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