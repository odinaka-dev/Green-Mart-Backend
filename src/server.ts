import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";
import mongoose from "mongoose";

const PORT = process.env.PORT || 8000;

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed (SIGTERM)");
  process.exit(0);
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
