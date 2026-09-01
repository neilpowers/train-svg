import { useState, useEffect } from "react";
import { fetchCoaches } from "./api/fetchCoaches";

function ApiTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    const start = performance.now();
    fetchCoaches()
      .then((data) => {
        setResult(data);
        setElapsed(Math.round(performance.now() - start));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const containerStyle = {
    fontFamily: "monospace",
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  };

  const badgeStyle = (color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "bold",
    background: color,
    color: "#fff",
  });

  const preStyle = {
    background: "#1e1e1e",
    color: "#d4d4d4",
    padding: "20px",
    borderRadius: "8px",
    overflow: "auto",
    fontSize: "12px",
    lineHeight: "1.6",
    maxHeight: "80vh",
    whiteSpace: "pre",
    textAlign: "left",
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={badgeStyle("#888")}>PENDING</span>
          <span>Fetching coaches from NR API…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={badgeStyle("#c0392b")}>ERROR</span>
          <span>{error}</span>
        </div>
        <p style={{ color: "#888", fontSize: "13px" }}>
          Check the proxy server is running (<code>npm run server</code>) and credentials in <code>.env</code> are correct.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={badgeStyle("#27ae60")}>200 OK</span>
        <span style={{ fontWeight: "bold", fontSize: "15px" }}>NR Coaches API Response</span>
        {elapsed !== null && (
          <span style={{ color: "#888", fontSize: "13px" }}>{elapsed}ms</span>
        )}
      </div>

      {result?.coaches && (
        <p style={{ marginBottom: "12px", fontSize: "13px", color: "#555" }}>
          {result.coaches.length} coach{result.coaches.length !== 1 ? "es" : ""} returned
          {result.coaches.map((c) => ` · ${c.id}`).join("")}
        </p>
      )}

      <pre style={preStyle}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default ApiTest;
