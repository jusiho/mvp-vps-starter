/**
 * Doble de `better-auth` y `better-auth/adapters/prisma` para los tests.
 * Ver test/mocks/nestjs-better-auth.ts para el porqué.
 */
export const betterAuth = (options: unknown) => ({ options, api: {} });
export const prismaAdapter = () => ({});
