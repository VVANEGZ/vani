import { useState } from "react";
import { FolderPlus, PlusCircle, Trash2, LayoutGrid, List, ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import TipTapEditor from "./TipTapEditor";
import ConfirmModal from "./ConfirmModal";

const TOPIC_COLORS = ["#647C68", "#667FA0", "#A47962", "#8C729C", "#9B8A52"];

export default function NotesGrid({ materia, onUpdate }) {
  const [activeCard, setActiveCard] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem("vani_notes_view") || "grid");
  const [collapsed, setCollapsed] = useState({});
  const [wide, setWide] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const updateTopics = (updater) => onUpdate("temas", updater(materia.temas || []));

  const addTopic = () => {
    const nuevo = { id: `topic-${Date.now()}`, nombre: `Tema ${(materia.temas || []).length + 1}`, tarjetas: [] };
    updateTopics((temas) => [...temas, nuevo]);
  };

  const updateTopic = (topicId, field, value) => {
    updateTopics((temas) => temas.map((tema) => tema.id === topicId ? { ...tema, [field]: value } : tema));
  };

  const addCard = (topicId) => {
    const nueva = {
      id: `card-${Date.now()}`,
      titulo: "Nuevo Bloque de Notas",
      contenido: "",
      color: materia.color || "#3B82F6",
    };
    setActiveCard(`${materia.id}-${topicId}-${nueva.id}`);
    updateTopics((temas) => temas.map((tema) =>
      tema.id === topicId ? { ...tema, tarjetas: [...(tema.tarjetas || []), nueva] } : tema,
    ));
  };

  const updateCard = (topicId, cardId, field, value) => {
    updateTopics((temas) => temas.map((tema) =>
      tema.id === topicId
        ? { ...tema, tarjetas: (tema.tarjetas || []).map((card) => card.id === cardId ? { ...card, [field]: value } : card) }
        : tema,
    ));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "card") {
      updateTopics((temas) => temas.map((tema) =>
        tema.id === deleteTarget.topicId
          ? { ...tema, tarjetas: (tema.tarjetas || []).filter((card) => card.id !== deleteTarget.id) }
          : tema,
      ));
    } else {
      updateTopics((temas) => temas.filter((tema) => tema.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <section className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <label
            className="relative h-8 w-8 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300 transition hover:scale-105 dark:border-slate-800 dark:ring-slate-600"
            style={{ backgroundColor: materia.color || "#3B82F6" }}
            title="Cambiar color de la materia"
          >
            <input
              type="color"
              value={materia.color || "#3B82F6"}
              onChange={(e) => onUpdate("color", e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Color de la materia"
            />
          </label>
          <input
            type="text"
            value={materia.nombre}
            onChange={(e) => onUpdate("nombre", e.target.value)}
            placeholder="Nombre de la materia..."
            className="min-w-0 flex-1 border-b-2 border-transparent bg-transparent px-1 py-1 text-xl font-bold text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 dark:text-slate-100 dark:hover:border-slate-600 sm:text-2xl"
          />
        </div>
        <button onClick={addTopic} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white">
          <FolderPlus size={15} /> Añadir tema
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Vista de apuntes">
        <div className="vani-view-switch">
          {[["grid", "Cuadrícula", LayoutGrid], ["list", "Lista", List]].map(([value, label, Icon]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => { setView(value); localStorage.setItem("vani_notes_view", value); }} className="vani-view-option"><Icon size={16} aria-hidden="true" />{label}</button>)}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{view === "grid" ? "Explora tus apuntes en tarjetas" : "Más espacio para leer y escribir"}</span>
      </div>
      <div className="space-y-5">
        {(materia.temas || []).map((tema, topicIndex) => (
          <section key={tema.id} className="topic-section rounded-2xl border p-3 sm:p-4" style={{ "--topic-color": tema.color || TOPIC_COLORS[topicIndex % TOPIC_COLORS.length] }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white" style={{ backgroundColor: tema.color || TOPIC_COLORS[topicIndex % TOPIC_COLORS.length] }} title="Cambiar color del tema"><FolderPlus size={18} aria-hidden="true" /><input type="color" aria-label={`Color del tema ${tema.nombre}`} value={tema.color || TOPIC_COLORS[topicIndex % TOPIC_COLORS.length]} onChange={(event) => updateTopic(tema.id, "color", event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>
              <input
                value={tema.nombre}
                onChange={(e) => updateTopic(tema.id, "nombre", e.target.value)}
                className="min-w-0 flex-1 break-words bg-transparent text-base font-bold text-slate-800 outline-none dark:text-slate-100"
                aria-label="Nombre del tema"
              />
              <button onClick={() => addCard(tema.id)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                <PlusCircle size={14} /> Apunte
              </button>
              <button
                onClick={() => setDeleteTarget({ type: "topic", id: tema.id, name: tema.nombre })}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                aria-label={`Eliminar tema ${tema.nombre}`}
              >
                <Trash2 size={15} />
              </button>
            </div>

            {(tema.tarjetas || []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400 dark:border-slate-700">Este tema todavía no tiene apuntes.</p>
            ) : (
              <div className={view === "list" ? "grid grid-cols-1 items-start gap-4" : "grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"}>
                {(tema.tarjetas || []).map((tarjeta) => {
                  const cardKey = `${materia.id}-${tema.id}-${tarjeta.id}`;
                  const isActive = activeCard === cardKey;
                  const previewDoc = new DOMParser().parseFromString(tarjeta.contenido || "", "text/html");
                  previewDoc.querySelectorAll("p, h1, h2, h3, li, blockquote, br").forEach((block) => block.append("\n"));
                  const preview = (previewDoc.body.textContent || "").trim();
                  const isCollapsed = collapsed[cardKey] ?? preview.length > 650;
                  const cardColor = tarjeta.color || materia.color || "#3B82F6";
                  return (
                    <article
                      key={tarjeta.id}
                      className={`note-card min-w-0 rounded-xl p-4 ${isActive ? "note-card-active" : ""} ${wide[cardKey] ? "col-span-full" : ""}`}
                      style={{
                        "--note-color": cardColor,

                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-300"><span aria-hidden="true" className="note-color-dot" />{isActive ? "Editando" : "Lectura"}</span>
                        <button type="button" className="vani-pill" onClick={() => { setActiveCard(isActive ? null : cardKey); if (!isActive) setCollapsed((current) => ({ ...current, [cardKey]: false })); }}>{isActive ? "Terminar" : "Editar apunte"}</button>
                      </div>
                      {isActive ? <div className="mb-3 flex items-center gap-2">
                        <label
                          className="relative h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-sm ring-1 ring-slate-300 transition hover:scale-110 dark:border-slate-900 dark:ring-slate-600"
                          style={{ backgroundColor: cardColor }}
                          title="Cambiar color de este apunte"
                        >
                          <input
                            type="color"
                            value={cardColor}
                            onChange={(e) => updateCard(tema.id, tarjeta.id, "color", e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            aria-label={`Color del apunte ${tarjeta.titulo}`}
                          />
                        </label>
                        <input
                          type="text"
                          value={tarjeta.titulo}
                          onChange={(e) => updateCard(tema.id, tarjeta.id, "titulo", e.target.value)}
                          className="min-w-0 flex-1 border-b border-transparent bg-transparent pb-1 font-semibold text-slate-800 outline-none focus:border-slate-300 dark:text-slate-100 dark:focus:border-slate-600"
                        />
                        <button
                          onClick={() => setDeleteTarget({ type: "card", id: tarjeta.id, topicId: tema.id, name: tarjeta.titulo })}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          aria-label={`Eliminar apunte ${tarjeta.titulo}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div> : <h3 className="mb-3 break-words font-semibold text-slate-700 dark:text-slate-200">{tarjeta.titulo || "Sin título"}</h3>}
                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <button type="button" aria-expanded={!isCollapsed} onClick={() => setCollapsed({ ...collapsed, [cardKey]: !isCollapsed })} className="vani-pill">{isCollapsed ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronUp size={15} aria-hidden="true" />}{isCollapsed ? "Expandir apunte" : "Contraer apunte"}</button>
                        {view === "grid" && <button type="button" aria-pressed={Boolean(wide[cardKey])} onClick={() => { setWide({ ...wide, [cardKey]: !wide[cardKey] }); setCollapsed({ ...collapsed, [cardKey]: false }); }} className="vani-pill">{wide[cardKey] ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />}{wide[cardKey] ? "Ancho normal" : "Todo el ancho"}</button>}
                      </div>
                      {isCollapsed ? <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{preview || "Apunte vacío. Expándelo para comenzar a escribir."}</p> : <TipTapEditor
                        editable={isActive}
                        content={tarjeta.contenido}
                        onUpdate={(html) => { setCollapsed((current) => ({ ...current, [cardKey]: false })); updateCard(tema.id, tarjeta.id, "contenido", html); }}
                      />}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "topic" ? `¿Eliminar el tema “${deleteTarget?.name}”?` : `¿Eliminar el apunte “${deleteTarget?.name}”?`}
        description={deleteTarget?.type === "topic" ? "También se eliminarán todos los apuntes que estén dentro de este tema." : "Se eliminará el contenido de este bloque de apuntes."}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
