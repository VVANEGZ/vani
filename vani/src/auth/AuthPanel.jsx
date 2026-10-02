import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, UserPlus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

function friendlyError(message) {
  if (!message) return "Ocurrió un error inesperado.";
  if (message.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (message.includes("User already registered")) return "Ese correo ya tiene una cuenta.";
  if (message.includes("Password should be")) return "La contraseña no cumple con los requisitos mínimos.";
  return message;
}

export default function AuthPanel() {
  const { user, loading } = useAuth();
  const dialogRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || user) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const scrollY = window.scrollY;
    const previous = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow };
    const htmlOverflow = document.documentElement.style.overflow;
    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden" });
    document.documentElement.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      Object.assign(document.body.style, previous);
      document.documentElement.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollY);
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [open, user]);

  const resetFeedback = () => {
    setMessage("");
    setError("");
  };

  const openPanel = (nextMode = "login") => {
    setMode(nextMode);
    resetFeedback();
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!email.trim() || !password) {
      setError("Completa correo y contraseña.");
      return;
    }

    if (mode === "register" && password.length < 8) {
      setError("Usa una contraseña de al menos 8 caracteres.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setMessage("Cuenta creada. La sesión está iniciada.");
          setOpen(false);
        } else {
          setMessage("Cuenta creada. Revisa el correo para confirmar la cuenta.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        setOpen(false);
      }
    } catch (authError) {
      setError(friendlyError(authError.message));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    resetFeedback();
    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(friendlyError(signOutError.message));
    setBusy(false);
  };

  if (!supabase) return <span className="text-xs text-slate-500">Modo local</span>;

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-400">
            Sesión...
          </div>
        ) : user ? (
          <div className="flex max-w-[80vw] items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="min-w-0">
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Sesión iniciada</p>
              <p className="max-w-44 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        ) : (
          <><button
            type="button"
            onClick={() => openPanel("login")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <LogIn size={14} /> Iniciar sesión
          </button><button type="button" className="vani-pill" onClick={() => openPanel("register")}><UserPlus size={14} /> Crear cuenta</button></>
        )}
      </div>

      {open && !user && createPortal(
        <dialog ref={dialogRef} className="auth-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) setOpen(false); }} aria-label={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}>
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Vani</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {mode === "register" ? "Crea una cuenta con correo y contraseña. Si se solicita confirmación, revisa el correo para completar el registro." : "Accede a las materias y apuntes desde cualquier dispositivo. Si aún no tienes cuenta, elige Crear cuenta."}
                </p>
              </div>
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                disabled={busy}
                onClick={() => { setMode("login"); resetFeedback(); }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); resetFeedback(); }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "register" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Correo</span>
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Contraseña</span>
                <input
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Contraseña"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Mostrar contraseña</label>
              {mode === "register" && <p className="text-xs text-slate-500">Usa al menos 8 caracteres. Los apuntes locales seguirán disponibles; podrás importarlos a la cuenta al entrar.</p>}
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
              {message && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
                {busy ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            </form>
          </div>
        </dialog>, document.body
      )}
    </>
  );
}
