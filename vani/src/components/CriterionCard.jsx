import { useId, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { validatePercentage, normalizePercentageDraft } from "../storage/criteria.js";

export default function CriterionCard({ criterio, criterios, onSave, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const errorId = useId();

  function cancel() {
    setDraft(null);
    setError("");
  }

  function save() {
    if (!draft) return;
    const validation = draft.nombre.trim()
      ? validatePercentage(criterios, criterio.id, draft.porcentaje)
      : "Escribe el nombre del criterio.";
    if (validation) {
      setError(validation);
      return;
    }
    onSave({ ...criterio, nombre: draft.nombre.trim(), porcentaje: Number(draft.porcentaje.replace(",", ".")) });
    cancel();
  }

  if (!draft) return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      <span className="min-w-0 flex-1 break-words text-sm font-medium text-slate-700 dark:text-slate-200">{criterio.nombre}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">{criterio.porcentaje}%</span>
      <button type="button" onClick={() => setDraft({ nombre: criterio.nombre, porcentaje: String(criterio.porcentaje) })}
        className="rounded p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/40" aria-label={`Editar ${criterio.nombre}`}>
        <Pencil size={14} />
      </button>
      <button type="button" onClick={() => {
        if (window.confirm(`¿Eliminar el criterio «${criterio.nombre}»? Esta acción no se puede deshacer.`)) onDelete();
      }} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={`Eliminar ${criterio.nombre}`}>
        <Trash2 size={14} />
      </button>
    </div>
  );

  const inputClass = "mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
  return (
    <div className="space-y-2 rounded-lg border-2 border-blue-400 bg-blue-50 p-3 dark:border-blue-500 dark:bg-blue-950/30"
      onBlur={(event) => {
        // Moving between the fields and action buttons is still editing this card.
        if (!event.currentTarget.contains(event.relatedTarget)) save();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); cancel(); }
        if (event.key === "Enter" && event.target.tagName === "INPUT" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          save();
        }
      }}>
      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Editando criterio</p>
      <label className="block text-xs text-slate-600 dark:text-slate-300">Nombre del criterio
        <input autoFocus value={draft.nombre} onChange={(event) => setDraft({ ...draft, nombre: event.target.value })} className={inputClass} />
      </label>
      <label className="block text-xs text-slate-600 dark:text-slate-300">Porcentaje (%)
        <input type="text" inputMode="decimal" value={draft.porcentaje}
          onFocus={(event) => event.target.select()}
          onChange={(event) => setDraft({ ...draft, porcentaje: normalizePercentageDraft(event.target.value) })}
          aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={inputClass} />
      </label>
      {error && <p id={errorId} role="alert" className="text-xs text-red-700 dark:text-red-300">{error}</p>}
      <div className="flex justify-end gap-2 text-xs font-semibold">
        <button type="button" onClick={cancel} className="rounded px-2 py-2 text-slate-600 dark:text-slate-300">Cancelar</button>
        <button type="button" onClick={save} className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Guardar</button>
      </div>
    </div>
  );
}
