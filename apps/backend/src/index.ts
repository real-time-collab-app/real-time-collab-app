import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS — must allow credentials so the refresh-token cookie can be sent
app.use(
  cors({
    origin: "http://localhost:5173", // update if your Vite dev port differs
    credentials: true,
  })
);

// Logging middleware — logs every incoming request
app.use(morgan("dev"));

// Parses incoming JSON request bodies
app.use(express.json());

// Parses cookies on incoming requests (needed to read the refresh token cookie)
app.use(cookieParser());

// Routes
app.use(healthRoutes);
app.use("/auth", authRoutes);
app.use("/rooms", roomRoutes);

// 404 handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

// Error handler — must be registered LAST, after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});