import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthenticatedUser();

  redirect(user ? "/scoreboard" : "/login");
}
