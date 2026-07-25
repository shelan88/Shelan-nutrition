/**
 * api/server.js  —  Local Express server for Replit development.
 *
 * Imports the same handler functions that Vercel deploys as Serverless
 * Functions, wires them into Express, and starts a long-running listener.
 * Nothing is duplicated — all business logic lives in the individual
 * function files (api/delete-account.js, api/health.js).
 *
 * Vercel never executes this file; it reads api/delete-account.js and
 * api/health.js directly via its file-system function routing.
 */

import express from "express";
import deleteAccountHandler from "./delete-account.js";
import healthHandler        from "./health.js";

const app = express();
app.use(express.json());

// Wire handlers — method restriction is also enforced inside each handler,
// but Express's method-specific mounts provide an extra layer locally.
app.post("/api/delete-account", deleteAccountHandler);
app.get("/api/health",          healthHandler);

const PORT = process.env.API_PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[api] Server listening on port ${PORT}`);
});
