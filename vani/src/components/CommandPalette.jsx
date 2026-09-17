import { useEffect, useMemo, useRef, useState } from "react";
import { FilePlus2, FolderPlus, Moon, Search, Sun, Upload, Download, BookPlus } from "lucide-react";

const ICONS = {
  materia: BookPlus,
  tema: FolderPlus,
  apunte: FilePlus2,
  theme: Moon,
  light: Sun,
  import: Upload,
  export: Download,
};

export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((command) =>
      [command.label, command.description, ...(command.aliases || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (selectedIndex >= filtered.length) setSelectedIndex(0);
  }, [filtered.length, selectedIndex]);

  if (!open) return null;

  const runCommand = (command) => {
    command.action();
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => filtered.length ? (index + 1) % filtered.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => filtered.length ? (index - 1 + filtered.length) % filtered.length : 0);
    } else if (event.key === "Enter" && filtered[selectedIndex]) {
      event.preventDefault();
      runCommand(filtered[selectedIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-700">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe: materia, tema, apunte, oscuro…"
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">Esc</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No encontré ese comando.</p>
          ) : (
            filtered.map((command, index) => {
              const Icon = ICONS[command.icon] || FilePlus2;
              const active = index === selectedIndex;
              return (
                <button
                  key={command.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runCommand(command)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? "bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{command.label}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{command.description}</span>
                  </span>
                  {command.hint && (
                    <span className="text-[11px] font-medium text-slate-400">{command.hint}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-700">
          <span>↑↓ navegar · Enter ejecutar · Esc cerrar</span>
          <span>Ctrl/⌘ + K para abrir</span>
        </div>
      </div>
    </div>
  );
}
