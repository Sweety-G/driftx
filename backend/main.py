from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SNAPSHOT_FOLDER = "./snapshots"


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
