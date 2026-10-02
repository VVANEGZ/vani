export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// An unchanged historical date remains valid; edits must be today or later.
export function validateAssignmentDate(value, previous = "", today = localDate()) {
  if (!value || value === previous) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today) return "Elige hoy o una fecha futura.";
  return "";
}

export function assessmentRatio(assignment) {
  if (!assignment.realizado || assignment.resultado === "" || assignment.resultado == null) return null;
  const result = Number(assignment.resultado);
  if (!Number.isFinite(result)) return null;
  if (!assignment.formato || assignment.formato === "reactivos") {
    const maximum = Number(assignment.reactivos);
    return Number.isInteger(result) && Number.isInteger(maximum) && maximum > 0 && result >= 0 && result <= maximum ? result / maximum : null;
  }
  if (assignment.formato === "calificacion") return result >= 1 && result <= 10 ? result / 10 : null;
  if (assignment.formato === "porcentaje") return result >= 0 && result <= 100 ? result / 100 : null;
  return null;
}

export function criterionFor(event, criteria) {
  if (event.criterioId) return criteria.find((c) => c.id === event.criterioId)?.id || null;
  const patterns = { examen: /examen/i, proyecto: /proyecto/i, tarea: /tarea/i };
  const matches = criteria.filter((c) => patterns[event.tipo]?.test(String(c.nombre).normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  return matches.length === 1 ? matches[0].id : null;
}

export function gradeSummary(events) {
  return events.reduce((summary, event) => {
    const weight = Math.max(0, Number(event.peso) || 0);
    const ratio = assessmentRatio(event);
    summary.assigned += weight;
    if (ratio !== null) { summary.earned += weight * ratio; summary.graded += weight; }
    return summary;
  }, { assigned: 0, earned: 0, graded: 0 });
}

export function validateWeight(value, eventId, events, maximum) {
  const number = Number(value);
  const others = gradeSummary(events.filter((event) => event.id !== eventId)).assigned;
  return value !== "" && (!Number.isFinite(number) || number < 0 || number + others > Number(maximum) + 0.000001)
    ? `Los pesos de este criterio no pueden superar ${maximum}% del curso.` : "";
}

export function validTopicName(value) {
  return value.length <= 80 && value.trim().split(/\s+/).filter(Boolean).length <= 10;
}
