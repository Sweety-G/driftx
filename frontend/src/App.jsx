import { useEffect, useState } from "react";

// Use environment variable for API URL, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [drift, setDrift] = useState(null);
  const [time, setTime] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_URL}/drift`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setDrift(data);
          setTime(new Date().toLocaleTimeString());
          setError(null); // Clear error on success
        })
        .catch((err) => {
          console.error("Error fetching drift data:", err);
          setError("Failed to fetch drift data. Make sure the backend is running.");
        });

      fetch(`${API_URL}/timeline`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setTimeline(data))
        .catch((err) => {
          console.error("Error fetching timeline data:", err);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const total =
    (drift?.added?.length || 0) +
    (drift?.removed?.length || 0);

  const risk =
    total === 0 ? "LOW" :
    total < 3 ? "MEDIUM" : "HIGH";

  const color =
    risk === "LOW"
      ? "#00ff88"
      : risk === "MEDIUM"
      ? "#ffaa00"
      : "#ff4444";

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <h1 style={styles.logo}>DriftX</h1>

      <p style={{ color: "#888" }}>
        Lightweight Forensic Change Intelligence Dashboard
      </p>

      {error ? (
        <p style={{ color: "#ff4444" }}>
          ● {error}
        </p>
      ) : (
        <p style={{ color: "#00ff88" }}>
          ● LIVE MONITORING ACTIVE
        </p>
      )}

      {/* OVERVIEW */}
      <div style={styles.grid}>
        <Card title="System Status" value={risk} color={color} />
        <Card title="Risk Score" value={risk} color={color} />
        <Card title="Last Snapshot" value={time} color="#00bfff" />
        <Card title="Total Changes" value={total} color="#ff66cc" />
      </div>

      {/* MAIN GRID */}
      <div style={styles.mainGrid}>
        <div style={styles.panel}>
          <h2>Drift Detection Panel</h2>
          <p style={{ color: "#888" }}>
            System behavior comparison
          </p>

          <Box title="Added Processes" color="#00ff88">
            {drift?.added?.length
              ? drift.added.join(", ")
              : "None"}
          </Box>

          <Box title="Removed Processes" color="#ff4444">
            {drift?.removed?.length
              ? drift.removed.join(", ")
              : "None"}
          </Box>
        </div>

        <div style={styles.panel}>
          <h2>Risk Level</h2>

          <div style={{ background: "#111", padding: "8px", borderRadius: "10px" }}>
            <div
              style={{
                width:
                  risk === "LOW"
                    ? "30%"
                    : risk === "MEDIUM"
                    ? "60%"
                    : "90%",
                background: color,
                height: "20px",
                borderRadius: "10px",
                transition: "0.4s",
              }}
            />
          </div>

          <p style={{ color, marginTop: "10px" }}>
            {risk} RISK
          </p>
        </div>
      </div>

      {/* TIMELINE */}
      <div style={styles.panel}>
        <h2>Snapshot Timeline</h2>

        {timeline.length === 0 ? (
          <p style={{ color: "#888" }}>No snapshots yet</p>
        ) : (
          timeline.map((t, index) => (
            <p key={index} style={{ color: "#bbb" }}>
              Snapshot → {t.time}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

/* STYLES */

const styles = {
  page: {
    background: "#05070d",
    minHeight: "100vh",
    width: "100vw",
    color: "white",
    padding: "25px",
    fontFamily: "Arial",
    boxSizing: "border-box",
  },
  logo: {
    fontSize: "40px",
    color: "#00ff88",
    textShadow: "0 0 10px #00ff88",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "15px",
    marginTop: "20px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "15px",
    marginTop: "20px",
  },
  panel: {
    background: "#0d1117",
    padding: "15px",
    borderRadius: "12px",
    marginTop: "15px",
  },
};

function Card({ title, value, color }) {
  return (
    <div style={{ background: "#111", padding: "15px", borderRadius: "10px", border: `1px solid ${color}` }}>
      <p style={{ color: "#888" }}>{title}</p>
      <h2 style={{ color }}>{value}</h2>
    </div>
  );
}

function Box({ title, color, children }) {
  return (
    <div style={{ background: "#111", padding: "12px", borderRadius: "10px", marginTop: "10px", border: `1px solid ${color}` }}>
      <h3 style={{ color }}>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default App;
