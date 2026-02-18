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
    background: "rgba(13, 17, 23, 0.6)",
    padding: "clamp(16px, 3vw, 24px)",
    borderRadius: "16px",
    border: "1px solid rgba(48, 54, 61, 0.5)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },
  title: {
    fontSize: "clamp(16px, 2vw, 18px)",
    marginBottom: "15px",
    color: "#58a6ff",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))",
    gap: "clamp(10px, 2vw, 15px)",
    marginBottom: "20px",
  },
  stat: {
    background: "rgba(22, 27, 34, 0.8)",
    padding: "clamp(12px, 2.5vw, 15px)",
    borderRadius: "12px",
    textAlign: "center",
  },
  label: {
    fontSize: "clamp(11px, 1.5vw, 12px)",
    color: "#8b949e",
    marginBottom: "5px",
  },
  value: {
    fontSize: "clamp(16px, 2.5vw, 18px)",
    color: "#00ff88",
    fontWeight: "bold",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  button: {
    width: "100%",
    padding: "clamp(12px, 2vw, 14px)",
    background: "linear-gradient(135deg, #00ff88, #00bfff)",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    fontSize: "clamp(13px, 1.8vw, 15px)",
    fontWeight: "700",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0, 255, 136, 0.3)",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
};

export default SnapshotControl;
