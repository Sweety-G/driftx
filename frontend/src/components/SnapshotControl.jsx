import { useState } from "react";

function SnapshotControl({ snapshotInfo, onTrigger }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await onTrigger();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error triggering snapshot:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📸 Snapshot Control</h2>
      
      <div style={styles.grid}>
        <div style={styles.stat}>
          <div style={styles.label}>Total Snapshots</div>
          <div style={styles.value}>{snapshotInfo?.total_snapshots || 0}</div>
        </div>
        
        <div style={styles.stat}>
          <div style={styles.label}>Last Snapshot</div>
          <div style={styles.value}>{snapshotInfo?.time_since_last || "Never"}</div>
        </div>
        
        <div style={styles.stat}>
          <div style={styles.label}>Next Scheduled</div>
          <div style={styles.value}>
            {snapshotInfo?.next_scheduled_snapshot 
              ? new Date(snapshotInfo.next_scheduled_snapshot).toLocaleTimeString()
              : "N/A"}
          </div>
        </div>
      </div>

      <button 
        onClick={handleTrigger} 
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "⏳ Creating..." : success ? "✅ Success!" : "🔄 Trigger Snapshot Now"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    background: "#0d1117",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #30363d",
  },
  title: {
    fontSize: "18px",
    marginBottom: "15px",
    color: "#58a6ff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },
  stat: {
    background: "#161b22",
    padding: "12px",
    borderRadius: "8px",
    textAlign: "center",
  },
  label: {
    fontSize: "12px",
    color: "#8b949e",
    marginBottom: "5px",
  },
  value: {
    fontSize: "18px",
    color: "#00ff88",
    fontWeight: "bold",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #00ff88, #00bfff)",
    border: "none",
    borderRadius: "8px",
    color: "#000",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
};

export default SnapshotControl;
