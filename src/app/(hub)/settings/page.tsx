"use client";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "@/components/password-form";
import { useWorkspace } from "@/context/workspace-context";
export default function SettingsPage() {
  const { user } = useWorkspace();
  return <>
    <PageHeader eyebrow="Tu cuenta" title="Configuración" description="Administra tu identidad y seguridad en ORIGIN Hub." />
    <section className="settings-grid">
      <article className="panel settings-card"><h2>Sesión actual</h2><p>Cuenta activa con Firebase Authentication y datos compartidos en Cloud Firestore.</p><div className="setting-row"><div><strong>Nombre</strong><small>Identidad visible</small></div><span className="setting-value">{user?.name}</span></div><div className="setting-row"><div><strong>Correo</strong><small>Acceso a la plataforma</small></div><span className="setting-value">{user?.email}</span></div></article>
      <article className="panel settings-card"><h2>Seguridad</h2><p>Para cambiar tu contraseña, confirma primero la actual.</p><PasswordForm/></article>
    </section>
  </>;
}
