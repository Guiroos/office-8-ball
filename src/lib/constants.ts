export const TEAMS = [
  {
    id: "frontend",
    name: "frontend",
    displayName: "Frontend",
    roster: "Gui + Jean",
    accent: "var(--frontend)",
    accentSoft: "var(--frontend-soft)",
    slogan: "Empurra feature e bola no mesmo sprint.",
  },
  {
    id: "backend",
    name: "backend",
    displayName: "Backend",
    roster: "Adair + Richard",
    accent: "var(--backend)",
    accentSoft: "var(--backend-soft)",
    slogan: "Consistentes ate quando o deploy cai.",
  },
] as const;

export const WIN_MESSAGES = {
  frontend: [
    "Frontend ganhou. Backend abriu um ticket para investigar.",
    "Jean chamou de responsivo. A mesa concordou.",
    "Mais uma para o pixel perfect da sinuca.",
  ],
  backend: [
    "Backend levou. Frontend vai culpar a iluminação.",
    "Richard chamou de regra de negócio e encerrou a discussão.",
    "Adair versionou a humilhação em produção.",
  ],
} as const;
