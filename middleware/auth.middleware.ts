import type { NextFunction, Request, Response } from "express";
import jsonwebtoken, { type JwtPayload } from "jsonwebtoken";
import prisma from "../db/index.js";

export type AuthPayload = {
  code: string;
  is_admin_code: boolean;
};

export type AuthenticatedRequest = Request & {
  auth?: AuthPayload;
};

function getTokenSecret() {
  const secret = process.env.TOKEN_SECRET;

  if (!secret) {
    throw new Error("TOKEN_SECRET is not defined");
  }

  return secret;
}

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function parsePayload(decoded: string | JwtPayload): AuthPayload {
  if (
    typeof decoded === "string" ||
    typeof decoded.code !== "string" ||
    typeof decoded.is_admin_code !== "boolean"
  ) {
    throw new jsonwebtoken.JsonWebTokenError("Invalid token payload");
  }

  return {
    code: decoded.code,
    is_admin_code: decoded.is_admin_code,
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      res.status(401).json({
        errorCode: "AUTH_TOKEN_REQUIRED",
        errorMessage: "Authorization token is required",
      });
      return;
    }

    const decoded = jsonwebtoken.verify(token, getTokenSecret(), {
      algorithms: ["HS256"],
    });

    const payload = parsePayload(decoded);

    const accessCode = await prisma.access_code.findUnique({
      where: {
        code: payload.code,
      },
      select: {
        code: true,
        is_admin_code: true,
      },
    });

    if (!accessCode) {
      res.status(401).json({
        errorCode: "INVALID_ACCESS_CODE",
        errorMessage: "Access code is no longer valid",
      });
      return;
    }

    if (accessCode.is_admin_code !== payload.is_admin_code) {
      res.status(401).json({
        errorCode: "TOKEN_PERMISSIONS_CHANGED",
        errorMessage: "Token permissions are no longer valid",
      });
      return;
    }

    req.auth = {
      code: accessCode.code,
      is_admin_code: accessCode.is_admin_code,
    };

    next();
  } catch (error) {
    if (error instanceof jsonwebtoken.TokenExpiredError) {
      res.status(401).json({
        errorCode: "TOKEN_EXPIRED",
        errorMessage: "Token has expired",
      });
      return;
    }

    if (error instanceof jsonwebtoken.JsonWebTokenError) {
      res.status(401).json({
        errorCode: "INVALID_TOKEN",
        errorMessage: "Invalid token",
      });
      return;
    }

    next(error);
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.auth?.is_admin_code) {
    res.status(403).json({
      errorCode: "ADMIN_REQUIRED",
      errorMessage: "Administrator access is required",
    });
    return;
  }

  next();
};
