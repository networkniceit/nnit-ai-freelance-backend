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

Endpoints

- GET /jobs/indeed?q=web+developer&location=remote
- GET /jobs/search?q=web+developer&source=indeed
- GET /jobs/search?q=ai&source=linkedin

Notes

- LinkedIn scraping is a fragile, best-effort helper. Use the official APIs when possible.
- Indeed RSS is public and reliable for basic job search.
