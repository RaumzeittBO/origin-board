import type { Idea, IdeaVote } from "../types";
export const ideaCategories = ["Juegos", "Software", "Pagina Web", "Apps", "Upgrade"] as const;
export const isVotingOpen = (idea: Idea) => idea.status === "IDEA" || idea.status === "VALIDATING";
export function applyIdeaVote(idea: Idea, userId: string, vote: IdeaVote, alreadyVoted: boolean): Idea {
  if (vote !== "like" && vote !== "dislike") throw new Error("Voto inválido.");
  if (idea.authorId === userId) throw new Error("No puedes votar tu propia idea.");
  if (alreadyVoted) throw new Error("Ya votaste esta idea.");
  if (!isVotingOpen(idea)) throw new Error("La votación de esta idea ya está cerrada.");
  const likes = (idea.likes ?? 0) + Number(vote === "like");
  const dislikes = (idea.dislikes ?? 0) + Number(vote === "dislike");
  return { ...idea, likes, dislikes, status: likes >= 2 ? "APPROVED" : dislikes >= 2 ? "REJECTED" : idea.status, updatedAt: new Date().toISOString() };
}
