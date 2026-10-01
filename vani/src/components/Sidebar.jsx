import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import CriterionCard from "./CriterionCard";
import { criteriaTotal } from "../storage/criteria.js";
import { BookOpen, Calendar, Plus, X } from "lucide-react";

const GROUPS = [
  { tipo: "examen", titulo: "Exámenes", tone: "red" },
  { tipo: "proyecto", titulo: "Proyectos", tone: "purple" },
  { tipo: "tarea", titulo: "Tareas", tone: "blue" },
];

const toneClasses = { red: "bg-rose-400", purple: "bg-violet-400", blue: "bg-sky-400" };

export default function Sidebar({ materia, onUpdate, onSaved }) {
  const [eventToDelete, setEventToDelete] = useState(null);
  const criterios = materia.criterios || [];
  const total = criteriaTotal(criterios);
  const restante = Math.max(0, 100 - total);

  const updateCriteria = (next) => onUpdate("criterios", next);

  const addCriterion = () => {
    if (total >= 100) return;
    updateCriteria([...criterios, { id: `criterion-${Date.now()}`, nombre: "Nuevo criterio", porcentaje: 0 }]);
  };

  const addEvent = (tipo) => {
    onUpdate("fechas", [...(materia.fechas || []), { id: `event-${Date.now()}`, tipo, fecha: "", titulo: "" }]);
  };

  const updateEvent = (id, field, value) => {
    onUpdate("fechas", (materia.fechas || []).map((evento) => evento.id === id ? { ...evento, [field]: value } : evento));
  };

  const removeEvent = (id) => setEventToDelete({ id, materiaId: materia.id });

  const commitWithEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
    onSaved?.();
  };

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5 lg:overflow-y-auto">
      <ConfirmModal open={eventToDelete?.materiaId === materia.id} title="¿Eliminar esta fecha?" description="Se eliminará esta asignación del calendario. Esta acción no se puede deshacer." onCancel={() => setEventToDelete(null)} onConfirm={() => { onUpdate("fechas", (materia.fechas || []).filter((event) => event.id !== eventToDelete.id)); setEventToDelete(null); onSaved?.(); }} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <BookOpen size={14} /> Encuadre
            </h2>
            <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${total === 100 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>
              {total}% / 100%
            </span>
          </div>

          <div className="space-y-2">
            {criterios.map((criterio) => (
              <CriterionCard
                key={`${materia.id}-${criterio.id}`}
                criterio={criterio}
                criterios={criterios}
                onSave={(updated) => {
                  updateCriteria(criterios.map((item) => item.id === updated.id ? updated : item));
                  onSaved?.();
                }}
                onDelete={() => {
                  updateCriteria(criterios.filter((item) => item.id !== criterio.id));
                  onSaved?.();
                }}
              />
            ))}
          </div>

          <button
            onClick={addCriterion}
            disabled={total >= 100}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus size={14} /> Agregar criterio
          </button>
          <p className="mt-2 break-words text-xs text-slate-500 dark:text-slate-400">
            {total === 100 ? "✓ Encuadre completo" : `Falta asignar ${restante}%`}
          </p>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Calendar size={14} /> Calendario
            </h2>
            <p className="mt-1 break-words text-[11px] text-slate-400">Los cambios se guardan automáticamente. Enter confirma y cierra el campo.</p>
          </div>
          <div className="space-y-3">
            {GROUPS.map(({ tipo, titulo, tone }) => (
              <details key={tipo} className="calendar-category group rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" open={tipo === "examen"}>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200"><span className={`h-1.5 w-1.5 rounded-full ${toneClasses[tone]}`} />{titulo}<span className="ml-auto text-xs text-slate-400">{(materia.fechas || []).filter((event) => event.tipo === tipo).length}</span><span className="text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true">›</span></summary>
                <div className="px-3 pb-3">
                <div className="mb-2 flex justify-end">
                  <button onClick={() => addEvent(tipo)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`Añadir ${titulo.toLowerCase()}`}>
                    <Plus size={14} /><span className="text-xs">Añadir</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {(materia.fechas || []).filter((f) => f.tipo === tipo).map((evento) => (
                    <div key={evento.id} className="rounded-lg border border-white/80 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={evento.fecha || ""}
                          onChange={(e) => updateEvent(evento.id, "fecha", e.target.value)}
                          onKeyDown={commitWithEnter}
                          onBlur={() => onSaved?.()}
                          className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <button onClick={() => removeEvent(evento.id)} className="text-slate-400 hover:text-red-600" aria-label="Eliminar evento">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={evento.titulo || ""}
                        onChange={(e) => updateEvent(evento.id, "titulo", e.target.value)}
                        onKeyDown={commitWithEnter}
                        onBlur={() => onSaved?.()}
                        placeholder="Descripción..."
                        className="mt-2 w-full break-words rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
