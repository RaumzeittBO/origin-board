import { demoData } from "@/data/demo-data";
import type { Idea, Project, Task, TeamMember, WorkspaceData } from "@/types";
import type { WorkspaceRepository } from "./workspace-repository";

const STORAGE_KEY = "origin-hub-workspace-v1";

function cloneDemoData(): WorkspaceData {
  return JSON.parse(JSON.stringify(demoData)) as WorkspaceData;
}

export class LocalWorkspaceRepository implements WorkspaceRepository {
  private read(): WorkspaceData {
    if (typeof window === "undefined") return cloneDemoData();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = cloneDemoData();
      this.write(initial);
      return initial;
    }
    try {
      return JSON.parse(stored) as WorkspaceData;
    } catch {
      const initial = cloneDemoData();
      this.write(initial);
      return initial;
    }
  }

  private write(data: WorkspaceData) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async load() { return this.read(); }

  private upsert<K extends keyof WorkspaceData>(key: K, item: WorkspaceData[K][number]) {
    const data = this.read();
    const items = data[key] as Array<{ id: string }>;
    const index = items.findIndex((current) => current.id === item.id);
    if (index >= 0) items[index] = item;
    else items.unshift(item);
    this.write(data);
  }

  async saveIdea(item: Idea) { this.upsert("ideas", item); }
  async deleteIdea(id: string) { const data = this.read(); data.ideas = data.ideas.filter((item) => item.id !== id); this.write(data); }
  async saveProject(item: Project) { this.upsert("projects", item); }
  async deleteProject(id: string) { const data = this.read(); data.projects = data.projects.filter((item) => item.id !== id); data.tasks = data.tasks.filter((item) => item.projectId !== id); this.write(data); }
  async saveTask(item: Task) { this.upsert("tasks", item); }
  async deleteTask(id: string) { const data = this.read(); data.tasks = data.tasks.filter((item) => item.id !== id); this.write(data); }
  async saveTeamMember(item: TeamMember) { this.upsert("team", item); }
}
