import { BookOpen, Calendar, Plus, Trash2, X } from "lucide-react";

const GROUPS = [
  { tipo: "examen", titulo: "Exámenes", tone: "red" },
  { tipo: "proyecto", titulo: "Proyectos", tone: "purple" },
  { tipo: "tarea", titulo: "Tareas", tone: "blue" },
];

const toneClasses = {
  red: "bg-red-50 border-red-100 text-red-900 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200",
  purple: "bg-purple-50 border-purple-100 text-purple-900 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-200",
  blue: "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200",
};

export default function Sidebar({ materia, onUpdate, onSaved }) {
  const criterios = materia.criterios || [];
  const total = criterios.reduce((sum, criterio) => sum + (Number(criterio.porcentaje) || 0), 0);
  const restante = Math.max(0, 100 - total);

  const updateCriteria = (next) => onUpdate("criterios", next);

  const addCriterion = () => {
    if (total >= 100) return;
    updateCriteria([...criterios, { id: `criterion-${Date.now()}`, nombre: "Nuevo criterio", porcentaje: 0 }]);
  };

  const updateCriterion = (id, field, value) => {
    if (field === "porcentaje") {
      const current = criterios.find((c) => c.id === id)?.porcentaje || 0;
      const others = total - Number(current || 0);
      const maxAllowed = Math.max(0, 100 - others);
      const safeValue = Math.min(maxAllowed, Math.max(0, Number(value) || 0));
      updateCriteria(criterios.map((c) => c.id === id ? { ...c, porcentaje: safeValue } : c));
      return;
    }
    updateCriteria(criterios.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCriterion = (id) => updateCriteria(criterios.filter((c) => c.id !== id));

  const addEvent = (tipo) => {
    onUpdate("fechas", [...(materia.fechas || []), { id: `event-${Date.now()}`, tipo, fecha: "", titulo: "" }]);
  };

  const updateEvent = (id, field, value) => {
    onUpdate("fechas", (materia.fechas || []).map((evento) => evento.id === id ? { ...evento, [field]: value } : evento));
  };

  const removeEvent = (id) => onUpdate("fechas", (materia.fechas || []).filter((evento) => evento.id !== id));

  const commitWithEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
    onSaved?.();
  };

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5 lg:overflow-y-auto">
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
              <div key={criterio.id} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950">
                <input
                  value={criterio.nombre}
                  onChange={(e) => updateCriterion(criterio.id, "nombre", e.target.value)}
                  className="w-full break-words bg-transparent text-sm font-medium text-slate-700 outline-none dark:text-slate-200"
                  aria-label="Nombre del criterio"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={criterio.porcentaje}
                    onChange={(e) => updateCriterion(criterio.id, "porcentaje", e.target.value)}
                    className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    aria-label={`Porcentaje de ${criterio.nombre}`}
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
                  <button onClick={() => removeCriterion(criterio.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={`Eliminar ${criterio.nombre}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
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
              <div key={tipo} className={`rounded-lg border p-2.5 ${toneClasses[tone]}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">{titulo}</span>
                  <button onClick={() => addEvent(tipo)} className="rounded p-1 hover:bg-white/70 dark:hover:bg-white/10" aria-label={`Añadir ${titulo.toLowerCase()}`}>
                    <Plus size={14} />
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
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
