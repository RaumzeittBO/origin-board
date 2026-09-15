import type { Idea, Project, Task, TeamMember, WorkspaceData } from "@/types";

export interface WorkspaceRepository {
  load(): Promise<WorkspaceData>;
  saveIdea(item: Idea): Promise<void>;
  deleteIdea(id: string): Promise<void>;
  saveProject(item: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  saveTask(item: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  saveTeamMember(item: TeamMember): Promise<void>;
}
