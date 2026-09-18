import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, Heading1, Heading2, Heading3, Link2, Unlink } from "lucide-react";

export default function TipTapEditor({ content, onUpdate }) {
  const [isEmpty, setIsEmpty] = useState(!content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "vani-editor focus:outline-none min-h-[140px] p-3",
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
    `rounded p-1.5 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 ${active ? "bg-slate-300 text-slate-950 dark:bg-slate-700 dark:text-white" : "text-slate-600 dark:text-slate-300"}`;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Pega la URL del enlace:", previousUrl);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-900" aria-label="Formato de notas">
        <button type="button" title="Negrita" aria-label="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}><Bold size={15} /></button>
        <button type="button" title="Cursiva" aria-label="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}><Italic size={15} /></button>
        <button type="button" title="Título 1" aria-label="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonClass(editor.isActive("heading", { level: 1 }))}><Heading1 size={15} /></button>
        <button type="button" title="Título 2" aria-label="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive("heading", { level: 2 }))}><Heading2 size={15} /></button>
        <button type="button" title="Título 3" aria-label="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={buttonClass(editor.isActive("heading", { level: 3 }))}><Heading3 size={15} /></button>
        <button type="button" title="Lista" aria-label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}><List size={15} /></button>
        <button type="button" title="Añadir o editar enlace" aria-label="Añadir o editar enlace" onClick={setLink} className={buttonClass(editor.isActive("link"))}><Link2 size={15} /></button>
        <button type="button" title="Quitar enlace" aria-label="Quitar enlace" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} className={`${buttonClass(false)} disabled:cursor-not-allowed disabled:opacity-35`}><Unlink size={15} /></button>
      </div>

      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] break-words text-sm text-slate-400">
            Escribe aquí tus notas… Prueba #, ##, ### o - al inicio, como en Obsidian.
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
