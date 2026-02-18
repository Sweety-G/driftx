# DriftX - Lightweight Forensic Change Intelligence Dashboard

DriftX is a lightweight forensic change intelligence dashboard that monitors system processes, detects drift, and provides real-time alerts for anomalous behavior.

## Features

- 🔄 **Drift Detection** - Track changes in running processes over time
- 📊 **Resource Monitoring** - Monitor CPU, memory, and process health
- ⚠️ **Alert System** - Get notified of high resource usage and stuck processes
- 📸 **Automated Snapshots** - Scheduled system state snapshots every 5 minutes
- 🎯 **Process Analysis** - Detailed process information and resource analysis

## Architecture

DriftX uses a modern web architecture with:

- **Backend**: FastAPI (Python) running on port 8000 (localhost only)
- **Frontend**: React + Vite running on port 5173 (development) or served via nginx (production)
- **Reverse Proxy**: Nginx proxies `/api/*` requests to the backend (production)

```
┌──────────────────────┐
│  Browser             │
│  http://IP:80        │
│                      │
│  fetch('/api/drift') │ ← Relative path
└──────────┬───────────┘
           │
    ┌──────▼────────┐
    │ Nginx Proxy   │
    │ Port 80/443   │
    │               │
    │ /api/* →      │
    │ localhost:8000│
    └──────┬────────┘
           │
    ┌──────▼──────────┐
    │ FastAPI Backend │
    │ localhost:8000  │
    │ (only local)    │
    └─────────────────┘
```

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sweety-G/driftx.git
   cd driftx
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Start Development Servers**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   source venv/bin/activate
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   
   Terminal 2 - Frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   
   Access the application at: `http://localhost:5173`

### Production Deployment

#### 1. Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-venv python3-pip nginx

# RHEL/CentOS/Fedora
sudo dnf install python3 python3-pip nginx
```

#### 2. Create Application User

```bash
sudo useradd -r -s /bin/false driftx
```

#### 3. Install Application

```bash
# Clone or copy application files
sudo mkdir -p /opt/driftx
sudo cp -r backend frontend /opt/driftx/
sudo chown -R driftx:driftx /opt/driftx

# Setup Python virtual environment
cd /opt/driftx/backend
sudo -u driftx python3 -m venv /opt/driftx/venv
sudo -u driftx /opt/driftx/venv/bin/pip install -r requirements.txt

# Create snapshots directory
sudo -u driftx mkdir -p /opt/driftx/backend/snapshots
```

#### 4. Build Frontend

```bash
cd /opt/driftx/frontend
npm install
npm run build

# Move build files to nginx directory
sudo mkdir -p /var/www/driftx
sudo cp -r dist/* /var/www/driftx/
```

#### 5. Configure Systemd Service

```bash
# Copy service file
sudo cp systemd/driftx.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable driftx
sudo systemctl start driftx

# Check status
sudo systemctl status driftx
```

#### 6. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx-driftx.conf /etc/nginx/sites-available/driftx
sudo ln -s /etc/nginx/sites-available/driftx /etc/nginx/sites-enabled/

# For production, update nginx-driftx.conf to serve static files:
# Uncomment the production section and comment out the proxy_pass to localhost:5173

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### 7. Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
# For HTTPS (if configured):
sudo ufw allow 443/tcp
```

## Configuration

### Backend Configuration

Create `/opt/driftx/backend/.env` file:

```bash
# Snapshot interval in minutes (default: 5)
SNAPSHOT_INTERVAL=5

# Timezone (default: UTC)
TIMEZONE=UTC

# Enable/disable auto snapshots (default: true)
AUTO_SNAPSHOT_ENABLED=true

# Maximum snapshots to keep (default: 1000)
MAX_SNAPSHOTS=1000
```

### Frontend Configuration

The frontend uses environment-based configuration:

- **Development**: Connects directly to `http://127.0.0.1:8000`
- **Production**: Uses `/api/*` endpoints (proxied by nginx)

To override the API URL, set `VITE_API_URL` in `.env`:

```bash
VITE_API_URL=http://custom-backend:8000
```

## API Endpoints

### System Endpoints

- `GET /` - Backend health check
- `GET /snapshot-info` - Snapshot metadata and timing
- `GET /scheduler-status` - Scheduler status and configuration
- `POST /trigger-snapshot` - Manually trigger a snapshot

### Drift Detection

- `GET /drift` - Get process drift between last two snapshots
- `GET /timeline` - Get snapshot timeline (last 5 snapshots)

### Process Monitoring

- `GET /current-processes` - Get all currently running processes
- `GET /process-details/{pid}` - Get details for specific process
- `GET /alerts` - Get current system alerts
- `GET /resource-analysis` - Comprehensive resource analysis

## Monitoring

### View Logs

```bash
# Backend logs (systemd)
sudo journalctl -u driftx -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Service Status

```bash
# Backend service
sudo systemctl status driftx

# Nginx service
sudo systemctl status nginx
```

## Troubleshooting

### Backend Won't Start

1. Check service logs: `sudo journalctl -u driftx -xe`
2. Verify Python dependencies: `/opt/driftx/venv/bin/pip list`
3. Check port 8000 availability: `sudo netstat -tuln | grep 8000`
4. Verify permissions: `ls -la /opt/driftx/backend/snapshots`

### Frontend Not Loading

1. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify nginx configuration: `sudo nginx -t`
3. Check if files exist: `ls -la /var/www/driftx/`
4. Verify nginx is running: `sudo systemctl status nginx`

### API Calls Failing

1. Check nginx proxy configuration in `/etc/nginx/sites-available/driftx`
2. Verify backend is running: `curl http://localhost:8000/`
3. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify CORS headers are set correctly

## Security Considerations

1. **Backend Isolation**: Backend only listens on `127.0.0.1:8000` (not exposed to network)
2. **Reverse Proxy**: All external access goes through nginx
3. **Service Security**: Systemd service runs with limited privileges
4. **HTTPS**: Configure SSL/TLS certificates in nginx for production
5. **Firewall**: Only expose necessary ports (80, 443)

## Development

### Running Tests

```bash
# Backend tests (if available)
cd backend
pytest

# Frontend tests (if available)
cd frontend
npm test
```

### Code Structure

```
driftx/
├── backend/
│   ├── analyzer/          # Process analysis modules
│   ├── collector/         # System state collection
│   ├── drift_engine/      # Drift detection logic
│   ├── snapshots/         # Snapshot storage
│   ├── main.py           # FastAPI application
│   ├── scheduler.py      # APScheduler setup
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── config/       # API configuration
│   │   └── App.jsx       # Main application
│   └── package.json      # Node dependencies
├── nginx-driftx.conf     # Nginx configuration
└── systemd/
    └── driftx.service    # Systemd service file
```

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

For issues and questions, please open an issue on GitHub.
