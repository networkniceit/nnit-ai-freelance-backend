from typing import List, Optional
from fastapi import FastAPI, Query
import httpx
import feedparser
from bs4 import BeautifulSoup
from pydantic import BaseModel

app = FastAPI(title="NNIT Job Scraper")

class Job(BaseModel):
    title: str
    link: str
    source: str
    summary: Optional[str] = None
    location: Optional[str] = None
    published: Optional[str] = None


@app.get("/jobs/indeed", response_model=List[Job])
async def indeed_jobs(q: str = Query(..., description="Keywords, space separated"), location: str = "", radius: int = 25):
    """Fetch jobs from Indeed RSS feed."""
    # Build Indeed RSS URL
    keywords = q.replace(" ", "+")
    loc = location
    rss_url = f"https://www.rss.indeed.com/rss?q={keywords}&l={loc}&radius={radius}"

    parsed = feedparser.parse(rss_url)
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
    return jobs


@app.get("/jobs/search", response_model=List[Job])
async def search_jobs(q: str = Query(...), source: str = Query("indeed"), location: str = ""):
    """Unified endpoint to search jobs from available sources."""
    if source == "indeed":
        return await indeed_jobs(q=q, location=location)
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
