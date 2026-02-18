import os
import json
import datetime
import subprocess
import psutil

SNAPSHOT_FOLDER = "./snapshots"

os.makedirs(SNAPSHOT_FOLDER, exist_ok=True)

def run_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def collect_system_state():
    data = {
        "timestamp": str(datetime.datetime.now()),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": run_command("df -h"),
        "logged_users": run_command("who"),
        "processes": []
    }

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'username', 'cmdline', 'create_time']):
        try:
            proc_info = proc.info
            memory_info = proc.memory_info()
            
            # Determine if process is high CPU or high memory
            cpu_pct = proc_info.get('cpu_percent', 0.0) or 0.0
            mem_pct = proc_info.get('memory_percent', 0.0) or 0.0
            status = proc_info.get('status', 'unknown')
            
            # Detect alerts
            alert = None
            if status in ['zombie', 'defunct']:
                alert = {
                    "type": "zombie",
                    "severity": "critical",
                    "message": f"Zombie/defunct process detected",
                    "value": None,
                    "threshold": None
                }
            elif cpu_pct > 50:
                alert = {
                    "type": "high_cpu",
                    "severity": "critical" if cpu_pct > 80 else "warning",
                    "message": f"Process using {cpu_pct:.1f}% CPU",
                    "value": cpu_pct,
                    "threshold": 50
                }
            elif mem_pct > 10:
                alert = {
                    "type": "high_memory",
                    "severity": "critical" if mem_pct > 20 else "warning",
                    "message": f"Process using {mem_pct:.1f}% memory",
                    "value": mem_pct,
                    "threshold": 10
                }
            
            cmdline = proc_info.get('cmdline')
            command = ' '.join(cmdline) if cmdline else proc_info.get('name', '')
            
            data["processes"].append({
                "pid": proc_info['pid'],
                "name": proc_info['name'],
                "cpu_percent": round(cpu_pct, 2),
                "memory_percent": round(mem_pct, 2),
                "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
                "status": status,
                "user": proc_info.get('username', 'unknown'),
                "command": command[:200] if command else '',  # Limit command length
                "create_time": datetime.datetime.fromtimestamp(proc_info.get('create_time', 0)).isoformat() if proc_info.get('create_time') else None,
                "alert": alert
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    return data

def save_snapshot(data, max_snapshots=None):
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SNAPSHOT_FOLDER}/snapshot_{timestamp}.json"

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

    print(f"Snapshot saved: {filename}")
    
    # Clean up old snapshots if max_snapshots is specified
    if max_snapshots:
        try:
            import glob
            snapshot_files = sorted(glob.glob(f"{SNAPSHOT_FOLDER}/snapshot_*.json"))
            if len(snapshot_files) > max_snapshots:
                # Remove oldest snapshots
                files_to_remove = snapshot_files[:-max_snapshots]
                for old_file in files_to_remove:
                    os.remove(old_file)
                    print(f"Removed old snapshot: {old_file}")
        except Exception as e:
            print(f"Error cleaning up old snapshots: {e}")

if __name__ == "__main__":
    system_state = collect_system_state()
    save_snapshot(system_state)
