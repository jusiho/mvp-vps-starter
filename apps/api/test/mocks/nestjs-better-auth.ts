/**
 * Doble de @thallesp/nestjs-better-auth para los tests.
 *
 * Jest (CommonJS) no puede cargar Better Auth, que es solo ESM, así que el
 * `moduleNameMapper` de package.json y test/jest-e2e.json apunta aquí.
 * Resultado: en tests no hay guard (todas las rutas abiertas) y `@Session()`
 * entrega TEST_USER, o `req.session` si un test lo define.
 */
import {
  createParamDecorator,
  ExecutionContext,
  Module,
  SetMetadata,
} from '@nestjs/common';

export const TEST_USER = {
  id: 'test-user',
  email: 'test@example.com',
  name: 'Usuario de prueba',
};

export type UserSession = {
  user: typeof TEST_USER;
  session: { id: string; userId: string };
};

export const TEST_SESSION: UserSession = {
  user: TEST_USER,
  session: { id: 'test-session', userId: TEST_USER.id },
};

export const AllowAnonymous = () => SetMetadata('allowAnonymous', true);
export const OptionalAuth = () => SetMetadata('optionalAuth', true);

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserSession => {
    const req = ctx.switchToHttp().getRequest<{ session?: UserSession }>();
    return req.session ?? TEST_SESSION;
  },
);

export class AuthGuard {
  canActivate() {
    return true;
  }
}

export class AuthService {}

@Module({})
export class AuthModule {
  static forRoot() {
    return { module: AuthModule };
  }
}
