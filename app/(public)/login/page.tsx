"use client";
import LocalizedContent from "../../components/localization/client";


import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { createBrowserSupabase } from "../../../lib/supabase";
import { registrationDetails, validRegistrationAge } from "../../../lib/registration-details";
import { useLanguage } from "../../components/localization/provider";
import { useRouter, useSearchParams } from "next/navigation";

type Field = "full_name" | "age" | "email" | "password" | "eligibility" | "legal";
function LoginForm() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const requestedMode = searchParams.get("modo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">(requestedMode === "registro" ? "signup" : "login");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  function changeMode(next: "login" | "signup") {
    setMode(next); setMsg(""); setErrors({}); setShowPassword(false); setConfirmationEmail(null);
  }
  useEffect(() => {
    setMode(requestedMode === "registro" ? "signup" : "login");
    setMsg(""); setErrors({}); setShowPassword(false); setConfirmationEmail(null);
  }, [requestedMode]);

  function clearError(field: Field) { setErrors(previous => ({ ...previous, [field]: undefined })); }
  function fieldError(field: Field) {
    return errors[field] ? <LocalizedContent><p className="public-field-error" id={field + "-error"}>{errors[field]}</p></LocalizedContent> : null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg("");
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!email || !(event.currentTarget.elements.namedItem("email") as HTMLInputElement).validity.valid) nextErrors.email = "Escribe un correo válido, como nombre@ejemplo.com.";
    // This is validation copy, not a credential. Reviewed false positive for Secret Keyword.
    if (password.length < 8) nextErrors.password = "Escribe una contraseña de al menos 8 caracteres."; // pragma: allowlist secret
    if (mode === "signup") {
      if (fullName.trim().length < 2 || fullName.trim().length > 100) nextErrors.full_name = "Escribe tu nombre, entre 2 y 100 caracteres.";
      if (!validRegistrationAge(age)) nextErrors.age = "Escribe tu edad en años completos o deja el campo vacío.";
      if (!eligibilityConfirmed) nextErrors.eligibility = "Confirma que eres mayor de 18 años o que tienes autorización de tu madre, padre o tutor.";
      if (!legalAccepted) nextErrors.legal = "Acepta los Términos y confirma que leíste el Aviso de privacidad.";
    }
    setErrors(nextErrors);
    const fieldOrder: Field[] = mode === "signup" ? ["full_name", "age", "email", "password", "eligibility", "legal"] : ["email", "password"];
    const firstError = fieldOrder.find(field => nextErrors[field]);
    if (firstError) { event.currentTarget.querySelector<HTMLInputElement>("#" + firstError)?.focus(); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) return setMsg("No pudimos iniciar sesión. Revisa tus datos o restablece tu contraseña.");
        router.push("/dashboard"); router.refresh(); return;
      }
      const result = await supabase.auth.signUp({
        email, password,
        options: { data: {
          ...registrationDetails(fullName, age),
          locale,
          signup_terms_version: "2026-10-06",
          signup_terms_accepted_at: new Date().toISOString(),
          age_or_guardian_authorization_confirmed: true,
        } },
      });
      if (result.error) return setMsg("No pudimos crear tu cuenta. Revisa tus datos e intenta de nuevo. Si ya tienes cuenta, entra o restablece tu contraseña.");
      if (!result.data.session) {
        setPassword(""); setShowPassword(false); setConfirmationEmail(email); return;
      }
      router.push("/positions?diagnostic=1"); router.refresh();
    } catch {
      setMsg("No pudimos conectar. Intenta de nuevo en unos momentos.");
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!email) { setErrors({ email: "Escribe primero tu correo para enviar el enlace." }); document.getElementById("email")?.focus(); return; }
    setBusy(true); setMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setMsg(error ? "No pudimos enviar el correo de recuperación." : "Te enviamos un enlace para restablecer tu contraseña.");
    } catch { setMsg("No pudimos conectar. Intenta de nuevo en unos momentos."); }
    finally { setBusy(false); }
  }

  return <LocalizedContent><main className="wrap">
    <div className="card public-login">
      {confirmationEmail ? <section aria-labelledby="confirmation-title">
        <h1 id="confirmation-title">Revisa tu correo</h1>
        <p role="status">Revisa <b>{confirmationEmail}</b> y sigue las instrucciones de confirmación para continuar.</p>
        <p className="muted">Si no ves el mensaje, revisa la carpeta de spam. Después vuelve para iniciar sesión.</p>
        <button className="btn" type="button" onClick={() => changeMode("login")}>Volver a Entrar</button>
      </section> : <>
        <div className="public-login-tabs" role="tablist" aria-label="Acceso a Garciloga">
          {(["login", "signup"] as const).map(tab => <button key={tab} id={tab + "-tab"} type="button" role="tab"
            aria-selected={mode === tab} aria-controls="account-panel" tabIndex={mode === tab ? 0 : -1}
            className="btn secondary" disabled={busy} onClick={() => changeMode(tab)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "login" : event.key === "End" ? "signup" : mode === "login" ? "signup" : "login";
              changeMode(next);
              event.currentTarget.parentElement?.querySelector<HTMLButtonElement>("#" + next + "-tab")?.focus();
            }}>{tab === "login" ? "Entrar" : "Crear cuenta"}</button>)}
        </div>
        <div id="account-panel" role="tabpanel" aria-labelledby={mode + "-tab"}>
          <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
          <p className="muted">{mode === "login" ? "Continúa tu ruta de aprendizaje." : "Empieza gratis con el Nivel 1. Puedes cambiar de plan después."}</p>
          {mode === "signup" && <p className="public-field-help">Al entrar eliges tu puesto y haces el diagnóstico inicial. Es una recomendación: no bloquea ninguna ruta.</p>}
          <form onSubmit={submit} className="grid" noValidate aria-busy={busy}>
            {mode === "signup" && <>
              <div><label htmlFor="full_name"><b>Nombre</b></label>
                <input id="full_name" name="full_name" autoComplete="name" value={fullName} onChange={e => { setFullName(e.target.value); clearError("full_name"); }} required minLength={2} maxLength={100} disabled={busy} aria-invalid={!!errors.full_name} aria-describedby={errors.full_name ? "full_name-error" : undefined} />
                {fieldError("full_name")}
              </div>
              <div><label htmlFor="age"><b>Edad en años (opcional)</b></label>
                <input id="age" name="age" type="text" inputMode="numeric" value={age} onChange={e => { setAge(e.target.value); clearError("age"); }} disabled={busy} aria-invalid={!!errors.age} aria-describedby={errors.age ? "age-help age-error" : "age-help"} />
                <p id="age-help" className="public-field-help">Es un dato de registro. La autorización se confirma abajo.</p>{fieldError("age")}
              </div>
            </>}
            <div><label htmlFor="email"><b>Correo</b></label>
              <input id="email" name="email" placeholder="tu@email.com" type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); clearError("email"); }} required disabled={busy} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
              {fieldError("email")}
            </div>
            <div><label htmlFor="password"><b>Contraseña</b></label>
              <div className="public-password"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => { setPassword(e.target.value); clearError("password"); }} minLength={8} required disabled={busy} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-help password-error" : "password-help"} />
                <button className="btn secondary" type="button" disabled={busy} aria-controls="password" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ocultar" : "Mostrar"}</button>
              </div>
              <p id="password-help" className="public-field-help">{mode === "signup" ? (password.length >= 8 ? "Cumple: al menos 8 caracteres." : "Requisito: al menos 8 caracteres.") : "Usa la contraseña de tu cuenta."}</p>{fieldError("password")}
            </div>
            {mode === "signup" && <>
              <div><label className="public-checkbox" htmlFor="eligibility"><input id="eligibility" type="checkbox" checked={eligibilityConfirmed} onChange={e => { setEligibilityConfirmed(e.target.checked); clearError("eligibility"); }} required disabled={busy} aria-invalid={!!errors.eligibility} aria-describedby={errors.eligibility ? "eligibility-error" : undefined} />
                <span>Soy mayor de 18 años o cuento con autorización de mi madre, padre o tutor legal para usar Garciloga.</span></label>{fieldError("eligibility")}
              </div>
              <div><label className="public-checkbox" htmlFor="legal"><input id="legal" type="checkbox" checked={legalAccepted} onChange={e => { setLegalAccepted(e.target.checked); clearError("legal"); }} required disabled={busy} aria-invalid={!!errors.legal} aria-describedby={errors.legal ? "legal-error" : undefined} />
                <span>Acepto los <Link prefetch={false} href="/terms">Términos</Link> y confirmo que leí el <Link prefetch={false} href="/privacy">Aviso de privacidad</Link>.</span></label>{fieldError("legal")}
              </div>
            </>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}</button>
          </form>
          {msg && <p className="public-form-message" role="status" aria-live="polite">{msg}</p>}
          {mode === "login" && <button className="btn secondary public-forgot" type="button" disabled={busy} onClick={resetPassword}>Olvidé mi contraseña</button>}
          <p className="public-field-help">Al crear una cuenta aceptas los <Link prefetch={false} href="/terms">Términos</Link> y el <Link prefetch={false} href="/privacy">Aviso de privacidad</Link>.</p>
        </div>
      </>}
    </div>
  </main></LocalizedContent>;
}

export default function Login() {
  return <LocalizedContent><Suspense fallback={<main className="wrap"><p role="status">Preparando acceso…</p></main>}><LoginForm /></Suspense></LocalizedContent>;
}

