import { useState, useEffect } from "react";
import TabBar from "./components/TabBar";
import TipTapEditor from "./components/TipTapEditor";
import {
  Calendar,
  BookOpen,
  PlusCircle,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";

const MATERIAS_INICIALES = [
  {
    id: "mat-1",
    nombre: "Materia 1",
    encuadre: "40% Exámenes\n30% Proyecto integrador\n30% Tareas y prácticas",
    fechas: [
      { tipo: "examen", texto: "20 Sep: Primer Parcial" },
      { tipo: "proyecto", texto: "15 Nov: Entrega Proyecto" },
    ],
    tarjetas: [{ id: "card-1", titulo: "Apuntes Generales", contenido: "" }],
  },
];

export default function App() {
  const [materias, setMaterias] = useState(() => {
    const saved = localStorage.getItem("study_hub_data");
    return saved ? JSON.parse(saved) : MATERIAS_INICIALES;
  });

  const [editandoEncuadre, setEditandoEncuadre] = useState(false);
  const [activaId, setActivaId] = useState(materias[0]?.id || "");

  useEffect(() => {
    localStorage.setItem("study_hub_data", JSON.stringify(materias));
  }, [materias]);

  const materiaActiva = materias.find((m) => m.id === activaId) || materias[0];
  useEffect(() => {
    document.title = materiaActiva.nombre;
  }, [materiaActiva]);

  const actualizarMateriaActiva = (campo, valor) => {
    setMaterias((prev) =>
      prev.map((m) => (m.id === activaId ? { ...m, [campo]: valor } : m)),
    );
  };

  const agregarTarjeta = () => {
    const nuevaTarjeta = {
      id: `card-${Date.now()}`,
      titulo: "Nuevo Bloque de Notas",
      contenido: "",
    };
    actualizarMateriaActiva("tarjetas", [
      ...materiaActiva.tarjetas,
      nuevaTarjeta,
    ]);
  };

  const actualizarContenidoTarjeta = (tarjetaId, nuevoContenido) => {
    const actualizadas = materiaActiva.tarjetas.map((t) =>
      t.id === tarjetaId ? { ...t, contenido: nuevoContenido } : t,
    );
    actualizarMateriaActiva("tarjetas", actualizadas);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans">
      <TabBar
        materias={materias}
        activaId={activaId}
        onSelect={setActivaId}
        onAdd={() => {
          const nueva = {
            id: `mat-${Date.now()}`,
            nombre: `Materia ${materias.length + 1}`,
            encuadre: "Especifica aquí los criterios de evaluación...",
            fechas: [],
            tarjetas: [],
          };
          setMaterias([...materias, nueva]);
          setActivaId(nueva.id);
        }}
        onDelete={(id) => {
          const filtradas = materias.filter((m) => m.id !== id);
          setMaterias(filtradas);
          setActivaId(filtradas[0]?.id || "");
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Panel Lateral Fijo: Encuadre y Fechas */}
        <aside className="w-80 bg-white border-r border-gray-200 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
          {/* ENCUADRE BLOQUEABLE */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={14} /> Encuadre
              </h2>
              <button
                onClick={() => setEditandoEncuadre(!editandoEncuadre)}
                className={`text-xs font-semibold px-3 py-1 rounded-md transition-colors ${
                  editandoEncuadre
                    ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {editandoEncuadre ? "Guardar" : "Editar"}
              </button>
            </div>

            {editandoEncuadre ? (
              <textarea
                className="w-full h-32 p-2.5 text-sm text-slate-700 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none resize-none transition-colors"
                value={materiaActiva.encuadre || ""}
                onChange={(e) =>
                  actualizarMateriaActiva("encuadre", e.target.value)
                }
                placeholder="Escribe aquí las reglas, porcentajes..."
              />
            ) : (
              <div className="w-full min-h-[8rem] text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {materiaActiva.encuadre ||
                  "No hay encuadre definido. Haz clic en Editar."}
              </div>
            )}
          </div>

          {/* FECHAS IMPORTANTES POR BLOQUES */}
          <div className="mt-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Calendar size={14} /> Calendario
            </h2>

            <div className="space-y-3">
              {/* Categoría: Exámenes */}
              <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-red-800 uppercase">
                    Exámenes
                  </span>
                  <button
                    onClick={() =>
                      actualizarMateriaActiva("fechas", [
                        ...(materiaActiva.fechas || []),
                        { tipo: "examen", texto: "Nuevo examen..." },
                      ])
                    }
                    className="text-red-600 hover:bg-red-200 p-0.5 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {(materiaActiva.fechas || []).map(
                    (f, i) =>
                      f.tipo === "examen" && (
                        <li
                          key={i}
                          className="flex gap-2 bg-white border border-red-100 rounded px-2 py-1"
                        >
                          <input
                            type="text"
                            value={f.texto}
                            onChange={(e) => {
                              const n = [...materiaActiva.fechas];
                              n[i] = { ...n[i], texto: e.target.value };
                              actualizarMateriaActiva("fechas", n);
                            }}
                            className="text-xs text-red-900 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (window.confirm("¿Borrar examen?")) {
                                actualizarMateriaActiva(
                                  "fechas",
                                  materiaActiva.fechas.filter(
                                    (_, idx) => idx !== i,
                                  ),
                                );
                              }
                            }}
                            className="text-red-400 hover:text-red-700"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ),
                  )}
                </ul>
              </div>

              {/* Categoría: Proyectos */}
              <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-purple-800 uppercase">
                    Proyectos
                  </span>
                  <button
                    onClick={() =>
                      actualizarMateriaActiva("fechas", [
                        ...(materiaActiva.fechas || []),
                        { tipo: "proyecto", texto: "Nuevo proyecto..." },
                      ])
                    }
                    className="text-purple-600 hover:bg-purple-200 p-0.5 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {(materiaActiva.fechas || []).map(
                    (f, i) =>
                      f.tipo === "proyecto" && (
                        <li
                          key={i}
                          className="flex gap-2 bg-white border border-purple-100 rounded px-2 py-1"
                        >
                          <input
                            type="text"
                            value={f.texto}
                            onChange={(e) => {
                              const n = [...materiaActiva.fechas];
                              n[i] = { ...n[i], texto: e.target.value };
                              actualizarMateriaActiva("fechas", n);
                            }}
                            className="text-xs text-purple-900 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (window.confirm("¿Borrar proyecto?")) {
                                actualizarMateriaActiva(
                                  "fechas",
                                  materiaActiva.fechas.filter(
                                    (_, idx) => idx !== i,
                                  ),
                                );
                              }
                            }}
                            className="text-purple-400 hover:text-purple-700"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ),
                  )}
                </ul>
              </div>

              {/* Categoría: Tareas */}
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-blue-800 uppercase">
                    Tareas
                  </span>
                  <button
                    onClick={() =>
                      actualizarMateriaActiva("fechas", [
                        ...(materiaActiva.fechas || []),
                        { tipo: "tarea", texto: "Nueva tarea..." },
                      ])
                    }
                    className="text-blue-600 hover:bg-blue-200 p-0.5 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {(materiaActiva.fechas || []).map(
                    (f, i) =>
                      f.tipo === "tarea" && (
                        <li
                          key={i}
                          className="flex gap-2 bg-white border border-blue-100 rounded px-2 py-1"
                        >
                          <input
                            type="text"
                            value={f.texto}
                            onChange={(e) => {
                              const n = [...materiaActiva.fechas];
                              n[i] = { ...n[i], texto: e.target.value };
                              actualizarMateriaActiva("fechas", n);
                            }}
                            className="text-xs text-blue-900 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (window.confirm("¿Borrar tarea?")) {
                                actualizarMateriaActiva(
                                  "fechas",
                                  materiaActiva.fechas.filter(
                                    (_, idx) => idx !== i,
                                  ),
                                );
                              }
                            }}
                            className="text-blue-400 hover:text-blue-700"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Tablero de Tarjetas / Bloques */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {/* Selector de color */}
              <input
                type="color"
                value={materiaActiva.color || "#3B82F6"}
                onChange={(e) =>
                  actualizarMateriaActiva("color", e.target.value)
                }
                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              {/* Campo de texto editable */}
              <input
                type="text"
                value={materiaActiva.nombre}
                onChange={(e) =>
                  actualizarMateriaActiva("nombre", e.target.value)
                }
                placeholder="Nombre de la materia..."
                className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 w-full"
              />
            </div>
            <button
              onClick={agregarTarjeta}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              <PlusCircle size={14} /> Añadir Bloque
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {materiaActiva.tarjetas.map((tarjeta) => (
              <div
                key={tarjeta.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3"
              >
                <input
                  type="text"
                  value={tarjeta.titulo}
                  onChange={(e) => {
                    const actualizadas = materiaActiva.tarjetas.map((t) =>
                      t.id === tarjeta.id
                        ? { ...t, titulo: e.target.value }
                        : t,
                    );
                    actualizarMateriaActiva("tarjetas", actualizadas);
                  }}
                  className="font-semibold text-gray-800 focus:outline-none border-b border-transparent focus:border-gray-300 pb-1"
                />
                <TipTapEditor
                  content={tarjeta.contenido}
                  onUpdate={(html) =>
                    actualizarContenidoTarjeta(tarjeta.id, html)
                  }
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}