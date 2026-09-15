"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/context/workspace-context";

export default function Home() {
  const router = useRouter();
  const { user, loginDemo, loading } = useWorkspace();
  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, user, router]);
  const enter = () => { loginDemo(); router.push("/dashboard"); };

  return <main className="login-page">
    <div className="login-grid">
      <section className="login-story">
        <Logo />
        <div className="story-copy"><span className="eyebrow">Espacio de trabajo del equipo</span><h1>Todo gran producto<br/>empieza en algún lugar.</h1><p>Centraliza las ideas, organiza el trabajo y convierte una primera intuición en el próximo producto de ORIGIN.</p></div>
        <div className="growth-visual" aria-hidden="true"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="origin-core">ORIGIN</div><span className="node node-a"></span><span className="node node-b"></span><span className="node node-c"></span></div>
        <small className="login-footer">Pensar · Construir · Crecer</small>
      </section>
      <section className="login-panel">
        <div className="login-card"><span className="login-index">01 / ACCESO</span><h2>Bienvenido a<br/>ORIGIN Hub</h2><p>Tu espacio central para construir juntos.</p><div className="demo-profile"><span className="demo-avatar">FA</span><div><strong>Fabrizio</strong><small>Founder / Product & Technology</small></div><i></i></div><button className="enter-button" onClick={enter} disabled={loading}><span>Entrar en modo demo</span><Icon name="arrow" width={18}/></button><div className="local-message"><span></span><p><strong>Entorno local activo</strong>Los datos se guardan únicamente en este navegador.</p></div></div>
      </section>
    </div>
  </main>;
}
