import type { IdeaStatus } from "@/types";

export const categoryPresentation: Record<string, { label: string; icon: string; tone: string }> = {
  Juegos: { label: "Juegos", icon: "game", tone: "violet" },
  Software: { label: "Software", icon: "code", tone: "blue" },
  "Pagina Web": { label: "Página Web", icon: "globe", tone: "teal" },
  Apps: { label: "Apps", icon: "phone", tone: "orange" },
  Upgrade: { label: "Upgrade", icon: "upgrade", tone: "amber" },
};

export const statusPresentation: Record<IdeaStatus, { label: string; icon: string; tone: string }> = {
  IDEA: { label: "Pendiente", icon: "ideas", tone: "slate" },
  VALIDATING: { label: "En votación", icon: "vote", tone: "violet" },
  APPROVED: { label: "Aprobada", icon: "check", tone: "green" },
  REJECTED: { label: "Rechazada", icon: "reject", tone: "red" },
  CONVERTED_TO_PROJECT: { label: "Convertida", icon: "convert", tone: "blue" },
};

export const getCategoryPresentation = (category: string) => categoryPresentation[category] ?? {
  label: category,
  icon: "ideas",
  tone: "slate",
};
