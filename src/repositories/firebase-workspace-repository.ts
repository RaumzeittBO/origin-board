import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Idea, Project, Task, TeamMember, WorkspaceData } from "@/types";
import type { WorkspaceRepository } from "./workspace-repository";

export class FirebaseWorkspaceRepository implements WorkspaceRepository {
  private db() {
    const db = getFirebaseDb();
    if (!db) throw new Error("Firebase no está configurado.");
    return db;
  }

  private async list<T>(name: string): Promise<T[]> {
    const result = await getDocs(collection(this.db(), name));
    return result.docs.map((item) => item.data() as T);
  }

  async load(): Promise<WorkspaceData> {
    const [ideas, projects, tasks, team] = await Promise.all([
      this.list<Idea>("ideas"), this.list<Project>("projects"), this.list<Task>("tasks"), this.list<TeamMember>("users"),
    ]);
    return { ideas, projects, tasks, team };
  }

  private async save<T extends { id: string }>(name: string, item: T) { await setDoc(doc(this.db(), name, item.id), item); }
  private async remove(name: string, id: string) { await deleteDoc(doc(this.db(), name, id)); }
  async saveIdea(item: Idea) { return this.save("ideas", item); }
  async deleteIdea(id: string) { return this.remove("ideas", id); }
  async saveProject(item: Project) { return this.save("projects", item); }
  async deleteProject(id: string) { return this.remove("projects", id); }
  async saveTask(item: Task) { return this.save("tasks", item); }
  async deleteTask(id: string) { return this.remove("tasks", id); }
  async saveTeamMember(item: TeamMember) { return this.save("users", item); }
}
