import { useState } from "react";
import { FolderPlus, PlusCircle, Trash2 } from "lucide-react";
import TipTapEditor from "./TipTapEditor";
import ConfirmModal from "./ConfirmModal";

export default function NotesGrid({ materia, onUpdate }) {
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

      <div className="space-y-5">
        {(materia.temas || []).map((tema) => (
          <section key={tema.id} className="rounded-2xl border border-slate-200/80 bg-white/55 p-3 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/55 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {(tema.tarjetas || []).map((tarjeta) => {
                  const cardColor = tarjeta.color || materia.color || "#3B82F6";
                  return (
                    <article
                      key={tarjeta.id}
                      className="min-w-0 rounded-xl border p-4 shadow-sm transition-colors"
                      style={{
                        borderColor: cardColor,
                        backgroundColor: `color-mix(in srgb, ${cardColor} 12%, transparent)`,
                      }}
                    >
                      <div className="mb-3 flex items-center gap-2">
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
                      </div>
                      <TipTapEditor
                        content={tarjeta.contenido}
                        onUpdate={(html) => updateCard(tema.id, tarjeta.id, "contenido", html)}
                      />
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
