import { BookOpen, Calendar, Plus, X } from "lucide-react";

const GROUPS = [
  { tipo: "examen", titulo: "Exámenes", tone: "red" },
  { tipo: "proyecto", titulo: "Proyectos", tone: "purple" },
  { tipo: "tarea", titulo: "Tareas", tone: "blue" },
];

const toneClasses = {
  red: "bg-red-50 border-red-100 text-red-900",
  purple: "bg-purple-50 border-purple-100 text-purple-900",
  blue: "bg-blue-50 border-blue-100 text-blue-900",
};

export default function Sidebar({ materia, editandoEncuadre, setEditandoEncuadre, onUpdate, onSaved }) {
  const addEvent = (tipo) => {
    onUpdate("fechas", [
      ...(materia.fechas || []),
      { id: `event-${Date.now()}`, tipo, fecha: "", titulo: "" },
    ]);
  };

  const updateEvent = (id, field, value) => {
    onUpdate(
      "fechas",
      (materia.fechas || []).map((evento) =>
        evento.id === id ? { ...evento, [field]: value } : evento,
      ),
    );
  };

  const removeEvent = (id) => {
    onUpdate("fechas", (materia.fechas || []).filter((evento) => evento.id !== id));
  };

  const commitWithEnter = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
    onSaved?.();
  };

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5 lg:overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
              <BookOpen size={14} /> Encuadre
            </h2>
            <button
              onClick={() => setEditandoEncuadre((value) => !value)}
              className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              {editandoEncuadre ? "Guardar" : "Editar"}
            </button>
          </div>

          {editandoEncuadre ? (
            <textarea
              className="h-32 w-full resize-y rounded-lg border-2 border-blue-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
              value={materia.encuadre || ""}
              onChange={(e) => onUpdate("encuadre", e.target.value)}
              placeholder="Escribe aquí las reglas, porcentajes..."
            />
          ) : (
            <div className="min-h-32 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {materia.encuadre || "No hay encuadre definido. Haz clic en Editar."}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
              <Calendar size={14} /> Calendario
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">Los cambios se guardan automáticamente. Enter confirma y cierra el campo.</p>
          </div>
          <div className="space-y-3">
            {GROUPS.map(({ tipo, titulo, tone }) => (
              <div key={tipo} className={`rounded-lg border p-2.5 ${toneClasses[tone]}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">{titulo}</span>
                  <button onClick={() => addEvent(tipo)} className="rounded p-1 hover:bg-white/70" aria-label={`Añadir ${titulo.toLowerCase()}`}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {(materia.fechas || []).filter((f) => f.tipo === tipo).map((evento) => (
                    <div key={evento.id} className="rounded-lg border border-white/80 bg-white p-2 shadow-sm">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={evento.fecha || ""}
                          onChange={(e) => updateEvent(evento.id, "fecha", e.target.value)}
                          onKeyDown={commitWithEnter}
                          onBlur={() => onSaved?.()}
                          className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          aria-label={`Fecha de ${evento.titulo || titulo}`}
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
                        className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400"
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
