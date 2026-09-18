import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    throw new Error("Configuración administrativa incompleta o proyecto incorrecto.");
  if (Boolean(clientEmail) !== Boolean(privateKey)) throw new Error("Configuración administrativa incompleta o proyecto incorrecto.");
  if (!clientEmail && !process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("Configuración administrativa incompleta o proyecto incorrecto.");
  const credential = clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault();
  return getApps().length ? getApp() : initializeApp({ credential, projectId });
}

export function adminAuth() { return getAuth(adminApp()); }
export function adminDb() { return getFirestore(adminApp()); }

export async function requireActiveUser(request: Request, allowTemporary = false) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("No autorizado.");
  const auth = adminAuth(), decoded = await auth.verifyIdToken(token, true);
  const [account, profile] = await Promise.all([auth.getUser(decoded.uid), adminDb().doc(`users/${decoded.uid}`).get()]);
  if (account.disabled || !profile.exists || profile.get("uid") !== decoded.uid || profile.get("status") !== "active" || (!allowTemporary && profile.get("mustChangePassword")))
    throw new Error("Cuenta sin acceso.");
  return { decoded, profile };
}
