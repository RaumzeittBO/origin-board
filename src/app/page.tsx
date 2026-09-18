"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { getFirebaseAuth } from "@/lib/firebase";
import { useWorkspace } from "@/context/workspace-context";

export default function Home() {
  const router = useRouter();
  const { user, login, loading, authError } = useWorkspace();
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true), [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false), [message, setMessage] = useState("");
  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, user, router]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (reset) {
        const auth = getFirebaseAuth(); if (!auth) throw new Error("Firebase no está configurado.");
        await sendPasswordResetEmail(auth, email.trim());
        setMessage("Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña.");
      } else await login(email, password, remember);
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(reset ? "Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña." : code === "auth/invalid-credential" ? "Correo o contraseña incorrectos." : "No fue posible iniciar sesión. Comprueba tu conexión e inténtalo otra vez.");
    } finally { setBusy(false); }
  };
  return <main className="login-page">
    <div className="login-grid">
      <section className="login-story">
        <Logo />
        <div className="story-copy"><span className="eyebrow">Espacio privado del equipo</span><h1>Todo gran producto<br/>empieza en algún lugar.</h1><p>Centraliza las ideas, organiza el trabajo y convierte una primera intuición en el próximo producto de ORIGIN.</p></div>
        <div className="growth-visual" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="origin-core">ORIGIN</div><span className="node node-a"></span><span className="node node-b"></span><span className="node node-c"></span></div>
        <small className="login-footer">Pensar · Construir · Crecer</small>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <span className="login-index">01 / ACCESO PRIVADO</span><h2>{reset ? "Recuperar acceso" : <>Bienvenido a<br/>ORIGIN Hub</>}</h2>
          <p>{reset ? "Te enviaremos un enlace para establecer una nueva contraseña." : "Tu espacio central para construir juntos."}</p>
          <label className="field"><span>Correo electrónico</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com"/></label>
          {!reset && <label className="field"><span>Contraseña</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña"/></label>}
          {!reset && <div className="login-options"><label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)}/> Recordarme</label><button type="button" onClick={() => { setReset(true); setMessage(""); }}>¿Olvidaste tu contraseña?</button></div>}
          {(message || authError) && <p className="form-message" role="status">{message || authError}</p>}
          <button className="enter-button" type="submit" disabled={busy || loading}><span>{busy ? "Un momento…" : reset ? "ENVIAR ENLACE" : "INICIAR SESIÓN"}</span><Icon name="arrow" width={18}/></button>
          {reset && <button className="login-back" type="button" onClick={() => { setReset(false); setMessage(""); }}>Volver a iniciar sesión</button>}
          <div className="local-message"><span></span><p><strong>Acceso solo para integrantes</strong>Las cuentas son creadas por miembros activos de ORIGIN.</p></div>
        </form>
      </section>
    </div>
  </main>;
}
