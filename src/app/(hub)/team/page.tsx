"use client";

import { PageHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/context/workspace-context";

export default function TeamPage() {
  const { team, projects, tasks } = useWorkspace();
  return <>
    <PageHeader eyebrow="Crecer en equipo" title="Equipo" description="Las personas que transforman las ideas de ORIGIN en productos reales." />
    <section className="team-grid">{team.map((member)=><article className="panel team-card" key={member.id}><div className="team-avatar">{member.name.slice(0,2).toUpperCase()}<i></i></div><h3>{member.name}</h3><p>{member.area}</p><StatusBadge value={member.status}/><div className="detail-section"><div className="detail-facts"><span><small>Proyectos</small>{projects.filter((project)=>project.members.includes(member.id)).length}</span><span><small>Tareas</small>{tasks.filter((task)=>task.assignedTo===member.id).length}</span></div></div></article>)}</section>
  </>;
}
