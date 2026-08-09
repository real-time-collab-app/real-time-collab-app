import "dotenv/config";
import express from "express";
import morgan from "morgan";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

// Logging middleware — logs every incoming request
app.use(morgan("dev"));

// Parses incoming JSON request bodies (needed for POST/PUT routes later)
app.use(express.json());

// Routes
app.use(healthRoutes);

// 404 handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ error: { message: "Route not found" } });
});

// Error handler — must be registered LAST, after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});