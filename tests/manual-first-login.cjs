/* eslint-disable @typescript-eslint/no-require-imports */
// Manual live-project smoke test. Set ORIGIN_PREVIEW_URL for preview mode.
// Run with `node --env-file=.env.local tests/manual-first-login.cjs local|preview`.
// Only touches origin-debug@example.com; never run concurrently with another copy.
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const admin = require("firebase-admin");

const email = "origin-debug@example.com";
const project = process.env.FIREBASE_ADMIN_PROJECT_ID;
const service = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
assert.equal(project, "originboard-db142");
assert.equal(service.project_id, project);
admin.initializeApp({ credential: admin.credential.cert(service), projectId: project });
const auth = admin.auth();
const db = admin.firestore();
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const oldPassword = `T-${randomBytes(20).toString("base64url")}a9!`;
const newPassword = `N-${randomBytes(20).toString("base64url")}b8!`;
const mode = process.argv[2];
assert.ok(["local", "preview"].includes(mode));

async function identity(path, body) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

async function activation(token) {
  if (mode === "local") {
    const response = await fetch("http://localhost:3000/api/auth/complete-first-login", {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    return { status: response.status, body: await response.text() };
  }
  const url = process.env.ORIGIN_PREVIEW_URL;
  assert.ok(url?.startsWith("https://origin-board-"), "ORIGIN_PREVIEW_URL is required");
  const result = spawnSync("cmd.exe", ["/c", "vercel", "curl", "/api/auth/complete-first-login", "--deployment", url,
    "--", "--silent", "--show-error", "--include", "--request", "POST", "--header", `Authorization: Bearer ${token}`],
  { encoding: "utf8", cwd: process.cwd(), maxBuffer: 1024 * 1024 });
  if (result.status !== 0) throw new Error(`vercel curl failed: ${result.stderr.replaceAll(token, "[redacted]")}`);
  const status = Number(result.stdout.match(/^HTTP\/\S+ (\d+)/m)?.[1]);
  return { status, body: result.stdout.split(/\r?\n\r?\n/).at(-1).trim() };
}

(async () => {
  let uid;
  try {
    try { const existing = await auth.getUserByEmail(email); throw new Error(`Test user already exists: ${existing.uid}`); }
    catch (error) { if (error.code !== "auth/user-not-found") throw error; }
    const created = await auth.createUser({ email, password: oldPassword, displayName: "Origin Debug" });
    uid = created.uid;
    await db.doc(`users/${uid}`).set({ uid, email, displayName: "Origin Debug", status: "active", mustChangePassword: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    console.log("temporary-user-created", { project, profile: true });
    const login = await identity("accounts:signInWithPassword", { email, password: oldPassword, returnSecureToken: true });
    assert.equal(login.status, 200, "initial login");
    assert.equal(login.data.localId, uid);
    const beforeChange = await auth.getUser(uid);
    const premature = await activation(login.data.idToken);
    console.log("premature-response", premature);
    assert.equal(premature.status, 409, "activation before password change must be rejected");
    assert.equal((await db.doc(`users/${uid}`).get()).get("mustChangePassword"), true);
    console.log("premature-activation-rejected");
    const wrong = await identity("accounts:signInWithPassword", { email, password: "wrong-password", returnSecureToken: true });
    assert.notEqual(wrong.status, 200);
    console.log("initial-login-ok; wrong-password-rejected");
    const changed = await identity("accounts:update", { idToken: login.data.idToken, password: newPassword, returnSecureToken: true });
    assert.equal(changed.status, 200, "password update");
    const afterChange = await auth.getUser(uid);
    console.log("auth-change-evidence", { tokensValidAfterTimeChanged: beforeChange.tokensValidAfterTime !== afterChange.tokensValidAfterTime,
      beforeFromCreationMs: Date.parse(beforeChange.tokensValidAfterTime) - Date.parse(beforeChange.metadata.creationTime),
      afterFromCreationMs: Date.parse(afterChange.tokensValidAfterTime) - Date.parse(afterChange.metadata.creationTime),
      lastSignInTimeChanged: beforeChange.metadata.lastSignInTime !== afterChange.metadata.lastSignInTime });
    const oldLogin = await identity("accounts:signInWithPassword", { email, password: oldPassword, returnSecureToken: true });
    assert.notEqual(oldLogin.status, 200);
    const freshLogin = await identity("accounts:signInWithPassword", { email, password: newPassword, returnSecureToken: true });
    assert.equal(freshLogin.status, 200);
    console.log("new-password-ok; old-password-rejected; pending-profile", (await db.doc(`users/${uid}`).get()).get("mustChangePassword"));
    const completed = await activation(freshLogin.data.idToken);
    console.log("activation-response", completed);
    assert.equal(completed.status, 200);
    assert.equal((await db.doc(`users/${uid}`).get()).get("mustChangePassword"), false);
    const again = await activation(freshLogin.data.idToken);
    assert.equal(again.status, 200, "idempotent activation");
    const loginAfterLogout = await identity("accounts:signInWithPassword", { email, password: newPassword, returnSecureToken: true });
    assert.equal(loginAfterLogout.status, 200, "new password after fresh login");
    const reset = await identity("accounts:sendOobCode", { requestType: "PASSWORD_RESET", email });
    assert.equal(reset.status, 200, "password reset request");
    console.log("profile-after", { mustChangePassword: false, idempotent: true, freshLogin: true, resetRequestAccepted: true });
  } finally {
    if (uid) {
      await db.doc(`users/${uid}`).delete();
      await auth.deleteUser(uid);
      console.log("temporary-user-deleted", { project, profile: true, auth: true });
    }
  }
})().catch((error) => { console.error({ code: error.code, message: error.message }); process.exitCode = 1; });
