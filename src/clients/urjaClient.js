import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { createHmac } from "node:crypto";

const baseURL = process.env.URJA_BASE_URL;

if (!baseURL) {
  throw new Error("URJA_BASE_URL is not configured");
}

const cookieJar = new CookieJar();

const client = wrapper(
  axios.create({
    baseURL,
    jar: cookieJar,
    timeout: 15000,
    headers: {
      Accept: "application/json",
    },
  }),
);

// Authentication

let loginPromise = null;
let authenticated = false;

export async function login() {
  const email = process.env.URJA_USERNAME;
  const password = process.env.URJA_PASSWORD;

  if (!email || !password) {
    throw new Error("Portal credentials are not configured");
  }

  const payload = new URLSearchParams({ email, password });

  const response = await client.post("/login", payload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: baseURL,
      Referer: `${baseURL}/login`,
      "X-Sveltekit-Action": "true",
    },
  });

  const body = response.data;

  if (
    response.status !== 200 ||
    body?.type !== "redirect" ||
    typeof body?.location !== "string" ||
    body?.status >= 400
  ) {
    authenticated = false;
    throw new Error(
      "Portal login failed. Check credentials and login response.",
    );
  }

  authenticated = true;

  return {
    authenticated: true,
    redirect: body.location,
  };
}

export async function ensureAuthenticated() {
  if (authenticated) {
    return;
  }

  if (!loginPromise) {
    loginPromise = login().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
}

// Automatically authenticate before protected portal requests.
// Never intercept the login request itself.
client.interceptors.request.use(async (config) => {
  const url = config.url || "";

  if (url === "/login" || url === "/api/auth/sign-out") {
    return config;
  }

  await ensureAuthenticated();
  return config;
});

// If the portal rejects a session, clear the local authentication
// flag so the next request can attempt to log in again.

let reauthenticationPromise = null;

client.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isLoginRequest = originalRequest.url === "/login";

    if (
      error.response?.status !== 401 ||
      isLoginRequest ||
      originalRequest._retry
    ) {
      if (error.response?.status === 401) {
        authenticated = false;
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!reauthenticationPromise) {
      authenticated = false;

      reauthenticationPromise = ensureAuthenticated().finally(() => {
        reauthenticationPromise = null;
      });
    }

    try {
      await reauthenticationPromise;
      return client(originalRequest);
    } catch {
      authenticated = false;

      return Promise.reject(
        new Error("Portal session expired and reauthentication failed"),
      );
    }
  },
);

// Meter search
// GET /portal/meters/search?q=&page=1

export async function getMeters({ q = "", page = 1 } = {}) {
  const response = await client.get("/portal/meters/search", {
    params: { q, page },
  });

  return response.data;
}

// Meter energy
// GET /portal/meters/:meterId/energy

export async function getMeterEnergy(meterId) {
  if (!meterId) {
    throw new Error("meterId is required");
  }

  const response = await client.get(
    `/portal/meters/${encodeURIComponent(meterId)}/energy`,
  );

  return response.data;
}

// Meter geographical location
// GET /portal/meters/:meterId/geo

export async function getMeterLocation(meterId) {
  if (!meterId) {
    throw new Error("meterId is required");
  }

  const response = await client.get(
    `/portal/meters/${encodeURIComponent(meterId)}/geo`,
  );

  return response.data;
}

// HMAC signing helpers for meter export

async function getSigningSecret() {
  const response = await client.get("/portal/keys");
  const secret = response.data?.data?.signingSecret;

  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("Portal signing secret was not returned");
  }

  return secret;
}

function createSignature(method, path, query, secret) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const message = [method, path, query, timestamp].join("\n");

  const signature = createHmac("sha256", secret).update(message).digest("hex");

  return { timestamp, signature };
}

// Signed meter export
// GET /portal/export?page=1

export async function exportMeters({ page = 1 } = {}) {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("page must be a positive integer");
  }

  const secret = await getSigningSecret();
  const path = "/portal/export";
  const query = `page=${page}`;

  const { timestamp, signature } = createSignature("GET", path, query, secret);

  const response = await client.get(`${path}?${query}`, {
    headers: {
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
  });

  return response.data;
}

export { client, cookieJar };
