import { applyIdeaVote } from "@/lib/idea-voting";
import { demoData } from "@/data/demo-data";
import type { Idea, IdeaVote, Project, Task, TeamMember, WorkspaceData } from "@/types";
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

  async getIdeaVotes(userId: string): Promise<Record<string, IdeaVote>> {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY + "-votes-" + userId) ?? "{}");
  }
  async voteIdea(id: string, userId: string, vote: IdeaVote) {
    await navigator.locks.request(STORAGE_KEY + "-ideas", async () => {
      const data = this.read();
      if (!data.team.some(member => member.id === userId && member.status === "ACTIVE")) throw new Error("Solo los miembros activos pueden votar.");
      const index = data.ideas.findIndex(idea => idea.id === id);
      if (index < 0) throw new Error("La idea ya no existe.");
      const votes = await this.getIdeaVotes(userId);
      data.ideas[index] = applyIdeaVote(data.ideas[index], userId, vote, Boolean(votes[id]));
      window.localStorage.setItem(STORAGE_KEY + "-votes-" + userId, JSON.stringify({ ...votes, [id]: vote }));
      this.write(data);
    });
  }
  async saveIdea(item: Idea) {
    const existing = this.read().ideas.find(idea => idea.id === item.id);
    this.upsert("ideas", existing ? { ...item, likes: existing.likes ?? 0, dislikes: existing.dislikes ?? 0, status: item.status === "CONVERTED_TO_PROJECT" && existing.status === "APPROVED" ? item.status : existing.status } : { ...item, status: "IDEA", likes: 0, dislikes: 0 });
  }
  async deleteIdea(id: string) { const data = this.read(); data.ideas = data.ideas.filter((item) => item.id !== id); this.write(data); }
  async saveProject(item: Project) { this.upsert("projects", item); }
  async deleteProject(id: string) { const data = this.read(); data.projects = data.projects.filter((item) => item.id !== id); data.tasks = data.tasks.filter((item) => item.projectId !== id); this.write(data); }
  async saveTask(item: Task) { this.upsert("tasks", item); }
  async deleteTask(id: string) { const data = this.read(); data.tasks = data.tasks.filter((item) => item.id !== id); this.write(data); }
  async saveTeamMember(item: TeamMember) { this.upsert("team", item); }
}
