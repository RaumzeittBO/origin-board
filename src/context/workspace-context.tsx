"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { demoUser } from "@/data/demo-data";
import { persistenceMode, workspaceRepository } from "@/repositories";
import type { Idea, LocalUser, Project, Task, TeamMember, WorkspaceData } from "@/types";

type NewIdea = Pick<Idea, "title" | "description" | "category" | "status">;
type NewProject = Pick<Project, "name" | "description" | "status" | "priority" | "members"> & { sourceIdeaId?: string };
type NewTask = Pick<Task, "title" | "description" | "projectId" | "assignedTo" | "status" | "priority" | "fastTrack">;

interface WorkspaceContextValue extends WorkspaceData {
  user: LocalUser | null;
  loading: boolean;
  mode: "local" | "firebase";
  loginDemo: () => void;
  logout: () => void;
  saveIdea: (values: NewIdea, id?: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  convertIdea: (id: string) => Promise<void>;
  saveProject: (values: NewProject, id?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveTask: (values: NewTask, id?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  changeTaskStatus: (id: string, status: Task["status"]) => Promise<void>;
  voteTaskCompletion: (id: string, vote: "SUCCESS" | "NEEDS_WORK") => Promise<void>;
  saveMember: (member: TeamMember) => Promise<void>;
}

const emptyData: WorkspaceData = { ideas: [], projects: [], tasks: [], team: [] };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const USER_KEY = "origin-hub-user";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(emptyData);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => setData(await workspaceRepository.load()), []);

  useEffect(() => {
    const hydrate = async () => {
      const storedUser = window.localStorage.getItem(USER_KEY);
      const workspace = await workspaceRepository.load();
      setData(workspace);
      if (storedUser) setUser(JSON.parse(storedUser) as LocalUser);
      setLoading(false);
    };
    hydrate();
  }, []);

  const loginDemo = () => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  };
  const logout = () => { window.localStorage.removeItem(USER_KEY); setUser(null); };

  const saveIdea = async (values: NewIdea, id?: string) => {
    const existing = data.ideas.find((item) => item.id === id);
    const now = new Date().toISOString();
    await workspaceRepository.saveIdea({
      ...values,
      id: id ?? crypto.randomUUID(),
      authorId: existing?.authorId ?? user?.id ?? demoUser.id,
      authorName: existing?.authorName ?? user?.name ?? demoUser.name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    await refresh();
  };

  const deleteIdea = async (id: string) => { await workspaceRepository.deleteIdea(id); await refresh(); };

  const saveProject = async (values: NewProject, id?: string) => {
    const existing = data.projects.find((item) => item.id === id);
    const now = new Date().toISOString();
    await workspaceRepository.saveProject({
      ...values,
      id: id ?? crypto.randomUUID(),
      ownerId: existing?.ownerId ?? user?.id ?? demoUser.id,
      ownerName: existing?.ownerName ?? user?.name ?? demoUser.name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    await refresh();
  };

  const deleteProject = async (id: string) => { await workspaceRepository.deleteProject(id); await refresh(); };

  const saveTask = async (values: NewTask, id?: string) => {
    const existing = data.tasks.find((item) => item.id === id);
    const now = new Date().toISOString();
    await workspaceRepository.saveTask({ ...values, fastTrack: values.status === "URGENT", completionVotes: existing?.completionVotes ?? {}, id: id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now });
    await refresh();
  };

  const deleteTask = async (id: string) => { await workspaceRepository.deleteTask(id); await refresh(); };
  const changeTaskStatus = async (id: string, status: Task["status"]) => {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) return;
    await workspaceRepository.saveTask({ ...task, status, fastTrack: status === "URGENT", updatedAt: new Date().toISOString() });
    await refresh();
  };

  const voteTaskCompletion = async (id: string, vote: "SUCCESS" | "NEEDS_WORK") => {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) return;
    const voterId = user?.id ?? demoUser.id;
    await workspaceRepository.saveTask({
      ...task,
      completionVotes: { ...task.completionVotes, [voterId]: vote },
      updatedAt: new Date().toISOString(),
    });
    await refresh();
  };

  const convertIdea = async (id: string) => {
    const idea = data.ideas.find((item) => item.id === id);
    if (!idea || idea.status === "CONVERTED_TO_PROJECT") return;
    await saveProject({ name: idea.title, description: idea.description, status: "PLANNING", priority: "MEDIUM", members: [user?.id ?? demoUser.id], sourceIdeaId: idea.id });
    await workspaceRepository.saveIdea({ ...idea, status: "CONVERTED_TO_PROJECT", updatedAt: new Date().toISOString() });
    await refresh();
  };

  const saveMember = async (member: TeamMember) => { await workspaceRepository.saveTeamMember(member); await refresh(); };

  const value = { ...data, user, loading, mode: persistenceMode, loginDemo, logout, saveIdea, deleteIdea, convertIdea, saveProject, deleteProject, saveTask, deleteTask, changeTaskStatus, voteTaskCompletion, saveMember };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider");
  return context;
}
