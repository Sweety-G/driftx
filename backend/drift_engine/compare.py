import json
import os

# Use absolute path based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_FOLDER = os.path.join(os.path.dirname(SCRIPT_DIR), "snapshots")

def load_snapshots():
    try:
        files = sorted(os.listdir(SNAPSHOT_FOLDER))
    except (FileNotFoundError, PermissionError) as e:
        print(f"Error accessing snapshot folder: {e}")
        return None, None

    if len(files) < 2:
        print("Need at least 2 snapshots")
        return None, None

    old_file = files[-2]
    new_file = files[-1]

    try:
        with open(os.path.join(SNAPSHOT_FOLDER, old_file)) as f:
            old_data = json.load(f)

        with open(os.path.join(SNAPSHOT_FOLDER, new_file)) as f:
            new_data = json.load(f)

        return old_data, new_data
    except (FileNotFoundError, json.JSONDecodeError, IOError) as e:
        print(f"Error loading snapshots: {e}")
        return None, None


def detect_drift(old, new):
    old_processes = {p["name"] for p in old["processes"]}
    new_processes = {p["name"] for p in new["processes"]}

    added = new_processes - old_processes
    removed = old_processes - new_processes

    print("\n=== DRIFT DETECTION RESULT ===")
    print("Added Processes:", added)
    print("Removed Processes:", removed)


if __name__ == "__main__":
    old, new = load_snapshots()
    if old and new:
        detect_drift(old, new)
