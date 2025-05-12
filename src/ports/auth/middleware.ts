import { Request, Response, NextFunction } from "express";
import { AuthPort } from "./types";
import { RequestHandler } from "express";
import { AppDeps } from "../../core/types";

// 인증이 필요없는 경로 목록
const PUBLIC_PATHS = ["/health", "/api/auth/register", "/api/auth/login"];

export const createAuthMiddleware = (authPort: AuthPort): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // 공개 경로는 인증 검사 건너뛰기
    if (PUBLIC_PATHS.includes(req.path)) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "No authorization header",
      });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Invalid authorization header format",
      });
      return;
    }

    try {
      const deps: AppDeps = {
        db: req.app.locals["db"],
        authPort,
      };

      const result = await authPort.validateToken(token)(deps)();

      if ("left" in result) {
        res.status(401).json({
          code: "UNAUTHORIZED",
          message: result.left.message,
        });
        return;
      }

      req.user = result.right;
      next();
    } catch (error) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "인증 처리 중 오류가 발생했습니다.",
      });
    }
  };
};
