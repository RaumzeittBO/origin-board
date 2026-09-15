"use client";

import { useEffect } from "react";
import { Icon } from "./icons";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function Button({ children, variant = "primary", icon, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; icon?: string }) {
  return <button className={`button button-${variant}`} {...props}>{icon && <Icon name={icon} width={17} />}{children}</button>;
}

export function Modal({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><Icon name="close" width={20}/></button></div>{children}</div></div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

export function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><div className="empty-orbit">O</div><h3>{title}</h3><p>{text}</p></div>; }

const labels: Record<string, string> = { IDEA: "Idea", VALIDATING: "Validando", APPROVED: "Aprobada", REJECTED: "Rechazada", CONVERTED_TO_PROJECT: "Convertida", PLANNING: "Planificación", IN_PROGRESS: "En progreso", TESTING: "Pruebas", PAUSED: "Pausado", COMPLETED: "Completado", TODO: "Por hacer", REVIEW: "Revisión", DONE: "Hecha", LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", ACTIVE: "Activo", INACTIVE: "Inactivo" };
export function StatusBadge({ value }: { value: string }) { return <span className={`status status-${value.toLowerCase()}`}>{labels[value] ?? value}</span>; }
export const labelFor = (value: string) => labels[value] ?? value;
