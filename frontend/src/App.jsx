import { useEffect, useState } from "react";
import SnapshotControl from "./components/SnapshotControl";
import SystemStats from "./components/SystemStats";
import AlertsCenter from "./components/AlertsCenter";
import ProcessTableEnhanced from "./components/ProcessTableEnhanced";
import { API_ENDPOINTS } from "./config/api";

const SNAPSHOT_ERROR_MESSAGE = "Need at least 2 snapshots";

// Helper function to validate API responses
const validateApiResponse = async (response) => {
  // Check if response is ok
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  // Check content type
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Invalid API response - expected JSON, got:", contentType, text.substring(0, 200));
    throw new Error(`Invalid API response: Expected JSON but got ${contentType || 'unknown content type'}`);
  }
  
  return response.json();
};

function App() {
  const [drift, setDrift] = useState(null);
  const [serverTime, setServerTime] = useState("");
  const [localTime, setLocalTime] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [snapshotInfo, setSnapshotInfo] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [resourceAnalysis, setResourceAnalysis] = useState(null);
  const [processes, setProcesses] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update local time every second
  useEffect(() => {
    const updateLocalTime = () => {
      setLocalTime(new Date().toLocaleTimeString());
    };
    updateLocalTime();
    const interval = setInterval(updateLocalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = () => {
      // Fetch drift data
      fetch(API_ENDPOINTS.DRIFT)
        .then(validateApiResponse)
        .then((data) => setDrift(data))
        .catch((err) => console.error("Error fetching drift:", err));

      // Fetch timeline
      fetch(API_ENDPOINTS.TIMELINE)
        .then(validateApiResponse)
        .then((data) => setTimeline(data))
        .catch((err) => console.error("Error fetching timeline:", err));

      // Fetch snapshot info
      fetch(API_ENDPOINTS.SNAPSHOT_INFO)
        .then(validateApiResponse)
        .then((data) => {
          setSnapshotInfo(data);
          setServerTime(new Date(data.server_time).toLocaleTimeString());
        })
        .catch((err) => console.error("Error fetching snapshot info:", err));

      // Fetch alerts
      fetch(API_ENDPOINTS.ALERTS)
        .then(validateApiResponse)
        .then((data) => setAlerts(data))
        .catch((err) => console.error("Error fetching alerts:", err));

      // Fetch resource analysis
      fetch(API_ENDPOINTS.RESOURCE_ANALYSIS)
        .then(validateApiResponse)
        .then((data) => setResourceAnalysis(data))
        .catch((err) => console.error("Error fetching resource analysis:", err));

      // Fetch current processes
      fetch(API_ENDPOINTS.CURRENT_PROCESSES)
        .then(validateApiResponse)
        .then((data) => setProcesses(data))
        .catch((err) => console.error("Error fetching processes:", err));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerSnapshot = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TRIGGER_SNAPSHOT, {
        method: "POST",
      });
      await validateApiResponse(response);
      // Refresh data after snapshot
      setTimeout(() => {
        fetch(API_ENDPOINTS.SNAPSHOT_INFO)
          .then(validateApiResponse)
          .then((data) => setSnapshotInfo(data));
      }, 1000);
    } catch (err) {
      console.error("Error triggering snapshot:", err);
    }
  };

  const total = (drift?.added?.length || 0) + (drift?.removed?.length || 0);
  const risk = resourceAnalysis?.risk_level || "LOW";
  const color = risk === "LOW" ? "#00ff88" : risk === "MEDIUM" ? "#ffaa00" : "#ff4444";

  // Handle "Need at least 2 snapshots" error
  const showSnapshotError = drift?.error === SNAPSHOT_ERROR_MESSAGE;

  // Responsive grid columns based on window width
  const getMainGridColumns = () => {
    if (windowWidth >= 1200) return "2fr 1fr";
    if (windowWidth >= 768) return "1fr 1fr";
    return "1fr";
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.logo}>DriftX</h1>
          <p style={{ color: "#8b949e", margin: "5px 0" }}>
            Lightweight Forensic Change Intelligence Dashboard
          </p>
        </div>
        <div style={styles.timeDisplay}>
          <div style={styles.timeLine}>
            <span style={styles.timeLabel}>🕐 Local:</span>
            <span style={styles.timeValue}>{localTime}</span>
          </div>
          <div style={styles.timeLine}>
            <span style={styles.timeLabel}>🌐 Server:</span>
            <span style={styles.timeValue}>{serverTime || "Loading..."}</span>
          </div>
        </div>
      </div>

      <p style={{ color: "#00ff88", margin: "10px 0" }}>● LIVE MONITORING ACTIVE</p>

      {/* Snapshot error message */}
      {showSnapshotError && (
        <div style={styles.errorBanner}>
          <div style={styles.errorIcon}>⏳</div>
          <div>
            <div style={styles.errorTitle}>Waiting for 2nd snapshot...</div>
            <div style={styles.errorMessage}>
              Snapshots are collected automatically every 5 minutes. 
              Next snapshot in: {snapshotInfo?.next_scheduled_snapshot 
                ? new Date(snapshotInfo.next_scheduled_snapshot).toLocaleTimeString() 
                : "calculating..."}
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW CARDS */}
      <div style={styles.grid}>
        <Card title="System Status" value={risk} color={color} />
        <Card title="Total Changes" value={total} color="#ff66cc" />
        <Card title="Total Snapshots" value={snapshotInfo?.total_snapshots || 0} color="#00bfff" />
        <Card title="Active Alerts" value={alerts?.total || 0} color={alerts?.total > 0 ? "#ff4444" : "#00ff88"} />
      </div>

      {/* SNAPSHOT CONTROL */}
      <div style={{ marginTop: "20px" }}>
        <SnapshotControl snapshotInfo={snapshotInfo} onTrigger={handleTriggerSnapshot} />
      </div>

      {/* MAIN CONTENT GRID */}
      <div style={{...styles.mainGrid, gridTemplateColumns: getMainGridColumns()}}>
        {/* LEFT COLUMN */}
        <div>
          {/* Drift Detection */}
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>🔄 Drift Detection Panel</h2>
            <p style={{ color: "#8b949e", fontSize: "14px" }}>System behavior comparison</p>

            <Box title="Added Processes" color="#00ff88">
              {drift?.added?.length ? drift.added.join(", ") : "None"}
            </Box>

            <Box title="Removed Processes" color="#ff4444">
              {drift?.removed?.length ? drift.removed.join(", ") : "None"}
            </Box>
          </div>

          {/* Alerts */}
          <div style={{ marginTop: "20px" }}>
            <AlertsCenter alerts={alerts} />
          </div>

          {/* Process Table */}
          <div style={{ marginTop: "20px" }}>
            <ProcessTableEnhanced processes={processes} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* System Stats */}
          <SystemStats resourceAnalysis={resourceAnalysis} />

          {/* Risk Level */}
          <div style={{ ...styles.panel, marginTop: "20px" }}>
            <h2 style={styles.panelTitle}>⚡ Risk Level</h2>
            <div style={{ background: "#161b22", padding: "12px", borderRadius: "10px", marginTop: "10px" }}>
              <div
                style={{
                  width: risk === "LOW" ? "30%" : risk === "MEDIUM" ? "60%" : "90%",
                  background: color,
                  height: "24px",
                  borderRadius: "12px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p style={{ color, marginTop: "15px", fontSize: "18px", fontWeight: "bold", textAlign: "center" }}>
              {risk} RISK
            </p>
          </div>

          {/* Timeline */}
          <div style={{ ...styles.panel, marginTop: "20px" }}>
            <h2 style={styles.panelTitle}>📅 Snapshot Timeline</h2>
            {timeline.length === 0 ? (
              <p style={{ color: "#8b949e", marginTop: "10px" }}>No snapshots yet</p>
            ) : (
              <div style={{ marginTop: "10px" }}>
                {timeline.map((t, index) => (
                  <div key={index} style={styles.timelineItem}>
                    <span style={styles.timelineDot}>●</span>
                    <span style={styles.timelineText}>{t.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* STYLES */

const styles = {
  page: {
    background: "linear-gradient(to bottom, #000000, #0a0c10)",
    minHeight: "100vh",
    color: "white",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Roboto', sans-serif",
    width: "100%",
    margin: "0",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "15px",
  },
  logo: {
    fontSize: "48px",
    color: "#00ff88",
    textShadow: "0 0 30px rgba(0, 255, 136, 0.6)",
    margin: 0,
    fontWeight: "700",
    letterSpacing: "-1px",
  },
  timeDisplay: {
    background: "rgba(13, 17, 23, 0.8)",
    padding: "15px 24px",
    borderRadius: "12px",
    border: "1px solid rgba(48, 54, 61, 0.5)",
    backdropFilter: "blur(10px)",
  },
  timeLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "5px",
  },
  timeLabel: {
    color: "#8b949e",
    fontSize: "14px",
  },
  timeValue: {
    color: "#00ff88",
    fontSize: "14px",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  errorBanner: {
    background: "linear-gradient(135deg, #1c1f26, #2d3748)",
    border: "2px solid #ffaa00",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "20px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: "36px",
  },
  errorTitle: {
    color: "#ffaa00",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  errorMessage: {
    color: "#8b949e",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    marginTop: "20px",
  },
  panel: {
    background: "rgba(13, 17, 23, 0.6)",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid rgba(48, 54, 61, 0.5)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  panelTitle: {
    fontSize: "18px",
    margin: "0 0 10px 0",
    color: "#58a6ff",
  },
  timelineItem: {
    padding: "8px 0",
    borderBottom: "1px solid #21262d",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  timelineDot: {
    color: "#00ff88",
    fontSize: "12px",
  },
  timelineText: {
    color: "#c9d1d9",
    fontSize: "13px",
    fontFamily: "monospace",
  },
};

function Card({ title, value, color }) {
  return (
    <div
      style={{
        background: "rgba(13, 17, 23, 0.6)",
        padding: "24px",
        borderRadius: "16px",
        border: `1px solid ${color}40`,
        transition: "all 0.3s ease",
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 20px ${color}20, 0 8px 32px rgba(0, 0, 0, 0.3)`,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 0 30px ${color}40, 0 12px 48px rgba(0, 0, 0, 0.4)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 0 20px ${color}20, 0 8px 32px rgba(0, 0, 0, 0.3)`;
      }}
    >
      <p style={{ color: "#8b949e", margin: "0 0 12px 0", fontSize: "13px", fontWeight: "500", letterSpacing: "0.5px", textTransform: "uppercase" }}>{title}</p>
      <h2 style={{ color, margin: 0, fontSize: "32px", fontWeight: "700" }}>{value}</h2>
    </div>
  );
}

function Box({ title, color, children }) {
  return (
    <div
      style={{
        background: "rgba(22, 27, 34, 0.8)",
        padding: "18px",
        borderRadius: "12px",
        marginTop: "15px",
        border: `1px solid ${color}40`,
        boxShadow: `0 0 15px ${color}15`,
      }}
    >
      <h3 style={{ color, margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>{title}</h3>
      <p style={{ color: "#c9d1d9", margin: 0, fontSize: "14px", lineHeight: "1.6" }}>{children}</p>
    </div>
  );
}

export default App;

