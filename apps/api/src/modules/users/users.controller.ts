import { Controller, Get } from '@nestjs/common';
// `type` es obligatorio: UserSession solo existe en tiempo de compilación y el
// decorador @Session() emite metadatos de los parámetros.
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

/**
 * Ejemplo de ruta protegida. El guard global ya exige sesión: si no hay
 * cookie válida responde 401 antes de llegar aquí. `@Session()` entrega el
 * usuario autenticado; usa `session.user.id` para filtrar sus datos.
 */
@Controller('users')
export class UsersController {
  // GET /users/me -> { id, email, name }
  @Get('me')
  me(@Session() session: UserSession) {
    const { id, email, name } = session.user;
    return { id, email, name };
  }
}
