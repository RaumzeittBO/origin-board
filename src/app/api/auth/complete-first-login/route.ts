import { NextResponse } from "next/server";
import { adminDb, requireActiveUser } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { decoded, profile } = await requireActiveUser(request, true);

    // Operación idempotente: si ya fue completado, responder ok sin error
    if (profile.get("mustChangePassword") === false) {
      return NextResponse.json({ ok: true, alreadyCompleted: true });
    }

    const now = new Date().toISOString();
    await adminDb().doc(`users/${decoded.uid}`).update({
      mustChangePassword: false,
      updatedAt: now,
      passwordChangedAt: now,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[complete-first-login error]", error);
    }
    if (error instanceof Error && (error.message === "No autorizado." || error.message === "Cuenta sin acceso.")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No se pudo finalizar la configuración de la cuenta." },
      { status: 500 }
    );
  }
}
