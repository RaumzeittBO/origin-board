import { isFirebaseConfigured } from "@/lib/firebase";
import { FirebaseWorkspaceRepository } from "./firebase-workspace-repository";
import { LocalWorkspaceRepository } from "./local-workspace-repository";

export const persistenceMode: "firebase" | "local" = isFirebaseConfigured ? "firebase" : "local";

export const workspaceRepository = isFirebaseConfigured
  ? new FirebaseWorkspaceRepository()
  : new LocalWorkspaceRepository();
