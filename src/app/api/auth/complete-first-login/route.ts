import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  let stage = "request-received";
  try {
    console.log("[complete-first-login] request-received");

    stage = "read-authorization";
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          code: "MISSING_TOKEN",
          message: "Falta el token de autenticación.",
        },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);

    stage = "admin-init";
    console.log("[complete-first-login] admin-init", {
      projectIdPresent: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
      clientEmailPresent: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
      privateKeyPresent: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
      privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length ?? 0,
    });

    const auth = adminAuth();
    const db = adminDb();

    stage = "verify-token";
    console.log("[complete-first-login] verify-token");
    const decoded = await auth.verifyIdToken(token, true);

    console.log("[complete-first-login] token-verified", {
      uidPresent: Boolean(decoded.uid),
      aud: decoded.aud,
    });

    stage = "load-user";
    console.log("[complete-first-login] load-user", { uid: decoded.uid });
    const [account, snapshot] = await Promise.all([
      auth.getUser(decoded.uid),
      db.doc(`users/${decoded.uid}`).get(),
    ]);

    const exists = snapshot.exists;
    const data = snapshot.data();
    const status = exists ? data?.status ?? null : null;
    const mustChangePassword = exists ? data?.mustChangePassword ?? null : null;

    console.log("[complete-first-login] user-loaded", {
      exists,
      status,
      mustChangePassword,
    });

    if (!exists) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          code: "USER_DOCUMENT_NOT_FOUND",
          message: `No existe el documento users/${decoded.uid} en Firestore.`,
        },
        { status: 404 }
      );
    }

    if (account.disabled) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          code: "USER_DISABLED",
          message: "La cuenta de usuario está inhabilitada en Authentication.",
        },
        { status: 403 }
      );
    }

    // Operación idempotente: si ya fue completado, responder ok
    if (mustChangePassword === false) {
      console.log("[complete-first-login] already-completed", decoded.uid);
      return NextResponse.json({
        ok: true,
        stage: "already-completed",
        alreadyCompleted: true,
      });
    }

    stage = "update-firestore";
    console.log("[complete-first-login] update-firestore");
    const now = new Date().toISOString();
    await db.doc(`users/${decoded.uid}`).update({
      mustChangePassword: false,
      updatedAt: now,
      passwordChangedAt: now,
    });

    stage = "completed";
    console.log("[complete-first-login] completed");

    return NextResponse.json({
      ok: true,
      stage,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const diagnostic = {
      ok: false,
      stage,
      code: err?.code ?? "UNKNOWN",
      message: error instanceof Error ? error.message : String(error),
    };

    console.error("[complete-first-login] ERROR", diagnostic);

    return NextResponse.json(diagnostic, { status: 500 });
  }
}
