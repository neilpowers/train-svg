import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3001;

// --- Token cache ---
// We fetch a token once and reuse it until it expires.
let cachedToken = null;
let tokenExpiresAt = 0;

async function getBearerToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.NR_CLIENT_ID,
    client_secret: process.env.NR_CLIENT_SECRET,
    username: process.env.NR_USERNAME,
    password: process.env.NR_PASSWORD,
  });

  const res = await fetch(process.env.NR_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  // expires_in is in seconds; fall back to 5 minutes if not provided
  tokenExpiresAt = now + (json.expires_in ?? 300) * 1000;

  return cachedToken;
}

// --- Coaches endpoint ---
app.get("/api/coaches", async (req, res) => {
  try {
    /*const {
      serviceId = "VT662000",
      serviceOriginDate,
      carrierCode = "VT",
      boardLocation = "GLC",
      alightLocation = "EUS",
    } = req.query;*/
    const {
      serviceId = "TP400100",
      serviceOriginDate,
      carrierCode = "TP",
      boardLocation = "EDB",
      alightLocation = "NCL",
    } = req.query;

    if (!serviceOriginDate) {
      return res.status(400).json({ error: "serviceOriginDate is required" });
    }

    const token = await getBearerToken();

    const url =
      `${process.env.NR_API_BASE}/api/v2/services/${serviceId}/coaches` +
      `?serviceOriginDate=${serviceOriginDate}` +
      `&carrierCode=${carrierCode}` +
      `&boardLocation=${boardLocation}` +
      `&alightLocation=${alightLocation}`;

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        client_id: `${process.env.NR_CLIENT_ID}`,
        "Content-Type": "application/json",
      },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({ error: text });
    }

    const data = await apiRes.json();
    return res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
