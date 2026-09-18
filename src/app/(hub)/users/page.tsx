"use client";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { useWorkspace } from "@/context/workspace-context";
import { PageHeader, StatusBadge } from "@/components/ui";

async function adminRequest(method: "POST" | "PATCH", body: object) {
  const account = getFirebaseAuth()?.currentUser;
  if (!account) throw new Error("Inicia sesión de nuevo.");
  const response = await fetch("/api/users", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${await account.getIdToken()}` }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudo completar la acción.");
}
export default function UsersPage() {
  const { users, user } = useWorkspace();
  const [open, setOpen] = useState(false), [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await adminRequest("POST", { displayName: name, email, password }); setOpen(false); setName(""); setEmail(""); setPassword(""); setMessage("Usuario creado. Comparte la contraseña temporal por un canal seguro."); }
    catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  };
  const edit = async (uid: string, displayName: string, status: "active" | "inactive") => {
    const nextName = window.prompt("Nombre del usuario", displayName);
    if (nextName === null) return;
    const nextStatus = window.confirm(status === "active" ? "¿Desactivar esta cuenta? Cancela para mantenerla activa." : "¿Reactivar esta cuenta? Cancela para mantenerla inactiva.") ? status === "active" ? "inactive" : "active" : status;
    try { await adminRequest("PATCH", { uid, displayName: nextName, status: nextStatus }); setMessage("Perfil actualizado."); }
    catch (error) { setMessage((error as Error).message); }
  };
  return <>
    <PageHeader eyebrow="Acceso del equipo" title="Usuarios" description="Integrantes con acceso a ORIGIN Hub. Las contraseñas nunca se muestran ni almacenan aquí." action={<button className="button button-primary" onClick={() => setOpen(true)}>+ Crear usuario</button>}/>
    {message && <p className="form-message" role="status">{message}</p>}
    <div className="users-list">{users.map((person) => <article className="panel user-row" key={person.uid}><span className="team-avatar">{person.displayName.slice(0,2).toUpperCase()}</span><div><strong>{person.displayName}</strong><small>{person.email}</small></div><StatusBadge value={person.status.toUpperCase()}/><div className="user-meta"><small>Alta: {new Date(person.createdAt).toLocaleDateString("es")}</small>{person.mustChangePassword && <small>Contraseña temporal</small>}</div><button className="button button-secondary" disabled={person.uid === user?.uid} onClick={() => edit(person.uid, person.displayName, person.status)}>Gestionar</button></article>)}</div>
    {!users.length && <p className="panel users-empty">Todavía no hay usuarios disponibles.</p>}
    {open && <div className="modal-backdrop"><form className="modal" onSubmit={create}><div className="modal-head"><div><h2>Crear usuario</h2><p>Esta cuenta deberá cambiar su contraseña en el primer ingreso.</p></div><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Cerrar">×</button></div><div className="form-grid"><label className="field field-wide"><span>Nombre</span><input value={name} onChange={(event) => setName(event.target.value)} required minLength={2}/></label><label className="field field-wide"><span>Correo</span><input type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><label className="field field-wide"><span>Contraseña temporal</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6}/><small>Elige una contraseña temporal y compártela por un canal seguro.</small></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? "Creando…" : "Crear usuario"}</button></div></div></form></div>}
  </>;
}
