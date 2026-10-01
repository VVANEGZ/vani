function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

// Export only note formatting, never executable HTML or remote embedded content.
export function safeNoteHtml(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const allowed = new Set(["P", "H1", "H2", "H3", "STRONG", "B", "EM", "I", "S", "U", "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "CODE", "BR", "HR", "A", "SPAN"]);
  function render(node) {
    if (node.nodeType === 3) return escape(node.textContent);
    if (node.nodeType !== 1 || ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG"].includes(node.tagName)) return "";
    const body = Array.from(node.childNodes).map(render).join("");
    if (!allowed.has(node.tagName)) return body;
    const tag = node.tagName.toLowerCase();
    let attrs = "";
    const color = node.style.color;
    const background = node.style.backgroundColor;
    const styles = [color && `color:${color}`, background && `background-color:${background}`].filter(Boolean).join(";");
    if (styles) attrs += ` style="${escape(styles)}"`;
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      if (/^(https?:|mailto:)/i.test(href)) attrs += ` href="${escape(href)}" target="_blank" rel="noopener noreferrer"`;
    }
    return ["br", "hr"].includes(tag) ? `<${tag}>` : `<${tag}${attrs}>${body}</${tag}>`;
  }
  return Array.from(doc.body.childNodes).map(render).join("");
}

export function buildNotesHtml(materia) {
  const sections = (materia.temas || []).map((tema) => `<section><h2>${escape(tema.nombre)}</h2>${(tema.tarjetas || []).map((card) => {
    const color = /^#[0-9a-f]{6}$/i.test(card.color || materia.color || "") ? card.color || materia.color : "#3B82F6";
    return `<article style="border-top:4px solid ${color}"><h3 class="note-title" style="color:${color}">${escape(card.titulo)}</h3><div class="content">${safeNoteHtml(card.contenido)}</div></article>`;
  }).join("")}</section>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(materia.nombre)} — Apuntes</title><style>body{font:16px/1.7 system-ui,sans-serif;background:#f8fafc;color:#334155;max-width:900px;margin:auto;padding:24px}article{background:white;border-radius:12px;padding:24px;margin:20px 0;overflow-wrap:anywhere}h1,h2,h3{line-height:1.3}.note-title{margin-top:0}.content h1{font-size:1.8em}.content h2{font-size:1.5em}a{color:#2563eb}pre{white-space:pre-wrap;background:#f1f5f9;padding:16px;border-radius:8px}blockquote{border-left:3px solid #cbd5e1;margin-left:0;padding-left:16px}@media print{body{background:white;padding:0}article{break-inside:avoid;border:1px solid #ddd}}</style></head><body><h1>${escape(materia.nombre)}</h1>${sections}</body></html>`;
}

export function exportNotesHtml(materia) {
  const url = URL.createObjectURL(new Blob([buildNotesHtml(materia)], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(materia.nombre || "apuntes").replace(/[^a-zA-Z0-9áéíóúñ_-]/gi, "-")}-apuntes.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
