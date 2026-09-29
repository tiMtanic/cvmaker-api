import type { NextFunction, Request, Response } from "express";

import prisma from "../db/index.js";

export const getSkills = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    res.json(skills);
  } catch (error) {
    next(error);
  }
};
