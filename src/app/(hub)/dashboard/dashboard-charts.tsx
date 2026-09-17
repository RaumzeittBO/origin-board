import type { Project, ProjectStatus, Task, TaskStatus } from "@/types";

const taskStages: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "Por hacer", color: "#b7c8dc" },
  { status: "IN_PROGRESS", label: "En progreso", color: "#427cb5" },
  { status: "REVIEW", label: "En revisión", color: "#80a8cc" },
  { status: "DONE", label: "Hechas", color: "#3d8b74" },
];

const projectStages: { status: ProjectStatus; label: string; color: string }[] = [
  { status: "PLANNING", label: "Planificación", color: "#a6bad0" },
  { status: "IN_PROGRESS", label: "En progreso", color: "#376eaa" },
  { status: "TESTING", label: "Pruebas", color: "#719bc1" },
  { status: "PAUSED", label: "Pausados", color: "#c3a87a" },
  { status: "COMPLETED", label: "Completados", color: "#3d8b74" },
];

function taskRing(tasks: Task[]) {
  if (!tasks.length) return "#e9eef3 0% 100%";
  let offset = 0;
  return taskStages.map(({ status, color }) => {
    const start = offset;
    offset += (tasks.filter((task) => task.status === status).length / tasks.length) * 100;
    return `${color} ${start}% ${offset}%`;
  }).join(", ");
}

export function DashboardCharts({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const maxProjects = Math.max(1, ...projectStages.map(({ status }) => projects.filter((project) => project.status === status).length));

  return <section className="insight-section" aria-labelledby="insight-title">
    <div className="insight-intro"><div><span className="panel-kicker">EN PERSPECTIVA</span><h2 id="insight-title">Estado del trabajo</h2></div><p>Una lectura rápida de cómo avanzan las tareas y los proyectos.</p></div>
    <div className="insight-grid">
      <article className="panel insight-card">
        <div className="insight-card-header"><div><h3>Tareas por estado</h3><p>Distribución actual del tablero</p></div><span className="insight-total">{tasks.length} en total</span></div>
        <div className="task-chart-layout">
          <div className="task-donut" style={{ background: `conic-gradient(${taskRing(tasks)})` }} role="img" aria-label={`Tareas completadas: ${completed} de ${tasks.length}, ${completion} por ciento`}><div className="task-donut-center"><strong>{completion}%</strong><span>completado</span></div></div>
          <div className="chart-legend">{taskStages.map(({ status, label, color }) => <div className="legend-row" key={status}><span className="legend-dot" style={{ backgroundColor: color }}/><span>{label}</span><strong>{tasks.filter((task) => task.status === status).length}</strong></div>)}</div>
        </div>
        {!tasks.length && <p className="chart-empty">Crea tareas para ver su distribución.</p>}
      </article>
      <article className="panel insight-card">
        <div className="insight-card-header"><div><h3>Proyectos por etapa</h3><p>En qué momento está cada proyecto</p></div><span className="insight-total">{projects.length} en total</span></div>
        <div className="project-chart" role="img" aria-label={`Proyectos por etapa: ${projectStages.map(({ status, label }) => `${label} ${projects.filter((project) => project.status === status).length}`).join(", ")}`}>
          {projectStages.map(({ status, label, color }) => {
            const count = projects.filter((project) => project.status === status).length;
            return <div className="project-chart-row" key={status}><span className="project-chart-label">{label}</span><div className="project-chart-track"><div className="project-chart-fill" style={{ width: `${(count / maxProjects) * 100}%`, backgroundColor: color }}/></div><strong>{count}</strong></div>;
          })}
        </div>
        {!projects.length && <p className="chart-empty">Crea proyectos para ver su avance.</p>}
      </article>
    </div>
  </section>;
}
