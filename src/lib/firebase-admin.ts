import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  const existing = getApps()[0];
  if (existing) return getApp(existing.name);

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  if (!projectId) throw new Error("FIREBASE_ADMIN_PROJECT_ID is missing");
  if (Boolean(clientEmail) !== Boolean(privateKey)) throw new Error("Firebase Admin credentials are incomplete");

  // Vercel uses explicit credentials. Locally GOOGLE_APPLICATION_CREDENTIALS
  // supplies the same service account without putting the key in .env.local.
  const credential = clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();
  return initializeApp({ credential, projectId });
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
