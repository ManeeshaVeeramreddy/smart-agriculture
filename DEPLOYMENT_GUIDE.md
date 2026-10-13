# SMART AGRICULTURE MONITORING SYSTEM (SAMS)
## Complete Production Deployment Guide

This guide explains how to deploy the **Smart Agriculture Monitoring System (SAMS)** across different environments, from 1-click Docker containers to free cloud platforms (Render/Railway) and dedicated Linux VPS / AWS EC2 cloud instances.

---

## 0. Key Architectural Advantage

**One Single Self-Contained Artifact:**  
Because the frontend UI is compiled into Spring Boot's static resources (`classpath:/static/`), you do **not** need to deploy separate frontend and backend servers. The single executable `.jar` file serves:
- All REST APIs (`/api/**`)
- Interactive Swagger Documentation (`/swagger-ui.html`)
- All responsive HTML/CSS/JS frontend pages (`/index.html`, `/farmer-home.html`, etc.)
- Database persistence (MySQL or H2)

---

## 1. Option 1: One-Command Docker Deployment (Recommended)

Docker provides an isolated, production-grade environment bundling both Spring Boot and MySQL 8.0 with automatic health checks and persistent storage.

### Prerequisites:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Deployment Steps:
1. Open a terminal in the project root directory:
   ```bash
   cd c:\Users\manoj\Downloads\last
   ```
2. Run Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Docker will:
   - Build the multi-stage lightweight Alpine JRE image.
   - Start the MySQL 8.0 container and mount schema & initial data.
   - Wait for MySQL to pass health check pings.
   - Start the SAMS web application on port `8080`.

4. **Access the application:**
   - Web App: [http://localhost:8080](http://localhost:8080)
   - Swagger Docs: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

5. **Useful Docker Commands:**
   - View live logs: `docker compose logs -f`
   - Stop containers: `docker compose down`
   - Stop and wipe database volume: `docker compose down -v`

---

## 2. Option 2: Free / Low-Cost Cloud Deployment (Render, Railway, Fly.io)

For university presentations, remote evaluations, and live portfolio demonstrations, you can deploy to free cloud PaaS providers without managing a Linux server.

> [!IMPORTANT]
> **Why HTTPS Matters:**  
> The browser **Web Speech API** (used for microphone voice input in Agri-Voice) is strictly disabled by modern browsers (Chrome/Edge/Safari) on insecure HTTP connections, **except on `localhost`**. Cloud platforms automatically provide free SSL certificates (`https://`), ensuring voice recognition works perfectly on mobile phones!

### Method A: Deploy on Render (render.com)
1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git remote add origin https://github.com/<your-username>/smart-agriculture.git
   git push -u origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Environment:** `Docker` (Render will detect the root `Dockerfile`)
   - **Plan:** Free
   - **Instance Type:** Free Tier
6. Add Environment Variables (optional, for standalone zero-db mode):
   - `SPRING_PROFILES_ACTIVE` = `h2`
   - `JAVA_OPTS` = `-Xms128m -Xmx384m`
7. Click **Create Web Service**.
8. Render will build and deploy the container in ~2 minutes and provide a live URL (e.g. `https://sams-agri.onrender.com`).

---

### Method B: Deploy on Railway (railway.app)
1. Log into [Railway](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub Repo**.
3. (Optional for MySQL): In the same project canvas, click **New** $\rightarrow$ **Database** $\rightarrow$ **Add MySQL**.
4. In the app settings, set:
   - `SPRING_PROFILES_ACTIVE` = `mysql`
   - `SPRING_DATASOURCE_URL` = `${{MySQL.MYSQL_URL}}`
5. Railway provides automated SSL, domain routing, and health checks out of the box.

---

## 3. Option 3: Dedicated Linux Cloud Server (AWS EC2 / DigitalOcean / Linode)

For full control, long-term deployment, or enterprise environments.

### Step 1: Provision an Ubuntu 22.04 or 24.04 LTS Server
Connect via SSH:
```bash
ssh ubuntu@your-server-ip
```

### Step 2: Install OpenJDK 21 & MySQL
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-21-jdk mysql-server nginx certbot python3-certbot-nginx
```

### Step 3: Configure MySQL Database
```bash
sudo mysql
```
Inside the MySQL prompt:
```sql
CREATE DATABASE smart_agriculture CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'samsuser'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON smart_agriculture.* TO 'samsuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Transfer and Package the Application
On your local machine, build the production JAR:
```powershell
cd backend
.\mvnw.cmd clean package -DskipTests
```
Transfer the JAR file to your cloud server:
```bash
scp backend/target/smart-agriculture-backend-1.0.0.jar ubuntu@your-server-ip:/home/ubuntu/sams-app.jar
```

### Step 5: Configure Systemd Service (Automatic Startup on Boot)
Create a service definition file:
```bash
sudo nano /etc/systemd/system/sams.service
```
Paste the following configuration:
```ini
[Unit]
Description=Smart Agriculture Monitoring System (SAMS)
After=network.target mysql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment="SPRING_PROFILES_ACTIVE=mysql"
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/smart_agriculture?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
Environment="SPRING_DATASOURCE_USERNAME=samsuser"
Environment="SPRING_DATASOURCE_PASSWORD=StrongPassword123!"
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /home/ubuntu/sams-app.jar
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sams
sudo systemctl start sams
sudo systemctl status sams
```

---

### Step 6: Configure Nginx as a Secure Reverse Proxy with HTTPS

Create an Nginx server block:
```bash
sudo nano /etc/nginx/sites-available/sams
```
Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/sams /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Obtain a free Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
*Certbot will configure HTTPS and automatic renewal automatically.*

---

## 4. Option 4: Local Machine or College Lab Network (LAN)

If you need to demonstrate the system on an examiner's laptop or college LAN:

### Running on LAN (Access from Mobile Phones):
1. Find your machine's local IP address:
   - In PowerShell: `ipconfig` (e.g., `192.168.1.45`)
2. Start the backend:
   ```bat
   run-backend.bat
   ```
3. Allow port `8080` through Windows Defender Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "SAMS Port 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```
4. Any phone or tablet connected to the same Wi-Fi network can open:
   `http://192.168.1.45:8080`

---

## 5. Production Environment Variables Reference

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `h2` | `h2` for in-memory zero-config; `mysql` for MySQL database |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/smart_agriculture...` | JDBC database connection URL |
| `SPRING_DATASOURCE_USERNAME` | `root` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `YOUR_PASSWORD` | Database password |
| `APP_JWT_SECRET` | *(64-character hex key)* | Secret key for HMAC-SHA256 token signing |
| `SERVER_PORT` | `8080` | Port on which embedded Tomcat listens |
| `JAVA_OPTS` | `-Xms256m -Xmx512m` | Memory and GC tuning flags for Java runtime |

---

## 6. Pre-Flight Deployment Checklist

- [x] **JAR Build Verified:** Packaged cleanly into `smart-agriculture-backend-1.0.0.jar`.
- [x] **Unit & Integration Tests:** 29 automated tests pass with 0 failures (`mvn test`).
- [x] **System Subsystems Verified:** All 8 core subsystems verified via `python test_system.py`.
- [x] **Database Fallback:** Embedded H2 active by default to prevent connection crashes if MySQL is absent.
- [x] **Docker Container Built:** Multi-stage `Dockerfile` and `docker-compose.yml` configured.
- [x] **Microphone Notice:** HTTPS or `localhost` documented for Agri-Voice speech recognition.
