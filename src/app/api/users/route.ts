import { NextResponse } from "next/server";
import { adminAuth, adminDb, requireActiveUser } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    await requireActiveUser(request);
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const password = body.password;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || displayName.length < 2 || displayName.length > 100 || typeof password !== "string" || password.length < 6 || password.length > 128)
      return NextResponse.json({ error: "Comprueba el nombre, el correo y la contraseña temporal (mínimo 6 caracteres)." }, { status: 400 });
    const auth = adminAuth();
    const account = await auth.createUser({ email, password, displayName });
    const now = new Date().toISOString();
    const profile = { uid: account.uid, email, displayName, status: "active", mustChangePassword: true, createdAt: now, updatedAt: now };
    try { await adminDb().doc(`users/${account.uid}`).create(profile); }
    catch (error) { await auth.deleteUser(account.uid); throw error; }
    return NextResponse.json({ user: profile }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-exists") return NextResponse.json({ error: "Este correo ya tiene una cuenta." }, { status: 409 });
    if (error instanceof Error && /Configuración administrativa/.test(error.message)) return NextResponse.json({ error: "Faltan credenciales administrativas en el servidor." }, { status: 503 });
    return NextResponse.json({ error: "No fue posible completar la operación." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { decoded } = await requireActiveUser(request);
    const body = await request.json();
    const uid = typeof body.uid === "string" ? body.uid : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : undefined;
    const status = body.status;
    if (!uid || (displayName === undefined && status === undefined) || (displayName !== undefined && (displayName.length < 2 || displayName.length > 100)) || (status !== undefined && !["active", "inactive"].includes(status)) || (uid === decoded.uid && status === "inactive"))
      return NextResponse.json({ error: "Cambio no permitido." }, { status: 400 });
    const ref = adminDb().doc(`users/${uid}`);
    const previous = await ref.get();
    if (!previous.exists) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    const changes = { ...(displayName !== undefined ? { displayName } : {}), ...(status !== undefined ? { status } : {}), updatedAt: new Date().toISOString() };
    if (displayName !== undefined) await adminAuth().updateUser(uid, { displayName });
    await ref.update(changes);
    if (status === "inactive") await adminAuth().revokeRefreshTokens(uid);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No autorizado o no disponible." }, { status: 403 }); }
}
