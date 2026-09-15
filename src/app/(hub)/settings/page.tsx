"use client";

import { PageHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/context/workspace-context";

export default function SettingsPage() {
  const { mode, user } = useWorkspace();
  return <>
    <PageHeader eyebrow="Preferencias del espacio" title="Configuración" description="Consulta el estado del entorno y la identidad activa." />
    <section className="settings-grid">
      <article className="panel settings-card"><h2>Entorno y persistencia</h2><p>ORIGIN Hub selecciona automáticamente el repositorio según la configuración disponible.</p><div className="setting-row"><div><strong>Modo actual</strong><small>Fuente de datos activa</small></div><StatusBadge value={mode === "local" ? "ACTIVE" : "APPROVED"}/></div><div className="setting-row"><div><strong>Persistencia</strong><small>Ubicación de los datos</small></div><span className="setting-value">{mode === "local" ? "Este navegador (localStorage)" : "Cloud Firestore"}</span></div><div className="setting-row"><div><strong>Firebase</strong><small>Configuración por variables de entorno</small></div><span className="setting-value">{mode === "local" ? "Pendiente de conectar" : "Configurado"}</span></div></article>
      <article className="panel settings-card"><h2>Sesión actual</h2><p>La autenticación demo se reemplazará por Firebase Authentication en la siguiente etapa.</p><div className="setting-row"><div><strong>Usuario</strong><small>Nombre visible</small></div><span className="setting-value">{user?.name}</span></div><div className="setting-row"><div><strong>Rol</strong><small>Rol de la sesión local</small></div><span className="setting-value">{user?.role}</span></div><div className="setting-row"><div><strong>Autenticación</strong><small>Proveedor activo</small></div><span className="setting-value">Modo demo, sin contraseña</span></div></article>
    </section>
  </>;
}
