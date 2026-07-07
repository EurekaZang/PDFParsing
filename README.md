# PDF PO Extractor

A deployable FastAPI + React app for extracting JABIL purchase-order PDF fields and exporting a fixed Excel workbook.

## Features

- Username/password login through environment variables.
- Single or batch PDF upload.
- Rule-based parsing for the supplied JABIL `Change to Purchase order` PDF layout.
- Preview table with one row per material item.
- Excel export with `PO Items` and `Parse Summary` sheets.

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

## Docker Deployment

Copy the example environment file and set secure values:

```bash
cp .env.example .env
```

Start the app:

```bash
docker compose --env-file .env up --build
```

Open `http://localhost:8080`. If port 8080 is already in use, start with `FRONTEND_PORT=8081 docker compose --env-file .env up --build` and open `http://localhost:8081`.

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
