import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCurrentUser } from "./current-user.js";
import { errorResponse } from "./http-errors.js";
import { getVisibleRequest, listVisibleRequests } from "./requests.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, "../../client/dist");

export function createApp({ db }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/users", (_request, response) => {
    const users = db.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE active = 1
      ORDER BY
        CASE role WHEN 'employee' THEN 1 WHEN 'reviewer' THEN 2 ELSE 3 END,
        name
    `).all();
    response.json({ data: users });
  });

  app.get("/api/categories", (_request, response) => {
    const categories = db.prepare("SELECT id, name FROM categories ORDER BY name").all();
    response.json({ data: categories });
  });

  app.get("/api/requests", (request, response, next) => {
    try {
      const user = getCurrentUser(db, request.query.currentUserId);
      response.json({ data: listVisibleRequests(db, user), meta: { currentUser: user } });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/requests/:id", (request, response, next) => {
    try {
      const user = getCurrentUser(db, request.query.currentUserId);
      response.json({ data: getVisibleRequest(db, user, request.params.id) });
    } catch (error) {
      next(error);
    }
  });

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("/{*path}", (_request, response) => {
      response.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json(errorResponse({
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON.",
      }));
    }
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error);
    return response.status(status).json(errorResponse(error));
  });

  return app;
}
