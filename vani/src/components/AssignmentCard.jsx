import { useRef, useState } from "react";
import { X, Pencil, Check, CalendarDays } from "lucide-react";
import { assessmentRatio, localDate, validateAssignmentDate, validateWeight } from "../storage/assessment.js";

const inputClass = "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export default function AssignmentCard({ event: savedEvent, events, criterion, criteria, onChange: saveEvent, onDelete, autoEdit = false }) {
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(savedEvent);
  const editButton = useRef(null);
  const dateInput = useRef(null);
  const event = editing ? draft : savedEvent;
  // Persist edits through the existing offline-safe workspace path, even when
  // navigation unmounts this card before Enter is pressed.
  const onChange = (updated) => { setDraft(updated); saveEvent(updated); };
  const finish = () => {
    const updated = { ...draft, fecha: dateInput.current?.value ?? draft.fecha };
    const message = validateAssignmentDate(updated.fecha, savedEvent.fecha) || (criterion ? validateWeight(draft.peso ?? "", draft.id, events, criterion.porcentaje) : "") || (draft.realizado && draft.resultado !== "" && draft.resultado != null && assessmentRatio(draft) === null ? "Revisa el resultado y el total de reactivos." : "");
    if (message) { setError(message); return; }
    saveEvent(updated); setEditing(false); setError("");
    requestAnimationFrame(() => editButton.current?.focus());
  };
  const [error, setError] = useState("");
  const ratio = assessmentRatio(event);
  const change = (field, value) => onChange({ ...event, [field]: value });
  if (!editing) return <article className="assignment-preview">
    <div className="flex items-start gap-2"><span className={event.realizado ? "assignment-status is-done" : "assignment-status"}>{event.realizado ? <Check size={15} /> : <CalendarDays size={15} />}</span><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{event.titulo || "Sin descripción"}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.fecha ? event.fecha.split("-").reverse().join("/") : "Sin fecha"} · {event.realizado ? "Realizado" : "Pendiente"}</p></div><button ref={editButton} className="assignment-edit" aria-label={"Editar " + (event.titulo || "asignación")} onClick={() => { setDraft(savedEvent); setEditing(true); }}><Pencil size={15} /></button><button className="assignment-edit" aria-label="Eliminar evento" onClick={onDelete}><X size={15} /></button></div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="assignment-chip">{event.peso ? event.peso + "% del curso" : "Sin peso"}</span>{ratio !== null && <span className="assignment-chip">{event.formato === "reactivos" ? event.resultado + "/" + event.reactivos + " aciertos" : event.resultado + (event.formato === "calificacion" ? "/10" : "%")}</span>}</div>
  </article>;
  return <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900" onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT" && !e.nativeEvent.isComposing) { e.preventDefault(); finish(); } }}>
    <div className="flex items-center gap-2"><input aria-label="Descripción de la asignación" placeholder="Descripción…" className={inputClass} value={event.titulo || ""} onChange={(e) => change("titulo", e.target.value)} /><button aria-label="Eliminar evento" onClick={onDelete}><X size={16} /></button></div>
    {!criterion && <label className="block text-xs">Vincular al encuadre<select className={inputClass} value={criteria.some((c) => c.id === event.criterioId) ? event.criterioId : ""} onChange={(e) => onChange({ ...event, criterioId: e.target.value, peso: "" })}><option value="">Sin criterio</option>{criteria.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
    <label className="block text-xs">Fecha<input ref={dateInput} type="date" aria-label="Fecha de la asignación" min={localDate()} onBlur={(e) => { const message = validateAssignmentDate(e.target.value, event.fecha); if (message) { setError(message); e.target.value = event.fecha || ""; } else { setError(""); if (e.target.value !== (event.fecha || "")) change("fecha", e.target.value); } }} className={inputClass} value={event.fecha || ""} onChange={(e) => { const message = validateAssignmentDate(e.target.value, event.fecha); setError(message); if (!message) change("fecha", e.target.value); }} /></label>
    {criterion && <label className="block text-xs">Peso en el curso (%)<input type="number" min="0" max={criterion.porcentaje} step="0.01" placeholder="Sin asignar" className={inputClass} value={event.peso ?? ""} onFocus={(e) => e.target.select()} onChange={(e) => { const message = validateWeight(e.target.value, event.id, events, criterion.porcentaje); setError(message); if (!message) change("peso", e.target.value); }} /></label>}
    <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={event.realizado === true} onChange={(e) => change("realizado", e.target.checked)} />Realizado</label>
    {event.realizado && <div className="space-y-2">
      <label className="block text-xs">Registrar resultado por<select className={inputClass} value={event.formato || "reactivos"} onChange={(e) => onChange({ ...event, formato: e.target.value, resultado: "", reactivos: "" })}><option value="reactivos">Reactivos</option><option value="porcentaje">Porcentaje</option><option value="calificacion">Calificación del 1 al 10</option></select></label>
      <div className="flex gap-2"><label className="min-w-0 flex-1 text-xs">{(event.formato || "reactivos") === "reactivos" ? "Aciertos" : "Resultado"}<input type="number" min={event.formato === "calificacion" ? 1 : 0} step={(!event.formato || event.formato === "reactivos") ? 1 : "0.01"} className={inputClass} value={event.resultado ?? ""} onChange={(e) => change("resultado", e.target.value)} /></label>
      {(!event.formato || event.formato === "reactivos") && <label className="min-w-0 flex-1 text-xs">Total reactivos<input type="number" min="1" step="1" className={inputClass} value={event.reactivos ?? ""} onChange={(e) => change("reactivos", e.target.value)} /></label>}</div>
      <p className="text-xs text-slate-500 dark:text-slate-400" role="status">{ratio === null ? "Sin calificar: completa un resultado válido dentro del rango elegido." : `${(ratio * 100).toFixed(1)}% de rendimiento · aporta ${(ratio * (Number(event.peso) || 0)).toFixed(2)} puntos al curso.`}</p>
    </div>}
    <button type="button" onClick={finish} className="assignment-save"><Check size={14} />Guardar y cerrar<span className="ml-auto opacity-60">↵</span></button>
    {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
  </div>;
}
