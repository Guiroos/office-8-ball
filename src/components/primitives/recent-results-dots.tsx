import { cn } from "@/lib/utils";

interface RecentResultsDotsProps {
  results: Array<"win" | "loss" | "none">;
  teamName: string;
  className?: string;
}

export function RecentResultsDots({ results, teamName, className }: RecentResultsDotsProps) {
  const slots = [...results, ...Array.from({ length: Math.max(0, 5 - results.length) }, () => "none" as const)];

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Últimas 5 partidas de ${teamName}`}
    >
      {slots.map((result, index) => (
        <span
          key={`${teamName}-${index}`}
          aria-label={
            result === "win"
              ? `Partida ${index + 1}: vitória`
              : result === "loss"
                ? `Partida ${index + 1}: derrota`
                : `Partida ${index + 1}: sem histórico`
          }
          className={cn(
            "block h-2.5 w-2.5 rounded-full border",
            result === "win" && "border-primary/70 bg-primary",
            result === "loss" && "border-danger/70 bg-danger",
            result === "none" && "border-border bg-surface-muted",
          )}
        />
      ))}
    </div>
  );
}
