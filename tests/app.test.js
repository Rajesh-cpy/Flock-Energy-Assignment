import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const services = vi.hoisted(() => ({
  listMeters: vi.fn(),
  getMeterDetails: vi.fn(),
  getMeterConsumption: vi.fn(),
  getMeterGeo: vi.fn(),
}));

vi.mock("../src/services/meterService.js", () => services);

import app from "../src/app.js";

describe("Urja Meter API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /health", () => {
    it("returns healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /api/v1/meters", () => {
    it("lists meters with pagination", async () => {
      services.listMeters.mockResolvedValue({
        data: [
          {
            meterId: "J100000",
            serialNo: "SE33962",
            make: "HPL",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const response = await request(app).get(
        "/api/v1/meters?q=J100000&page=1",
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].meterId).toBe("J100000");
      expect(response.body.total).toBe(1);

      expect(services.listMeters).toHaveBeenCalledWith({
        q: "J100000",
        page: 1,
      });
    });

    it("rejects an invalid page number", async () => {
      const response = await request(app).get("/api/v1/meters?page=0");

      expect(response.status).toBe(400);
      expect(services.listMeters).not.toHaveBeenCalled();
    });

    it("returns 502 when the upstream service fails", async () => {
      services.listMeters.mockRejectedValue(new Error("Network failure"));

      const response = await request(app).get("/api/v1/meters");

      expect(response.status).toBe(502);
      expect(response.body.error).toBe("Upstream request failed");
    });
  });

  describe("GET /api/v1/meters/:meterId", () => {
    it("returns combined meter details", async () => {
      services.getMeterDetails.mockResolvedValue({
        meterId: "J100000",
        geo: {
          latitude: 26.93,
          longitude: 75.83,
        },
        energy: [
          {
            timestamp: "23/06/2026 23:30",
            kwh: 48438.74,
          },
        ],
      });

      const response = await request(app).get("/api/v1/meters/J100000");

      expect(response.status).toBe(200);
      expect(response.body.meterId).toBe("J100000");
      expect(response.body.geo.latitude).toBe(26.93);
      expect(response.body.geo.longitude).toBe(75.83);
      expect(response.body.energy).toHaveLength(1);
      expect(response.body.energy[0].kwh).toBe(48438.74);
    });

    it("returns 404 when a meter does not exist", async () => {
      services.getMeterDetails.mockResolvedValue(null);

      const response = await request(app).get(
        "/api/v1/meters/INVALID_METER_999",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Meter not found");
    });
  });

  describe("GET /api/v1/meters/:meterId/consumption", () => {
    it("returns normalized consumption readings", async () => {
      services.getMeterConsumption.mockResolvedValue({
        data: [
          {
            timestamp: "23/06/2026 23:30",
            kwh: 48438.74,
            kvah: 50000.25,
            voltR: 230.5,
          },
        ],
      });

      const response = await request(app).get(
        "/api/v1/meters/J100000/consumption",
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].kwh).toBe(48438.74);
      expect(response.body.data[0].kvah).toBe(50000.25);
      expect(response.body.data[0].voltR).toBe(230.5);
    });
  });

  describe("GET /api/v1/meters/:meterId/geo", () => {
    it("returns meter coordinates", async () => {
      services.getMeterGeo.mockResolvedValue({
        data: {
          latitude: 26.93,
          longitude: 75.83,
        },
      });

      const response = await request(app).get("/api/v1/meters/J100000/geo");

      expect(response.status).toBe(200);
      expect(response.body.data.latitude).toBe(26.93);
      expect(response.body.data.longitude).toBe(75.83);
    });
  });
});
