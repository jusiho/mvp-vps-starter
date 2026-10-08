import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../prisma/prisma.service';

/**
 * Better Auth corre DENTRO del API: registro, inicio de sesión, sesiones y,
 * cuando lo necesites, Google, magic links, 2FA u organizaciones (plugins).
 * La web y cualquier app móvil solo consumen /api/auth.
 *
 * Docs: https://www.better-auth.com/docs
 */

// Orígenes desde los que el navegador puede llamar a /api/auth.
const webOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(
  ',',
);

// En producción web y api son subdominios del mismo dominio: la cookie se
// emite para ".tudominio.com" y así la ven los dos. En local (localhost) no
// hace falta: el navegador comparte cookies entre puertos.
const cookieDomain = process.env.COOKIE_DOMAIN;

export const auth = betterAuth({
  // URL pública del API. Con https, las cookies salen como "secure".
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  trustedOrigins: webOrigins,
  // Rate limiting (activo en producción): identifica al cliente por la IP que
  // Caddy reenvía en X-Forwarded-For, que es la cabecera que lee por defecto.
  advanced: {
    crossSubDomainCookies: cookieDomain
      ? { enabled: true, domain: cookieDomain }
      : { enabled: false },
  },
});

export type Auth = typeof auth;
