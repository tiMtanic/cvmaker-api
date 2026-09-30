import express, { type Express } from "express";
import logger from "morgan";
import cors from "cors";

function config(app: Express): void {
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.ORIGIN,
    }),
  );
  app.use(logger("dev"));
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: false }));
}

export default config;
