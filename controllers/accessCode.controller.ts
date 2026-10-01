import type { NextFunction, Request, Response } from "express";
import prisma from "../db/index.js";

function getRequiredCode(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

export const getAccessCodes = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessCodes = await prisma.access_code.findMany({
      orderBy: [
        {
          is_admin_code: "desc",
        },
        {
          company: "asc",
        },
        {
          code: "asc",
        },
      ],
      select: {
        code: true,
        company: true,
        is_admin_code: true,
      },
    });

    res.status(200).json(accessCodes);
  } catch (error) {
    next(error);
  }
};

export const createAccessCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const code = getRequiredCode(req.body?.code);

    const company = getOptionalText(req.body?.company);

    if (code.length !== 5) {
      res.status(400).json({
        errorMessage: "Access code must contain exactly 5 characters",
      });
      return;
    }

    const existingCode = await prisma.access_code.findUnique({
      where: {
        code,
      },
      select: {
        code: true,
      },
    });

    if (existingCode) {
      res.status(409).json({
        errorMessage: "This access code already exists",
      });
      return;
    }

    const accessCode = await prisma.access_code.create({
      data: {
        code,
        company,
        is_admin_code: false,
      },
      select: {
        code: true,
        company: true,
        is_admin_code: true,
      },
    });

    res.status(201).json(accessCode);
  } catch (error) {
    next(error);
  }
};

export const deleteAccessCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const code = getRequiredCode(req.params.code);

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
      res.status(404).json({
        errorMessage: "Access code not found",
      });
      return;
    }

    if (accessCode.is_admin_code) {
      res.status(403).json({
        errorCode: "ADMIN_CODE_CANNOT_BE_DELETED",
        errorMessage: "The administrator access code cannot be deleted",
      });
      return;
    }

    await prisma.access_code.delete({
      where: {
        code,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
