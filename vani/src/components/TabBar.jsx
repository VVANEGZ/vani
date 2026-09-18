import { Plus, X } from "lucide-react";

export default function TabBar({ materias, activaId, onSelect, onAdd, onDelete }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-300 bg-slate-200 px-2 pt-2 dark:border-slate-700 dark:bg-slate-900 sm:px-3">
      {materias.map((materia) => {
        const esActiva = materia.id === activaId;
        return (
          <div
            key={materia.id}
            onClick={() => onSelect(materia.id)}
            style={{ backgroundColor: esActiva ? materia.color || "#3B82F6" : undefined }}
            className={`group flex max-w-[210px] shrink-0 cursor-pointer items-center justify-between gap-2 rounded-t-lg border-x border-t px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
              esActiva
                ? "border-slate-400 text-slate-950 shadow-sm dark:border-slate-500"
                : "border-transparent bg-slate-300 text-slate-700 hover:brightness-95 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <span className="min-w-0 truncate">{materia.nombre || "Nueva Materia"}</span>
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
    </div>
  );
}
