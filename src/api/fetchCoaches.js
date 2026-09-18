function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // If tomorrow is Saturday (6) or Sunday (0), advance to Monday
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
  if (day === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/**
 * Read service parameters from the URL query string.
 * Returns null if any required parameter is missing.
 *
 * Required params:
 *   ?service=VT662000  → serviceId
 *   ?carrier=VT        → carrierCode
 *   ?from=GLC          → boardLocation
 *   ?to=EUS            → alightLocation
 *
 * Optional:
 *   ?date=2026-08-28   → serviceOriginDate (defaults to next weekday if omitted)
 *
 * Example:
 *   http://localhost:5173?service=VT662000&carrier=VT&from=GLC&to=EUS
 */
function getParamsFromURL() {
  const p = new URLSearchParams(window.location.search);

  const serviceId      = p.get("service");
  const carrierCode    = p.get("carrier");
  const boardLocation  = p.get("from");
  const alightLocation = p.get("to");

  // All four are required — return null if any are absent
  if (!serviceId || !carrierCode || !boardLocation || !alightLocation) {
    return null;
  }

  return {
    serviceId,
    serviceOriginDate: p.get("date")  ?? getTomorrowDate(),
    carrierCode,
    boardLocation,
    alightLocation,
    // Optional — filter to a single coach by ID (e.g. ?coach=A)
    coach: p.get("coach") ?? null,
  };
}

/**
 * Fetch coach seat map data via the local proxy server.
 * Returns null (rather than throwing) if required URL params are missing.
 * Throws on network or API errors.
 */
export async function fetchCoaches() {
  const params = getParamsFromURL();

  if (!params) return null;

  const query = new URLSearchParams(params);
  const res = await fetch(`/api/coaches?${query.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`API error ${res.status}: ${body.error ?? res.statusText}`);
  }

  return res.json();
}
