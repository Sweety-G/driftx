"""
Process monitoring and analysis module.
Provides functionality for analyzing process health, detecting stuck processes,
memory leaks, and generating alerts for abnormal behavior.
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class ProcessMonitor:
    """Monitor and analyze process behavior for anomalies."""
    
    def __init__(self, snapshot_folder: str = "./snapshots"):
        self.snapshot_folder = snapshot_folder
        self.cpu_threshold_critical = 80
        self.cpu_threshold_warning = 50
        self.memory_threshold_critical = 20
        self.memory_threshold_warning = 10
        
    def get_current_processes(self) -> List[Dict]:
        """Get current running processes from the latest snapshot."""
        try:
            files = sorted(os.listdir(self.snapshot_folder))
            if not files:
                return []
            
            latest_file = files[-1]
            with open(f"{self.snapshot_folder}/{latest_file}") as f:
                data = json.load(f)
            
            return data.get("processes", [])
        except Exception:
            return []
    
    def get_process_by_pid(self, pid: int) -> Optional[Dict]:
        """Get detailed information about a specific process by PID."""
        processes = self.get_current_processes()
        for proc in processes:
            if proc.get("pid") == pid:
                return proc
        return None
    
    def get_alerts(self) -> List[Dict]:
        """Get all current alerts from processes with issues."""
        processes = self.get_current_processes()
        alerts = []
        
        for proc in processes:
            if proc.get("alert"):
                alert = proc["alert"].copy()
                alert["pid"] = proc["pid"]
                alert["name"] = proc["name"]
                alerts.append(alert)
        
        return alerts
    
    def analyze_resource_usage(self) -> Dict:
        """Analyze system resource usage and identify problems."""
        processes = self.get_current_processes()
        
        if not processes:
            return {
                "total_processes": 0,
                "high_cpu_processes": [],
                "high_memory_processes": [],
                "zombie_processes": [],
                "total_cpu_usage": 0,
                "total_memory_usage": 0,
                "top_cpu_consumers": [],
                "top_memory_consumers": []
            }
        
        # Sort processes by CPU and memory usage
        sorted_by_cpu = sorted(processes, key=lambda p: p.get("cpu_percent", 0), reverse=True)
        sorted_by_memory = sorted(processes, key=lambda p: p.get("memory_percent", 0), reverse=True)
        
        # Calculate totals
        total_cpu = sum(p.get("cpu_percent", 0) for p in processes)
        total_memory = sum(p.get("memory_percent", 0) for p in processes)
        
        # Identify problem processes
        high_cpu = [p for p in processes if p.get("cpu_percent", 0) > self.cpu_threshold_warning]
        high_memory = [p for p in processes if p.get("memory_percent", 0) > self.memory_threshold_warning]
        zombie_procs = [p for p in processes if p.get("status") in ['zombie', 'defunct']]
        
        return {
            "total_processes": len(processes),
            "high_cpu_processes": [
                {
                    "pid": p["pid"],
                    "name": p["name"],
                    "cpu_percent": p.get("cpu_percent", 0),
                    "severity": "critical" if p.get("cpu_percent", 0) > self.cpu_threshold_critical else "warning"
                }
                for p in high_cpu
            ],
            "high_memory_processes": [
                {
                    "pid": p["pid"],
                    "name": p["name"],
                    "memory_percent": p.get("memory_percent", 0),
                    "memory_mb": p.get("memory_mb", 0),
                    "severity": "critical" if p.get("memory_percent", 0) > self.memory_threshold_critical else "warning"
                }
                for p in high_memory
            ],
            "zombie_processes": [
                {
                    "pid": p["pid"],
                    "name": p["name"],
                    "status": p.get("status")
                }
                for p in zombie_procs
            ],
            "total_cpu_usage": round(total_cpu, 2),
            "total_memory_usage": round(total_memory, 2),
            "top_cpu_consumers": [
                {
                    "pid": p["pid"],
                    "name": p["name"],
                    "cpu_percent": p.get("cpu_percent", 0)
                }
                for p in sorted_by_cpu[:5]
            ],
            "top_memory_consumers": [
                {
                    "pid": p["pid"],
                    "name": p["name"],
                    "memory_percent": p.get("memory_percent", 0),
                    "memory_mb": p.get("memory_mb", 0)
                }
                for p in sorted_by_memory[:5]
            ]
        }
    
    def detect_stuck_processes(self, history_window: int = 3) -> List[Dict]:
        """
        Detect processes that have been using high CPU for a sustained period.
        Checks the last N snapshots (history_window) for consistent high CPU usage.
        """
        try:
            files = sorted(os.listdir(self.snapshot_folder))
            if len(files) < history_window:
                return []
            
            # Get the last N snapshots
            recent_files = files[-history_window:]
            
            # Track CPU usage across snapshots for each PID
            pid_cpu_history = {}
            
            for snapshot_file in recent_files:
                with open(f"{self.snapshot_folder}/{snapshot_file}") as f:
                    data = json.load(f)
                
                for proc in data.get("processes", []):
                    pid = proc.get("pid")
                    cpu = proc.get("cpu_percent", 0)
                    
                    if pid not in pid_cpu_history:
                        pid_cpu_history[pid] = {
                            "name": proc.get("name"),
                            "cpu_values": [],
                            "user": proc.get("user"),
                            "command": proc.get("command")
                        }
                    
                    pid_cpu_history[pid]["cpu_values"].append(cpu)
            
            # Identify stuck processes (high CPU in all snapshots)
            stuck_processes = []
            for pid, info in pid_cpu_history.items():
                cpu_values = info["cpu_values"]
                if len(cpu_values) >= history_window:
                    avg_cpu = sum(cpu_values) / len(cpu_values)
                    min_cpu = min(cpu_values)
                    
                    # Process is stuck if it has consistently high CPU
                    if avg_cpu > self.cpu_threshold_critical and min_cpu > self.cpu_threshold_warning:
                        stuck_processes.append({
                            "pid": pid,
                            "name": info["name"],
                            "avg_cpu": round(avg_cpu, 2),
                            "min_cpu": round(min_cpu, 2),
                            "max_cpu": round(max(cpu_values), 2),
                            "user": info.get("user"),
                            "command": info.get("command"),
                            "duration_snapshots": len(cpu_values)
                        })
            
            return stuck_processes
        except Exception:
            return []
