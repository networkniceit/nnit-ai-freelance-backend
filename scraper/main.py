from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
import httpx
import feedparser
from bs4 import BeautifulSoup
from pydantic import BaseModel
import logging
from urllib.parse import quote_plus

app = FastAPI(title="NNIT Job Scraper")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nnit-scraper")

class Job(BaseModel):
    title: str
    link: str
    source: str
    summary: Optional[str] = None
    location: Optional[str] = None
    published: Optional[str] = None


async def _remotive_jobs(q: str) -> List[Job]:
    """Fetch jobs from Remotive public API as a fallback when RSS sources are blocked."""
    url = f"https://remotive.com/api/remote-jobs?search={quote_plus(q)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        r = await client.get(url, headers=headers)
    if r.status_code != 200:
        logger.warning("Remotive non-200", extra={"url": url, "status": r.status_code})
        return []
    data = r.json() if r.content else {}
    raw_jobs = data.get("jobs") or []
    jobs: List[Job] = []
    for item in raw_jobs:
        title = item.get("title") or ""
        link = item.get("url") or ""
        published = item.get("publication_date") or ""
        location = item.get("candidate_required_location") or None
        desc_html = item.get("description") or ""
        summary = BeautifulSoup(desc_html, "lxml").get_text(" ", strip=True) if desc_html else None
        jobs.append(Job(title=title, link=link, source="remotive", summary=summary, location=location, published=published))
    return jobs


@app.get("/jobs/indeed", response_model=List[Job])
async def indeed_jobs(q: str = Query(..., description="Keywords, space separated"), location: str = "", radius: int = 25):
    """Fetch jobs from Indeed RSS feed."""
    # Build Indeed RSS URL (encode user input)
    keywords = quote_plus(q)
    loc = quote_plus(location or "")
    rss_url = f"https://www.rss.indeed.com/rss?q={keywords}&l={loc}&radius={radius}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            r = await client.get(rss_url, headers=headers)
    except Exception as e:
        logger.warning("Indeed RSS request failed", extra={"rss_url": rss_url, "error": str(e)})
        fallback = await _remotive_jobs(q)
        if fallback:
            return fallback
        raise HTTPException(status_code=502, detail="Failed to fetch Indeed RSS")

    if r.status_code != 200:
        logger.warning(
            "Indeed RSS non-200",
            extra={"rss_url": rss_url, "status": r.status_code, "content_type": r.headers.get("content-type", "")},
        )
        fallback = await _remotive_jobs(q)
        if fallback:
            return fallback
        raise HTTPException(status_code=502, detail=f"Indeed RSS returned HTTP {r.status_code}")

    parsed = feedparser.parse(r.content)
    jobs: List[Job] = []
    for entry in parsed.entries:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = entry.get("summary", "")
        published = entry.get("published", "")
        # Try to extract location from summary
        location_text = None
        if "location" in entry:
            location_text = entry.get("location")
        jobs.append(Job(title=title, link=link, source="indeed", summary=summary, location=location_text, published=published))

    if not jobs:
        logger.info(
            "Indeed RSS returned zero entries",
            extra={"rss_url": rss_url, "bozo": bool(getattr(parsed, "bozo", False)), "status": r.status_code, "bytes": len(r.content)},
        )
        fallback = await _remotive_jobs(q)
        if fallback:
            return fallback
    return jobs


@app.get("/jobs/search", response_model=List[Job])
async def search_jobs(q: str = Query(...), source: str = Query("indeed"), location: str = ""):
    """Unified endpoint to search jobs from available sources."""
    if source == "indeed":
        return await indeed_jobs(q=q, location=location)
    elif source == "remotive":
        return await _remotive_jobs(q)
    elif source == "linkedin":
        # Basic LinkedIn scraping - returns limited results
        return await linkedin_search(q, location)
    else:
        return await indeed_jobs(q=q, location=location)


async def linkedin_search(q: str, location: str = "") -> List[Job]:
    """Basic LinkedIn job scraping helper (may break if LinkedIn changes layout).
    Use responsibly and within LinkedIn terms of service.
    """
    keywords = q.replace(" ", "%20")
    loc = location.replace(" ", "%20")
    url = f"https://www.linkedin.com/jobs/search?keywords={keywords}&location={loc}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        jobs: List[Job] = []
        # LinkedIn uses data attributes; pick a simple selector for job cards
        for card in soup.select("li.result-card, .result-card"):  # best-effort
            a = card.find("a", href=True)
            if not a:
                continue
            title = a.get_text(strip=True)
            link = a["href"]
            jobs.append(Job(title=title, link=link, source="linkedin"))
        return jobs
