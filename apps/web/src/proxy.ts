import { NextResponse, type NextRequest } from "next/server";

// Chequeo optimista de sesión: solo mira si existe la cookie, sin tocar la
// base de datos. La verificación real la hace getSession() en cada página
// privada. Agrega aquí las rutas que requieren sesión.
const protectedRoutes = ["/dashboard", "/notes"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");

  if (!hasSession && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*", "/login", "/register"],
};
