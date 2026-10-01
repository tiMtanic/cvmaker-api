import type { NextFunction, Request, Response } from "express";
import jsonwebtoken, { type JwtPayload } from "jsonwebtoken";
import prisma from "../db/index.js";

type AuthPayload = {
  code: string;
  is_admin_code: boolean;
};

function getTokenSecret() {
  const secret = process.env.TOKEN_SECRET;

  if (!secret) {
    throw new Error("TOKEN_SECRET is not defined");
  }

  return secret;
}

function getCode(req: Request) {
  return typeof req.body?.code === "string" ? req.body.code.trim() : "";
}

function validateCode(code: string) {
  return code.length === 5;
}

function createAuthToken(payload: AuthPayload) {
  return jsonwebtoken.sign(payload, getTokenSecret(), {
    expiresIn: "7d",
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  return token || null;
}

function parseTokenPayload(decoded: string | JwtPayload): AuthPayload {
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

export const setup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const code = getCode(req);

    if (!validateCode(code)) {
      res.status(400).json({
        errorMessage: "Access code must contain exactly 5 characters",
      });
      return;
    }

    const [existingAdminCode, existingCode] = await Promise.all([
      prisma.access_code.findFirst({
        where: {
          is_admin_code: true,
        },
        select: {
          code: true,
        },
      }),

      prisma.access_code.findUnique({
        where: {
          code,
        },
        select: {
          code: true,
        },
      }),
    ]);

    if (existingAdminCode) {
      res.status(409).json({
        errorMessage: "Initial setup has already been completed",
      });
      return;
    }

    if (existingCode) {
      res.status(409).json({
        errorMessage: "This access code already exists",
      });
      return;
    }

    const createdAccessCode = await prisma.access_code.create({
      data: {
        code,
        is_admin_code: true,
      },
      select: {
        code: true,
        is_admin_code: true,
      },
    });

    const payload: AuthPayload = {
      code: createdAccessCode.code,
      is_admin_code: createdAccessCode.is_admin_code,
    };

    const authToken = createAuthToken(payload);

    res.status(201).json({
      authToken,
      payload,
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const code = getCode(req);

    if (!validateCode(code)) {
      res.status(400).json({
        errorMessage: "A valid 5-character access code is required",
      });
      return;
    }

    const accessCode = await prisma.access_code.findUnique({
      where: {
        code,
      },
      select: {
        code: true,
        is_admin_code: true,
      },
    });

    if (!accessCode) {
      res.status(401).json({
        errorMessage: "Invalid access code",
      });
      return;
    }

    const payload: AuthPayload = {
      code: accessCode.code,
      is_admin_code: accessCode.is_admin_code,
    };

    const authToken = createAuthToken(payload);

    res.status(200).json({
      authToken,
      payload,
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminCode = await prisma.access_code.findFirst({
      where: {
        is_admin_code: true,
      },
      select: {
        code: true,
      },
    });

    if (!adminCode) {
      res.status(428).json({
        errorCode: "SETUP_REQUIRED",
        errorMessage: "Initial setup is required",
      });
      return;
    }

    const token = getBearerToken(req);

    if (!token) {
      res.status(401).json({
        errorCode: "AUTH_TOKEN_REQUIRED",
        errorMessage: "Authorization token is required",
      });
      return;
    }

    const decoded = jsonwebtoken.verify(token, getTokenSecret());

    const payload = parseTokenPayload(decoded);

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

    res.status(200).json({
      payload: {
        code: accessCode.code,
        is_admin_code: accessCode.is_admin_code,
      },
    });
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
