# PDF PO Extractor

A deployable FastAPI + React app for extracting JABIL purchase-order PDF fields and exporting a fixed Excel workbook.

## Features

- Username/password login through environment variables.
- Single or batch PDF upload.
- Rule-based parsing for the supplied JABIL `Change to Purchase order` PDF layout.
- Preview table with one row per material item.
- Excel export with `PO Items` and `Parse Summary` sheets.
- Apple-style React frontend with Chinese onboarding guidance for new users.

## Local Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
APP_USERNAME=buyer APP_PASSWORD=secret-password JWT_SECRET=test-secret uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

## Local Frontend

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

Open `http://localhost:5173` and log in with the backend environment credentials.

## Tests

```bash
cd backend
. .venv/bin/activate
pytest -v
```

```bash
cd frontend
npm run build
```

## Alibaba Cloud ECS Single-Server Deployment

This section describes how to deploy the full app on one domestic Alibaba Cloud ECS server with Docker Compose. The deployment runs two containers:

- `frontend`: Nginx serves the React build and proxies `/api/*` requests.
- `backend`: FastAPI runs on the internal Docker network at port `8000`.

Only the frontend port is exposed to the public internet. The backend container should not be opened directly.

### 1. Recommended server

A small internal-use deployment can start with:

- OS: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- CPU: 2 vCPU or higher
- RAM: 2 GB or higher
- Disk: 40 GB or higher
- Public bandwidth: choose according to PDF upload size and expected users

The commands below assume Ubuntu. If you use Alibaba Cloud Linux or CentOS, install Docker and Git with the equivalent package manager.

### 2. Configure Alibaba Cloud security group

In the Alibaba Cloud ECS console, open the instance security group and allow inbound traffic:

| Port | Source | Purpose |
| --- | --- | --- |
| `22/tcp` | Your own IP if possible | SSH login |
| `8080/tcp` | `0.0.0.0/0` or office IP range | App access if using the default Compose port |
| `80/tcp` | `0.0.0.0/0` | Optional, if you map the app to HTTP port 80 |
| `443/tcp` | `0.0.0.0/0` | Optional, if you later add HTTPS |

Do not open `8000/tcp` publicly. It is the backend service port and is only needed inside Docker Compose.

### 3. SSH into the server

From your local machine:

```bash
ssh root@YOUR_SERVER_PUBLIC_IP
```

If you use a non-root user, prefix the system installation commands with `sudo`.

### 4. Install Git, Docker, and Docker Compose plugin

```bash
apt update
apt install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify installation:

```bash
docker --version
docker compose version
```

### 5. Optional: configure Docker registry mirror for domestic network

Docker image pulls from Docker Hub may be slow from a domestic server. If your ECS cannot pull images reliably, configure a registry mirror.

Create or edit `/etc/docker/daemon.json`:

```bash
cat >/etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io"
  ]
}
EOF
systemctl daemon-reload
systemctl restart docker
```

Then test image pulling:

```bash
docker pull hello-world
docker run --rm hello-world
```

If your organization has an Alibaba Cloud Container Registry mirror, use that mirror instead of the public example above.

### 6. Clone the repository

Choose an application directory:

```bash
mkdir -p /opt/apps
cd /opt/apps
git clone https://github.com/EurekaZang/PDFParsing.git
cd PDFParsing
```

If the code you want to deploy is on the current development branch, check it out explicitly:

```bash
git checkout task-4-second-rereview-fix
```

If you later merge the work to `main`, deploy from `main` instead:

```bash
git checkout main
git pull
```

### 7. Create production environment file

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
nano .env
```

Example production values:

```env
APP_USERNAME=buyer
APP_PASSWORD=replace-with-a-strong-password
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_PORT=8080
```

Important production notes:

- Change `APP_PASSWORD`. Do not use `secret-password` or `change-this-password` in production.
- Set `JWT_SECRET` to a long random value.
- Keep `.env` private. Do not commit it to Git.
- `FRONTEND_PORT=8080` means the app is available at `http://SERVER_IP:8080`.
- If you want direct HTTP access at `http://SERVER_IP`, set `FRONTEND_PORT=80` and make sure port 80 is open in the security group.

Generate a random JWT secret:

```bash
openssl rand -hex 32
```

### 8. Build and start the app

From the repository root:

```bash
docker compose --env-file .env up --build -d
```

Check running containers:

```bash
docker compose ps
```

Expected result:

- `pdfparsing-backend-1` running
- `pdfparsing-frontend-1` running
- Frontend exposes `${FRONTEND_PORT}:80`

### 9. Verify deployment on the server

Check the frontend:

```bash
curl -I http://127.0.0.1:8080
```

Check the backend through the frontend proxy:

```bash
curl http://127.0.0.1:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

Check login API with the credentials from `.env`:

```bash
curl -i -X POST http://127.0.0.1:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"username":"buyer","password":"replace-with-a-strong-password"}'
```

A successful response returns HTTP `200 OK` with an `access_token`.

### 10. Open the app in a browser

Open:

```text
http://YOUR_SERVER_PUBLIC_IP:8080
```

Or, if you set `FRONTEND_PORT=80`:

```text
http://YOUR_SERVER_PUBLIC_IP
```

Log in with:

- Username: value of `APP_USERNAME` in `.env`
- Password: value of `APP_PASSWORD` in `.env`

After login, the Chinese new-user guide appears automatically the first time. You can reopen it later with the `使用引导` button.

### 11. View logs

All logs:

```bash
docker compose logs -f
```

Backend only:

```bash
docker compose logs -f backend
```

Frontend only:

```bash
docker compose logs -f frontend
```

### 12. Stop, restart, and update

Stop the app:

```bash
docker compose down
```

Restart the app:

```bash
docker compose --env-file .env up -d
```

Update to the latest code and rebuild:

```bash
cd /opt/apps/PDFParsing
git pull
docker compose --env-file .env up --build -d
```

If you deploy from a feature branch, keep using that branch when updating:

```bash
git checkout task-4-second-rereview-fix
git pull
docker compose --env-file .env up --build -d
```

### 13. Optional: use a domain name and HTTPS

For internal use, `http://SERVER_IP:8080` is enough. For public or long-term use, bind a domain name and add HTTPS.

Common options:

1. Put another Nginx or Caddy reverse proxy on the host.
2. Point your domain DNS record to the ECS public IP.
3. Reverse proxy the domain to `127.0.0.1:8080`.
4. Use Let's Encrypt or Alibaba Cloud SSL certificate for HTTPS.

If you use an external reverse proxy, keep this app listening on `127.0.0.1` or a private port where possible, and expose only ports `80` and `443` publicly.

### 14. Troubleshooting

#### Login fails with “Invalid username or password”

The app reads credentials from `.env` through Docker Compose. Check the actual values:

```bash
cat .env
```

Then restart containers after changing `.env`:

```bash
docker compose --env-file .env up -d --force-recreate
```

#### Browser opens but API requests fail

Check health through the frontend proxy:

```bash
curl -i http://127.0.0.1:8080/api/health
```

If it fails, inspect backend logs:

```bash
docker compose logs backend
```

#### Port 8080 is already in use

Change `FRONTEND_PORT` in `.env`, for example:

```env
FRONTEND_PORT=8081
```

Restart:

```bash
docker compose --env-file .env up -d
```

Open:

```text
http://YOUR_SERVER_PUBLIC_IP:8081
```

Also open the new port in the Alibaba Cloud security group.

#### Docker build is slow or cannot pull images

Domestic servers may have slow access to Docker Hub, npm registry, or PyPI. Try:

- Configure a Docker registry mirror as described above.
- Re-run the build after network stabilizes:

```bash
docker compose --env-file .env build --no-cache
```

#### Uploaded PDFs fail to parse

Version 1 supports text-based PDFs matching the supplied JABIL purchase-order layout. It does not support scanned PDFs or OCR.

Check backend logs for parse warnings:

```bash
docker compose logs backend
```

## Sample PDFs

Regression samples used during development live in `/home/eureka/catch/`:

- `4515457833 WHIRLPOOL.PDF`
- `4515662616 WHIRLPOOL.PDF`

## Version 1 Limits

- Text-based PDFs only.
- No OCR for scanned PDFs.
- No enterprise SSO.
- No persistent upload history.
- No user-editable Excel template.
