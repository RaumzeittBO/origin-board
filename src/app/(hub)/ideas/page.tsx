"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, Field, Modal, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/context/workspace-context";
import type { Idea, IdeaStatus } from "@/types";

const statuses: IdeaStatus[] = ["IDEA", "VALIDATING", "APPROVED", "REJECTED", "CONVERTED_TO_PROJECT"];
const initial = { title: "", description: "", category: "Producto digital", status: "IDEA" as IdeaStatus };

export default function IdeasPage() {
  const { ideas, saveIdea, deleteIdea, convertIdea } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [form, setForm] = useState(initial);
  const visible = useMemo(() => ideas.filter((idea) => (filter === "ALL" || idea.status === filter) && `${idea.title} ${idea.description} ${idea.category}`.toLowerCase().includes(query.toLowerCase())), [ideas, filter, query]);

  const showForm = (idea?: Idea) => { setEditing(idea ?? null); setForm(idea ? { title: idea.title, description: idea.description, category: idea.category, status: idea.status } : initial); setOpen(true); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await saveIdea(form, editing?.id); setOpen(false); };
  const remove = async (idea: Idea) => { if (window.confirm(`¿Eliminar la idea “${idea.title}”?`)) await deleteIdea(idea.id); };

  return <>
    <PageHeader eyebrow="Explorar oportunidades" title="Ideas" description="Captura, valida y transforma posibilidades en proyectos concretos." action={<Button icon="plus" onClick={() => showForm()}>Nueva idea</Button>} />
    <div className="toolbar"><div className="search-box"><Icon name="search" width={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título, categoría o descripción…" aria-label="Buscar ideas"/></div><select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrar por estado"><option value="ALL">Todos los estados</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></div>
    <section className="panel entity-list">
      <div className="entity-row table-head"><span>Idea</span><span>Categoría</span><span>Estado</span><span>Autor</span><span>Acciones</span></div>
      {visible.map((idea) => <div className="entity-row" key={idea.id}><div className="entity-main"><strong>{idea.title}</strong><p>{idea.description}</p></div><div className="entity-meta"><small>Categoría</small>{idea.category}</div><div><StatusBadge value={idea.status}/></div><div className="entity-meta"><small>Autor</small>{idea.authorName}</div><div className="row-actions"><button className="text-button" onClick={() => showForm(idea)}>Editar</button>{idea.status !== "CONVERTED_TO_PROJECT" && <button className="text-button" onClick={() => convertIdea(idea.id)}>Convertir</button>}<button className="text-button danger-text" onClick={() => remove(idea)}>Eliminar</button></div></div>)}
      {!visible.length && <EmptyState title="No hay ideas que mostrar" text="Crea una nueva idea o cambia los filtros de búsqueda."/>}
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar idea" : "Nueva idea"} subtitle="Registra lo esencial. Siempre podrás ampliarlo después."><form className="form-grid" onSubmit={submit}><Field label="Título"><input required maxLength={100} value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} placeholder="Una idea clara y breve" autoFocus/></Field><Field label="Categoría"><input required maxLength={50} value={form.category} onChange={(e) => setForm({...form,category:e.target.value})}/></Field><div className="field-wide"><Field label="Descripción"><textarea required maxLength={600} value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="¿Qué problema resuelve y para quién?"/></Field></div><Field label="Estado"><select value={form.status} onChange={(e) => setForm({...form,status:e.target.value as IdeaStatus})}>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></Field><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Guardar cambios" : "Crear idea"}</Button></div></form></Modal>
  </>;
}
