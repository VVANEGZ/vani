import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import TabBar from "./components/TabBar";
import Sidebar from "./components/Sidebar";
import NotesGrid from "./components/NotesGrid";
import DeleteSubjectModal from "./components/DeleteSubjectModal";
import { exportBackup, importBackup, loadData, saveData } from "./storage/storage";

function mixWithWhite(hex, ratio = 0.9) {
  const safeHex = /^#[0-9A-F]{6}$/i.test(hex || "") ? hex : "#3B82F6";
  const r = parseInt(safeHex.slice(1, 3), 16);
  const g = parseInt(safeHex.slice(3, 5), 16);
  const b = parseInt(safeHex.slice(5, 7), 16);
  const mix = (value) => Math.round(value + (255 - value) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export default function App() {
  const initialData = useMemo(() => loadData(), []);
  const [materias, setMaterias] = useState(initialData.materias);
  const [activaId, setActivaId] = useState(initialData.materias[0]?.id || "");
  const [editandoEncuadre, setEditandoEncuadre] = useState(false);
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const fileInputRef = useRef(null);

  const materiaActiva = materias.find((m) => m.id === activaId) || materias[0];

  useEffect(() => {
    saveData(materias);
  }, [materias]);

  useEffect(() => {
    if (materiaActiva) document.title = `${materiaActiva.nombre} · Vani`;
  }, [materiaActiva]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const timer = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  if (!materiaActiva) return null;

  const actualizarMateriaActiva = (campo, valor) => {
    setMaterias((prev) =>
      prev.map((materia) =>
        materia.id === activaId ? { ...materia, [campo]: valor } : materia,
      ),
    );
  };

  const agregarMateria = () => {
    const nueva = {
      id: `mat-${Date.now()}`,
      nombre: `Materia ${materias.length + 1}`,
      color: "#3B82F6",
      encuadre: "",
      fechas: [],
      tarjetas: [],
    };
    setMaterias((prev) => [...prev, nueva]);
    setActivaId(nueva.id);
    setEditandoEncuadre(false);
  };

  const confirmarEliminacion = () => {
    if (!materiaAEliminar) return;
    const filtradas = materias.filter((m) => m.id !== materiaAEliminar.id);
    setMaterias(filtradas);
    setActivaId((current) =>
      current === materiaAEliminar.id ? filtradas[0]?.id || "" : current,
    );
    setMateriaAEliminar(null);
    setMensaje("Materia eliminada.");
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedSubjects = await importBackup(file);
      setMaterias(importedSubjects);
      setActivaId(importedSubjects[0]?.id || "");
      setMensaje("Respaldo importado correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo importar ese respaldo.");
    } finally {
      event.target.value = "";
    }
  };

  const backgroundColor = mixWithWhite(materiaActiva.color, 0.91);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <header className="sticky top-0 z-30 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-slate-900">Vani</p>
            <p className="text-xs text-slate-500">Tus materias y apuntes, en un solo lugar</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportBackup(materias)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={14} /> Exportar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Upload size={14} /> Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        <TabBar
          materias={materias}
          activaId={activaId}
          onSelect={(id) => {
            setActivaId(id);
            setEditandoEncuadre(false);
          }}
          onAdd={agregarMateria}
          onDelete={(id) => setMateriaAEliminar(materias.find((m) => m.id === id) || null)}
        />
      </header>

      <div
        className="flex min-h-[calc(100vh-106px)] flex-col lg:flex-row"
        style={{ backgroundColor }}
      >
        <Sidebar
          materia={materiaActiva}
          editandoEncuadre={editandoEncuadre}
          setEditandoEncuadre={setEditandoEncuadre}
          onUpdate={actualizarMateriaActiva}
        />
        <NotesGrid materia={materiaActiva} onUpdate={actualizarMateriaActiva} />
      </div>

      {mensaje && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg" role="status">
          {mensaje}
        </div>
      )}

      <DeleteSubjectModal
        materia={materiaAEliminar}
        onCancel={() => setMateriaAEliminar(null)}
        onConfirm={confirmarEliminacion}
      />
    </div>
  );
}
