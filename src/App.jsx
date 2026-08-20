import { useState, useEffect } from "react";
import CarriageSVG from "./components/CarriageSVG";
import { fetchCoaches } from "./api/fetchCoaches";
import { transformS3Coach } from "./utils/transformS3Coach";
import useMediaQuery from "./hooks/useMediaQuery";

function App() {
  const isLandscape = useMediaQuery("(min-width: 1024px)");
  const [coaches, setCoaches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCoaches()
      .then((data) => {
        // Take the first two coaches only
        const first2 = (data.coaches || []).slice(0, 2);
        setCoaches(first2.map(transformS3Coach));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.status}>Loading seat map…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <p style={{ ...styles.status, color: "#c0392b" }}>
          Error: {error}
        </p>
        <p style={styles.hint}>
          Make sure the proxy server is running (<code>npm run server</code>)
          and your <code>.env</code> credentials are correct.
        </p>
      </div>
    );
  }

  if (!coaches.length) {
    return (
      <div style={styles.page}>
        <p style={styles.status}>No coaches returned from API.</p>
      </div>
    );
  }

  const currentCoach = coaches[selectedIndex];

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>{currentCoach.meta.rollingStock}</h2>

      {/* Coach selector tabs */}
      <div style={styles.tabBar}>
        {coaches.map((coach, i) => (
          <button
            key={coach.meta.carriageId}
            onClick={() => setSelectedIndex(i)}
            style={{
              ...styles.tab,
              ...(i === selectedIndex ? styles.tabActive : {}),
            }}
          >
            Coach {coach.meta.carriageId}
          </button>
        ))}
      </div>

      {/* Seat map legend */}
      <div style={styles.legend}>
        {[
          { color: "#1e8449", label: "Available" },
          { color: "#c0392b", label: "Reserved" },
          { color: "#95a5a6", label: "Not reservable" },
          { color: "#2c3e50", label: "No data" },
        ].map(({ color, label }) => (
          <div key={label} style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, background: color }} />
            <span style={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

      <CarriageSVG data={currentCoach} landscape={isLandscape} />
    </div>
  );
}

const styles = {
  page: {
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 12px",
    color: "#2c3e50",
  },
  status: {
    fontSize: "15px",
    color: "#555",
  },
  hint: {
    fontSize: "13px",
    color: "#888",
    marginTop: "8px",
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },
  tab: {
    padding: "6px 16px",
    border: "1px solid #bdc3c7",
    borderRadius: "6px",
    background: "#f5f6fa",
    cursor: "pointer",
    fontSize: "14px",
    color: "#555",
  },
  tabActive: {
    background: "#2c3e50",
    color: "#fff",
    borderColor: "#2c3e50",
  },
  legend: {
    display: "flex",
    gap: "16px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  legendSwatch: {
    width: "14px",
    height: "14px",
    borderRadius: "3px",
    display: "inline-block",
  },
  legendLabel: {
    fontSize: "12px",
    color: "#555",
  },
};

export default App;
