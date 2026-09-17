import { PlusCircle } from "lucide-react";
import TipTapEditor from "./TipTapEditor";

export default function NotesGrid({ materia, onUpdate }) {
  const addCard = () => {
    const nueva = {
      id: `card-${Date.now()}`,
      titulo: "Nuevo Bloque de Notas",
      contenido: "",
    };
    onUpdate("tarjetas", [...(materia.tarjetas || []), nueva]);
  };

  const updateCard = (id, field, value) => {
    onUpdate(
      "tarjetas",
      (materia.tarjetas || []).map((card) =>
        card.id === id ? { ...card, [field]: value } : card,
      ),
    );
  };

  return (
    <section className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="color"
            value={materia.color || "#3B82F6"}
            onChange={(e) => onUpdate("color", e.target.value)}
            className="h-9 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label="Color de la materia"
          />
          <input
            type="text"
            value={materia.nombre}
            onChange={(e) => onUpdate("nombre", e.target.value)}
            placeholder="Nombre de la materia..."
            className="min-w-0 flex-1 border-b-2 border-transparent bg-transparent px-1 py-1 text-xl font-bold text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500 sm:text-2xl"
          />
        </div>
        <button onClick={addCard} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <PlusCircle size={15} /> Añadir bloque
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {(materia.tarjetas || []).map((tarjeta) => (
          <article key={tarjeta.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              value={tarjeta.titulo}
              onChange={(e) => updateCard(tarjeta.id, "titulo", e.target.value)}
              className="mb-3 w-full border-b border-transparent pb-1 font-semibold text-slate-800 outline-none focus:border-slate-300"
            />
            <TipTapEditor
              content={tarjeta.contenido}
              onUpdate={(html) => updateCard(tarjeta.id, "contenido", html)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
