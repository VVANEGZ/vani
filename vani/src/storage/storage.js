const STORAGE_KEY = "study_hub_data";
const DATA_VERSION = 2;

const INITIAL_SUBJECTS = [
  {
    id: "mat-1",
    nombre: "Materia 1",
    color: "#3B82F6",
    encuadre: "40% Exámenes\n30% Proyecto integrador\n30% Tareas y prácticas",
    fechas: [
      { id: "event-1", tipo: "examen", fecha: "", titulo: "20 Sep: Primer Parcial" },
      { id: "event-2", tipo: "proyecto", fecha: "", titulo: "15 Nov: Entrega Proyecto" },
    ],
    tarjetas: [{ id: "card-1", titulo: "Apuntes Generales", contenido: "" }],
  },
];

function normalizeEvent(evento, index) {
  return {
    id: evento.id || `event-${Date.now()}-${index}`,
    tipo: evento.tipo || "tarea",
    fecha: evento.fecha || "",
    titulo: evento.titulo || evento.texto || "",
  };
}

function normalizeSubject(materia) {
  return {
    id: materia.id || `mat-${Date.now()}`,
    nombre: materia.nombre || "Nueva Materia",
    color: materia.color || "#3B82F6",
    encuadre: materia.encuadre || "",
    fechas: (materia.fechas || []).map(normalizeEvent),
    tarjetas: materia.tarjetas || [],
  };
}

function normalizePayload(payload) {
  const materias = Array.isArray(payload) ? payload : payload?.materias;
  const safeSubjects = Array.isArray(materias) && materias.length
    ? materias.map(normalizeSubject)
    : INITIAL_SUBJECTS;

  return {
    version: DATA_VERSION,
    materias: safeSubjects,
  };
}

export function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return normalizePayload(null);
    return normalizePayload(JSON.parse(saved));
  } catch (error) {
    console.error("No se pudieron cargar los datos de Vani:", error);
    return normalizePayload(null);
  }
}

export function saveData(materias) {
  const payload = {
    version: DATA_VERSION,
    materias,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function exportBackup(materias) {
  const payload = {
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    materias,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `vani-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  return normalizePayload(parsed).materias;
}
