import type { NextFunction, Request, Response } from "express";
import prisma from "../db/index.js";

export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        profile_info_id: true,
        title: true,
        category: true,
        description: true,
        external_url: true,
        file_name: true,
        file_mime_type: true,
        issue_date: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(
      documents.map((item) => ({
        ...item,
        issue_date: item.issue_date
          ? item.issue_date.toISOString().slice(0, 10)
          : null,
      })),
    );
  } catch (error) {
    next(error);
  }
};

export const getDocumentFile = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json({
        message: "Invalid document id",
      });
      return;
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        file_content: true,
        file_name: true,
        file_mime_type: true,
      },
    });

    if (!document) {
      res.status(404).json({
        message: "Document not found",
      });
      return;
    }

    if (!document.file_content) {
      res.status(404).json({
        message: "Document has no attached file",
      });
      return;
    }

    res.setHeader(
      "Content-Type",
      document.file_mime_type ?? "application/octet-stream",
    );

    if (document.file_name) {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${document.file_name}"`,
      );
    }

    res.send(Buffer.from(document.file_content));
  } catch (error) {
    next(error);
  }
};
