NNIT Job Scraper Service

This FastAPI service fetches jobs from Indeed (RSS) and provides a basic LinkedIn search helper.

Requirements

- Python 3.10+
- Install dependencies:

```bash
pip install -r requirements.txt
```

Run locally

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Deploy to Railway

1. Create a new Railway service in your project and set the repository root to the `scraper/` folder (or create a new service and deploy from this folder).
2. Railway will detect the `requirements.txt`. Set the start command to:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Or use the included `Procfile` / `start.sh`.

Notes: ensure any secrets (if later required) are added to the Railway service variables. The scraper is optional and can run as a separate service.

Endpoints

- GET /jobs/indeed?q=web+developer&location=remote
- GET /jobs/search?q=web+developer&source=indeed
- GET /jobs/search?q=ai&source=linkedin

Notes

- LinkedIn scraping is a fragile, best-effort helper. Use the official APIs when possible.
- Indeed RSS is public and reliable for basic job search.
