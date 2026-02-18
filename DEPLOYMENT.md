# DriftX Quick Deployment Guide

## 🚀 Quick Start (Development)

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

**Access**: http://localhost:5173

---

## 🏭 Production Deployment

### Prerequisites
- Ubuntu/Debian or RHEL/CentOS/Fedora
- Python 3.8+
- Node.js 18+
- Nginx
- Sudo access

### Quick Install Script
```bash
# Install system dependencies
sudo apt update && sudo apt install -y python3 python3-venv nginx

# Create application user
sudo useradd -r -s /bin/false driftx

# Install application
sudo mkdir -p /opt/driftx
sudo cp -r backend frontend /opt/driftx/
sudo chown -R driftx:driftx /opt/driftx

# Setup backend
cd /opt/driftx/backend
sudo -u driftx python3 -m venv /opt/driftx/venv
sudo -u driftx /opt/driftx/venv/bin/pip install -r requirements.txt
sudo -u driftx mkdir -p snapshots

# Build frontend
cd /opt/driftx/frontend
npm install
npm run build
sudo mkdir -p /var/www/driftx
sudo cp -r dist/* /var/www/driftx/

# Install systemd service
sudo cp systemd/driftx.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable driftx
sudo systemctl start driftx

# Install nginx config
sudo cp nginx-driftx.conf /etc/nginx/sites-available/driftx
sudo ln -s /etc/nginx/sites-available/driftx /etc/nginx/sites-enabled/
# IMPORTANT: Edit nginx-driftx.conf to uncomment production config
sudo nginx -t
sudo systemctl reload nginx

# Allow firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # If using HTTPS
```

### Verify Installation
```bash
# Check backend
sudo systemctl status driftx
curl http://localhost:8000/

# Check nginx
sudo nginx -t
curl http://localhost/api/

# Check logs
sudo journalctl -u driftx -f
sudo tail -f /var/log/nginx/access.log
```

---

## 🔧 Configuration

### Backend (.env)
```bash
SNAPSHOT_INTERVAL=5       # Minutes between snapshots
TIMEZONE=UTC              # IANA timezone
AUTO_SNAPSHOT_ENABLED=true
MAX_SNAPSHOTS=1000
```

### Frontend (Production)
For production deployment with nginx, the frontend automatically uses `/api/*` endpoints.

For custom backend URL:
```bash
# frontend/.env
VITE_API_URL=/api
```

---

## 📊 Monitoring

### Service Status
```bash
sudo systemctl status driftx
sudo systemctl status nginx
```

### Logs
```bash
# Backend logs
sudo journalctl -u driftx -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Resource Usage
```bash
# Check CPU/Memory
ps aux | grep python
ps aux | grep nginx

# Check disk space (snapshots)
du -sh /opt/driftx/backend/snapshots
```

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u driftx -xe

# Verify dependencies
/opt/driftx/venv/bin/pip list

# Check port
sudo netstat -tuln | grep 8000

# Test manually
cd /opt/driftx/backend
source /opt/driftx/venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Frontend not loading
```bash
# Check nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/driftx/

# Restart nginx
sudo systemctl restart nginx
```

### API calls failing
```bash
# Test backend directly
curl http://localhost:8000/

# Test through nginx
curl http://localhost/api/

# Check proxy logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 Security Checklist

- [ ] Backend listens only on 127.0.0.1 (not 0.0.0.0)
- [ ] Nginx is the only public-facing service
- [ ] Firewall configured (only 80/443 open)
- [ ] HTTPS configured with valid certificates
- [ ] Systemd service runs as non-root user
- [ ] File permissions set correctly (`chown driftx:driftx`)
- [ ] No secrets in environment variables or config files

---

## 📈 Scaling

### Increase Snapshot Retention
Edit `/opt/driftx/backend/.env`:
```bash
MAX_SNAPSHOTS=5000  # Keep more snapshots
```

### Change Snapshot Frequency
Edit `/opt/driftx/backend/.env`:
```bash
SNAPSHOT_INTERVAL=1  # Every 1 minute (more frequent)
# or
SNAPSHOT_INTERVAL=15  # Every 15 minutes (less frequent)
```

Restart service:
```bash
sudo systemctl restart driftx
```

### Enable HTTPS
1. Install certbot: `sudo apt install certbot python3-certbot-nginx`
2. Get certificate: `sudo certbot --nginx -d your-domain.com`
3. Certbot will automatically configure nginx

---

## 🆘 Support

For issues:
1. Check logs: `sudo journalctl -u driftx -f`
2. Review README.md for detailed documentation
3. Run test script: `./test-deployment.sh`
4. Open GitHub issue with logs

---

## ✅ Post-Installation Checklist

- [ ] Backend service running: `sudo systemctl status driftx`
- [ ] Nginx configured and running: `sudo systemctl status nginx`
- [ ] Can access frontend: `http://your-server/`
- [ ] API calls working: `curl http://your-server/api/`
- [ ] Snapshots being created: `ls -la /opt/driftx/backend/snapshots/`
- [ ] Logs accessible: `sudo journalctl -u driftx -f`
- [ ] Firewall configured: `sudo ufw status`
- [ ] HTTPS configured (production)
