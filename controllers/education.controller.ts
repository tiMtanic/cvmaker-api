import type { NextFunction, Request, Response } from "express";

import prisma from "../db/index.js";

export const getEducation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const education = await prisma.education.findMany({
      orderBy: {
        start_date: "desc",
      },
    });

    res.json(
      education.map((item) => ({
        ...item,

        start_date: item.start_date.toISOString().slice(0, 10),

        end_date: item.end_date
          ? item.end_date.toISOString().slice(0, 10)
          : null,
      })),
    );
  } catch (error) {
    next(error);
  }
};
