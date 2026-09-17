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
  const reminder = [...tasks]
    .filter((item) => item.status !== "DONE")
    .sort((a, b) => ({ HIGH: 3, MEDIUM: 2, LOW: 1 }[b.priority] - { HIGH: 3, MEDIUM: 2, LOW: 1 }[a.priority]))[0];
  const reminderProject = projects.find((project) => project.id === reminder?.projectId);
  const reminderOwner = team.find((member) => member.id === reminder?.assignedTo);
  const reminderTips = reminder ? taskTips(reminder.status, reminder.priority, reminderOwner?.name) : [];

  return <>
    <PageHeader eyebrow="Vista general" title={`Buenos días, ${user?.name ?? "equipo"}.`} description="Este es el pulso de ORIGIN hoy. Ideas, proyectos y próximos pasos en un solo lugar." />
    <section className="metric-grid">
      <Metric label="Ideas registradas" value={ideas.length} icon="ideas" note="Banco de oportunidades" />
      <Metric label="Proyectos activos" value={activeProjects} icon="projects" note={`${projects.length} en total`} />
      <Metric label="Tareas pendientes" value={pendingTasks} icon="tasks" note={`${tasks.filter((item) => item.status === "DONE").length} completadas`} />
      <Metric label="Miembros del equipo" value={team.length} icon="team" note="Equipo ORIGIN" />
    </section>
    <DashboardCharts tasks={tasks} projects={projects} />
    {reminder && <Link href={`/tasks#task-${reminder.id}`} className="task-reminder">
      <span className="reminder-icon">⏰</span>
      <div className="reminder-main"><span className="panel-kicker">RECORDATORIO PRIORITARIO</span><h2>{reminder.title}</h2><p>{reminder.description}</p><small>{reminderProject?.name ?? "Sin proyecto"} · Responsable: {reminderOwner?.name ?? "Sin asignar"}</small></div>
      <div className="reminder-tips"><strong>Cómo avanzar hoy</strong>{reminderTips.map((tip) => <span key={tip}>✓ {tip}</span>)}</div>
      <span className="reminder-action">Abrir tarea <Icon name="arrow" width={15}/></span>
    </Link>}
    <section className="dashboard-grid">
      <div className="panel dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">MOVIMIENTO</span><h2>Actividad reciente</h2></div><Link href="/ideas">Ver todo <Icon name="arrow" width={14}/></Link></div><div className="activity-list">{recent.map((item) => <Link href={item.href} key={`${item.icon}-${item.id}`} className="activity-row"><span className="activity-icon"><Icon name={item.icon} width={16}/></span><span className="activity-copy"><strong>{item.title}</strong><small>{item.meta}</small></span><time>{formatRelative(item.at)}</time></Link>)}</div></div>
      <div className="panel dashboard-panel"><div className="panel-heading"><div><span className="panel-kicker">EN FOCO</span><h2>Próximos objetivos</h2></div><Link href="/tasks">Ver tablero <Icon name="arrow" width={14}/></Link></div><div className="goal-list">{goals.map((task, index) => <div className="goal-row" key={task.id}><span className="goal-index">0{index + 1}</span><span className="goal-copy"><strong>{task.title}</strong><small>{projects.find((project) => project.id === task.projectId)?.name ?? "Sin proyecto"}</small></span><StatusBadge value={task.status}/></div>)}</div></div>
    </section>
    <section className="focus-banner"><div><span className="panel-kicker">SIGUIENTE PASO</span><h2>Las buenas ideas avanzan cuando el próximo paso es claro.</h2><p>Revisa lo que está en validación y decide qué merece convertirse en proyecto.</p></div><Link href="/ideas" className="button button-secondary">Revisar ideas <Icon name="arrow" width={16}/></Link></section>
  </>;
}

function taskTips(status: string, priority: string, owner?: string) {
  const tips = status === "REVIEW"
    ? ["Define un criterio de aprobación", "Pide una revisión de 15 minutos"]
    : status === "IN_PROGRESS"
      ? ["Divide el siguiente entregable", "Bloquea 45 minutos sin interrupciones"]
      : ["Aclara el primer resultado visible", "Empieza por una acción de menos de 20 minutos"];
  if (priority === "HIGH") tips.push(`Confirma el bloqueo principal con ${owner ?? "el equipo"}`);
  return tips;
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
