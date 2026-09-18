import { NextResponse } from "next/server";
import { adminDb, requireActiveUser } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  console.log("[complete-first-login] request-received");
  try {
    const { decoded, profile } = await requireActiveUser(request, true);
    console.log("[complete-first-login] user-verified", decoded.uid);

    // Operación idempotente: si ya fue completado, responder ok sin error
    if (profile.get("mustChangePassword") === false) {
      console.log("[complete-first-login] already-completed", decoded.uid);
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    const now = new Date().toISOString();
    await adminDb().doc(`users/${decoded.uid}`).update({
      mustChangePassword: false,
      updatedAt: now,
      passwordChangedAt: now,
    });
    console.log("[complete-first-login] firestore-updated", decoded.uid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[complete-first-login] error", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && (error.message === "No autorizado." || error.message === "Cuenta sin acceso.")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No se pudo finalizar la configuración de la cuenta." },
      { status: 500 }
    );
  }
}
