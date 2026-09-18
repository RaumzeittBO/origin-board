"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { browserLocalPersistence, browserSessionPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { workspaceRepository } from "@/repositories";
import type { Idea, IdeaVote, OriginUser, Project, Task, WorkspaceData } from "@/types";

type NewIdea = Pick<Idea, "title" | "description" | "category" | "status" | "referenceImages">;
type NewProject = Pick<Project, "name" | "description" | "status" | "priority" | "members"> & { sourceIdeaId?: string };
type NewTask = Pick<Task, "title" | "description" | "projectId" | "assignedTo" | "status" | "priority" | "fastTrack">;
type SessionUser = OriginUser & { id: string; name: string; role: string };
interface WorkspaceContextValue extends WorkspaceData {
  ideaVotes: Record<string, IdeaVote>;
  voteIdea: (id: string, vote: IdeaVote) => Promise<void>;
  user: SessionUser | null;
  loading: boolean;
  authError: string;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  saveIdea: (values: NewIdea, id?: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  convertIdea: (id: string) => Promise<void>;
  saveProject: (values: NewProject, id?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveTask: (values: NewTask, id?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  changeTaskStatus: (id: string, status: Task["status"]) => Promise<void>;
  voteTaskCompletion: (id: string, vote: "SUCCESS" | "NEEDS_WORK") => Promise<void>;
}
const emptyData: WorkspaceData = { ideas: [], projects: [], tasks: [], team: [], users: [] };
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(emptyData);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ideaVotes, setIdeaVotes] = useState<Record<string, IdeaVote>>({});
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const refresh = useCallback(async () => setData(await workspaceRepository.load()), []);

  useEffect(() => {
    const auth = getFirebaseAuth(), db = getFirebaseDb();
    if (!auth || !db) {
      queueMicrotask(() => { setAuthError("Falta configurar Firebase en las variables de entorno."); setLoading(false); });
      return;
    }
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      if (!firebaseUser) { setUser(null); setData(emptyData); setIdeaVotes({}); setLoading(false); return; }
      unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (snapshot) => {
        const profile = snapshot.data() as OriginUser | undefined;
        if (!profile || profile.uid !== firebaseUser.uid || profile.status !== "active") {
          setAuthError("Tu cuenta no está habilitada en ORIGIN Hub. Contacta al equipo.");
          void signOut(auth); setLoading(false); return;
        }
        setAuthError("");
        setUser({ ...profile, id: profile.uid, name: profile.displayName, role: "Miembro" });
        setLoading(false);
      }, () => { setAuthError("No se pudo comprobar tu acceso al espacio."); void signOut(auth); setLoading(false); });
    });
    return () => { unsubscribeProfile?.(); unsubscribeAuth(); };
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    let active = true;
    const sync = async () => {
      try {
        const [workspace, votes] = await Promise.all([workspaceRepository.load(), workspaceRepository.getIdeaVotes(user.uid)]);
        if (active) { setData(workspace); setIdeaVotes(votes); }
      } catch (error) { console.error("No se pudo actualizar el espacio", error); }
    };
    const db = getFirebaseDb();
    if (!db) return;
    const listeners = ["ideas", "projects", "tasks", "users"].map((name) =>
      onSnapshot(collection(db, name), () => { void sync(); }, (error) => console.error("No se pudo observar " + name, error)));
    listeners.push(onSnapshot(collection(db, "users", user.uid, "ideaVotes"), () => { void sync(); }, (error) => console.error("No se pudo observar la votación", error)));
    return () => { active = false; listeners.forEach((unsubscribe) => unsubscribe()); };
  }, [user]);

  const login = async (email: string, password: string, remember: boolean) => {
    const auth = getFirebaseAuth(); if (!auth) throw new Error("Firebase no está configurado.");
    setAuthError("");
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };
  const logout = async () => { const auth = getFirebaseAuth(); if (auth) await signOut(auth); };
  const requireUser = () => { if (!user || user.mustChangePassword) throw new Error("Se requiere una sesión activa."); return user; };
  const voteIdea = async (id: string, vote: IdeaVote) => { const current = requireUser(); await workspaceRepository.voteIdea(id, current.uid, vote); setIdeaVotes(await workspaceRepository.getIdeaVotes(current.uid)); await refresh(); };
  const saveIdea = async (values: NewIdea, id?: string) => {
    const current = requireUser(), existing = data.ideas.find((item) => item.id === id), now = new Date().toISOString();
    await workspaceRepository.saveIdea({ ...values, id: id ?? crypto.randomUUID(), authorId: existing?.authorId ?? current.uid, authorName: existing?.authorName ?? current.name, createdAt: existing?.createdAt ?? now, updatedAt: now }); await refresh();
  };
  const deleteIdea = async (id: string) => { requireUser(); await workspaceRepository.deleteIdea(id); await refresh(); };
  const saveProject = async (values: NewProject, id?: string) => {
    const current = requireUser(), existing = data.projects.find((item) => item.id === id), now = new Date().toISOString();
    await workspaceRepository.saveProject({ ...values, id: id ?? crypto.randomUUID(), ownerId: existing?.ownerId ?? current.uid, ownerName: existing?.ownerName ?? current.name, createdAt: existing?.createdAt ?? now, updatedAt: now }); await refresh();
  };
  const deleteProject = async (id: string) => { requireUser(); await workspaceRepository.deleteProject(id); await refresh(); };
  const saveTask = async (values: NewTask, id?: string) => {
    requireUser(); const existing = data.tasks.find((item) => item.id === id), now = new Date().toISOString();
    await workspaceRepository.saveTask({ ...values, fastTrack: values.status === "URGENT", completionVotes: existing?.completionVotes ?? {}, id: id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: now }); await refresh();
  };
  const deleteTask = async (id: string) => { requireUser(); await workspaceRepository.deleteTask(id); await refresh(); };
  const changeTaskStatus = async (id: string, status: Task["status"]) => { requireUser(); const task = data.tasks.find((item) => item.id === id); if (!task) return; await workspaceRepository.saveTask({ ...task, status, fastTrack: status === "URGENT", updatedAt: new Date().toISOString() }); await refresh(); };
  const voteTaskCompletion = async (id: string, vote: "SUCCESS" | "NEEDS_WORK") => { const current = requireUser(), task = data.tasks.find((item) => item.id === id); if (!task) return; await workspaceRepository.saveTask({ ...task, completionVotes: { ...task.completionVotes, [current.uid]: vote }, updatedAt: new Date().toISOString() }); await refresh(); };
  const convertIdea = async (id: string) => { const current = requireUser(), idea = data.ideas.find((item) => item.id === id); if (!idea || idea.status !== "APPROVED") return; await saveProject({ name: idea.title, description: idea.description, status: "PLANNING", priority: "MEDIUM", members: [current.uid], sourceIdeaId: idea.id }); await workspaceRepository.saveIdea({ ...idea, status: "CONVERTED_TO_PROJECT", updatedAt: new Date().toISOString() }); await refresh(); };
  return <WorkspaceContext.Provider value={{ ...data, ideaVotes, voteIdea, user, loading, authError, login, logout, saveIdea, deleteIdea, convertIdea, saveProject, deleteProject, saveTask, deleteTask, changeTaskStatus, voteTaskCompletion }}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() { const context = useContext(WorkspaceContext); if (!context) throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider"); return context; }
