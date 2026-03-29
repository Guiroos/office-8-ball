import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const authRequired = Boolean(process.env.DATABASE_URL?.trim());

export default async function proxy(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scoreboard",
    "/times/:path*",
    "/ranking/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/head-to-head/:path*",
  ],
};
