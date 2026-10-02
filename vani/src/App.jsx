import { exportNotesHtml } from "./storage/notesHtml";
import { useEffect, useMemo, useRef, useState } from "react";
import { Command, Download, Moon, Sun, Upload, Pin, PinOff, SlidersHorizontal } from "lucide-react";
import { Menu, NotebookPen, CalendarDays, BookOpen, Plus, Trash2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import NotesGrid from "./components/NotesGrid";
import DeleteSubjectModal from "./components/DeleteSubjectModal";
import CommandPalette from "./components/CommandPalette";
import AuthPanel from "./auth/AuthPanel.jsx";
import { useAuth } from './auth/AuthProvider';
import { useWorkspace } from './storage/useWorkspace';
import SyncStatus from './components/SyncStatus';
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
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6">Cargando sesión…</p>;
  return <Workspace key={user?.id || 'guest'} userId={user?.id} />;
}

function Workspace({ userId }) {
  const sync = useWorkspace(userId);
  const { materias, setMaterias } = sync;
  const [activaId, setActivaId] = useState("");
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("vani_theme") || "light");
  const [headerPinned, setHeaderPinned] = useState(() => localStorage.getItem("vani_header_pinned") !== "false");
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [section, setSection] = useState("notes");
  const [headerCompact, setHeaderCompact] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const fileInputRef = useRef(null);

  const materiaActiva = materias.find((m) => m.id === activaId) || materias[0];



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
      prev.map((materia) => materia.id === materiaActiva?.id ? { ...materia, [campo]: valor } : materia),
    );
  };

  const agregarMateria = () => {
    if (!sync.ready) return;
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
        if (!materiaActiva) return;
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



  const backgroundColor = theme === "dark"
    ? mixWithBlack(materiaActiva?.color, 0.88)
    : mixWithWhite(materiaActiva?.color, 0.91);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header onKeyDown={(e) => { if (e.key === "Escape") setHeaderCompact(true); }} className={`${headerPinned ? "sticky top-0" : "relative"} z-30 shadow-sm`}>
        <div className="workspace-toolbar">
          <button className="toolbar-icon" aria-label="Mostrar u ocultar menú" aria-expanded={navigationOpen} aria-controls="workspace-navigation" onClick={() => setNavigationOpen(!navigationOpen)}><Menu size={20} /></button><span className="workspace-brand">vani<span aria-hidden="true">.</span></span>
          <button type="button" onClick={() => setCommandOpen(true)} className="workspace-search" aria-label="Buscar o abrir comandos" title="Abrir comandos (Ctrl/⌘ + K)"><Command size={16} /><span>Buscar o hacer…</span><kbd>⌘ K</kbd></button>
          <div className="ml-auto flex items-center gap-1">
            <button className="toolbar-icon" aria-label="Fijar encabezado" aria-pressed={headerPinned} title="Fijar encabezado" onClick={() => { setHeaderPinned(!headerPinned); localStorage.setItem("vani_header_pinned", String(!headerPinned)); }}>{headerPinned ? <Pin size={17} /> : <PinOff size={17} />}</button>
            <button className="toolbar-icon" aria-label="Cambiar tema" title="Cambiar tema" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="toolbar-icon" aria-label="Herramientas" title="Herramientas" aria-expanded={!headerCompact} aria-controls="workspace-tools" onClick={() => setHeaderCompact(!headerCompact)}><SlidersHorizontal size={18} /></button>
            <AuthPanel />
          </div>
        </div>
        {!headerCompact && <div id="workspace-tools" className="workspace-tools" onKeyDown={(e) => { if(e.key === "Escape") setHeaderCompact(true); }}>
          <span className="text-xs text-slate-500">Archivos</span>
          <button className="vani-pill" onClick={() => { fileInputRef.current?.click(); setHeaderCompact(true); }}><Upload size={15} />Importar .md</button>
          <button className="vani-pill" onClick={() => { if(materiaActiva) exportNotesMarkdown(materiaActiva); setHeaderCompact(true); }}><Download size={15} />Exportar .md</button>
          <button className="vani-pill" onClick={() => { if(materiaActiva) exportNotesHtml(materiaActiva); setHeaderCompact(true); }}><Download size={15} />Exportar .html</button>
        </div>}
        <input ref={fileInputRef} type="file" accept="text/markdown,.md" className="hidden" onChange={handleImport} />
      </header>

      <div className="study-layout">
      {navigationOpen && <nav id="workspace-navigation" className="study-navigation" aria-label="Menú principal">
        <p className="nav-eyebrow">ESPACIO DE ESTUDIO</p>
        {[["notes", "Apuntes", NotebookPen], ["calendar", "Calendario", CalendarDays], ["rubric", "Encuadre", BookOpen]].map(([id,label,Icon]) => <button key={id} className={"study-nav-item " + (section === id ? "selected" : "")} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}><Icon size={18} />{label}</button>)}
        <div className="mt-8 flex items-center justify-between"><p className="nav-eyebrow">MATERIAS</p><button className="toolbar-icon" aria-label="Añadir materia" onClick={agregarMateria}><Plus size={16} /></button></div>
        {materias.map((m) => <div key={m.id} className="flex items-center gap-1"><button className={"study-nav-item min-w-0 flex-1 " + (materiaActiva?.id === m.id ? "subject-selected" : "")} aria-current={materiaActiva?.id === m.id ? "true" : undefined} onClick={() => setActivaId(m.id)}><span className="h-2 w-2 shrink-0 rounded-full" style={{backgroundColor:m.color}} /><span className="truncate">{m.nombre}</span></button><button className="nav-delete" aria-label={"Eliminar " + m.nombre} onClick={() => setMateriaAEliminar(m)}><Trash2 size={13} /></button></div>)}
        <div className="nav-bottom"><button className="study-nav-item" onClick={() => setCommandOpen(true)}><Command size={17} />Comandos</button><button className="study-nav-item" onClick={() => setHeaderCompact(!headerCompact)}><SlidersHorizontal size={17} />Herramientas</button></div>
      </nav>}
      <main className="study-content">
      <SyncStatus sync={sync} signedIn={Boolean(userId)} />
      {!sync.ready ? <p className="p-6">Cargando apuntes. Si no hay conexión, pulsa Reintentar.</p> : !materiaActiva ? <div className="p-6"><p>Aún no hay materias en esta cuenta. Importa los apuntes de este navegador o crea una materia.</p><button className="mt-3 rounded border p-2" onClick={agregarMateria}>Crear materia</button></div> : <div className="flex min-h-[calc(100vh-106px)] flex-col transition-colors lg:flex-row" style={{ backgroundColor }}>
        {section !== "notes" && <Sidebar section={section}
          materia={materiaActiva}
          onUpdate={actualizarMateriaActiva}
          onSaved={() => setMensaje("Cambios guardados.")}
        />}
        {section === "notes" && <NotesGrid key={materiaActiva.id} materia={materiaActiva} onUpdate={actualizarMateriaActiva} />}
      </div>}

      </main></div>
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
