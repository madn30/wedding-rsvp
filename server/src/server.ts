import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";

import connectDB from "./config/database";
import { errorHandler } from "./middlewares/errorHandler";
import { initWhatsAppClient } from "./whatsapp";
import { initScheduler } from "./services/schedulerService";
import guestRoutes from "./routes/guestRoutes";
import rsvpRoutes from "./routes/rsvpRoutes";
import statsRoutes from "./routes/statsRoutes";

import messageRoutes from "./routes/messageRoutes";
import tableRoutes from "./routes/tableRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import eventRoutes from "./routes/eventRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});
app.use(globalLimiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/guests", guestRoutes);
app.use("/api/rsvp", rsvpRoutes);
app.use("/api/stats", statsRoutes);

app.use("/api/messages", messageRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/events", eventRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use(errorHandler);

let server: http.Server;

const start = async () => {
  try {
    await connectDB();

    if (process.env.WHATSAPP_ENABLED === "true") {
      await initWhatsAppClient();
    }

    initScheduler();

    server = app.listen(PORT, () => {
      console.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("🔥 Fatal startup error:", error);
    process.exit(1);
  }
};
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

function shutdown() {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  start();
}

export default app;
