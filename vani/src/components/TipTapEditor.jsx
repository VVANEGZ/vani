import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, Heading2 } from "lucide-react";

export default function TipTapEditor({ content, onUpdate }) {
  const [isEmpty, setIsEmpty] = useState(!content);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    editorProps: {
      attributes: {
        class: "vani-editor focus:outline-none min-h-[140px] text-slate-700 p-3",
      },
    },
    onCreate: ({ editor: currentEditor }) => setIsEmpty(currentEditor.isEmpty),
    onUpdate: ({ editor: currentEditor }) => {
      setIsEmpty(currentEditor.isEmpty);
      onUpdate(currentEditor.getHTML());
    },
  });

  if (!editor) return null;

  const buttonClass = (active) =>
    `rounded p-1.5 transition-colors hover:bg-slate-200 ${active ? "bg-slate-300 text-slate-950" : "text-slate-600"}`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex gap-1 border-b border-slate-200 bg-slate-50 p-1.5" aria-label="Formato de notas">
        <button type="button" title="Negrita" aria-label="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}>
          <Bold size={15} />
        </button>
        <button type="button" title="Cursiva" aria-label="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}>
          <Italic size={15} />
        </button>
        <button type="button" title="Encabezado" aria-label="Encabezado" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive("heading", { level: 2 }))}>
          <Heading2 size={15} />
        </button>
        <button type="button" title="Lista" aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}>
          <List size={15} />
        </button>
      </div>

      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 text-sm text-slate-400">
            Escribe aquí tus notas… Prueba #, ## o - al inicio, como en Obsidian.
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
