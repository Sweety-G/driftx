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
    background: "#0d1117",
    borderRadius: "12px",
    border: "1px solid #30363d",
    overflow: "hidden",
  },
  header: {
    padding: "15px 20px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
  },
  title: {
    fontSize: "18px",
    margin: 0,
    color: "#58a6ff",
  },
  toggle: {
    color: "#8b949e",
    fontSize: "14px",
  },
  content: {
    padding: "0 20px 20px",
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
    padding: "12px",
    background: "#161b22",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #21262d",
  },
  alertIcon: {
    fontSize: "24px",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#c9d1d9",
  },
  alertMessage: {
    fontSize: "12px",
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
