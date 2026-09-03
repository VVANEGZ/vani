import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Heading2 } from 'lucide-react';

export default function TipTapEditor({ content, onUpdate }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p>Escribe aquí tus notas...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[140px] text-gray-700 p-2',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex gap-1 bg-gray-50 border-b border-gray-200 p-1.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''}`}
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
        >
          <Heading2 size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
        >
          <List size={14} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}