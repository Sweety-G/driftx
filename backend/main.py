from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from analyzer.process_monitor import ProcessMonitor


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SNAPSHOT_FOLDER = "./snapshots"
monitor = ProcessMonitor(SNAPSHOT_FOLDER)


@app.get("/")
def home():
    return {"message": "DriftX Backend Running"}


@app.get("/latest-snapshot")
def latest_snapshot():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    if not files:
        return {"error": "No snapshots found"}

    latest = files[-1]

    with open(f"{SNAPSHOT_FOLDER}/{latest}") as f:
        data = json.load(f)

    return data


@app.get("/drift")
def drift_result():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    if len(files) < 2:
        return {"error": "Need at least 2 snapshots"}

    old_file = files[-2]
    new_file = files[-1]

    with open(f"{SNAPSHOT_FOLDER}/{old_file}") as f:
        old_data = json.load(f)

    with open(f"{SNAPSHOT_FOLDER}/{new_file}") as f:
        new_data = json.load(f)

    old_proc = {p["name"] for p in old_data["processes"]}
    new_proc = {p["name"] for p in new_data["processes"]}

    return {
        "added": list(new_proc - old_proc),
        "removed": list(old_proc - new_proc)
    }
@app.get("/timeline")
def timeline():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    timeline_data = []

    for f in files[-5:]:
        timeline_data.append({
            "snapshot": f,
            "time": f.replace("snapshot_", "").replace(".json", "")
        })

    return timeline_data


@app.get("/current-processes")
def current_processes():
    """Get all currently running processes with detailed information."""
    processes = monitor.get_current_processes()
    return {
        "processes": processes,
        "total": len(processes)
    }


@app.get("/process-details/{pid}")
def process_details(pid: int):
    """Get detailed information about a specific process by PID."""
    process = monitor.get_process_by_pid(pid)
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with PID {pid} not found")
    return process


@app.get("/alerts")
def get_alerts():
    """Get all current system alerts (stuck processes, resource hogs, etc.)."""
    alerts = monitor.get_alerts()
    stuck_processes = monitor.detect_stuck_processes()
    
    # Add stuck process alerts
    for stuck in stuck_processes:
        alerts.append({
            "pid": stuck["pid"],
            "name": stuck["name"],
            "type": "stuck",
            "severity": "critical",
            "message": f"Process stuck with {stuck['avg_cpu']:.1f}% CPU (sustained high usage)",
            "value": stuck["avg_cpu"],
            "threshold": monitor.cpu_threshold_critical
        })
    
    return {
        "alerts": alerts,
        "total": len(alerts)
    }


@app.get("/resource-analysis")
def resource_analysis():
    """Analyze system resources and identify problems."""
    analysis = monitor.analyze_resource_usage()
    stuck_processes = monitor.detect_stuck_processes()
    
    analysis["stuck_processes"] = stuck_processes
    
    # Calculate risk level
    critical_count = (
        len([a for a in analysis["high_cpu_processes"] if a["severity"] == "critical"]) +
        len([a for a in analysis["high_memory_processes"] if a["severity"] == "critical"]) +
        len(analysis["zombie_processes"]) +
        len(stuck_processes)
    )
    
    warning_count = (
        len([a for a in analysis["high_cpu_processes"] if a["severity"] == "warning"]) +
        len([a for a in analysis["high_memory_processes"] if a["severity"] == "warning"])
    )
    
    if critical_count > 0:
        analysis["risk_level"] = "HIGH"
    elif warning_count > 2:
        analysis["risk_level"] = "MEDIUM"
    else:
        analysis["risk_level"] = "LOW"
    
    return analysis
