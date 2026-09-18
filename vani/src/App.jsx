import { useEffect, useMemo, useRef, useState } from "react";
import { Command, Download, Moon, Sun, Upload } from "lucide-react";
import TabBar from "./components/TabBar";
import Sidebar from "./components/Sidebar";
import NotesGrid from "./components/NotesGrid";
import DeleteSubjectModal from "./components/DeleteSubjectModal";
import CommandPalette from "./components/CommandPalette";
import { loadData, saveData } from "./storage/storage";
import { exportNotesMarkdown, importNotesMarkdown } from "./storage/notesMarkdown";

function mixWithWhite(hex, ratio = 0.9) {
  const safeHex = /^#[0-9A-F]{6}$/i.test(hex || "") ? hex : "#3B82F6";
  const r = parseInt(safeHex.slice(1, 3), 16);
  const g = parseInt(safeHex.slice(3, 5), 16);
  const b = parseInt(safeHex.slice(5, 7), 16);
  const mix = (value) => Math.round(value + (255 - value) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function mixWithBlack(hex, ratio = 0.82) {
  const safeHex = /^#[0-9A-F]{6}$/i.test(hex || "") ? hex : "#3B82F6";
  const r = parseInt(safeHex.slice(1, 3), 16);
  const g = parseInt(safeHex.slice(3, 5), 16);
  const b = parseInt(safeHex.slice(5, 7), 16);
  const mix = (value) => Math.round(value * (1 - ratio));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], .ProseMirror"),
  );
}

export default function App() {
  const initialData = useMemo(() => loadData(), []);
  const [materias, setMaterias] = useState(initialData.materias);
  const [activaId, setActivaId] = useState(initialData.materias[0]?.id || "");
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("vani_theme") || "light");
  const [commandOpen, setCommandOpen] = useState(false);
  const fileInputRef = useRef(null);

  const materiaActiva = materias.find((m) => m.id === activaId) || materias[0];

  useEffect(() => {
    saveData(materias);
  }, [materias]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("vani_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (materiaActiva) document.title = `${materiaActiva.nombre} · Vani`;
  }, [materiaActiva]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const timer = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  const actualizarMateriaActiva = (campo, valor) => {
    setMaterias((prev) =>
      prev.map((materia) => materia.id === activaId ? { ...materia, [campo]: valor } : materia),
    );
  };

  const agregarMateria = () => {
    const nueva = {
      id: `mat-${Date.now()}`,
      nombre: `Materia ${materias.length + 1}`,
      color: "#3B82F6",
      criterios: [],
      fechas: [],
      temas: [{ id: `topic-${Date.now()}`, nombre: "Sin tema", tarjetas: [] }],
    };
    setMaterias((prev) => [...prev, nueva]);
    setActivaId(nueva.id);
    setMensaje("Materia creada.");
  };

  const agregarTema = () => {
    if (!materiaActiva) return;
    const temas = materiaActiva.temas || [];
    const nuevo = {
      id: `topic-${Date.now()}`,
      nombre: `Tema ${temas.length + 1}`,
      tarjetas: [],
    };
    actualizarMateriaActiva("temas", [...temas, nuevo]);
    setMensaje("Tema creado.");
  };

  const agregarApunte = () => {
    if (!materiaActiva) return;
    const temas = materiaActiva.temas || [];
    const targetTopic = temas[0];

    if (!targetTopic) {
      const topicId = `topic-${Date.now()}`;
      actualizarMateriaActiva("temas", [{
        id: topicId,
        nombre: "Sin tema",
        tarjetas: [{ id: `card-${Date.now()}`, titulo: "Nuevo Bloque de Notas", contenido: "" }],
      }]);
      setMensaje("Apunte creado en “Sin tema”.");
      return;
    }

    const nueva = { id: `card-${Date.now()}`, titulo: "Nuevo Bloque de Notas", contenido: "" };
    actualizarMateriaActiva(
      "temas",
      temas.map((tema) =>
        tema.id === targetTopic.id
          ? { ...tema, tarjetas: [...(tema.tarjetas || []), nueva] }
          : tema,
      ),
    );
    setMensaje(`Apunte creado en “${targetTopic.nombre}”.`);
  };

  const confirmarEliminacion = () => {
    if (!materiaAEliminar) return;
    const filtradas = materias.filter((m) => m.id !== materiaAEliminar.id);
    setMaterias(filtradas);
    setActivaId((current) => current === materiaAEliminar.id ? filtradas[0]?.id || "" : current);
    setMateriaAEliminar(null);
    setMensaje("Materia eliminada.");
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !materiaActiva) return;

    try {
      const importedNotes = await importNotesMarkdown(file);
      const topics = (materiaActiva.temas || []).map((topic) => ({
        ...topic,
        tarjetas: [...(topic.tarjetas || [])],
      }));

      importedNotes.forEach((note) => {
        const topicName = note.topic || "Importados";
        let topic = topics.find((item) => item.nombre.toLowerCase() === topicName.toLowerCase());
        if (!topic) {
          topic = { id: `topic-${Date.now()}-${topics.length}`, nombre: topicName, tarjetas: [] };
          topics.push(topic);
        }
        topic.tarjetas = [...topic.tarjetas, { id: note.id, titulo: note.titulo, contenido: note.contenido }];
      });

      actualizarMateriaActiva("temas", topics);
      setMensaje(`${importedNotes.length} apunte${importedNotes.length === 1 ? "" : "s"} importado${importedNotes.length === 1 ? "" : "s"}.`);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo importar ese archivo Markdown.");
    } finally {
      event.target.value = "";
    }
  };

  const commands = useMemo(() => [
    {
      id: "new-subject",
      label: "Nueva materia",
      description: "Crear una materia nueva",
      aliases: ["materia", "subject", "crear"],
      icon: "materia",
      hint: "Ctrl+Alt+M",
      action: agregarMateria,
    },
    {
      id: "new-topic",
      label: "Nuevo tema",
      description: "Crear una carpeta/tema en la materia actual",
      aliases: ["tema", "carpeta", "folder"],
      icon: "tema",
      hint: "Ctrl+Alt+T",
      action: agregarTema,
    },
    {
      id: "new-note",
      label: "Nuevo apunte",
      description: "Crear un bloque de apuntes en el primer tema",
      aliases: ["apunte", "bloque", "nota", "note"],
      icon: "apunte",
      hint: "Ctrl+Alt+N",
      action: agregarApunte,
    },
    {
      id: "toggle-theme",
      label: theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
      description: "Alternar la apariencia de Vani",
      aliases: ["oscuro", "claro", "tema", "dark", "light"],
      icon: theme === "dark" ? "light" : "theme",
      action: () => setTheme((current) => current === "dark" ? "light" : "dark"),
    },
    {
      id: "export-notes",
      label: "Exportar apuntes",
      description: "Descargar los apuntes de la materia actual en Markdown",
      aliases: ["exportar", "markdown", "md", "descargar"],
      icon: "export",
      action: () => {
        exportNotesMarkdown(materiaActiva);
        setMensaje("Apuntes exportados en Markdown.");
      },
    },
    {
      id: "import-notes",
      label: "Importar apuntes",
      description: "Añadir apuntes desde un archivo .md",
      aliases: ["importar", "markdown", "md", "subir"],
      icon: "import",
      action: () => fileInputRef.current?.click(),
    },
  ], [materiaActiva, materias.length, theme]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
        return;
      }

      if (commandOpen || isTypingTarget(event.target)) return;

      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        agregarMateria();
      } else if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        agregarTema();
      } else if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        agregarApunte();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [commandOpen, materiaActiva, materias.length]);

  if (!materiaActiva) return null;

  const backgroundColor = theme === "dark"
    ? mixWithBlack(materiaActiva.color, 0.88)
    : mixWithWhite(materiaActiva.color, 0.91);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
          <div className="min-w-0">
            <p className="break-words text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">Vani</p>
            <p className="break-words text-xs text-slate-500 dark:text-slate-400">Tus materias y apuntes, en un solo lugar</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Abrir paleta de comandos (Ctrl/⌘ + K)"
            >
              <Command size={14} /> Comandos <span className="text-[10px] text-slate-400">Ctrl K</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark" ? "Claro" : "Oscuro"}
            </button>
            <button
              type="button"
              onClick={() => {
                exportNotesMarkdown(materiaActiva);
                setMensaje("Apuntes exportados en Markdown.");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Exportar únicamente los apuntes de esta materia"
            >
              <Download size={14} /> Exportar .md
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Añadir apuntes desde un archivo Markdown a esta materia"
            >
              <Upload size={14} /> Importar .md
            </button>
            <input ref={fileInputRef} type="file" accept="text/markdown,.md" className="hidden" onChange={handleImport} />
          </div>
        </div>

        <TabBar
          materias={materias}
          activaId={activaId}
          onSelect={setActivaId}
          onAdd={agregarMateria}
          onDelete={(id) => setMateriaAEliminar(materias.find((m) => m.id === id) || null)}
        />
      </header>

      <div className="flex min-h-[calc(100vh-106px)] flex-col transition-colors lg:flex-row" style={{ backgroundColor }}>
        <Sidebar
          materia={materiaActiva}
          onUpdate={actualizarMateriaActiva}
          onSaved={() => setMensaje("Cambios guardados.")}
        />
        <NotesGrid materia={materiaActiva} onUpdate={actualizarMateriaActiva} />
      </div>

      {mensaje && (
        <div className="fixed bottom-4 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 break-words rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900" role="status">
          {mensaje}
        </div>
      )}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        commands={commands}
      />

      <DeleteSubjectModal
        materia={materiaAEliminar}
        onCancel={() => setMateriaAEliminar(null)}
        onConfirm={confirmarEliminacion}
      />
    </div>
  );
}
