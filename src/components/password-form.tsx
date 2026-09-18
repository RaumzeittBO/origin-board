"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export function PasswordForm({ mandatory = false }: { mandatory?: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordAlreadyUpdated, setPasswordAlreadyUpdated] = useState(false);

  const completeActivation = async (account: User) => {
    const token = await account.getIdToken(true);
    const response = await fetch("/api/auth/complete-first-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(result.error || `Error del servidor (${response.status})`);
    }
  };

  const handleOnlyActivation = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage("");

    const auth = getFirebaseAuth();
    const account = auth?.currentUser;
    if (!account) {
      setMessage("No se detectó una sesión activa. Vuelve a iniciar sesión.");
      return;
    }

    setBusy(true);
    try {
      await completeActivation(account);
      setPasswordAlreadyUpdated(false);
      setMessage("Activación completada con éxito. Redirigiendo…");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la activación. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (passwordAlreadyUpdated) {
      await handleOnlyActivation();
      return;
    }

    const auth = getFirebaseAuth();
    const account = auth?.currentUser;
    if (!account?.email) {
      setMessage("Vuelve a iniciar sesión.");
      return;
    }

    setBusy(true);
    let stage: "validation" | "reauth" | "updatePassword" | "completeActivation" = "validation";

    try {
      if (!current) {
        setMessage("Ingresa tu contraseña actual.");
        return;
      }
      if (!next || !confirm) {
        setMessage("Ingresa la nueva contraseña y confírmala.");
        return;
      }
      if (next !== confirm) {
        setMessage("Las contraseñas no coinciden.");
        return;
      }
      if (next.length < 6) {
        setMessage("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (current === next) {
        setMessage("La nueva contraseña debe ser diferente de la contraseña actual.");
        return;
      }

      stage = "reauth";
      await reauthenticateWithCredential(account, EmailAuthProvider.credential(account.email, current));

      stage = "updatePassword";
      await updatePassword(account, next);
      setPasswordAlreadyUpdated(true);

      if (mandatory) {
        stage = "completeActivation";
        await completeActivation(account);
        setPasswordAlreadyUpdated(false);
      }

      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage("Contraseña actualizada correctamente.");
    } catch (error) {
      const code = (error as { code?: string }).code;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (stage === "completeActivation" || passwordAlreadyUpdated) {
        setMessage(
          "Tu contraseña ya fue actualizada, pero no pudimos finalizar la configuración de tu cuenta. Intenta completar la activación nuevamente."
        );
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setMessage("La contraseña actual no es correcta.");
      } else if (code === "auth/weak-password") {
        setMessage("La nueva contraseña no cumple los requisitos de seguridad.");
      } else if (code === "auth/requires-recent-login") {
        setMessage("Por seguridad debes volver a iniciar sesión.");
      } else if (code === "auth/too-many-requests") {
        setMessage("Se realizaron demasiados intentos. Espera unos minutos e inténtalo nuevamente.");
      } else if (code === "auth/network-request-failed" || (error instanceof TypeError && errorMsg.includes("fetch"))) {
        setMessage("No pudimos conectar con el servicio. Verifica tu conexión.");
      } else if (error instanceof Error && !code && error.message) {
        setMessage(error.message);
      } else {
        setMessage("No se pudo cambiar la contraseña. Inténtalo otra vez.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="password-form" onSubmit={submit}>
      {!passwordAlreadyUpdated ? (
        <>
          <label className="field">
            <span>Contraseña actual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Confirmar nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </label>
        </>
      ) : (
        <div style={{ margin: "12px 0", fontSize: "0.95rem", lineHeight: "1.4" }}>
          <p>
            Tu contraseña ya fue actualizada en el sistema de autenticación. Haz clic a continuación para finalizar la activación de tu espacio de trabajo.
          </p>
        </div>
      )}

      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}

      <button className="button button-primary" type="submit" disabled={busy}>
        {busy
          ? "Procesando…"
          : passwordAlreadyUpdated
          ? "Completar activación"
          : "Cambiar contraseña"}
      </button>

      {mandatory && (
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          {passwordAlreadyUpdated ? (
            <button
              type="button"
              className="login-back"
              style={{ fontSize: "0.82rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => {
                setPasswordAlreadyUpdated(false);
                setMessage("");
              }}
            >
              ¿Prefieres cambiar tu contraseña otra vez?
            </button>
          ) : (
            <button
              type="button"
              className="login-back"
              style={{ fontSize: "0.82rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
              onClick={handleOnlyActivation}
            >
              ¿Ya actualizaste tu contraseña? Completar activación de cuenta
            </button>
          )}
        </div>
      )}
    </form>
  );
}
