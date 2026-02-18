function SystemStats({ resourceAnalysis }) {
  const riskLevel = resourceAnalysis?.risk_level || "LOW";

  const getRiskColor = (level) => {
    if (level === "HIGH") return "#ff4444";
    if (level === "MEDIUM") return "#ffaa00";
    return "#00ff88";
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 System Resources</h2>
      
      <div style={styles.statRow}>
        <div style={styles.statLabel}>Risk Level</div>
        <div style={{...styles.badge, background: getRiskColor(riskLevel)}}>
          {riskLevel}
        </div>
      </div>

      <div style={styles.statRow}>
        <div style={styles.statLabel}>High CPU Processes</div>
        <div style={styles.statValue}>
          {resourceAnalysis?.high_cpu_processes?.length || 0}
        </div>
      </div>

      <div style={styles.statRow}>
        <div style={styles.statLabel}>High Memory Processes</div>
        <div style={styles.statValue}>
          {resourceAnalysis?.high_memory_processes?.length || 0}
        </div>
      </div>

      <div style={styles.statRow}>
        <div style={styles.statLabel}>Zombie Processes</div>
        <div style={styles.statValue}>
          {resourceAnalysis?.zombie_processes?.length || 0}
        </div>
      </div>

      <div style={styles.statRow}>
        <div style={styles.statLabel}>Stuck Processes</div>
        <div style={styles.statValue}>
          {resourceAnalysis?.stuck_processes?.length || 0}
        </div>
      </div>
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
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #21262d",
  },
  statLabel: {
    fontSize: "14px",
    color: "#8b949e",
  },
  statValue: {
    fontSize: "16px",
    color: "#00ff88",
    fontWeight: "bold",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#000",
  },
};

export default SystemStats;
