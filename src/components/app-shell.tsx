"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { Icon } from "./icons";
import { Logo } from "./logo";
import { PasswordForm } from "./password-form";

const navigation = [
  { href: "/dashboard", label: "Resumen", icon: "dashboard" },
  { href: "/ideas", label: "Ideas", icon: "ideas" },
  { href: "/projects", label: "Proyectos", icon: "projects" },
  { href: "/tasks", label: "Tareas", icon: "tasks" },
  { href: "/team", label: "Equipo", icon: "team" },
  { href: "/users", label: "Usuarios", icon: "team" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return <div className="page-loader"><div className="loader-mark">O</div><span>Preparando tu espacio…</span></div>;
  if (user.mustChangePassword) return <div className="password-gate"><div className="panel password-gate-card"><Logo/><span className="eyebrow">Primer acceso</span><h1>Configura tu contraseña</h1><p>Tu contraseña inicial es temporal. Establece una nueva para acceder al espacio de trabajo.</p><PasswordForm mandatory/><button className="login-back" onClick={() => void logout()}>Cerrar sesión</button></div></div>;

  const signOut = async () => { await logout(); router.push("/"); };
  return <div className="app-frame">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Link href="/dashboard" onClick={() => setMenuOpen(false)}><Logo /></Link><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><Icon name="close" width={21}/></button></div>
      <nav className="main-nav" aria-label="Navegación principal">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pathname.startsWith(item.href) ? "active" : ""}><Icon name={item.icon} width={19}/><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><div className="mode-note"><i></i><span>Firebase · conectado</span></div><Link href="/settings" className={pathname === "/settings" ? "active" : ""}><Icon name="settings" width={19}/><span>Configuración</span></Link><button onClick={signOut} className="user-card"><span className="avatar">{user.name.slice(0,2).toUpperCase()}</span><span><strong>{user.name}</strong><small>Miembro ORIGIN</small></span><Icon name="arrow" width={16}/></button></div>
    </aside>
    {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"/>}
    <div className="app-main"><div className="mobile-bar"><button onClick={() => setMenuOpen(true)} className="menu-button" aria-label="Abrir menú"><span></span><span></span><span></span></button><Logo /><span className="mobile-avatar">FA</span></div><main>{children}</main></div>
  </div>;
}
