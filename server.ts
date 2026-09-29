import express, {
  type Request,
  type Response,
} from "express";
import config from "./config/index.js";
import indexRouter from "./routes/index.routes.js";
import handleErrors from "./errors/index.js";

try {
  process.loadEnvFile();
} catch {
  console.warn(".env file not found, using default environment values");
}

const app = express();

config(app);

app.get("/", (req: Request, res: Response) => {
  res.json("All good in here");
});

app.use("/api", indexRouter);

handleErrors(app);

const PORT = Number(process.env.PORT) || 5005;

app.listen(PORT, () => {
  console.log(`Server listening. Local access on http://localhost:${PORT}`);
});