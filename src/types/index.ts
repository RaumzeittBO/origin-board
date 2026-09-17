export type IdeaStatus = "IDEA" | "VALIDATING" | "APPROVED" | "REJECTED" | "CONVERTED_TO_PROJECT";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "TESTING" | "PAUSED" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "URGENT" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type IdeaVote = "like" | "dislike";

export interface Idea {
  likes?: number;
  dislikes?: number;
  referenceImages?: string[];
  id: string;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  ownerId: string;
  ownerName: string;
  members: string[];
  sourceIdeaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: TaskStatus;
  priority: Priority;
  fastTrack?: boolean;
  completionVotes?: Record<string, "SUCCESS" | "NEEDS_WORK">;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  area: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface WorkspaceData {
  ideas: Idea[];
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
}

export interface LocalUser {
  id: string;
  name: string;
  role: string;
}
