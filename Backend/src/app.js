import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { testConnection } from "./config/database.js";
import { initializeDatabase } from "./config/initDatabase.js";

dotenv.config();

const app = express();

// Security and parsers
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404 and error handling
app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 8080;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, async () => {
    console.log(`Server running on :${port}`);

    // Test database connection
    const dbConnected = await testConnection();

    if (dbConnected) {
      // Initialize database tables
      await initializeDatabase();
    }
  });
}

export default app;
