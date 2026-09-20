export function normalizePercentageDraft(value) {
  return value.replace(/^0+(?=\d)/, "");
}

export function criteriaTotal(criterios) {
  return criterios.reduce((sum, criterio) => sum + Math.round((Number(criterio.porcentaje) || 0) * 100), 0) / 100;
}

export function validatePercentage(criterios, id, draft) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(draft)) return "Escribe un porcentaje válido con hasta dos decimales.";
  const percentage = Number(draft.replace(",", "."));
  if (!Number.isFinite(percentage) || percentage > 100) return "El porcentaje debe estar entre 0 y 100%.";
  const otherTotal = criteriaTotal(criterios.filter((criterio) => criterio.id !== id));
  if (Math.round(otherTotal * 100) + Math.round(percentage * 100) > 10000) {
    return "El total del encuadre no puede superar el 100%.";
  }
  return "";
}
