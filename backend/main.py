from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os


# Get CORS origins from environment variable or use default
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Specific origins instead of wildcard
    allow_credentials=False,  # Set to False when using specific origins for security
    allow_methods=["GET"],  # Only allow GET methods for this API
    allow_headers=["*"],
)


# Use absolute path based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_FOLDER = os.path.join(SCRIPT_DIR, "snapshots")


@app.get("/")
def home():
    return {"message": "DriftX Backend Running"}


@app.get("/latest-snapshot")
def latest_snapshot():
    try:
        files = sorted(os.listdir(SNAPSHOT_FOLDER))
    except (FileNotFoundError, PermissionError) as e:
        raise HTTPException(status_code=500, detail=f"Error accessing snapshots: {str(e)}")

    if not files:
        raise HTTPException(status_code=404, detail="No snapshots found")

    latest = files[-1]

    try:
        with open(os.path.join(SNAPSHOT_FOLDER, latest)) as f:
            data = json.load(f)
        return data
    except (FileNotFoundError, json.JSONDecodeError, IOError) as e:
        raise HTTPException(status_code=500, detail=f"Error reading snapshot: {str(e)}")


@app.get("/drift")
def drift_result():
    try:
        files = sorted(os.listdir(SNAPSHOT_FOLDER))
    except (FileNotFoundError, PermissionError) as e:
        raise HTTPException(status_code=500, detail=f"Error accessing snapshots: {str(e)}")

    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 snapshots")

    old_file = files[-2]
    new_file = files[-1]

    try:
        with open(os.path.join(SNAPSHOT_FOLDER, old_file)) as f:
            old_data = json.load(f)

        with open(os.path.join(SNAPSHOT_FOLDER, new_file)) as f:
            new_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, IOError) as e:
        raise HTTPException(status_code=500, detail=f"Error reading snapshots: {str(e)}")

    old_proc = {p["name"] for p in old_data.get("processes", [])}
    new_proc = {p["name"] for p in new_data.get("processes", [])}

    return {
        "added": list(new_proc - old_proc),
        "removed": list(old_proc - new_proc)
    }
@app.get("/timeline")
def timeline():
    try:
        files = sorted(os.listdir(SNAPSHOT_FOLDER))
    except (FileNotFoundError, PermissionError) as e:
        raise HTTPException(status_code=500, detail=f"Error accessing snapshots: {str(e)}")

    timeline_data = []

    for f in files[-5:]:
        timeline_data.append({
            "snapshot": f,
            "time": f.replace("snapshot_", "").replace(".json", "")
        })

    return timeline_data
