import { Plus, X } from "lucide-react";

export default function TabBar({ materias, activaId, onSelect, onAdd, onDelete }) {
  return (
    <nav aria-label="Materias" className="subject-tabs flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      {materias.map((materia) => {
        const esActiva = materia.id === activaId;
        return (
          <div
            key={materia.id}
            className={`subject-tab group flex max-w-[230px] shrink-0 items-center gap-1 rounded-xl border pr-2 ${esActiva ? "is-active border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" : "border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"}`}
          >
            <button type="button" aria-current={esActiva ? "page" : undefined} onClick={() => onSelect(materia.id)} className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-500">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: materia.color || "#3B82F6" }} />
              <span className="truncate">{materia.nombre || "Nueva Materia"}</span>
            </button>
            {materias.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(materia.id);
                }}
                className="shrink-0 rounded p-0.5 opacity-70 transition-colors hover:bg-red-500 hover:text-white group-hover:opacity-100"
                aria-label={`Eliminar ${materia.nombre || "materia"}`}
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
      <button type="button" onClick={onAdd} className="shrink-0 rounded-md p-1.5 text-slate-700 transition-colors hover:bg-slate-300 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Añadir materia">
        <Plus size={16} />
      </button>
    </nav>
  );
}
