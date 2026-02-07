import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import http from "http";
import cookieParser from "cookie-parser";
import fs from "fs";
import { Config } from "./config";
import api from "./bootstrap";
import { errorHandler } from "./middleware/error-handler";
import listEndpoints from "express-list-endpoints";
const app = express();
const server = http.createServer(app);

// ------- Middleware -------
app.disable("x-powered-by");

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//   }),
// );

app.use(cors());

app.use(morgan("dev"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.set("trust proxy", true);

const cfg = new Config();

app.use("/api", api);
app.use(errorHandler);

server.listen(cfg.common.PORT, async () => {
  console.log(`HTTP listening on ${cfg.common.PORT}`);
  console.log(`BASE_URL: ${cfg.common.BASE_URL}`);

  const routes = listEndpoints(app);

  // --- Logic Grouping Spesifik Module ---
  const groupedRoutes = routes.reduce(
    (acc, route) => {
      const parts = route.path.split("/").filter(Boolean); // Buang string kosong
      let groupName = "Root / Global";

      if (parts.length > 0) {
        // Cek apakah diawali 'api' dan punya nama module setelahnya
        if (parts[0] === "api" && parts.length >= 2) {
          // Contoh: /api/app, /api/transaction
          groupName = `Module: /${parts[0]}/${parts[1]}`;
        } else {
          // Contoh: /__version, /health
          groupName = `Misc: /${parts[0]}`;
        }
      }

      if (!acc[groupName]) {
        acc[groupName] = [];
      }

      acc[groupName].push({
        path: route.path,
        methods: route.methods.join(", "),
      });

      return acc;
    },
    {} as Record<string, Array<{ path: string; methods: string }>>,
  );

  // --- Print Table ---
  console.log("\n--- Registered Routes (By Module) ---");

  Object.keys(groupedRoutes)
    .sort()
    .forEach((groupName) => {
      console.log(`\n📂 ${groupName}`);
      console.table(groupedRoutes[groupName]);
    });
});
