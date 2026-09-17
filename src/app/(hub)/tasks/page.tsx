"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Field, Modal, PageHeader, StatusBadge, labelFor } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/context/workspace-context";
import type { Priority, Task, TaskStatus, TeamMember } from "@/types";

const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "URGENT", "DONE"];
const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH"];
const difficulty: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const blank = { title: "", description: "", projectId: "", assignedTo: "", status: "TODO" as TaskStatus, priority: "MEDIUM" as Priority, fastTrack: false };

function recommendOwner(task: Task, team: TeamMember[], tasks: Task[]) {
  const activeTeam = team.filter((member) => member.status === "ACTIVE");
  const currentOwner = activeTeam.find((member) => member.id === task.assignedTo);
  const workload = (memberId: string) => tasks.filter((item) => item.assignedTo === memberId && item.status !== "DONE").length;
  if (currentOwner && workload(currentOwner.id) <= 2) return { member: currentOwner, reason: "Ya conoce el contexto" };
  const member = [...activeTeam].sort((a, b) => workload(a.id) - workload(b.id))[0];
  return member ? { member, reason: `${workload(member.id)} tareas activas` } : null;
}

export default function TasksPage() {
  const { tasks, projects, team, user, saveTask, deleteTask, changeTaskStatus, voteTaskCompletion } = useWorkspace();
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [sort, setSort] = useState<"HARD_FIRST" | "EASY_FIRST">("HARD_FIRST");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(blank);

  const visible = useMemo(() => tasks
    .filter((task) => (projectFilter === "ALL" || task.projectId === projectFilter) && `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "HARD_FIRST" ? difficulty[b.priority] - difficulty[a.priority] : difficulty[a.priority] - difficulty[b.priority]), [tasks, projectFilter, query, sort]);

  const suggestions = useMemo(() => {
    const highPriorityWaiting = tasks.filter((task) => task.priority === "HIGH" && task.status === "TODO").length;
    const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const inReview = tasks.filter((task) => task.status === "REVIEW").length;
    return [
      highPriorityWaiting ? `Activa ${highPriorityWaiting} tarea${highPriorityWaiting > 1 ? "s" : ""} difícil${highPriorityWaiting > 1 ? "es" : ""} antes de abrir trabajo nuevo.` : "Las tareas críticas ya están en movimiento.",
      inProgress > 3 ? "Reduce el trabajo en progreso a un máximo de 3 tareas." : `Buen foco: ${inProgress} tarea${inProgress === 1 ? "" : "s"} en progreso.`,
      inReview ? `Desbloquea ${inReview} revisión hoy con una decisión corta del equipo.` : "No hay revisiones esperando respuesta.",
    ];
  }, [tasks]);

  const showForm = (task?: Task) => {
    setEditing(task ?? null);
    setForm(task ? { title: task.title, description: task.description, projectId: task.projectId, assignedTo: task.assignedTo, status: task.status, priority: task.priority, fastTrack: task.fastTrack ?? false } : { ...blank, projectId: projects[0]?.id ?? "", assignedTo: team[0]?.id ?? "" });
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await saveTask(form, editing?.id); setOpen(false); };
  const remove = async (task: Task) => { if (window.confirm(`¿Eliminar la tarea “${task.title}”?`)) await deleteTask(task.id); };
  const move = (task: Task, delta: number) => { const next = columns[columns.indexOf(task.status) + delta]; if (next) changeTaskStatus(task.id, next); };

  return <>
    <PageHeader eyebrow="Hacer visible el trabajo" title="Tareas" description="Prioriza lo difícil, reparte mejor el esfuerzo y celebra cada entrega." action={<Button icon="plus" onClick={() => showForm()} disabled={!projects.length}>Nueva tarea</Button>} />

    <section className="task-playbook" aria-labelledby="playbook-title">
      <div className="playbook-heading"><span>⚡</span><div><small>RADAR DE EFICIENCIA</small><h2 id="playbook-title">Tres movimientos para trabajar mejor</h2></div></div>
      <div className="suggestion-grid">{suggestions.map((suggestion, index) => <div className="suggestion" key={suggestion}><b>0{index + 1}</b><p>{suggestion}</p></div>)}</div>
    </section>

    <div className="toolbar">
      <div className="search-box"><Icon name="search" width={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tareas…" aria-label="Buscar tareas"/></div>
      <select className="filter-select" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} aria-label="Filtrar por proyecto"><option value="ALL">Todos los proyectos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      <select className="filter-select difficulty-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Ordenar por dificultad"><option value="HARD_FIRST">🔥 Más difíciles primero</option><option value="EASY_FIRST">🌱 Más fáciles primero</option></select>
    </div>

    {!projects.length ? <section className="panel"><EmptyState title="Primero crea un proyecto" text="Las tareas necesitan estar vinculadas a un proyecto."/></section> : <section className="kanban">{columns.map((status) => {
      const columnTasks = visible.filter((task) => task.status === status);
      return <div className={`kanban-column column-${status.toLowerCase()}`} key={status}>
        <div className="column-head"><span className="column-label">{labelFor(status)}</span><span>{columnTasks.length}</span></div>
        {columnTasks.map((task) => {
          const recommendation = recommendOwner(task, team, tasks);
          const votes = Object.values(task.completionVotes ?? {});
          const successVotes = votes.filter((vote) => vote === "SUCCESS").length;
          const needsWorkVotes = votes.length - successVotes;
          const currentVote = task.completionVotes?.[user?.id ?? ""];
          return <article id={`task-${task.id}`} className={`task-card difficulty-${task.priority.toLowerCase()}`} key={task.id}>
            <div className="task-card-top"><h3>{task.title}</h3><StatusBadge value={task.priority}/></div>
            <p>{task.description}</p>
            <span className="task-project">{projects.find((project) => project.id === task.projectId)?.name ?? "Proyecto eliminado"}</span>
            {task.status !== "URGENT" && <button className="fast-track-button" onClick={() => changeTaskStatus(task.id, "URGENT")}>⚡ Terminar urgente</button>}
            {recommendation && <div className="recommendation"><span>✨ Recomendado</span><strong>{recommendation.member.name}</strong><small>{recommendation.reason}</small></div>}
            <div className="task-card-foot"><div className="task-owner"><span>{team.find((member) => member.id === task.assignedTo)?.name.slice(0, 2).toUpperCase() ?? "?"}</span>{team.find((member) => member.id === task.assignedTo)?.name ?? "Sin asignar"}</div><div className="task-move"><button onClick={() => move(task, -1)} disabled={status === "TODO"} title="Mover atrás">←</button><button onClick={() => showForm(task)} title="Editar">···</button><button onClick={() => move(task, 1)} disabled={status === "DONE"} title="Mover adelante">→</button></div></div>
            <div className="task-vote" aria-label={`Votación de éxito de ${task.title}`}>
              <div><span>¿Terminó con éxito?</span><small>{votes.length ? `${successVotes} sí · ${needsWorkVotes} por ajustar` : "Sé el primero en votar"}</small></div>
              <div className="vote-actions"><button className={currentVote === "SUCCESS" ? "active success" : ""} onClick={() => voteTaskCompletion(task.id, "SUCCESS")} aria-pressed={currentVote === "SUCCESS"}>👍 Sí</button><button className={currentVote === "NEEDS_WORK" ? "active needs-work" : ""} onClick={() => voteTaskCompletion(task.id, "NEEDS_WORK")} aria-pressed={currentVote === "NEEDS_WORK"}>🛠 Ajustar</button></div>
            </div>
            <button className="text-button danger-text" onClick={() => remove(task)}>Eliminar</button>
          </article>;
        })}
      </div>;
    })}</section>}

    <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar tarea" : "Nueva tarea"} subtitle="Haz que el siguiente paso sea específico y accionable."><form className="form-grid" onSubmit={submit}><Field label="Título"><input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus/></Field><Field label="Proyecto"><select required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field><div className="field-wide"><Field label="Descripción"><textarea required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></Field></div><Field label="Asignada a"><select required value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>{team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field><Field label="Estado"><select value={form.status} onChange={(event) => { const status = event.target.value as TaskStatus; setForm({ ...form, status, fastTrack: status === "URGENT" }); }}>{columns.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></Field><Field label="Dificultad"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>{priorities.map((priority) => <option key={priority} value={priority}>{labelFor(priority)}</option>)}</select></Field><div className="field-wide"><label className={`lightning-option ${form.status === "URGENT" ? "active" : ""}`}><input type="checkbox" checked={form.status === "URGENT"} onChange={(event) => setForm({ ...form, status: event.target.checked ? "URGENT" : "TODO", fastTrack: event.target.checked })}/><span className="lightning-symbol">⚡</span><span><strong>Terminar urgente</strong><small>Mueve esta tarea a la columna de máxima atención.</small></span></label></div><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Guardar cambios" : "Crear tarea"}</Button></div></form></Modal>
  </>;
}
