import os
import json
import datetime
import subprocess
import psutil

SNAPSHOT_FOLDER = "../snapshots"

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

    for proc in psutil.process_iter(['pid', 'name']):
        try:
            data["processes"].append({
                "pid": proc.info['pid'],
                "name": proc.info['name']
            })
        except:
            pass

    return data

def save_snapshot(data):
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SNAPSHOT_FOLDER}/snapshot_{timestamp}.json"

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

    print(f"Snapshot saved: {filename}")

if __name__ == "__main__":
    system_state = collect_system_state()
    save_snapshot(system_state)
