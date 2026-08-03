import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { webhooksRouter } from "@/routes/webhooks.router";
import { mediaRouter } from "@/routes/media.router";
import { apiRouter } from "@/routes/api.router";

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-hub-signature-256"],
  }),
);

// Capturar rawBody para verificación de firma HMAC en Webhooks de Meta WhatsApp
app.use(
  express.json({
    verify: (req: express.Request & { rawBody?: string }, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  }),
);

app.use(express.urlencoded({ extended: true }));

// Endpoint de Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "internal-system-backend", timestamp: new Date() });
});

// Rutas de Webhooks, Media y API REST
app.use("/api/webhooks", webhooksRouter);
app.use("/api/media", mediaRouter);
app.use("/api", apiRouter);

// Iniciar Servidor
app.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor Backend Standalone ejecutándose en puerto ${port}`);
  console.log(`📍 Health Check: http://localhost:${port}/health`);
  console.log(`📍 Webhooks Meta: http://localhost:${port}/api/webhooks/whatsapp`);
  console.log(`====================================================`);
});
