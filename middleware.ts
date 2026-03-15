import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const authRequired = Boolean(process.env.DATABASE_URL?.trim());
const authSecret = process.env.NEXTAUTH_SECRET?.trim();
const AUTH_SECRET_CONFIGURATION_ERROR =
  "Configuracao de autenticacao invalida: defina NEXTAUTH_SECRET para usar o login.";

if (authRequired && !authSecret) {
  throw new Error(AUTH_SECRET_CONFIGURATION_ERROR);
}

const protectedMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
  secret: authSecret ?? "auth-disabled-no-database",
});

export default authRequired
  ? protectedMiddleware
  : function disabledAuthMiddleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/scoreboard"],
};
