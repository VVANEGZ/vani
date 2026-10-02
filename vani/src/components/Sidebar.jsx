import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import CriterionCard from "./CriterionCard";
import AssignmentCard from "./AssignmentCard";
import { criterionFor, gradeSummary } from "../storage/assessment.js";
import { criteriaTotal } from "../storage/criteria.js";
import { BookOpen, Calendar, Plus } from "lucide-react";

export default function Sidebar({ materia, onUpdate, onSaved, section }) {
  const [newEventId, setNewEventId] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const criterios = materia.criterios || [];
  const fechas = materia.fechas || [];
  const groups = criterios.map((c) => ({ ...c, events: fechas.filter((e) => criterionFor(e, criterios) === c.id) }));
  const unlinked = fechas.filter((e) => !criterionFor(e, criterios));
  const summary = gradeSummary(groups.flatMap((g) => g.events));
  const overweight = groups.some((g) => gradeSummary(g.events).assigned > Number(g.porcentaje));
  const total = criteriaTotal(criterios);
  const restante = Math.max(0, 100 - total);

  const updateCriteria = (next) => onUpdate("criterios", next);

  const addCriterion = () => {
    if (total >= 100) return;
    updateCriteria([...criterios, { id: `criterion-${Date.now()}`, nombre: "Nuevo criterio", porcentaje: 0 }]);
  };

  const addEvent = (criterioId) => { const id = crypto.randomUUID(); setNewEventId(id); onUpdate("fechas", [...fechas, { id, criterioId, fecha: "", titulo: "", peso: "", realizado: false, formato: "reactivos", resultado: "", reactivos: "" }]); };
  const removeEvent = (id) => setEventToDelete({ id, materiaId: materia.id });

  return (
    <aside className="section-workspace w-full p-5 sm:p-8">
      <div className="mx-auto mb-6 max-w-3xl"><p className="mb-1 text-xs text-slate-500 dark:text-slate-400">{materia.nombre}</p><h1 className="text-2xl font-semibold tracking-tight">{section === "rubric" ? "Encuadre" : "Calendario"}</h1></div>
      <ConfirmModal open={eventToDelete?.materiaId === materia.id} title="¿Eliminar esta fecha?" description="Se eliminará esta asignación del calendario. Esta acción no se puede deshacer." onCancel={() => setEventToDelete(null)} onConfirm={() => { onUpdate("fechas", (materia.fechas || []).filter((event) => event.id !== eventToDelete.id)); setEventToDelete(null); onSaved?.(); }} />
      <div className="mx-auto max-w-3xl space-y-6">
        {section !== "calendar" && <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
              <div key={`${materia.id}-${criterio.id}`}>
              <CriterionCard
                key={`${materia.id}-${criterio.id}`}
                criterio={criterio}
                criterios={criterios}
                onSave={(updated) => {
                  updateCriteria(criterios.map((item) => item.id === updated.id ? updated : item));
                  onSaved?.();
                }}
                onDelete={() => {
                  onUpdate("fechas", fechas.map((event) => ({ ...event, criterioId: criterionFor(event, criterios) || event.criterioId || "unlinked" })));
                  updateCriteria(criterios.filter((item) => item.id !== criterio.id));
                  onSaved?.();
                }}
              />
              <p className="px-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">Aporte: {gradeSummary(groups.find((g) => g.id === criterio.id).events).earned.toFixed(2)} / {criterio.porcentaje} puntos</p>
              </div>
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
        </section>}

        <section>
          <div className="grade-overview mb-4" aria-live="polite">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avance</p>
            {overweight || total > 100 ? <p className="mt-2 text-rose-600 dark:text-rose-300">Revisa los pesos: superan el encuadre. El cálculo está pausado.</p> : <>
              <div className="mt-2 flex items-baseline gap-2"><strong className="text-3xl font-semibold tracking-tight">{summary.earned.toFixed(1)}</strong><span className="text-xs text-slate-500 dark:text-slate-400">puntos de 100</span></div>
              <div className="grade-track" role="progressbar" aria-label="Porcentaje del curso evaluado" aria-valuenow={summary.graded} aria-valuemin={0} aria-valuemax={100}><span style={{ width: Math.min(100, summary.graded) + "%" }} /></div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>{summary.graded.toFixed(0)}% evaluado</span><span>{Math.max(0,100-summary.graded).toFixed(0)}% pendiente</span></div>
              <details className="mt-3 text-xs text-slate-500 dark:text-slate-400"><summary className="cursor-pointer">Ver detalle</summary><p className="mt-2 leading-relaxed">Según los resultados pendientes, la calificación final puede quedar entre {(summary.earned / 10).toFixed(2)} y {((summary.earned + 100 - summary.graded) / 10).toFixed(2)} / 10. Lo pendiente aún no cuenta como cero.</p></details>
            </>}
          </div>
          {section !== "rubric" && <><div className="mb-3">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Calendar size={14} /> Calendario
            </h2>
            <p className="mt-1 break-words text-[11px] text-slate-400">Edita con el lápiz · Enter guarda y cierra</p>
          </div>
          <div className="space-y-3">
            {!criterios.length && <p className="text-xs text-slate-500">Agrega criterios al encuadre para crear asignaciones.</p>}
            {[...groups, ...(unlinked.length ? [{ id: "unlinked", nombre: "Sin criterio", events: unlinked }] : [])].map((group) => {
              const criterion = criterios.find((c) => c.id === group.id);
              const progress = gradeSummary(group.events);
              return <details key={materia.id + group.id} className="calendar-category group rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" open>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />{group.nombre}<span className="ml-auto text-xs text-slate-400">{group.events.length}</span><span aria-hidden="true">›</span></summary>
                <div className="space-y-3 px-3 pb-3">
                  {criterion ? <><p className="text-xs text-slate-500 dark:text-slate-400">{progress.assigned}% de {criterion.porcentaje}% distribuido</p><button onClick={() => addEvent(criterion.id)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700"><Plus size={14} />Añadir asignación</button></> : <p className="text-xs text-slate-500">Estas asignaciones se conservan, pero no cuentan en la calificación hasta vincularlas.</p>}
                  {group.events.map((event) => <AssignmentCard autoEdit={event.id === newEventId} key={materia.id + event.id} event={event} events={group.events} criterion={criterion} criteria={criterios} onDelete={() => removeEvent(event.id)} onChange={(updated) => { onUpdate("fechas", fechas.map((e) => e.id === updated.id ? { ...updated, criterioId: criterion?.id || updated.criterioId } : e)); onSaved?.(); }} />)}
                </div>
              </details>;
            })}
          </div></>}
        </section>
      </div>
    </aside>
  );
}
