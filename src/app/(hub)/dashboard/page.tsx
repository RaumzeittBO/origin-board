"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/context/workspace-context";
import { DashboardCharts } from "./dashboard-charts";

export default function DashboardPage() {
  const { ideas, projects, tasks, team, user } = useWorkspace();
  const activeProjects = projects.filter((item) => !["COMPLETED", "PAUSED"].includes(item.status)).length;
  const pendingTasks = tasks.filter((item) => item.status !== "DONE").length;
  const recent = [
    ...ideas.map((item) => ({ id: item.id, title: item.title, meta: "Idea actualizada", at: item.updatedAt, icon: "ideas", href: "/ideas" })),
    ...projects.map((item) => ({ id: item.id, title: item.name, meta: "Proyecto actualizado", at: item.updatedAt, icon: "projects", href: `/projects?view=${item.id}` })),
    ...tasks.map((item) => ({ id: item.id, title: item.title, meta: "Tarea actualizada", at: item.updatedAt, icon: "tasks", href: "/tasks" })),
  ].sort((a,b) => b.at.localeCompare(a.at)).slice(0,5);
  const goals = tasks.filter((item) => item.status !== "DONE").slice(0,4);

  return <>
    <PageHeader eyebrow="Vista general" title={`Buenos días, ${user?.name ?? "equipo"}.`} description="Este es el pulso de ORIGIN hoy. Ideas, proyectos y próximos pasos en un solo lugar." />
    <section className="metric-grid">
      <Metric label="Ideas registradas" value={ideas.length} icon="ideas" note="Banco de oportunidades" />
      <Metric label="Proyectos activos" value={activeProjects} icon="projects" note={`${projects.length} en total`} />
      <Metric label="Tareas pendientes" value={pendingTasks} icon="tasks" note={`${tasks.filter((item) => item.status === "DONE").length} completadas`} />
      <Metric label="Miembros del equipo" value={team.length} icon="team" note="Equipo ORIGIN" />
    </section>
    <DashboardCharts tasks={tasks} projects={projects} />
    <section className="dashboard-grid">
      <div className="panel dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">MOVIMIENTO</span><h2>Actividad reciente</h2></div><Link href="/ideas">Ver todo <Icon name="arrow" width={14}/></Link></div><div className="activity-list">{recent.map((item) => <Link href={item.href} key={`${item.icon}-${item.id}`} className="activity-row"><span className="activity-icon"><Icon name={item.icon} width={16}/></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.meta}</small></span><time>{formatRelative(item.at)}</time></Link>)}</div></div>
      <div className="panel dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">EN FOCO</span><h2>Próximos objetivos</h2></div><Link href="/tasks">Ver tablero <Icon name="arrow" width={14}/></Link></div><div className="goal-list">{goals.map((task, index) => <div className="goal-row" key={task.id}><span className="goal-index">0{index + 1}</span><span className="goal-copy"><strong>{task.title}</strong><small>{projects.find((project) => project.id === task.projectId)?.name ?? "Sin proyecto"}</small></span><StatusBadge value={task.status}/></div>)}</div></div>
    </section>
    <section className="focus-banner"><div><span className="panel-kicker">SIGUIENTE PASO</span><h2>Las buenas ideas avanzan cuando el próximo paso es claro.</h2><p>Revisa lo que está en validación y decide qué merece convertirse en proyecto.</p></div><Link href="/ideas" className="button button-secondary">Revisar ideas <Icon name="arrow" width={16}/></Link></section>
  </>;
}

function Metric({ label, value, icon, note }: { label: string; value: number; icon: string; note: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><i><Icon name={icon} width={17}/></i></div><strong>{String(value).padStart(2,"0")}</strong><small>{note}</small></div>;
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 86_400_000) return "Hoy";
  const days = Math.floor(diff / 86_400_000);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
}
