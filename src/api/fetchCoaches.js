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
 * Fetch coach seat map data via the local proxy server.
 * The proxy handles token acquisition — no credentials are needed here.
 */
export async function fetchCoaches({
  serviceId = "VT662000",
  carrierCode = "VT",
  boardLocation = "GLC",
  alightLocation = "EUS",
  serviceOriginDate = getTomorrowDate(),
  //serviceOriginDate = "2026-08-17",

} = {}) {
  const params = new URLSearchParams({
    serviceId,
    serviceOriginDate,
    carrierCode,
    boardLocation,
    alightLocation,
  });

  const res = await fetch(`/api/coaches?${params.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`API error ${res.status}: ${body.error ?? res.statusText}`);
  }

  return res.json();
}
