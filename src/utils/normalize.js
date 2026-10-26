function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeMeter(meter) {
  return {
    meterId: meter?.meterId ?? null,
    serialNo: meter?.serialNo ?? null,
    make: meter?.make ?? null,
    phaseType: meter?.phaseType ?? null,
    installStatus: meter?.installStatus ?? null,
    dtCode: meter?.dtCode ?? null,
  };
}

export function normalizeGeo(geo) {
  const location = geo?.data ?? geo;

  return {
    latitude: toNumberOrNull(location?.latitude),
    longitude: toNumberOrNull(location?.longitude),
  };
}

export function normalizeConsumption(readings) {
  const data = Array.isArray(readings)
    ? readings
    : Array.isArray(readings?.data)
      ? readings.data
      : [];

  return data.map((reading) => ({
    timestamp: reading?.timestamp ?? null,
    kwh: toNumberOrNull(reading?.kwh),
    kvah: toNumberOrNull(reading?.kvah),
    voltR: toNumberOrNull(reading?.voltR),
  }));
}
