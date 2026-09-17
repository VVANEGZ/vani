const STORAGE_KEY = "study_hub_data";
const DATA_VERSION = 3;

function parseLegacyEncuadre(text = "") {
  const lines = String(text).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const criterios = [];

  lines.forEach((line, index) => {
    const match = line.match(/(\d+(?:[.,]\d+)?)\s*%\s*(.*)/);
    if (!match) return;
    const porcentaje = Math.min(100, Math.max(0, Number(match[1].replace(",", ".")) || 0));
    const nombre = (match[2] || `Criterio ${index + 1}`).trim();
    criterios.push({ id: `criterion-${Date.now()}-${index}`, nombre, porcentaje });
  });

  return criterios;
}

const INITIAL_SUBJECTS = [
  {
    id: "mat-1",
    nombre: "Materia 1",
    color: "#3B82F6",
    criterios: [
      { id: "criterion-1", nombre: "Exámenes", porcentaje: 40 },
      { id: "criterion-2", nombre: "Proyecto integrador", porcentaje: 30 },
      { id: "criterion-3", nombre: "Tareas y prácticas", porcentaje: 30 },
    ],
    fechas: [
      { id: "event-1", tipo: "examen", fecha: "", titulo: "20 Sep: Primer Parcial" },
      { id: "event-2", tipo: "proyecto", fecha: "", titulo: "15 Nov: Entrega Proyecto" },
    ],
    temas: [
      {
        id: "topic-general",
        nombre: "General",
        tarjetas: [{ id: "card-1", titulo: "Apuntes Generales", contenido: "", color: "#3B82F6" }],
      },
    ],
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

function normalizeCriteria(materia) {
  if (Array.isArray(materia.criterios)) {
    return materia.criterios.map((criterio, index) => ({
      id: criterio.id || `criterion-${Date.now()}-${index}`,
      nombre: criterio.nombre || `Criterio ${index + 1}`,
      porcentaje: Math.min(100, Math.max(0, Number(criterio.porcentaje) || 0)),
    }));
  }
  return parseLegacyEncuadre(materia.encuadre || "");
}

function normalizeCards(cards, fallbackColor) {
  return (Array.isArray(cards) ? cards : []).map((card, index) => ({
    id: card.id || `card-${Date.now()}-${index}`,
    titulo: card.titulo || "Apunte",
    contenido: card.contenido || "",
    color: /^#[0-9A-F]{6}$/i.test(card.color || "") ? card.color : fallbackColor,
  }));
}

function normalizeTopics(materia) {
  const fallbackColor = materia.color || "#3B82F6";

  if (Array.isArray(materia.temas) && materia.temas.length) {
    return materia.temas.map((tema, index) => ({
      id: tema.id || `topic-${Date.now()}-${index}`,
      nombre: tema.nombre || `Tema ${index + 1}`,
      tarjetas: normalizeCards(tema.tarjetas, fallbackColor),
    }));
  }

  const tarjetas = normalizeCards(materia.tarjetas, fallbackColor);
  return [{ id: `topic-general-${materia.id || Date.now()}`, nombre: "Sin tema", tarjetas }];
}

function normalizeSubject(materia) {
  return {
    id: materia.id || `mat-${Date.now()}`,
    nombre: materia.nombre || "Nueva Materia",
    color: materia.color || "#3B82F6",
    criterios: normalizeCriteria(materia),
    fechas: (materia.fechas || []).map(normalizeEvent),
    temas: normalizeTopics(materia),
  };
}

function normalizePayload(payload) {
  const materias = Array.isArray(payload) ? payload : payload?.materias;
  const safeSubjects = Array.isArray(materias) && materias.length
    ? materias.map(normalizeSubject)
    : INITIAL_SUBJECTS;

  return { version: DATA_VERSION, materias: safeSubjects };
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DATA_VERSION, materias }));
}
