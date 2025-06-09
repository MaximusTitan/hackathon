"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import { Button } from './button';
import { useState } from 'react';

interface ToolbarConfig {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  bulletList?: boolean;
  orderedList?: boolean;
  heading?: {
    h1?: boolean;
    h2?: boolean;
    h3?: boolean;
  };
  link?: boolean;
  undo?: boolean;
  redo?: boolean;
}

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  toolbar?: ToolbarConfig;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  toolbar = {}
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'mb-1 leading-normal',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold mb-2 mt-4 first:mt-0',
          },
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc pl-6 mb-2 space-y-0',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal pl-6 mb-2 space-y-0',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'pl-1 leading-normal',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
        hardBreak: {
          HTMLAttributes: {
            class: 'block',
          },
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white relative">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex flex-wrap gap-1 rounded-t-lg">
        {/* Bold */}
        {toolbar.bold && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
        )}

        {/* Italic */}
        {toolbar.italic && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
        )}

        {/* Underline */}
        {toolbar.underline && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-gray-200' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Separator */}
        {(toolbar.bold || toolbar.italic || toolbar.underline) && 
         (toolbar.heading?.h1 || toolbar.heading?.h2 || toolbar.heading?.h3) && (
          <div className="w-px h-6 bg-gray-300 mx-1" />
        )}

        {/* Headings */}
        {toolbar.heading?.h1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
        )}

        {toolbar.heading?.h2 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        )}

        {toolbar.heading?.h3 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        )}

        {/* Separator */}
        {(toolbar.heading?.h1 || toolbar.heading?.h2 || toolbar.heading?.h3) && 
         (toolbar.bulletList || toolbar.orderedList) && (
          <div className="w-px h-6 bg-gray-300 mx-1" />
        )}

        {/* Bullet List */}
        {toolbar.bulletList && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        )}

        {/* Ordered List */}
        {toolbar.orderedList && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        )}

        {/* Separator */}
        {(toolbar.bulletList || toolbar.orderedList) && toolbar.link && (
          <div className="w-px h-6 bg-gray-300 mx-1" />
        )}

        {/* Link */}
        {toolbar.link && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={editor.isActive('link') ? 'bg-gray-200' : ''}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeLink}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>
        )}

        {/* Separator */}
        {toolbar.link && (toolbar.undo || toolbar.redo) && (
          <div className="w-px h-6 bg-gray-300 mx-1" />
        )}

        {/* Undo */}
        {toolbar.undo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
        )}

        {/* Redo */}
        {toolbar.redo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sticky Link Input */}
      {showLinkInput && (
        <div className="sticky top-[49px] z-10 bg-white border-b border-gray-200 p-2 flex gap-2">
          <input
            type="url"
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={addLink}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[200px] prose prose-sm max-w-none p-4 focus-within:outline-none overflow-y-auto max-h-[400px] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-6 [&_h1:first-child]:mt-0 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2:first-child]:mt-0 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3:first-child]:mt-0 [&_p]:mb-1 [&_p]:leading-normal [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ul]:space-y-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_ol]:space-y-0 [&_li]:pl-1 [&_li]:leading-normal [&_br]:block [&_br]:h-1"
      />
    </div>
  );
}
