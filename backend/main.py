from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import json
import os
from datetime import datetime, timezone
from analyzer.process_monitor import ProcessMonitor
from scheduler import init_scheduler, shutdown_scheduler, get_scheduler_info, create_snapshot


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize scheduler
    init_scheduler()
    yield
    # Shutdown: Clean up scheduler
    shutdown_scheduler()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper to create JSON responses with no-cache headers
def json_response(data, status_code=200):
    return JSONResponse(
        content=data,
        status_code=status_code,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Expires": "0"
        }
    )


SNAPSHOT_FOLDER = "./snapshots"
monitor = ProcessMonitor(SNAPSHOT_FOLDER)


@app.get("/")
def home():
    return json_response({"message": "DriftX Backend Running"})


@app.get("/latest-snapshot")
def latest_snapshot():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    if not files:
        return json_response({"error": "No snapshots found"})

    latest = files[-1]

    with open(f"{SNAPSHOT_FOLDER}/{latest}") as f:
        data = json.load(f)

    return json_response(data)


@app.get("/drift")
def drift_result():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    if len(files) < 2:
        return json_response({"error": "Need at least 2 snapshots"})

    old_file = files[-2]
    new_file = files[-1]

    with open(f"{SNAPSHOT_FOLDER}/{old_file}") as f:
        old_data = json.load(f)

    with open(f"{SNAPSHOT_FOLDER}/{new_file}") as f:
        new_data = json.load(f)

    old_proc = {p["name"] for p in old_data["processes"]}
    new_proc = {p["name"] for p in new_data["processes"]}

    return json_response({
        "added": list(new_proc - old_proc),
        "removed": list(old_proc - new_proc)
    })
@app.get("/timeline")
def timeline():
    files = sorted(os.listdir(SNAPSHOT_FOLDER))

    timeline_data = []

    for f in files[-5:]:
        timeline_data.append({
            "snapshot": f,
            "time": f.replace("snapshot_", "").replace(".json", "")
        })

    return json_response(timeline_data)


@app.get("/current-processes")
def current_processes():
    """Get all currently running processes with detailed information."""
    processes = monitor.get_current_processes()
    return json_response({
        "processes": processes,
        "total": len(processes)
    })


@app.get("/process-details/{pid}")
def process_details(pid: int):
    """Get detailed information about a specific process by PID."""
    process = monitor.get_process_by_pid(pid)
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with PID {pid} not found")
    return json_response(process)


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
    
    return json_response({
        "alerts": alerts,
        "total": len(alerts)
    })


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
    
    return json_response(analysis)


@app.get("/snapshot-info")
def snapshot_info():
    """Get snapshot metadata and timing information."""
    files = sorted(os.listdir(SNAPSHOT_FOLDER))
    
    total_snapshots = len(files)
    last_snapshot_time = None
    time_since_last = None
    server_time = datetime.now(timezone.utc).isoformat()
    
    if files:
        latest_file = files[-1]
        # Parse timestamp from filename: snapshot_20260218_153245.json
        try:
            timestamp_str = latest_file.replace("snapshot_", "").replace(".json", "")
            last_snapshot_dt = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            last_snapshot_time = last_snapshot_dt.isoformat()
            
            # Calculate time since last snapshot
            now = datetime.now()
            delta = now - last_snapshot_dt
            minutes = int(delta.total_seconds() / 60)
            
            if minutes < 1:
                time_since_last = "just now"
            elif minutes == 1:
                time_since_last = "1 minute ago"
            elif minutes < 60:
                time_since_last = f"{minutes} minutes ago"
            else:
                hours = minutes // 60
                if hours == 1:
                    time_since_last = "1 hour ago"
                else:
                    time_since_last = f"{hours} hours ago"
        except Exception as e:
            pass
    
    # Get scheduler info for next scheduled snapshot
    scheduler_info = get_scheduler_info()
    next_scheduled = scheduler_info.get("next_run")
    
    return json_response({
        "total_snapshots": total_snapshots,
        "last_snapshot_time": last_snapshot_time,
        "next_scheduled_snapshot": next_scheduled,
        "time_since_last": time_since_last,
        "server_time": server_time
    })


@app.post("/trigger-snapshot")
def trigger_snapshot():
    """Manually trigger a snapshot creation."""
    try:
        success = create_snapshot()
        
        if success:
            # Get the latest snapshot filename
            files = sorted(os.listdir(SNAPSHOT_FOLDER))
            filename = files[-1] if files else None
            
            return json_response({
                "status": "success",
                "snapshot_created": True,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "filename": filename
            })
        else:
            raise HTTPException(status_code=500, detail="Failed to create snapshot")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating snapshot: {str(e)}")


@app.get("/scheduler-status")
def scheduler_status():
    """Get scheduler status and configuration."""
    return json_response(get_scheduler_info())

