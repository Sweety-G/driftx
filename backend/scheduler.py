import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from dotenv import load_dotenv

# Import the snapshot collector
from collector.snapshot import collect_system_state, save_snapshot

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration from environment
SNAPSHOT_INTERVAL = int(os.getenv("SNAPSHOT_INTERVAL", "5"))
TIMEZONE = os.getenv("TIMEZONE", "UTC")
AUTO_SNAPSHOT_ENABLED = os.getenv("AUTO_SNAPSHOT_ENABLED", "true").lower() == "true"
MAX_SNAPSHOTS = int(os.getenv("MAX_SNAPSHOTS", "1000"))

# Global scheduler instance
scheduler = None


def create_snapshot():
    """Create a system snapshot."""
    try:
        logger.info("Creating scheduled snapshot...")
        system_state = collect_system_state()
        save_snapshot(system_state, max_snapshots=MAX_SNAPSHOTS)
        logger.info("Scheduled snapshot created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating snapshot: {e}")
        return False


def init_scheduler():
    """Initialize and start the scheduler."""
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler already initialized")
        return scheduler
    
    scheduler = BackgroundScheduler(timezone=TIMEZONE)
    
    if AUTO_SNAPSHOT_ENABLED:
        # Add job to create snapshots at regular intervals
        scheduler.add_job(
            func=create_snapshot,
            trigger=IntervalTrigger(minutes=SNAPSHOT_INTERVAL),
            id="snapshot_job",
            name="Create system snapshot",
            replace_existing=True
        )
        logger.info(f"Scheduler initialized with {SNAPSHOT_INTERVAL} minute interval")
    else:
        logger.info("Auto snapshot disabled")
    
    scheduler.start()
    logger.info("Scheduler started")
    
    return scheduler


def get_scheduler_info():
    """Get information about the scheduler status."""
    if scheduler is None:
        return {
            "scheduler_running": False,
            "auto_snapshot_enabled": False,
            "interval_minutes": SNAPSHOT_INTERVAL,
            "next_run": None
        }
    
    jobs = scheduler.get_jobs()
    snapshot_job = next((job for job in jobs if job.id == "snapshot_job"), None)
    
    next_run = None
    if snapshot_job and snapshot_job.next_run_time:
        next_run = snapshot_job.next_run_time.isoformat()
    
    return {
        "scheduler_running": scheduler.running,
        "auto_snapshot_enabled": AUTO_SNAPSHOT_ENABLED,
        "interval_minutes": SNAPSHOT_INTERVAL,
        "next_run": next_run
    }


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    global scheduler
    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Scheduler shutdown")
