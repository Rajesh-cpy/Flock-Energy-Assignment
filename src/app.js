import swaggerUi from "swagger-ui-express";
import openapi from "./openapi.js";
import express from "express";
import {
  listMeters,
  getMeterDetails,
  getMeterConsumption,
  getMeterGeo,
  listExportMeters,
} from "./services/meterService.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Urja Meter Operations API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      meters: "/api/v1/meters",
      meterDetails: "/api/v1/meters/:meterId",
      consumption: "/api/v1/meters/:meterId/consumption",
      location: "/api/v1/meters/:meterId/geo",
      export: "/api/v1/meters/export",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// List meters. Supports ?q=search&page=1
app.get("/api/v1/meters", async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page ?? "1", 10);
    const q = String(req.query.q ?? "");

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: "Invalid page",
        message: "page must be a positive integer",
      });
    }

    const result = await listMeters({ q, page });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get details for one meter
app.get("/api/v1/meters/:meterId", async (req, res, next) => {
  try {
    const meter = await getMeterDetails(req.params.meterId);

    if (!meter) {
      return res.status(404).json({
        error: "Meter not found",
      });
    }

    res.json(meter);
  } catch (error) {
    next(error);
  }
});

// Get energy/consumption readings
app.get("/api/v1/meters/:meterId/consumption", async (req, res, next) => {
  try {
    const result = await getMeterConsumption(req.params.meterId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get meter coordinates
app.get("/api/v1/meters/:meterId/geo", async (req, res, next) => {
  try {
    const result = await getMeterGeo(req.params.meterId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Export meter data
app.get("/api/v1/meters/export", async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page ?? "1", 10);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: "Invalid page",
        message: "page must be a positive integer",
      });
    }

    const result = await listExportMeters({ page });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/openapi.json", (req, res) => {
  res.json(openapi);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// Centralized error handler

app.use((error, req, res, next) => {
  console.error("API request failed:", {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    upstreamData: error.response?.data,
  });

  if (res.headersSent) {
    return next(error);
  }

  const status = error.response?.status;
  const clientError = status >= 400 && status < 500;

  res.status(clientError ? status : 502).json({
    error: "Upstream request failed",
    message: "The meter service could not complete the request.",
  });
});

export default app;
