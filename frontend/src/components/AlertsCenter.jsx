import { useState } from "react";

function AlertsCenter({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const [expanded, setExpanded] = useState(true);

  const visibleAlerts = (alerts?.alerts || []).filter(
    (alert) => !dismissed.includes(alert.pid)
  );

  const dismissAlert = (pid) => {
    setDismissed([...dismissed, pid]);
  };

  const getSeverityColor = (severity) => {
    if (severity === "critical") return "#ff4444";
    if (severity === "warning") return "#ffaa00";
    return "#00bfff";
  };

  const getAlertIcon = (type) => {
    if (type === "zombie") return "🧟";
    if (type === "high_cpu") return "🔥";
    if (type === "high_memory") return "💾";
    if (type === "stuck") return "⚠️";
    return "ℹ️";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <h2 style={styles.title}>
          🚨 Alerts ({visibleAlerts.length})
        </h2>
        <span style={styles.toggle}>{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div style={styles.content}>
          {visibleAlerts.length === 0 ? (
            <div style={styles.noAlerts}>✅ No active alerts</div>
          ) : (
            visibleAlerts.map((alert, index) => (
              <div key={index} style={styles.alert}>
                <div style={styles.alertIcon}>
                  {getAlertIcon(alert.type)}
                </div>
                <div style={styles.alertContent}>
                  <div style={styles.alertTitle}>
                    <span style={{color: getSeverityColor(alert.severity)}}>
                      [{alert.severity.toUpperCase()}]
                    </span>
                    {" "}{alert.name} (PID: {alert.pid})
                  </div>
                  <div style={styles.alertMessage}>{alert.message}</div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.pid)}
                  style={styles.dismissButton}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "rgba(13, 17, 23, 0.6)",
    borderRadius: "16px",
    border: "1px solid rgba(48, 54, 61, 0.5)",
    overflow: "hidden",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  header: {
    padding: "clamp(12px, 2.5vw, 15px) clamp(16px, 3vw, 20px)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
  },
  title: {
    fontSize: "clamp(16px, 2vw, 18px)",
    margin: 0,
    color: "#58a6ff",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  toggle: {
    color: "#8b949e",
    fontSize: "14px",
  },
  content: {
    padding: "0 clamp(16px, 3vw, 20px) clamp(16px, 3vw, 20px)",
  },
  noAlerts: {
    padding: "20px",
    textAlign: "center",
    color: "#00ff88",
    background: "#161b22",
    borderRadius: "8px",
  },
  alert: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px",
    background: "rgba(22, 27, 34, 0.8)",
    borderRadius: "12px",
    marginBottom: "10px",
    border: "1px solid rgba(33, 38, 45, 0.5)",
  },
  alertIcon: {
    fontSize: "24px",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: "clamp(13px, 1.8vw, 14px)",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#c9d1d9",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  alertMessage: {
    fontSize: "clamp(11px, 1.5vw, 12px)",
    color: "#8b949e",
  },
  dismissButton: {
    background: "transparent",
    border: "none",
    color: "#8b949e",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 5px",
  },
};

export default AlertsCenter;
