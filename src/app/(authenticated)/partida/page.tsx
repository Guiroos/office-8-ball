import type { Metadata } from "next";

import { Partida } from "@/components/partida";

export const metadata: Metadata = {
  title: "Nova Partida | Office 8 Ball",
  description: "Registre o resultado de uma partida entre times.",
};

export default function PartidaPage() {
  return <Partida />;
}
