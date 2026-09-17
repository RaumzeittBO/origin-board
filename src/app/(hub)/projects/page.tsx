"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Field, Modal, PageHeader, StatusBadge, labelFor } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/context/workspace-context";
import type { Priority, Project, ProjectStatus, Task } from "@/types";

const statuses: ProjectStatus[] = ["PLANNING", "IN_PROGRESS", "TESTING", "PAUSED", "COMPLETED"];
const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH"];
const blank = { name: "", description: "", status: "PLANNING" as ProjectStatus, priority: "MEDIUM" as Priority, members: [] as string[], sourceIdeaId: undefined as string | undefined };
type ProjectCategory = "URGENT" | "FINISHING" | "IN_PROGRESS" | "NEW" | "INACTIVE";

const categoryInfo: Record<ProjectCategory, { title: string; description: string; icon: string }> = {
  URGENT: { title: "Urgentes por terminar", description: "Proyectos de alta prioridad que necesitan una decisión o entrega.", icon: "🚨" },
  FINISHING: { title: "Por terminar", description: "Están en pruebas o ya recorrieron la mayor parte del camino.", icon: "🏁" },
  IN_PROGRESS: { title: "En proceso", description: "Trabajo activo con entregables todavía abiertos.", icon: "⚙️" },
  NEW: { title: "Recién iniciados", description: "Proyectos en planificación o con sus primeros pasos.", icon: "🌱" },
  INACTIVE: { title: "Cerrados o pausados", description: "Proyectos fuera del flujo activo por ahora.", icon: "📦" },
};
const categoryOrder: ProjectCategory[] = ["URGENT", "FINISHING", "IN_PROGRESS", "NEW", "INACTIVE"];

function progressFor(project: Project, tasks: Task[]) {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  if (!projectTasks.length) return project.status === "COMPLETED" ? 100 : 0;
  const points: Record<Task["status"], number> = { TODO: 0, IN_PROGRESS: 35, REVIEW: 75, URGENT: 85, DONE: 100 };
  return Math.round(projectTasks.reduce((sum, task) => sum + points[task.status], 0) / projectTasks.length);
}

function categoryFor(project: Project, tasks: Task[]): ProjectCategory {
  if (["COMPLETED", "PAUSED"].includes(project.status)) return "INACTIVE";
  const progress = progressFor(project, tasks);
  if (project.priority === "HIGH" && progress < 100) return "URGENT";
  if (project.status === "TESTING" || progress >= 70) return "FINISHING";
  if (project.status === "IN_PROGRESS" || progress > 20) return "IN_PROGRESS";
  return "NEW";
}

export default function ProjectsPage() {
  const { projects, team, tasks, ideas, saveProject, deleteProject } = useWorkspace();
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"ALL" | "FAST_TRACK">("ALL");
  const [filter, setFilter] = useState<"ALL" | ProjectCategory>("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [form, setForm] = useState(blank);

  const grouped = useMemo(() => {
    const fastProjectIds = new Set(tasks.filter((task) => task.fastTrack && task.status !== "DONE").map((task) => task.projectId));
    const matching = projects.filter((project) => (viewMode === "ALL" || fastProjectIds.has(project.id)) && `${project.name} ${project.description}`.toLowerCase().includes(query.toLowerCase()));
    return categoryOrder.map((category) => ({
      category,
      projects: matching.filter((project) => categoryFor(project, tasks) === category),
    })).filter((group) => (filter === "ALL" || group.category === filter) && group.projects.length);
  }, [projects, tasks, query, filter, viewMode]);

  const fastTaskCount = tasks.filter((task) => task.fastTrack && task.status !== "DONE").length;

  const showForm = (project?: Project) => {
    setEditing(project ?? null);
    setForm(project ? { name: project.name, description: project.description, status: project.status, priority: project.priority, members: project.members, sourceIdeaId: project.sourceIdeaId } : blank);
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await saveProject(form, editing?.id); setOpen(false); };
  const remove = async (project: Project) => { if (window.confirm(`¿Eliminar “${project.name}” y todas sus tareas?`)) { await deleteProject(project.id); setDetail(null); } };
  const toggleMember = (id: string) => setForm({ ...form, members: form.members.includes(id) ? form.members.filter((member) => member !== id) : [...form.members, id] });

  return <>
    <PageHeader eyebrow="Construir con intención" title="Proyectos" description="Visualiza qué está comenzando, qué avanza y qué necesita cruzar la meta." action={<Button icon="plus" onClick={() => showForm()}>Nuevo proyecto</Button>} />
    <div className="project-tabs" role="tablist" aria-label="Vistas de proyectos">
      <button className={`project-tab ${viewMode === "ALL" ? "active" : ""}`} onClick={() => setViewMode("ALL")} role="tab" aria-selected={viewMode === "ALL"}>Todos los proyectos</button>
      <button className={`project-tab ${viewMode === "FAST_TRACK" ? "active" : ""}`} onClick={() => setViewMode("FAST_TRACK")} role="tab" aria-selected={viewMode === "FAST_TRACK"}>⚡ Terminar rápido / urgente <span className="project-fast-count">{fastTaskCount}</span></button>
    </div>
    <div className="toolbar">
      <div className="search-box"><Icon name="search" width={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar proyectos…" aria-label="Buscar proyectos"/></div>
      <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filtrar por categoría"><option value="ALL">Todas las categorías</option>{categoryOrder.map((category) => <option key={category} value={category}>{categoryInfo[category].icon} {categoryInfo[category].title}</option>)}</select>
    </div>

    {grouped.length ? <div className="project-groups">{grouped.map(({ category, projects: categoryProjects }) => <section key={category}>
      <div className="project-group-head"><div><h2>{categoryInfo[category].icon} {categoryInfo[category].title}</h2><p>{categoryInfo[category].description}</p></div><span className="project-group-count">{categoryProjects.length}</span></div>
      <div className="card-grid">{categoryProjects.map((project) => {
        const progress = progressFor(project, tasks);
        const fastTasks = tasks.filter((task) => task.projectId === project.id && task.fastTrack && task.status !== "DONE");
        return <article className="panel project-card" key={project.id} onClick={() => setDetail(project)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setDetail(project)}>
          <div className="project-card-top"><span className="project-symbol"><Icon name="projects" width={17}/></span><StatusBadge value={project.status}/></div>
          <h3>{project.name}</h3><p>{project.description}</p>
          <div className="project-progress"><div className="project-progress-row"><span>Progreso estimado</span><strong>{progress}%</strong></div><div className="project-progress-track"><i style={{ width: `${progress}%` }}/></div></div>
          {fastTasks.length > 0 && <div className="fast-task-list" aria-label="Tareas para terminar rápido">{fastTasks.slice(0, 3).map((task) => <span className="fast-task-chip" key={task.id}>⚡ {task.title}</span>)}</div>}
          <div className="project-card-foot"><div className="member-stack">{project.members.slice(0, 4).map((id) => { const member = team.find((item) => item.id === id); return <span className="member-mini" key={id} title={member?.name}>{member?.name.slice(0, 2).toUpperCase() ?? "?"}</span>; })}</div><StatusBadge value={project.priority}/></div>
        </article>;
      })}</div>
    </section>)}</div> : <section className="panel"><EmptyState title="No hay proyectos que mostrar" text="Crea un proyecto o ajusta los filtros."/></section>}

    {detail && <><button className="drawer-scrim" onClick={() => setDetail(null)} aria-label="Cerrar detalle"/><aside className="detail-drawer"><div className="detail-top"><div><StatusBadge value={detail.status}/><h2>{detail.name}</h2></div><button className="icon-button" onClick={() => setDetail(null)} aria-label="Cerrar"><Icon name="close" width={20}/></button></div><p className="detail-description">{detail.description}</p><div className="detail-section"><h3>Resumen</h3><div className="detail-facts"><span><small>Categoría</small>{categoryInfo[categoryFor(detail, tasks)].icon} {categoryInfo[categoryFor(detail, tasks)].title}</span><span><small>Progreso</small>{progressFor(detail, tasks)}%</span><span><small>Prioridad</small><StatusBadge value={detail.priority}/></span><span><small>Responsable</small>{detail.ownerName}</span><span><small>Miembros</small>{detail.members.length}</span><span><small>Tareas</small>{tasks.filter((task) => task.projectId === detail.id).length}</span>{detail.sourceIdeaId && <span><small>Idea de origen</small>{ideas.find((idea) => idea.id === detail.sourceIdeaId)?.title ?? detail.sourceIdeaId}</span>}</div></div><div className="detail-section"><h3>Equipo</h3><div className="member-stack">{detail.members.map((id) => { const member = team.find((item) => item.id === id); return <span className="member-mini" key={id} title={member?.name}>{member?.name.slice(0, 2).toUpperCase() ?? "?"}</span>; })}</div></div><div className="detail-actions"><Button variant="secondary" onClick={() => { setDetail(null); showForm(detail); }}>Editar proyecto</Button><Button variant="danger" onClick={() => remove(detail)}>Eliminar proyecto</Button></div></aside></>}

    <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar proyecto" : "Nuevo proyecto"} subtitle="Define el objetivo y reúne al equipo adecuado."><form className="form-grid" onSubmit={submit}><Field label="Nombre"><input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus/></Field><Field label="Estado"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>{statuses.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></Field><div className="field-wide"><Field label="Descripción"><textarea required maxLength={700} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></Field></div><Field label="Prioridad"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>{priorities.map((priority) => <option key={priority} value={priority}>{labelFor(priority)}</option>)}</select></Field><Field label="Idea de origen (opcional)"><select value={form.sourceIdeaId ?? ""} onChange={(event) => setForm({ ...form, sourceIdeaId: event.target.value || undefined })}><option value="">Sin idea vinculada</option>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select></Field><div className="field-wide"><Field label="Miembros"><div className="checkbox-grid">{team.map((member) => <label key={member.id} className="check-option"><input type="checkbox" checked={form.members.includes(member.id)} onChange={() => toggleMember(member.id)}/><span>{member.name}</span></label>)}</div></Field></div><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Guardar cambios" : "Crear proyecto"}</Button></div></form></Modal>
  </>;
}
