import type { Idea, IdeaVote, Project, Task, TeamMember, WorkspaceData } from "@/types";

export interface WorkspaceRepository {
  getIdeaVotes(userId: string): Promise<Record<string, IdeaVote>>;
  voteIdea(id: string, userId: string, vote: IdeaVote): Promise<void>;
  load(): Promise<WorkspaceData>;
  saveIdea(item: Idea): Promise<void>;
  deleteIdea(id: string): Promise<void>;
  saveProject(item: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  saveTask(item: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  saveTeamMember(item: TeamMember): Promise<void>;
}
