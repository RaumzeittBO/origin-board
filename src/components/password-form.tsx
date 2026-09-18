"use client";
import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export function PasswordForm({ mandatory = false }: { mandatory?: boolean }) {
  const [current, setCurrent] = useState(""), [next, setNext] = useState(""), [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("");
    if (next !== confirm) { setMessage("Las contraseñas no coinciden."); return; }
    if (next.length < 10 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) { setMessage("La nueva contraseña necesita al menos 10 caracteres, letras y números."); return; }
    if (current === next) { setMessage("Elige una contraseña distinta de la temporal."); return; }
    const auth = getFirebaseAuth(), account = auth?.currentUser;
    if (!account?.email) { setMessage("Vuelve a iniciar sesión."); return; }
    setBusy(true);
    try {
      await reauthenticateWithCredential(account, EmailAuthProvider.credential(account.email, current));
      if (mandatory) {
        const response = await fetch("/api/account/password-complete", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await account.getIdToken(true)}` },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error ?? "No se pudo completar el acceso.");
        }
        await signInWithEmailAndPassword(auth!, account.email, next);
      } else await updatePassword(account, next);
      setCurrent(""); setNext(""); setConfirm("");
      setMessage("Contraseña actualizada correctamente.");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(code === "auth/invalid-credential" || code === "auth/wrong-password" ? "Contraseña actual incorrecta." : code === "auth/weak-password" ? "Nueva contraseña demasiado débil." : error instanceof Error && !code ? error.message : "No se pudo cambiar la contraseña. Inténtalo otra vez.");
    } finally { setBusy(false); }
  };
  return <form className="password-form" onSubmit={submit}>
    <label className="field"><span>Contraseña actual</span><input type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required/></label>
    <label className="field"><span>Nueva contraseña</span><input type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} required/></label>
    <label className="field"><span>Confirmar nueva contraseña</span><input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required/></label>
    {message && <p className="form-message" role="status">{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? "Actualizando…" : "Cambiar contraseña"}</button>
  </form>;
}
