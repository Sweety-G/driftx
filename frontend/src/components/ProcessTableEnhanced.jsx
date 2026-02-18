import { useState, Fragment } from "react";

function ProcessTableEnhanced({ processes }) {
  const [sortBy, setSortBy] = useState("cpu_percent");
  const [sortDir, setSortDir] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPid, setExpandedPid] = useState(null);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const getStatusColor = (cpuPercent, memPercent) => {
    if (cpuPercent > 80 || memPercent > 20) return "#ff4444";
    if (cpuPercent > 50 || memPercent > 10) return "#ffaa00";
    return "#00ff88";
  };

  let filteredProcesses = (processes?.processes || [])
    .filter((p) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pid.toString().includes(searchTerm)
    );

  filteredProcesses.sort((a, b) => {
    let aVal = a[sortBy] || 0;
    let bVal = b[sortBy] || 0;
    
    if (sortDir === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const topProcesses = filteredProcesses.slice(0, 20);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⚙️ Process Monitor</h2>
        <div style={styles.info}>
          Showing {topProcesses.length} of {filteredProcesses.length} processes
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Search by name or PID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.search}
      />

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort("pid")}>
                PID {sortBy === "pid" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={styles.th} onClick={() => handleSort("name")}>
                Name {sortBy === "name" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={styles.th} onClick={() => handleSort("cpu_percent")}>
                CPU% {sortBy === "cpu_percent" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={styles.th} onClick={() => handleSort("memory_percent")}>
                MEM% {sortBy === "memory_percent" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
              <th style={styles.th} onClick={() => handleSort("status")}>
                Status {sortBy === "status" && (sortDir === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {topProcesses.map((proc) => (
              <Fragment key={proc.pid}>
                <tr
                  style={{
                    ...styles.tr,
                    background: expandedPid === proc.pid ? "#1c2128" : "#161b22",
                    borderLeft: `3px solid ${getStatusColor(proc.cpu_percent, proc.memory_percent)}`
                  }}
                  onClick={() => setExpandedPid(expandedPid === proc.pid ? null : proc.pid)}
                >
                  <td style={styles.td}>{proc.pid}</td>
                  <td style={styles.td}>{proc.name}</td>
                  <td style={{...styles.td, color: getStatusColor(proc.cpu_percent, 0)}}>
                    {proc.cpu_percent?.toFixed(1) || 0}%
                  </td>
                  <td style={{...styles.td, color: getStatusColor(0, proc.memory_percent)}}>
                    {proc.memory_percent?.toFixed(1) || 0}%
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>{proc.status}</span>
                  </td>
                </tr>
                {expandedPid === proc.pid && (
                  <tr style={styles.expandedRow}>
                    <td colSpan="5" style={styles.expandedContent}>
                      <div style={styles.details}>
                        <div><strong>User:</strong> {proc.user}</div>
                        <div><strong>Memory:</strong> {proc.memory_mb?.toFixed(2)} MB</div>
                        <div><strong>Command:</strong> {proc.command || "N/A"}</div>
                        <div><strong>Started:</strong> {proc.create_time ? new Date(proc.create_time).toLocaleString() : "N/A"}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0d1117",
    padding: "clamp(16px, 3vw, 20px)",
    borderRadius: "12px",
    border: "1px solid #30363d",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    flexWrap: "wrap",
    gap: "10px",
  },
  title: {
    fontSize: "clamp(16px, 2vw, 18px)",
    margin: 0,
    color: "#58a6ff",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  info: {
    fontSize: "clamp(11px, 1.5vw, 12px)",
    color: "#8b949e",
  },
  search: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontSize: "clamp(13px, 1.8vw, 14px)",
    fontFamily: "'Overlock', system-ui, sans-serif",
  },
  tableContainer: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "clamp(8px, 1.5vw, 10px)",
    textAlign: "left",
    background: "#161b22",
    color: "#8b949e",
    fontSize: "clamp(11px, 1.5vw, 12px)",
    fontWeight: "bold",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: "2px solid #30363d",
    fontFamily: "'Ubuntu Sans', system-ui, -apple-system, sans-serif",
  },
  tr: {
    cursor: "pointer",
    transition: "background 0.2s",
  },
  td: {
    padding: "clamp(8px, 1.5vw, 10px)",
    fontSize: "clamp(12px, 1.6vw, 13px)",
    color: "#c9d1d9",
    borderBottom: "1px solid #21262d",
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "10px",
    background: "#21262d",
    fontSize: "11px",
  },
  expandedRow: {
    background: "#1c2128",
  },
  expandedContent: {
    padding: "15px !important",
  },
  details: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "10px",
    fontSize: "clamp(11px, 1.5vw, 12px)",
    color: "#8b949e",
  },
};

export default ProcessTableEnhanced;
