import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  let stage = "admin-init";
  try {
    const auth = adminAuth();
    const db = adminDb();
    stage = "verify-token";
    const decoded = await auth.verifyIdToken(token, true);
    stage = "load-user";
    const [account, profile] = await Promise.all([
      auth.getUser(decoded.uid), db.doc(`users/${decoded.uid}`).get(),
    ]);
    if (account.disabled || !profile.exists || profile.get("uid") !== decoded.uid || profile.get("status") !== "active") {
      return NextResponse.json({ error: "Cuenta sin acceso." }, { status: 403 });
    }
    if (profile.get("mustChangePassword") === false) return NextResponse.json({ ok: true, alreadyCompleted: true });
    if (profile.get("mustChangePassword") !== true) return NextResponse.json({ error: "Perfil inválido." }, { status: 409 });
    // Firebase revokes existing tokens when the password changes. An account
    // still using its initial credential has the same valid-after and creation time.
    if (!account.tokensValidAfterTime || Date.parse(account.tokensValidAfterTime) <= Date.parse(account.metadata.creationTime)) {
      return NextResponse.json({ error: "Primero cambia tu contraseña temporal." }, { status: 409 });
    }
    stage = "update-firestore";
    const now = new Date().toISOString();
    await profile.ref.update({ mustChangePassword: false, updatedAt: now, passwordChangedAt: now });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? "UNKNOWN";
    console.error("[complete-first-login] failed", { stage, code });
    if (code.startsWith("auth/")) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    return NextResponse.json({ error: "No se pudo completar la activación." }, { status: 500 });
  }
}
