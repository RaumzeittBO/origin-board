import { NextResponse } from "next/server";
import { adminAuth, adminDb, requireActiveUser } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { decoded, profile } = await requireActiveUser(request, true);
    if (!decoded.auth_time || Date.now() / 1000 - decoded.auth_time > 300)
      return NextResponse.json({ error: "Vuelve a autenticarte." }, { status: 403 });
    if (profile.get("mustChangePassword") !== true)
      return NextResponse.json({ error: "La contraseña temporal ya fue reemplazada." }, { status: 400 });
    const body = await request.json();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || currentPassword === newPassword)
      return NextResponse.json({ error: "Elige una contraseña nueva de al menos 10 caracteres, con letras y números." }, { status: 400 });
    const account = await adminAuth().getUser(decoded.uid);
    if (!account.email || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) throw new Error("Configuración incompleta.");
    const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: account.email, password: currentPassword, returnSecureToken: true }),
      cache: "no-store",
    });
    if (!verification.ok) return NextResponse.json({ error: "Contraseña actual incorrecta." }, { status: 400 });
    const verified = await verification.json() as { localId?: string };
    if (verified.localId !== decoded.uid) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    await adminAuth().updateUser(decoded.uid, { password: newPassword });
    await adminDb().doc(`users/${decoded.uid}`).update({ mustChangePassword: false, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "No autorizado." || error.message === "Cuenta sin acceso."))
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    return NextResponse.json({ error: "No se pudo finalizar el cambio de contraseña. Contacta al equipo si persiste." }, { status: 503 });
  }
}
