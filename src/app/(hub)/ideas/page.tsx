"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button, EmptyState, Field, Modal, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/context/workspace-context";
import { ideaCategories, isVotingOpen } from "@/lib/idea-voting";
import { categoryPresentation, getCategoryPresentation, statusPresentation } from "@/lib/idea-presentation";
import type { Idea, IdeaStatus, IdeaVote } from "@/types";

const initial = { title: "", description: "", category: "Juegos", status: "IDEA" as IdeaStatus, referenceImages: [] as string[] };
const filterOptions = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobado" },
  { value: "REJECTED", label: "Rechazado" },
];

function matchesFilter(idea: Idea, filter: string) {
  if (filter === "ALL") return true;
  if (filter === "PENDING") return idea.status === "IDEA" || idea.status === "VALIDATING";
  return idea.status === filter;
}

async function optimizeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Solo puedes agregar archivos de imagen.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagen debe pesar menos de 8 MB.");
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  let quality = 0.76;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 230_000 && quality > 0.4) { quality -= 0.08; result = canvas.toDataURL("image/jpeg", quality); }
  if (result.length > 230_000) throw new Error("La imagen es demasiado compleja. Prueba con una más pequeña.");
  return result;
}

function ActionsMenu({ idea, onEdit, onConvert, onDelete }: { idea: Idea; onEdit: () => void; onConvert: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    firstAction.current?.focus();
    const closeOutside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeWithEscape); };
  }, [open]);
  const run = (action: () => void) => { setOpen(false); action(); };
  return <div className="idea-actions" ref={root}>
    <button className="idea-actions-trigger" type="button" aria-label={`Acciones para ${idea.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Icon name="more" width={19}/></button>
    {open && <div className="idea-actions-menu" role="menu">
      <button ref={firstAction} type="button" role="menuitem" onClick={() => run(onEdit)}><Icon name="edit" width={15}/>Editar</button>
      {idea.status === "APPROVED" && <button type="button" role="menuitem" onClick={() => run(onConvert)}><Icon name="convert" width={15}/>Convertir en proyecto</button>}
      <button type="button" role="menuitem" className="danger" onClick={() => run(onDelete)}><Icon name="trash" width={15}/>Eliminar</button>
    </div>}
  </div>;
}

export default function IdeasPage() {
  const { ideas, saveIdea, deleteIdea, convertIdea, user, team, ideaVotes, voteIdea } = useWorkspace();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null);
  const [form, setForm] = useState(initial);
  const counters = useMemo(() => [
    { label: "Total de ideas", value: ideas.length, icon: "ideas", tone: "slate" },
    { label: "En votación", value: ideas.filter(isVotingOpen).length, icon: "vote", tone: "violet" },
    { label: "Aprobadas", value: ideas.filter((idea) => idea.status === "APPROVED").length, icon: "check", tone: "green" },
    { label: "Rechazadas", value: ideas.filter((idea) => idea.status === "REJECTED").length, icon: "reject", tone: "red" },
  ], [ideas]);
  const visible = useMemo(() => ideas.filter((idea) => matchesFilter(idea, filter)
    && (categoryFilter === "ALL" || idea.category === categoryFilter)
    && `${idea.title} ${idea.description} ${idea.category}`.toLowerCase().includes(query.toLowerCase())), [ideas, filter, categoryFilter, query]);

  const showForm = (idea?: Idea) => {
    setEditing(idea ?? null);
    setForm(idea ? { title: idea.title, description: idea.description, category: ideaCategories.some((category) => category === idea.category) ? idea.category : "", status: idea.status, referenceImages: idea.referenceImages ?? [] } : initial);
    setError(""); setOpen(true);
  };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await saveIdea(form, editing?.id); setOpen(false); setError(""); } catch { setError("No se pudo guardar la idea. Inténtalo de nuevo."); } };
  const remove = async (idea: Idea) => { if (window.confirm(`¿Eliminar la idea “${idea.title}”?`)) await deleteIdea(idea.id); };
  const addImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []); event.target.value = "";
    if (form.referenceImages.length + files.length > 3) { setError("Puedes agregar hasta 3 imágenes de referencia."); return; }
    try { const images = await Promise.all(files.map(optimizeImage)); setForm((current) => ({ ...current, referenceImages: [...current.referenceImages, ...images] })); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudieron procesar las imágenes."); }
  };
  const vote = async (id: string, choice: IdeaVote) => { setPending(id); setError(""); try { await voteIdea(id, choice); } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo registrar el voto."); } finally { setPending(null); } };

  return <>
    <PageHeader eyebrow="Explorar oportunidades" title="Ideas" description="Captura, valida y transforma posibilidades en proyectos concretos." action={<Button icon="plus" onClick={() => showForm()}>Nueva idea</Button>} />
    <section className="idea-summary" aria-label="Resumen de ideas">{counters.map((counter) => <article className={`idea-counter tone-${counter.tone}`} key={counter.label}><span><Icon name={counter.icon} width={18}/></span><div><small>{counter.label}</small><strong>{counter.value}</strong></div></article>)}</section>
    <div className="ideas-toolbar">
      <div className="search-box"><Icon name="search" width={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, categoría o descripción…" aria-label="Buscar ideas"/></div>
      <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filtrar por estado">{filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <select className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoría"><option value="ALL">Todas las categorías</option>{ideaCategories.map((category) => <option key={category} value={category}>{categoryPresentation[category].label}</option>)}</select>
    </div>
    <p className="voting-note">Voto anónimo, una vez por miembro. La votación cierra al alcanzar 2 likes o 2 dislikes.</p>
    {error && !open && <p role="alert" className="ideas-error">{error}</p>}
    {visible.length ? <section className="ideas-grid" aria-label="Ideas">{visible.map((idea) => {
      const category = getCategoryPresentation(idea.category);
      const status = statusPresentation[idea.status];
      const likes = idea.likes ?? 0;
      const dislikes = idea.dislikes ?? 0;
      const leadingVotes = Math.max(likes, dislikes);
      const image = idea.referenceImages?.[0];
      const votingDisabled = pending !== null || !user || !team.some((member) => member.id === user.id && member.status === "ACTIVE") || idea.authorId === user.id || Boolean(ideaVotes[idea.id]) || !isVotingOpen(idea);
      return <article className="idea-card" data-status={idea.status.toLowerCase()} key={idea.id}>
        {image ? <button type="button" className="idea-card-media" onClick={() => setViewingImage({ src: image, alt: `Imagen de referencia de ${idea.title}` })} aria-label={`Ampliar imagen de ${idea.title}`}><Image src={image} alt={`Imagen de referencia de ${idea.title}`} fill unoptimized sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"/></button> : <div className={`idea-card-media idea-placeholder tone-${category.tone}`} role="img" aria-label={`Sin imagen de referencia. Categoría ${category.label}`}><Icon name={category.icon} width={42}/><span>{category.label}</span></div>}
        <div className="idea-card-body">
          <div className="idea-card-top"><span className={`idea-category tone-${category.tone}`}><Icon name={category.icon} width={14}/>{category.label}</span><ActionsMenu idea={idea} onEdit={() => showForm(idea)} onConvert={() => convertIdea(idea.id)} onDelete={() => remove(idea)}/></div>
          <h2>{idea.title}</h2><p className="idea-card-description">{idea.description}</p>
          <div className="idea-card-meta"><span className={`idea-status tone-${status.tone}`}><Icon name={status.icon} width={13}/>{status.label}</span><span className="idea-author"><i>{idea.authorName.slice(0, 1).toUpperCase()}</i>{idea.authorName}</span></div>
          <div className="idea-voting-progress"><div className="idea-vote-counts"><span>👍 {likes}</span><span>👎 {dislikes}</span><small>{isVotingOpen(idea) ? `${leadingVotes} de 2 para decidir` : "Votación cerrada"}</small></div><div className="idea-progress-track" role="progressbar" aria-label="Progreso de votación" aria-valuemin={0} aria-valuemax={2} aria-valuenow={Math.min(2, leadingVotes)}><span style={{ width: `${Math.min(100, leadingVotes * 50)}%` }}/></div></div>
          <div className="idea-vote-actions">{(["like", "dislike"] as const).map((choice) => <button key={choice} type="button" className="vote-button" aria-pressed={ideaVotes[idea.id] === choice} disabled={votingDisabled} onClick={() => vote(idea.id, choice)}>{choice === "like" ? "👍 Like" : "👎 Dislike"}</button>)}<small>{ideaVotes[idea.id] ? "Voto registrado" : idea.authorId === user?.id && isVotingOpen(idea) ? "Tu equipo vota esta idea" : ""}</small></div>
        </div>
      </article>;
    })}</section> : <section className="panel"><EmptyState title="No hay ideas que mostrar" text="Crea una nueva idea o cambia los filtros de búsqueda."/></section>}

    <Modal open={Boolean(viewingImage)} onClose={() => setViewingImage(null)} title="Imagen de referencia">{viewingImage && <div className="idea-image-viewer"><Image src={viewingImage.src} alt={viewingImage.alt} fill unoptimized sizes="min(90vw, 900px)"/></div>}</Modal>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar idea" : "Nueva idea"} subtitle="Registra lo esencial. Siempre podrás ampliarlo después.">
      <form className="form-grid" onSubmit={submit}>{error && <p role="alert" className="field-wide ideas-error">{error}</p>}
        <Field label="Título"><input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Una idea clara y breve" autoFocus/></Field>
        <Field label="Categoría"><select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="" disabled>Selecciona una categoría</option>{ideaCategories.map((category) => <option key={category} value={category}>{categoryPresentation[category].label}</option>)}</select></Field>
        <div className="field-wide"><Field label="Descripción"><textarea required maxLength={600} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="¿Qué problema resuelve y para quién?"/></Field></div>
        <div className="field-wide"><Field label="Imágenes de referencia (opcional)"><input type="file" accept="image/*" multiple onChange={addImages} disabled={form.referenceImages.length >= 3}/></Field><small className="image-help">Hasta 3 imágenes. Se optimizan antes de guardarse.</small>{Boolean(form.referenceImages.length) && <div className="image-preview-grid">{form.referenceImages.map((image, index) => <div className="image-preview" key={index}><Image src={image} alt={`Vista previa ${index + 1}`} fill unoptimized sizes="86px"/><button type="button" onClick={() => setForm((current) => ({ ...current, referenceImages: current.referenceImages.filter((_, imageIndex) => imageIndex !== index) }))} aria-label={`Quitar imagen ${index + 1}`}>×</button></div>)}</div>}</div>
        <div className="field-wide voting-note">El estado se actualiza automáticamente con los votos del equipo.</div>
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Guardar cambios" : "Crear idea"}</Button></div>
      </form>
    </Modal>
  </>;
}
