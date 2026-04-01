export function formatMatchDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date as string));
}

export function formatLastPlayedAt(value: string | null): string {
  if (!value) return "Sem partidas ainda";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function formatTeamType(type: "solo" | "duo"): string {
  return type === "solo" ? "Solo" : "Duplas";
}
