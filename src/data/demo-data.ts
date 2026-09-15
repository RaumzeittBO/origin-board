import type { LocalUser, WorkspaceData } from "@/types";

const now = new Date().toISOString();

export const demoUser: LocalUser = {
  id: "user-fabrizio",
  name: "Fabrizio",
  role: "Founder / Product & Technology",
};

export const demoData: WorkspaceData = {
  ideas: [
    {
      id: "idea-saas-small-business",
      title: "Plataforma SaaS para pequeños negocios",
      description: "Un espacio simple para centralizar operaciones, clientes y métricas de pequeños equipos.",
      category: "SaaS",
      status: "VALIDATING",
      authorId: demoUser.id,
      authorName: demoUser.name,
      createdAt: now,
      updatedAt: now,
    },
  ],
  projects: [
    {
      id: "project-origin-hub",
      name: "ORIGIN Hub",
      description: "Plataforma interna para convertir ideas en productos y coordinar el trabajo del equipo.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      ownerId: demoUser.id,
      ownerName: demoUser.name,
      members: ["user-fabrizio", "user-helmy", "user-dario", "user-santino"],
      createdAt: now,
      updatedAt: now,
    },
  ],
  tasks: [
    { id: "task-stack", title: "Definir stack", description: "Acordar las tecnologías base del producto.", projectId: "project-origin-hub", assignedTo: "user-fabrizio", status: "DONE", priority: "HIGH", createdAt: now, updatedAt: now },
    { id: "task-firebase", title: "Configurar Firebase", description: "Crear el proyecto y conectar Authentication y Firestore.", projectId: "project-origin-hub", assignedTo: "user-helmy", status: "TODO", priority: "HIGH", createdAt: now, updatedAt: now },
    { id: "task-github", title: "Crear repositorio GitHub", description: "Crear el repositorio definitivo y definir permisos.", projectId: "project-origin-hub", assignedTo: "user-dario", status: "IN_PROGRESS", priority: "MEDIUM", createdAt: now, updatedAt: now },
    { id: "task-vercel", title: "Desplegar en Vercel", description: "Publicar la primera versión una vez conectado Firebase.", projectId: "project-origin-hub", assignedTo: "user-santino", status: "REVIEW", priority: "MEDIUM", createdAt: now, updatedAt: now },
  ],
  team: [
    { id: "user-fabrizio", name: "Fabrizio", area: "Product & Technology", status: "ACTIVE" },
    { id: "user-helmy", name: "Helmy", area: "Team Member", status: "ACTIVE" },
    { id: "user-dario", name: "Dario", area: "Team Member", status: "ACTIVE" },
    { id: "user-santino", name: "Santino", area: "Team Member", status: "ACTIVE" },
  ],
};
