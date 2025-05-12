import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as RTE from "fp-ts/ReaderTaskEither";
import { AuthPort, AuthenticatedUser, AuthError } from "./types";
import { AppDeps, AppRTE } from "../../core/types";

interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface Auth {
  validateToken(token: string): Promise<TokenPayload>;
  generateToken(payload: TokenPayload): Promise<string>;
}

export class AuthAdapter implements AuthPort {
  constructor(private readonly auth: Auth) {}

  validateToken = (token: string): AppRTE<AuthError, AuthenticatedUser> =>
    pipe(
      RTE.ask<AppDeps>(),
      RTE.chain((_) =>
        RTE.fromTaskEither(
          TE.tryCatch(
            () => this.auth.validateToken(token),
            (_) =>
              ({
                code: "INVALID_TOKEN",
                message: "Invalid or expired token",
              } as AuthError)
          )
        )
      ),
      RTE.chain((payload: TokenPayload) =>
        RTE.fromEither(
          E.right({
            id: payload.sub,
            email: payload.email,
            username: payload.username,
            roles: payload.roles || [],
            createdAt: new Date(payload.createdAt),
            updatedAt: new Date(payload.updatedAt),
          })
        )
      )
    );

  generateToken = (user: AuthenticatedUser): AppRTE<AuthError, string> =>
    pipe(
      RTE.ask<AppDeps>(),
      RTE.chain((_) =>
        RTE.fromTaskEither(
          TE.tryCatch(
            async () => {
              console.log("Generating token for user:", user);
              const token = await this.auth.generateToken({
                sub: user.id,
                email: user.email,
                username: user.username,
                roles: user.roles,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
              });
              console.log("Generated token:", token);
              return token;
            },
            (error) => {
              console.error("Token generation error:", error);
              return {
                code: "TOKEN_GENERATION_FAILED",
                message: "Failed to generate token",
              } as AuthError;
            }
          )
        )
      )
    );

  requireRole = (roles: string[]) => {
    return async (req: any, res: any, next: any) => {
      const user = req.user as AuthenticatedUser;

      if (!user) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const hasRequiredRole = roles.some((role) => user.roles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      next();
    };
  };
}
