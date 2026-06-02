import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { setupSwagger } from "./config/swagger";

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import guestRoutes from "./routes/guest.routes";
import favoritesRoutes from "./routes/favorites.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// allowed origins (add your frontend origin(s) here)
const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://green-mart-backend.onrender.com",
];

// SECURITY MIDDLEWARES
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Pass an error so the global error handler can return a 403
        const err: any = new Error("Not allowed by CORS");
        err.statusCode = 403;
        callback(err);
      }
    },
    credentials: true,
  }),
);

// app.use(mongoSanitize());

// BODY PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGGING
app.use(morgan("dev"));

// GLOBAL RATE LIMIT
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use(globalLimiter);
setupSwagger(app);

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/admin", adminRoutes);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("API RUNNING SUCCESSFULLY");
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// GLOBAL ERROR HANDLER
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);

  const status = err && err.statusCode ? err.statusCode : 500;

  const payload: any = {
    success: false,
    message: err?.message || "Internal Server Error",
  };

  // In non-production show stack to help debugging
  if (process.env.NODE_ENV !== "production") {
    payload.stack = err?.stack;
  }

  res.status(status).json(payload);
});

export default app;
