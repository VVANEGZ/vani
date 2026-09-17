function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdownToHtml(text) {
  let html = escapeHtml(text);
  const codeTokens = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@VANI_CODE_${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });
  html = html
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  codeTokens.forEach((code, index) => {
    html = html.replace(`@@VANI_CODE_${index}@@`, code);
  });
  return html;
}

export function markdownToHtml(markdown = "") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let codeBlock = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inlineMarkdownToHtml(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listType || !listItems.length) return;
    output.push(`<${listType}>${listItems.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    if (codeBlock !== null) {
      if (/^```/.test(line)) {
        output.push(`<pre><code>${escapeHtml(codeBlock.replace(/\n$/, ""))}</code></pre>`);
        codeBlock = null;
      } else codeBlock += `${line}\n`;
      continue;
    }
    if (/^```/.test(line)) {
      flushParagraph(); flushList(); codeBlock = ""; continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered || ordered)[1]);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushParagraph(); flushList();
      output.push(`<blockquote><p>${inlineMarkdownToHtml(line.replace(/^\s*>\s?/, ""))}</p></blockquote>`);
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph(); flushList(); output.push("<hr>"); continue;
    }
    if (!line.trim()) {
      flushParagraph(); flushList(); continue;
    }
    paragraph.push(line.trim());
  }

  if (codeBlock !== null) output.push(`<pre><code>${escapeHtml(codeBlock)}</code></pre>`);
  flushParagraph(); flushList();
  return output.join("");
}

function nodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(nodeToMarkdown).join("");
  if (tag === "p") return `${children.trim()}\n\n`;
  if (/^h[1-3]$/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${children.trim()}\n\n`;
  if (tag === "strong" || tag === "b") return `**${children}**`;
  if (tag === "em" || tag === "i") return `*${children}*`;
  if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") return `\`${node.textContent || ""}\``;
  if (tag === "pre") return `\`\`\`\n${node.textContent || ""}\n\`\`\`\n\n`;
  if (tag === "a") return `[${children || node.getAttribute("href")}](${node.getAttribute("href") || ""})`;
  if (tag === "br") return "\n";
  if (tag === "hr") return "---\n\n";
  if (tag === "blockquote") return `${children.trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(node.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${Array.from(item.childNodes).map(nodeToMarkdown).join("").trim()}`)
      .join("\n");
    return `${items}\n\n`;
  }
  if (tag === "li") return children;
  return children;
}

export function htmlToMarkdown(html = "") {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  return Array.from(root?.childNodes || []).map(nodeToMarkdown).join("").replace(/\n{3,}/g, "\n\n").trim();
}

function safeFilename(value) {
  return (value || "apuntes")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "apuntes";
}

export function exportNotesMarkdown(materia) {
  const sections = (materia.temas || []).flatMap((tema) =>
    (tema.tarjetas || []).map((tarjeta) => {
      const meta = JSON.stringify({
        title: tarjeta.titulo || "Apunte",
        topic: tema.nombre || "Sin tema",
        color: tarjeta.color || materia.color || "#3B82F6",
      });
      const body = htmlToMarkdown(tarjeta.contenido || "");
      return `<!-- vani:note ${meta} -->\n\n${body}\n\n<!-- vani:end -->`;
    }),
  );
  const markdown = `# ${materia.nombre || "Materia"}\n\n${sections.join("\n\n")}`.trim() + "\n";
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(materia.nombre)}-apuntes.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importNotesMarkdown(file) {
  const markdown = await file.text();
  const notes = [];
  const pattern = /<!--\s*vani:note\s+({.*?})\s*-->([\s\S]*?)<!--\s*vani:end\s*-->/g;
  let match;
  while ((match = pattern.exec(markdown)) !== null) {
    let meta = { title: "Apunte importado", topic: "Importados", color: "#3B82F6" };
    try { meta = { ...meta, ...JSON.parse(match[1]) }; } catch { /* metadatos editados */ }
    notes.push({
      id: `card-${Date.now()}-${notes.length}`,
      titulo: meta.title || "Apunte importado",
      topic: meta.topic || "Importados",
      color: /^#[0-9A-F]{6}$/i.test(meta.color || "") ? meta.color : "#3B82F6",
      contenido: markdownToHtml(match[2].trim()),
    });
  }
  if (notes.length) return notes;
  return [{
    id: `card-${Date.now()}`,
    titulo: file.name.replace(/\.md$/i, "") || "Apunte importado",
    topic: "Importados",
    color: "#3B82F6",
    contenido: markdownToHtml(markdown.replace(/^#\s+.+\n+/, "").trim()),
  }];
}
