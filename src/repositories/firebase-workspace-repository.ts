import { applyIdeaVote } from "@/lib/idea-voting";
import { collection, deleteDoc, doc, getDocs, setDoc, runTransaction, query, where, writeBatch } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Idea, IdeaVote, Project, Task, OriginUser, WorkspaceData } from "@/types";
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
    const [ideas, projects, tasks, users] = await Promise.all([
      this.list<Idea>("ideas"), this.list<Project>("projects"), this.list<Task>("tasks"), this.list<OriginUser>("users"),
    ]);
    return { ideas, projects, tasks, users, team: users.map((person) => ({ id: person.uid, name: person.displayName, area: person.area ?? "Equipo ORIGIN", status: person.status === "active" ? "ACTIVE" : "INACTIVE" })) };
  }

  private async save<T extends { id: string }>(name: string, item: T) { await setDoc(doc(this.db(), name, item.id), item); }
  private async remove(name: string, id: string) { await deleteDoc(doc(this.db(), name, id)); }
  async getIdeaVotes(userId: string): Promise<Record<string, IdeaVote>> {
    const result = await getDocs(collection(this.db(), "users", userId, "ideaVotes"));
    return Object.fromEntries(result.docs.map(item => [item.id, item.data().vote as IdeaVote]));
  }
  async voteIdea(id: string, userId: string, vote: IdeaVote) {
    const ideaRef = doc(this.db(), "ideas", id);
    const voteRef = doc(this.db(), "users", userId, "ideaVotes", id);
    await runTransaction(this.db(), async transaction => {
      const idea = await transaction.get(ideaRef);
      const receipt = await transaction.get(voteRef);
      if (!idea.exists()) throw new Error("La idea ya no existe.");
      const updated = applyIdeaVote(idea.data() as Idea, userId, vote, receipt.exists());
      transaction.set(voteRef, { vote });
      transaction.update(ideaRef, { likes: updated.likes, dislikes: updated.dislikes, status: updated.status, updatedAt: updated.updatedAt });
    });
  }
  async saveIdea(item: Idea) {
    const ref = doc(this.db(), "ideas", item.id);
    await runTransaction(this.db(), async transaction => {
      const snapshot = await transaction.get(ref);
      const existing = snapshot.exists() ? snapshot.data() as Idea : null;
      transaction.set(ref, existing ? { ...item, likes: existing.likes ?? 0, dislikes: existing.dislikes ?? 0, status: item.status === "CONVERTED_TO_PROJECT" && existing.status === "APPROVED" ? item.status : existing.status } : { ...item, status: "IDEA", likes: 0, dislikes: 0 });
    });
  }
  async deleteIdea(id: string) { return this.remove("ideas", id); }
  async saveProject(item: Project) { return this.save("projects", item); }
  async deleteProject(id: string) {
    const related = await getDocs(query(collection(this.db(), "tasks"), where("projectId", "==", id)));
    for (let index = 0; index < related.docs.length; index += 400) {
      const batch = writeBatch(this.db());
      related.docs.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
    await this.remove("projects", id);
  }
  async saveTask(item: Task) { return this.save("tasks", item); }
  async deleteTask(id: string) { return this.remove("tasks", id); }
}
