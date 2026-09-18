/* eslint-disable @typescript-eslint/no-require-imports */
const { test, before, after } = require("node:test");
const fs = require("node:fs");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, runTransaction } = require("firebase/firestore");

let env;
const now = "2026-09-17T00:00:00.000Z";
const idea = (id, authorId) => ({ id, title: "Idea", description: "Descripción", category: "Software", status: "IDEA", authorId, authorName: "Persona", createdAt: now, updatedAt: now, likes: 0, dislikes: 0, referenceImages: [] });
const project = (id, ownerId) => ({ id, name: "Proyecto", description: "", status: "PLANNING", priority: "MEDIUM", ownerId, ownerName: "Persona", members: [ownerId], createdAt: now, updatedAt: now });
const task = (id) => ({ id, title: "Tarea", description: "", projectId: "p1", assignedTo: "active", status: "TODO", priority: "MEDIUM", fastTrack: false, completionVotes: {}, createdAt: now, updatedAt: now });
before(async () => {
  env = await initializeTestEnvironment({ projectId: "origin-rules-test", firestore: { rules: fs.readFileSync("firestore.rules", "utf8") } });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/active"), { uid: "active", email: "a@example.com", displayName: "Activo", status: "active", mustChangePassword: false, createdAt: now, updatedAt: now });
    await setDoc(doc(db, "users/other"), { uid: "other", email: "b@example.com", displayName: "Otro", status: "active", mustChangePassword: false, createdAt: now, updatedAt: now });
    await setDoc(doc(db, "users/inactive"), { uid: "inactive", status: "inactive", mustChangePassword: false });
    await setDoc(doc(db, "users/temporary"), { uid: "temporary", status: "active", mustChangePassword: true });
    await setDoc(doc(db, "ideas/existing"), idea("existing", "other"));
    await setDoc(doc(db, "projects/p1"), project("p1", "other"));
    await setDoc(doc(db, "tasks/t1"), task("t1"));
  });
});
after(async () => { await env?.cleanup(); });
test("sin sesión no accede a datos privados ni crea ideas", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "users/active")));
  await assertFails(getDocs(collection(db, "ideas")));
  await assertFails(setDoc(doc(db, "ideas/new"), idea("new", "active")));
  await assertFails(getDocs(collection(db, "projects")));
  await assertFails(updateDoc(doc(db, "tasks/t1"), { title: "Otro" }));
});
test("miembro activo usa ideas, proyectos, tareas y lee equipo", async () => {
  const db = env.authenticatedContext("active").firestore();
  await assertSucceeds(getDocs(collection(db, "users")));
  await assertSucceeds(getDocs(collection(db, "ideas")));
  await assertSucceeds(getDocs(collection(db, "projects")));
  await assertSucceeds(getDocs(collection(db, "tasks")));
  await assertSucceeds(setDoc(doc(db, "ideas/new"), idea("new", "active")));
  await assertSucceeds(updateDoc(doc(db, "ideas/existing"), { title: "Nueva idea" }));
  await assertSucceeds(setDoc(doc(db, "projects/new"), project("new", "active")));
  await assertSucceeds(updateDoc(doc(db, "projects/p1"), { name: "Actualizado" }));
  await assertSucceeds(setDoc(doc(db, "tasks/new"), task("new")));
  await assertSucceeds(updateDoc(doc(db, "tasks/t1"), { status: "IN_PROGRESS" }));
  await assertSucceeds(updateDoc(doc(db, "tasks/t1"), { completionVotes: { active: "SUCCESS" } }));
  await assertSucceeds(deleteDoc(doc(db, "tasks/new")));
});
test("cuentas inactivas o temporales no acceden al workspace", async () => {
  for (const uid of ["inactive", "temporary"]) {
    const db = env.authenticatedContext(uid).firestore();
    await assertFails(getDocs(collection(db, "ideas")));
    await assertFails(setDoc(doc(db, "projects/blocked"), project("blocked", uid)));
  }
  await assertSucceeds(getDoc(doc(env.authenticatedContext("temporary").firestore(), "users/temporary")));
});
test("voto de idea legítimo exige recibo y conteos atómicos", async () => {
  const db = env.authenticatedContext("active").firestore();
  await assertSucceeds(runTransaction(db, async (transaction) => {
    const ref = doc(db, "ideas/existing"), receipt = doc(db, "users/active/ideaVotes/existing");
    const before = await transaction.get(ref);
    await transaction.get(receipt);
    transaction.set(receipt, { vote: "like" });
    transaction.update(ref, { likes: before.data().likes + 1, updatedAt: new Date().toISOString() });
  }));
  await assertFails(updateDoc(doc(db, "ideas/existing"), { likes: 12 }));
});
test("suplantación, campos administrativos y votos ajenos son rechazados", async () => {
  const db = env.authenticatedContext("active").firestore();
  await assertFails(setDoc(doc(db, "users/evil"), { uid: "evil", status: "active" }));
  await assertFails(updateDoc(doc(db, "users/active"), { status: "active", role: "admin" }));
  await assertFails(setDoc(doc(db, "ideas/forged"), idea("forged", "other")));
  await assertFails(setDoc(doc(db, "ideas/extra"), { ...idea("extra", "active"), admin: true }));
  await assertFails(updateDoc(doc(db, "ideas/existing"), { authorId: "active" }));
  await assertFails(setDoc(doc(db, "projects/forged"), project("forged", "other")));
  await assertFails(updateDoc(doc(db, "projects/p1"), { ownerId: "active" }));
  await assertFails(updateDoc(doc(db, "tasks/t1"), { completionVotes: { other: "SUCCESS" } }));
  await assertFails(setDoc(doc(db, "activity/x"), { event: "fake" }));
});
