import { User } from '../../core/domain/user'
import { AppRTE } from '../../core/types'

export interface AuthenticatedUser extends User {
  roles: string[];
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

export interface AuthPort {
  validateToken(token: string): AppRTE<AuthError, AuthenticatedUser>;
  generateToken(user: AuthenticatedUser): AppRTE<AuthError, string>;
  requireRole(
    roles: string[]
  ): (req: any, res: any, next: any) => Promise<void>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
