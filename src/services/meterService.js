import {
  normalizeMeter,
  normalizeGeo,
  normalizeConsumption,
} from "../utils/normalize.js";

import {
  getMeters,
  getMeterEnergy,
  getMeterLocation,
  exportMeters,
} from "../clients/urjaClient.js";

// --------------------------------------------------
// List and search meters
// GET /api/v1/meters?q=&page=1
// --------------------------------------------------

export async function listMeters({ q = "", page = 1 } = {}) {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("page must be a positive integer");
  }

  const result = await getMeters({ q, page });

  if (!Array.isArray(result?.data)) {
    throw new Error("Unexpected meter-list response");
  }

  return {
    data: result.data.map(normalizeMeter),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

// --------------------------------------------------
// Get combined meter details
// GET /api/v1/meters/:meterId
// --------------------------------------------------

export async function getMeterDetails(meterId) {
  if (typeof meterId !== "string" || !meterId.trim()) {
    throw new Error("meterId is required");
  }

  const result = await getMeters({
    q: meterId,
    page: 1,
  });

  if (!Array.isArray(result?.data)) {
    throw new Error("Unexpected meter-list response");
  }

  // Require an exact ID match, not a partial search match.
  const meter = result.data.find((item) => item?.meterId === meterId);

  if (!meter) {
    return null;
  }

  const [geoResult, energyResult] = await Promise.all([
    getMeterLocation(meterId),
    getMeterEnergy(meterId),
  ]);

  return {
    ...normalizeMeter(meter),
    geo: normalizeGeo(geoResult),
    energy: normalizeConsumption(energyResult),
  };
}

// --------------------------------------------------
// Get normalized consumption readings
// GET /api/v1/meters/:meterId/consumption
// --------------------------------------------------

export async function getMeterConsumption(meterId) {
  if (typeof meterId !== "string" || !meterId.trim()) {
    throw new Error("meterId is required");
  }

  const result = await getMeterEnergy(meterId);

  return {
    data: normalizeConsumption(result),
  };
}

// --------------------------------------------------
// Get normalized geographical coordinates
// GET /api/v1/meters/:meterId/geo
// --------------------------------------------------

export async function getMeterGeo(meterId) {
  if (typeof meterId !== "string" || !meterId.trim()) {
    throw new Error("meterId is required");
  }

  const result = await getMeterLocation(meterId);

  return {
    data: normalizeGeo(result),
  };
}

// --------------------------------------------------
// Signed meter export
// Retained for internal use if required
// --------------------------------------------------

export async function listExportMeters({ page = 1 } = {}) {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("page must be a positive integer");
  }

  return exportMeters({ page });
}
