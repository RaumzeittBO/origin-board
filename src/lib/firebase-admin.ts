import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  let clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

  if (privateKey) {
    privateKey = privateKey
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n");
  }

  // Soporte local si existe archivo GOOGLE_APPLICATION_CREDENTIALS y faltan en env
  if ((!clientEmail || !privateKey) && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const fileContent = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
        clientEmail = clientEmail || fileContent.client_email;
        privateKey = privateKey || fileContent.private_key;
      }
    } catch {
      // Ignorar fallo de lectura local
    }
  }

  console.log("[firebase-admin] config", {
    projectIdPresent: Boolean(projectId),
    projectIdLength: projectId?.length ?? 0,

    publicProjectIdPresent: Boolean(publicProjectId),
    publicProjectMatches:
      publicProjectId
        ? publicProjectId === projectId
        : "not-provided",

    clientEmailPresent: Boolean(clientEmail),
    clientEmailLength: clientEmail?.length ?? 0,

    privateKeyPresent: Boolean(privateKey),
    privateKeyLength: privateKey?.length ?? 0,

    privateKeyHasBegin:
      privateKey?.startsWith("-----BEGIN PRIVATE KEY-----") ?? false,

    privateKeyHasEnd:
      privateKey?.includes("-----END PRIVATE KEY-----") ?? false,
  });

  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID no está disponible.");
  }

  if (!clientEmail) {
    throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL no está disponible.");
  }

  if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY no está disponible.");
  }

  if (publicProjectId && projectId !== publicProjectId) {
    throw new Error("Firebase project mismatch: Admin y Web utilizan proyectos diferentes.");
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
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
