import { useEffect, useId, useRef, useState } from "react";

export default function ColorPicker({ value, onChange, label }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(false);
  const panel = useRef(null);
  const id = useId();
  useEffect(() => {
    const closeOutside = (event) => {
      if (panel.current?.open && !panel.current.contains(event.target)) {
        panel.current.open = false;
        setDraft(null);
        setError(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside, true);
    };
  }, []);
  const apply = () => {
    let hex = (draft ?? value).trim().replace(/^#/, "");
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) { setError(true); return; }
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    onChange(`#${hex.toUpperCase()}`);
    setDraft(null);
    setError(false);
    panel.current.open = false;
    panel.current.querySelector("summary").focus();
  };
  return <details name="workspace-color-picker" ref={panel} className="hex-picker" onToggle={(e) => { if (!e.currentTarget.open) { setDraft(null); setError(false); } }} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); panel.current.open = false; panel.current.querySelector("summary").focus(); } }}>
    <summary aria-label={label} title={label} style={{ backgroundColor: value }} />
    <div className="hex-picker-panel">
      <p className="text-xs font-medium">{label}</p>
      <input type="color" aria-label={`Selector visual: ${label}`} value={value} onChange={(e) => { onChange(e.target.value); setDraft(null); setError(false); }} className="mt-3 h-9 w-full cursor-pointer" />
      <label htmlFor={`${id}-hex`} className="mt-3 block text-xs">Hexadecimal</label>
      <input id={`${id}-hex`} aria-label={`Hexadecimal: ${label}`} aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined} value={draft ?? value.toUpperCase()} placeholder="#647C68" spellCheck={false} autoComplete="off" className="hex-picker-input" onChange={(e) => { setDraft(e.target.value); setError(false); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); apply(); } }} />
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-300">Usa 3 o 6 dígitos, por ejemplo #ABC o #647C68.</p>}
      <button type="button" onClick={apply} className="assignment-save mt-3 justify-center">Aplicar color</button>
    </div>
  </details>;
}

