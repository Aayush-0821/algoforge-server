import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AlgoForge AI is Running",
  });
});

export default app;
