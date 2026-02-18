import os
import json
import datetime
import subprocess
import psutil

# Use absolute path based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_FOLDER = os.path.join(os.path.dirname(SCRIPT_DIR), "snapshots")

os.makedirs(SNAPSHOT_FOLDER, exist_ok=True)

def run_command(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "Command timeout"
    except Exception as e:
        return f"Error: {str(e)}"

def collect_system_state():
    data = {
        "timestamp": str(datetime.datetime.now()),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": run_command("df -h"),
        "logged_users": run_command("who"),
        "processes": []
    }

    for proc in psutil.process_iter(['pid', 'name']):
        try:
            data["processes"].append({
                "pid": proc.info['pid'],
                "name": proc.info['name']
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            # Skip processes that no longer exist or we don't have permission to access
            pass

    return data

def save_snapshot(data):
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(SNAPSHOT_FOLDER, f"snapshot_{timestamp}.json")

    try:
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)
        print(f"Snapshot saved: {filename}")
    except (IOError, OSError) as e:
        print(f"Error saving snapshot: {e}")
        raise

if __name__ == "__main__":
    system_state = collect_system_state()
    save_snapshot(system_state)
