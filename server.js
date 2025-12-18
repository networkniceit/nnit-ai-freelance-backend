// AI FREELANCE AUTOMATION BACKEND
// server.js - Main Express Server
// Handles job scraping, AI proposals, auto-apply, and Stripe payments

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { OpenAI } = require('openai');

// Minimal structured logger with level gating and JSON output
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
function shouldLog(level) { return levels[level] <= (levels[LOG_LEVEL] ?? 2); }
function log(level, message, extra) {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(extra && typeof extra === 'object' ? { attributes: extra } : {})
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// Global safety nets to prevent unexpected crashes in production
process.on('uncaughtException', (err) => {
  log('error', 'UNCAUGHT EXCEPTION', { error: err && err.stack ? err.stack : String(err) });
});
process.on('unhandledRejection', (reason) => {
  log('error', 'UNHANDLED REJECTION', { reason: reason && reason.stack ? reason.stack : String(reason) });
});

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_key_here') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  log('error', 'STRIPE_SECRET_KEY not set - Stripe features disabled');
}

// Runtime configuration via env (with sane defaults)
// Bind explicitly to 0.0.0.0 for container platforms (Railway, Docker)
const PORT = process.env.PORT || (process.env.RAILWAY_ENVIRONMENT ? 8080 : 5000);
const HOST = process.env.HOST || '0.0.0.0';
const SCRAPE_INTERVAL_MINUTES = Number(process.env.SCRAPE_INTERVAL || 30);
const AUTO_APPLY_ENABLED = process.env.AUTO_APPLY === 'true';
// Auto-scrape toggle: default disabled on Railway to reduce noise unless explicitly enabled
const AUTO_SCRAPE_ENABLED = (() => {
  if (process.env.AUTO_SCRAPE === 'true') return true;
  if (process.env.AUTO_SCRAPE === 'false') return false;
  return process.env.RAILWAY_ENVIRONMENT ? false : true;
})();
const DEFAULT_MIN_BUDGET = Number(process.env.DEFAULT_MIN_BUDGET || 100);
const DEFAULT_MAX_BUDGET = Number(process.env.DEFAULT_MAX_BUDGET || 5000);
const DEFAULT_MIN_CONFIDENCE = Number(process.env.DEFAULT_MIN_CONFIDENCE || 85);
const DEFAULT_KEYWORDS = (process.env.DEFAULT_KEYWORDS || 'web development,python script,react,nodejs,data entry,automation')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);
// Network safety timeouts
const SCRAPE_TIMEOUT_MS = Number(process.env.SCRAPE_TIMEOUT_MS || 12000);
const PY_SCRAPER_TIMEOUT_MS = Number(process.env.PY_SCRAPER_TIMEOUT_MS || 8000);
// Optional external scraper service (FastAPI) base URL. Example:
// - http://localhost:8000 (local dev)
// - https://<your-scraper-service>.up.railway.app (production)
// On Railway, default to disabled unless explicitly configured.
function normalizeBaseUrl(raw) {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return '';
  if (value.includes('://')) return value;
  // If user pastes only a host (e.g. <service>.up.railway.app), assume https.
  // If localhost/loopback, assume http.
  const isLocal = /^localhost(?::\d+)?$/i.test(value) || /^127\.0\.0\.1(?::\d+)?$/.test(value);
  return `${isLocal ? 'http' : 'https'}://${value}`;
}

const PY_SCRAPER_BASE_URL = (() => {
  const explicit = (process.env.PY_SCRAPER_BASE_URL || process.env.PY_SCRAPER_URL || '').trim();
  if (explicit) return normalizeBaseUrl(explicit);
  return process.env.RAILWAY_ENVIRONMENT ? '' : 'http://localhost:8000';
})();

const app = express();
const parser = new Parser();
const VERSION = require('./package.json').version || '0.0.0';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
// Readiness flag for platform health probes (only true once DB/schema init completes)
const readiness = {
  dbInitialized: false
};
// In-memory metrics counters (reset on restart if using :memory: DB)
const metrics = {
  requests: 0,
  scrapeRuns: 0,
  proposalsGenerated: 0,
  applicationsCreated: 0,
  stripeEvents: 0,
  timings: {
    scrapeMs: [],
    proposalMs: [],
    autoApplyMs: []
  }
};

// Runtime automation state (can be toggled via API and settings)
const state = {
  autoApply: AUTO_APPLY_ENABLED,
  autoScrape: AUTO_SCRAPE_ENABLED,
};

// Middleware
app.use(cors());
app.use(express.static('public'));
// Request counter middleware (exclude static assets by simple heuristic)
app.use((req, res, next) => {
  if (!req.path.match(/\.(js|css|png|jpg|svg|ico)$/)) {
    metrics.requests++;
  }
  next();
});

// Stripe webhook endpoint (must be before express.json)
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (stripeWebhookSecret && stripe) {
  app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err) {
      log('warn', 'Webhook signature verification failed', { message: err.message });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    metrics.stripeEvents++;
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        log('info', 'checkout.session.completed', { sessionId: session.id });

        const metadata = session.metadata || {};
        if (metadata.application_id) {
          db.run(`
            UPDATE applications 
            SET status = 'paid', earnings = ?
            WHERE id = ?
          `, [session.amount_total / 100, metadata.application_id], (err) => {
            if (!err) {
              log('info', 'Application marked as paid', { applicationId: metadata.application_id, amount: session.amount_total / 100 });
            }
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        log('info', 'invoice.payment_succeeded', { invoiceId: invoice.id });
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        log('info', 'payment_intent.succeeded', { amount: paymentIntent.amount / 100 });
        break;
      }
      default:
        log('warn', 'Unhandled Stripe event type', { type: event.type });
    }

    res.json({ received: true });
  });
} else {
  log('info', 'Stripe webhook disabled: STRIPE_WEBHOOK_SECRET missing or Stripe not configured.');
}

// JSON body parser should come after webhook raw parser
app.use(express.json());

// Helper to compute base URL for redirects (Stripe success/cancel)
function getBaseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

// OpenAI Setup (safe if API key missing)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    log('warn', 'Failed to initialize OpenAI client', { message: e.message });
    openai = null;
  }
} else {
  log('error', 'OPENAI_API_KEY not set — using fallback proposal generator.');
}

// Warn when API keys are not set (do not log actual secrets)
if (!process.env.STRIPE_SECRET_KEY) log('error', 'Warning: STRIPE_SECRET_KEY not set — Stripe payments disabled or will error if used.');
if (!process.env.OPENAI_API_KEY) log('error', 'Warning: OPENAI_API_KEY not set — AI proposal generation will use fallback templates.');

// Database Setup
// - Prefer persistence on Railway if a writable /data exists
// - Fall back to :memory: if filesystem is not writable (prevents 502 from crash-loop)
function resolveDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (!process.env.RAILWAY_ENVIRONMENT) return './freelance.db';
  const candidate = '/data/app.db';
  try {
    fs.mkdirSync('/data', { recursive: true });
    return candidate;
  } catch (e) {
    log('warn', 'Persistent DB path unavailable; falling back to :memory:', { message: e.message });
    return ':memory:';
  }
}

const dbPath = resolveDbPath();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    log('error', 'Database error', { error: err && err.message ? err.message : String(err) });
  } else {
    log('info', `Database connected (${dbPath})`);
    initDatabase().catch((e) => {
      // Never crash the process for schema init issues; log and continue.
      log('error', 'Database initialization failed', { message: e && e.message ? e.message : String(e) });
    });
  }
});

// Initialize Database Schema
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDatabase() {
  // Order matters: ensure tables exist before ALTER/SELECT.
  await dbRun(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      budget TEXT,
      platform TEXT,
      job_type TEXT,
      difficulty TEXT,
      url TEXT,
      posted_date DATETIME,
      ai_confidence INTEGER,
      estimated_time TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      proposal TEXT,
      applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      earnings TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      auto_apply BOOLEAN DEFAULT 0,
      auto_scrape BOOLEAN DEFAULT 0,
      min_budget INTEGER DEFAULT 100,
      max_budget INTEGER DEFAULT 5000,
      min_confidence INTEGER DEFAULT 85,
      platforms TEXT DEFAULT '["Upwork","Fiverr","Freelancer"]',
      job_types TEXT DEFAULT '["coding","data-entry","research"]'
    )
  `);

  // Migration: older DBs may not have auto_scrape
  try {
    await dbRun('ALTER TABLE settings ADD COLUMN auto_scrape BOOLEAN DEFAULT 0');
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    // Ignore expected cases: already exists or table doesn't need migration.
    if (!/duplicate column name/i.test(msg)) {
      log('warn', 'Settings migration warning', { message: msg });
    }
  }

  // Ensure a row exists for id=1 with valid JSON defaults for UI parsing.
  await dbRun(`
    INSERT OR IGNORE INTO settings (id, auto_apply, auto_scrape, min_budget, max_budget, min_confidence, platforms, job_types)
    VALUES (1, 0, 0, 100, 5000, 85, '["Upwork","Fiverr","Freelancer"]', '["coding","data-entry","research"]')
  `);

  log('info', 'Database initialized');
  readiness.dbInitialized = true;

  // Load automation flags from settings (prefer explicit 0/1 over env defaults)
  try {
    const row = await dbGet('SELECT auto_apply, auto_scrape FROM settings WHERE id = 1');
    if (row) {
      if (row.auto_apply === 0 || row.auto_apply === 1) state.autoApply = row.auto_apply === 1;
      if (row.auto_scrape === 0 || row.auto_scrape === 1) state.autoScrape = row.auto_scrape === 1;
      log('info', 'Automation flags loaded', { autoApply: state.autoApply, autoScrape: state.autoScrape });
    }
  } catch (e) {
    log('warn', 'Failed to load automation flags from settings', { message: e && e.message ? e.message : String(e) });
  }

  // If settings enable automation after boot, ensure the schedulers are running.
  // This makes automation robust even when DB init completes after server listen.
  try {
    ensureAutomationSchedulers();
  } catch (e) {
    log('warn', 'Failed to ensure automation schedulers', { message: e && e.message ? e.message : String(e) });
  }
}

// ============================================
// JOB SCRAPING FUNCTIONS
// ============================================

// Generic timeout wrapper to prevent long-hangs
function withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
  ]);
}

// Some RSS endpoints (notably Upwork) may return HTML/blocked content unless a browser-like User-Agent is used.
// Fetch RSS with axios + headers, then parse the XML string.
async function fetchAndParseRss(rssUrl, label) {
  const response = await withTimeout(
    axios.get(rssUrl, {
      timeout: SCRAPE_TIMEOUT_MS,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NNITBot/1.0; +https://railway.app)',
        'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5'
      },
      // treat non-2xx as errors we can handle consistently
      validateStatus: (status) => status >= 200 && status < 300
    }),
    SCRAPE_TIMEOUT_MS,
    label
  );

  const contentType = String(response.headers?.['content-type'] || '');
  const body = response.data;
  if (typeof body !== 'string') {
    log('warn', `${label} returned non-text body`, { contentType });
    return null;
  }

  // Very lightweight sanity check before trying to parse
  const looksLikeXml = body.includes('<rss') || body.includes('<feed') || body.includes('<?xml');
  if (!looksLikeXml) {
    log('warn', `${label} returned non-RSS content`, {
      contentType,
      sample: body.slice(0, 200)
    });
    return null;
  }

  return parser.parseString(body);
}

// Scrape Upwork RSS Feed
async function scrapeUpworkRSS(keyword = 'web development') {
  try {
    const t0 = Date.now();
    // Upwork has changed RSS endpoints over time; try a couple of known variants.
    const q = encodeURIComponent(keyword);
    const candidates = [
      `https://www.upwork.com/nx/search/jobs/rss?sort=recency&q=${q}`,
      `https://www.upwork.com/ab/feed/jobs/rss?q=${q}&sort=recency`
    ];

    let feed = null;
    for (const rssUrl of candidates) {
      try {
        feed = await fetchAndParseRss(rssUrl, 'Upwork RSS');
        if (feed && Array.isArray(feed.items) && feed.items.length > 0) break;
      } catch (e) {
        log('warn', 'Upwork RSS fetch failed', { message: e.message, rssUrl });
        feed = null;
      }
    }

    if (!feed || !Array.isArray(feed.items) || feed.items.length === 0) return [];

    const jobs = feed.items.map(item => {
      // Extract budget from description
      const budgetMatch = item.contentSnippet?.match(/\$[\d,]+/);
      const budget = budgetMatch ? budgetMatch[0] : 'Not specified';

      return {
        external_id: item.guid || item.link,
        title: item.title,
        description: item.contentSnippet || item.content,
        budget: budget,
        platform: 'Upwork',
        url: item.link,
        posted_date: new Date(item.pubDate || Date.now()).toISOString(),
        job_type: categorizeJob(item.title, item.contentSnippet),
        difficulty: estimateDifficulty(item.contentSnippet),
        ai_confidence: calculateAIConfidence(item.title, item.contentSnippet)
      };
    });

    metrics.timings.scrapeMs.push(Date.now() - t0);
    return jobs;
  } catch (error) {
    log('warn', 'Upwork scraping error', { message: error.message });
    return [];
  }
}

// Scrape using Python FastAPI service
async function scrapePythonService(keyword = 'web development', location = '') {
  try {
    if (!PY_SCRAPER_BASE_URL) {
      throw new Error('Python scraper service is not configured (set PY_SCRAPER_BASE_URL)');
    }
    const t0 = Date.now();
    const response = await axios.get(`${PY_SCRAPER_BASE_URL}/jobs/search`, {
      params: { q: keyword, source: 'indeed', location: location },
      timeout: PY_SCRAPER_TIMEOUT_MS
    });

    const jobs = response.data.map(item => {
      const budgetMatch = item.summary?.match(/\$[\d,]+/);
      const budget = budgetMatch ? budgetMatch[0] : 'Not specified';

      return {
        external_id: item.link,
        title: item.title,
        description: item.summary || '',
        budget: budget,
        platform: item.source.charAt(0).toUpperCase() + item.source.slice(1),
        url: item.link,
        posted_date: new Date(item.published || Date.now()).toISOString(),
        job_type: categorizeJob(item.title, item.summary),
        difficulty: estimateDifficulty(item.summary),
        ai_confidence: calculateAIConfidence(item.title, item.summary)
      };
    });

    metrics.timings.scrapeMs.push(Date.now() - t0);
    return jobs;
  } catch (error) {
    log('warn', 'Python scraper service error', { message: error.message });
    return [];
  }
}

// Scrape Indeed RSS Feed
async function scrapeIndeedRSS(keyword = 'web development', location = '') {
  try {
    const t0 = Date.now();
    const q = encodeURIComponent(keyword);
    const loc = encodeURIComponent(location || '');
    // Use the www.rss.indeed.com host (matches the Python scraper and tends to behave better).
    const rssUrl = `https://www.rss.indeed.com/rss?q=${q}&l=${loc}`;
    const feed = await fetchAndParseRss(rssUrl, 'Indeed RSS');
    if (!feed || !Array.isArray(feed.items) || feed.items.length === 0) return [];

    const jobs = feed.items.map(item => {
      const budgetMatch = item.contentSnippet?.match(/\$[\d,]+/);
      const budget = budgetMatch ? budgetMatch[0] : 'Not specified';

      return {
        external_id: item.guid || item.link,
        title: item.title,
        description: item.contentSnippet || item.content,
        budget: budget,
        platform: 'Indeed',
        url: item.link,
        posted_date: new Date(item.pubDate || Date.now()).toISOString(),
        job_type: categorizeJob(item.title, item.contentSnippet),
        difficulty: estimateDifficulty(item.contentSnippet),
        ai_confidence: calculateAIConfidence(item.title, item.contentSnippet)
      };
    });

    metrics.timings.scrapeMs.push(Date.now() - t0);
    return jobs;
  } catch (error) {
    log('warn', 'Indeed scraping error', { message: error.message });
    return [];
  }
}

// Insert jobs into database (ignore duplicates)
function insertJobs(jobs) {
  return new Promise((resolve) => {
    if (!jobs || jobs.length === 0) return resolve(0);

    let inserted = 0;
    let pending = jobs.length;

    jobs.forEach((job) => {
      db.run(
        `
        INSERT OR IGNORE INTO jobs
        (external_id, title, description, budget, platform, job_type, difficulty, url, posted_date, ai_confidence, estimated_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          job.external_id,
          job.title,
          job.description,
          job.budget,
          job.platform,
          job.job_type,
          job.difficulty,
          job.url,
          job.posted_date,
          job.ai_confidence,
          job.estimated_time || '2-4 hours'
        ],
        function (err) {
          if (!err && this.changes > 0) inserted++;
          pending--;
          if (pending === 0) resolve(inserted);
        }
      );
    });
  });
}

// Categorize job type
function categorizeJob(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  if (text.match(/python|javascript|react|node|code|programming|api|web dev/)) {
    return 'coding';
  } else if (text.match(/data entry|excel|spreadsheet|csv|typing/)) {
    return 'data-entry';
  } else if (text.match(/research|report|analysis|writing/)) {
    return 'research';
  } else if (text.match(/design|logo|graphic|ui|ux/)) {
    return 'design';
  }
  return 'general';
}

// Estimate difficulty
function estimateDifficulty(description) {
  const text = description?.toLowerCase() || '';

  if (text.match(/simple|easy|quick|basic|beginner/)) {
    return 'Easy';
  } else if (text.match(/complex|advanced|expert|senior/)) {
    return 'Hard';
  }
  return 'Medium';
}

// Calculate AI confidence score
function calculateAIConfidence(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  let score = 70; // Base score

  // Increase score for AI-friendly keywords
  if (text.match(/python|javascript|react|node/)) score += 10;
  if (text.match(/simple|quick|easy/)) score += 5;
  if (text.match(/data entry|excel|csv/)) score += 8;
  if (text.match(/automation|script|api/)) score += 7;

  // Decrease score for complex requirements
  if (text.match(/expert|senior|years of experience/)) score -= 10;
  if (text.match(/interview|phone call|meeting/)) score -= 5;

  return Math.min(Math.max(score, 50), 99); // Keep between 50-99
}

// ============================================
// AI PROPOSAL GENERATION
// ============================================

function buildProposalProfile(jobTitle, jobDescription) {
  const title = String(jobTitle || '').trim();
  const desc = String(jobDescription || '').trim();
  const text = `${title} ${desc}`.toLowerCase();

  const has = (re) => re.test(text);

  // Keep these intentionally broad; we only need enough to avoid obvious mismatches.
  if (has(/\b(devops|site reliability|sre|aws|terraform|cloudformation|kubernetes|k8s|docker|ci\/?cd|jenkins|github actions)\b/)) {
    return {
      label: 'DevOps / Cloud',
      skills: ['AWS', 'Docker/Kubernetes', 'Terraform/IaC', 'CI/CD', 'Monitoring & logging'],
      question: 'What is the current infrastructure setup (AWS services + IaC tool) and your top 1–2 priorities for the first week?'
    };
  }

  if (has(/\b(copywriter|copywriting|content writer|blog|seo|landing page|newsletter|editor|ghostwriter)\b/)) {
    return {
      label: 'Copywriting / Content',
      skills: ['SEO content writing', 'Landing-page copy', 'Research & outlining', 'Editing & tone matching', 'Fast iteration'],
      question: 'Do you have a preferred tone + examples (links) of content you like, and what’s the primary KPI (traffic, conversions, signups)?'
    };
  }

  if (has(/\b(react native|ios|android|mobile app|app store|play store|expo)\b/)) {
    return {
      label: 'Mobile',
      skills: ['React Native', 'Performance tuning', 'Crash/debug triage', 'Release readiness', 'Clean refactors'],
      question: 'What are the top issues right now (crashes, slow screens, specific flows) and do you have logs/Crashlytics set up?'
    };
  }

  if (has(/\b(data entry|excel|google sheets|spreadsheet|csv|scrape|scraping|lead list|crm)\b/)) {
    return {
      label: 'Data / Ops',
      skills: ['Data entry', 'Excel/Sheets', 'Data cleaning', 'CSV processing', 'Light automation'],
      question: 'What format do you want the final delivery in (CSV/Sheets/CRM) and are there validation rules I should enforce?'
    };
  }

  // Default: software/web
  return {
    label: 'Software Development',
    skills: ['React', 'Node.js', 'Python', 'APIs', 'Clean, maintainable code'],
    question: 'What are the exact deliverables (features + acceptance criteria) and do you have a preferred timeline?'
  };
}

async function generateProposal(jobTitle, jobDescription, jobBudget) {
  const t0 = Date.now();
  const profile = buildProposalProfile(jobTitle, jobDescription);

  // Check if we have a real OpenAI key
  const hasRealKey = process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'demo-mode' &&
    process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';

  if (hasRealKey) {
    try {
      const prompt = `Write a concise, high-signal proposal message for a freelance job application. Keep it personal, specific, and under 140 words.

Do NOT claim specific projects or clients unless they are mentioned in the job description. Avoid generic fluff.

Target profile: ${profile.label}
Suggested skills to reference (pick the most relevant 2-4): ${profile.skills.join(', ')}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION: ${jobDescription}

BUDGET: ${jobBudget}

Requirements for the proposal:
- Address the client professionally
- Show you understand the work in 1 sentence
- Include 3 short checkmark bullets (capabilities/approach) relevant to the job
- Ask exactly one smart question
- Mention quick turnaround and clear communication
- Keep it friendly and confident
- End with "NetworkNiceIT Tec" as the signature

Write only the proposal text, nothing else.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      });

      const text = response.choices[0].message.content.trim();
      metrics.timings.proposalMs.push(Date.now() - t0);
      return text;
    } catch (error) {
      log('warn', 'OpenAI error, using fallback proposal', { message: error.message });
      // Fall through to fallback
    }
  }

  // Fallback proposal template (works without OpenAI)
  const fallback = `Hi,

I can help with your "${jobTitle}" and start immediately.

✅ ${profile.skills[0]}
✅ ${profile.skills[1]}
✅ ${profile.skills[2]}

I’ll keep communication clear and move fast, with a first update within 24 hours.

Quick question: ${profile.question}

Best regards,
NetworkNiceIT Tec`;
  metrics.timings.proposalMs.push(Date.now() - t0);
  return fallback;
}
// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    message: '🤖 AI Freelance Backend is active!',
    version: VERSION,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Version check (quick sanity endpoint)
app.get('/api/version', (req, res) => {
  res.json({ version: VERSION, uptime: process.uptime() });
});

// Ping endpoint for uptime monitors
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Ready endpoint (simple OK for platform health probes)
app.get('/ready', (req, res) => {
  if (!readiness.dbInitialized) {
    return res.status(503).send('starting');
  }
  res.status(200).send('ok');
});

// Root route returns a minimal message (helps verify routing without SPA)
app.get('/', (req, res) => {
  res.status(200).send('AI Freelance Backend is running');
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const { status, platform, job_type, min_confidence } = req.query;

  let query = 'SELECT * FROM jobs WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (platform) {
    query += ' AND platform = ?';
    params.push(platform);
  }
  if (job_type) {
    query += ' AND job_type = ?';
    params.push(job_type);
  }
  if (min_confidence) {
    query += ' AND ai_confidence >= ?';
    params.push(parseInt(min_confidence));
  }

  query += ' ORDER BY posted_date DESC LIMIT 50';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ jobs: rows, count: rows.length });
    }
  });
});

// Scrape new jobs
app.post('/api/scrape', async (req, res) => {
  try {
    const { keywords } = req.body || {};
    const { source = 'upwork', location = '', limit } = req.body || {};
    const maxKeywords = Math.max(1, Math.min(Number(limit || 3), (keywords || DEFAULT_KEYWORDS).length));
    const searchTerms = (keywords || DEFAULT_KEYWORDS).slice(0, maxKeywords);

    // Run scraping concurrently with per-source timeouts
    const tasks = searchTerms.map(async (keyword) => {
      try {
        if (source === 'indeed') {
          // Prefer the optional scraper service if configured (more robust than direct RSS in some environments)
          if (PY_SCRAPER_BASE_URL) return await scrapePythonService(keyword, location);
          return await scrapeIndeedRSS(keyword, location);
        } else if (source === 'python' || source === 'scraper') {
          return await scrapePythonService(keyword, location);
        } else if (source === 'both') {
          const [up, indd] = await Promise.allSettled([
            scrapeUpworkRSS(keyword),
            (PY_SCRAPER_BASE_URL
              ? scrapePythonService(keyword, location)
              : scrapeIndeedRSS(keyword, location))
          ]);
          const upJobs = up.status === 'fulfilled' ? up.value : [];
          const inJobs = indd.status === 'fulfilled' ? indd.value : [];
          return upJobs.concat(inJobs);
        } else {
          return await scrapeUpworkRSS(keyword);
        }
      } catch (e) {
        log('warn', 'Keyword scrape failed', { keyword, message: e.message });
        return [];
      }
    });

    const results = await Promise.allSettled(tasks);
    const allJobs = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

    const inserted = await insertJobs(allJobs);
    metrics.scrapeRuns++;

    res.json({
      success: true,
      scraped: allJobs.length,
      inserted: inserted,
      message: `Found ${allJobs.length} jobs, added ${inserted} new ones`,
      keywordsProcessed: searchTerms.length,
      source
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate proposal for a job
app.post('/api/generate-proposal', async (req, res) => {
  try {
    const { job_id } = req.body;

    db.get('SELECT * FROM jobs WHERE id = ?', [job_id], async (err, job) => {
      if (err || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const proposal = await generateProposal(job.title, job.description, job.budget);
      metrics.proposalsGenerated++;

      res.json({
        success: true,
        proposal: proposal,
        job_title: job.title
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply to a job
app.post('/api/apply', async (req, res) => {
  try {
    const { job_id, custom_proposal } = req.body;

    db.get('SELECT * FROM jobs WHERE id = ?', [job_id], async (err, job) => {
      if (err || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Generate proposal if not provided
      const proposal = custom_proposal || await generateProposal(job.title, job.description, job.budget);
      metrics.proposalsGenerated++;

      // Create application
      db.run(`
        INSERT INTO applications (job_id, proposal, status, earnings)
        VALUES (?, ?, 'pending', ?)
      `, [job_id, proposal, job.budget], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Update job status
        db.run('UPDATE jobs SET status = ? WHERE id = ?', ['applied', job.id]);
        metrics.applicationsCreated++;
        log('info', 'Application created', { jobId: job.id, title: job.title, confidence: job.ai_confidence, budget: job.budget });
        res.json({
          success: true,
          application_id: this.lastID,
          proposal: proposal,
          message: `Applied to: ${job.title}`
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications
app.get('/api/applications', (req, res) => {
  const query = `
    SELECT a.*, j.title as job_title, j.platform, j.budget
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    ORDER BY a.applied_date DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ applications: rows, count: rows.length });
    }
  });
});

// Update application status and earnings
app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status, progress, earnings } = req.body;

  const updates = [];
  const values = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (progress !== undefined) {
    updates.push('progress = ?');
    values.push(progress);
  }
  if (earnings) {
    updates.push('earnings = ?');
    values.push(earnings);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  db.run(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`, values, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Application not found' });
    } else {
      log('info', 'Application updated', { id, status: status || 'unchanged', earnings: earnings || 'unchanged' });
      res.json({ success: true, message: 'Application updated' });
    }
  });
});

// Get statistics
// Direct proposal generation (no job_id needed)
app.post('/api/generate-proposal-direct', async (req, res) => {
  try {
    const { job_title, job_description, job_budget } = req.body;

    if (!job_title || !job_description) {
      return res.status(400).json({ error: 'job_title and job_description required' });
    }

    const proposal = await generateProposal(job_title, job_description, job_budget || 'Not specified');

    res.json({
      success: true,
      proposal: proposal,
      job_title: job_title
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Helpers for Promise-based DB queries
function dbGetAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || {});
    });
  });
}

// Lightweight stats endpoint for quick responses
app.get('/api/stats-lite', async (req, res) => {
  try {
    const totalRow = await dbGetAsync(`SELECT COUNT(*) as total FROM applications`, []);
    const completedRow = await dbGetAsync(`SELECT COUNT(*) as count FROM applications WHERE status = 'completed'`, []);
    const activeRow = await dbGetAsync(`SELECT COUNT(*) as count FROM applications WHERE status IN ('pending','in-progress')`, []);
    res.json({
      stats: {
        totalApplications: totalRow.total || 0,
        completedJobs: completedRow.count || 0,
        activeJobs: activeRow.count || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full stats with guarded queries and prompt response
app.get('/api/stats', async (req, res) => {
  try {
    const [earningsRes, activeRes, completedRes, successRes] = await Promise.allSettled([
      dbGetAsync(`SELECT SUM(CAST(REPLACE(REPLACE(earnings, '$', ''), ',', '') AS INTEGER)) as total FROM applications WHERE status = 'completed'`, []),
      dbGetAsync(`SELECT COUNT(*) as count FROM applications WHERE status IN ('pending','in-progress')`, []),
      dbGetAsync(`SELECT COUNT(*) as count FROM applications WHERE status = 'completed'`, []),
      dbGetAsync(`SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('completed','in-progress') THEN 1 ELSE 0 END) as successful FROM applications`, []),
    ]);

    const stats = {
      totalEarnings: earningsRes.status === 'fulfilled' ? (earningsRes.value.total || 0) : 0,
      activeJobs: activeRes.status === 'fulfilled' ? (activeRes.value.count || 0) : 0,
      completedJobs: completedRes.status === 'fulfilled' ? (completedRes.value.count || 0) : 0,
      successRate: 0,
    };

    if (successRes.status === 'fulfilled') {
      const total = successRes.value.total || 0;
      const successful = successRes.value.successful || 0;
      stats.successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    }

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint (JSON counters)
app.get('/metrics', (req, res) => {
  const avg = arr => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  res.json({
    version: VERSION,
    metrics: {
      ...metrics,
      timings: {
        scrapeAvgMs: avg(metrics.timings.scrapeMs),
        proposalAvgMs: avg(metrics.timings.proposalMs),
        autoApplyAvgMs: avg(metrics.timings.autoApplyMs),
        samples: {
          scrape: metrics.timings.scrapeMs.length,
          proposal: metrics.timings.proposalMs.length,
          autoApply: metrics.timings.autoApplyMs.length,
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get settings
app.get('/api/settings', (req, res) => {
  db.get('SELECT * FROM settings WHERE id = 1', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        settings: {
          ...row,
          platforms: JSON.parse(row.platforms),
          job_types: JSON.parse(row.job_types)
        }
      });
    }
  });
});

// Update settings
app.put('/api/settings', (req, res) => {
  const { auto_apply, auto_scrape, min_budget, max_budget, min_confidence, platforms, job_types } = req.body;

  db.run(`
    UPDATE settings 
    SET auto_apply = ?, auto_scrape = ?, min_budget = ?, max_budget = ?, min_confidence = ?, platforms = ?, job_types = ?
    WHERE id = 1
  `, [
    auto_apply ? 1 : 0,
    auto_scrape ? 1 : 0,
    min_budget,
    max_budget,
    min_confidence,
    JSON.stringify(platforms),
    JSON.stringify(job_types)
  ], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      if (typeof auto_apply === 'boolean') state.autoApply = auto_apply;
      if (typeof auto_scrape === 'boolean') state.autoScrape = auto_scrape;
      res.json({ success: true, message: 'Settings updated' });
    }
  });
});

// Auto-scrape jobs every 30 minutes (if running)
let autoScrapeInterval;
let autoApplyInterval;

async function runAutoScrape() {
  log('info', 'Auto-scraping jobs from all sources...');
  let all = [];

  for (const keyword of DEFAULT_KEYWORDS) {
    // Try RSS feeds; if an external scraper service is configured, prefer it for Indeed.
    const [upworkJobs, indeedJobs] = await Promise.all([
      scrapeUpworkRSS(keyword).catch(e => { log('warn', 'Upwork scrape error', { message: e.message }); return []; }),
      (PY_SCRAPER_BASE_URL
        ? scrapePythonService(keyword)
        : scrapeIndeedRSS(keyword)
      ).catch(e => { log('warn', 'Indeed scrape error', { message: e.message }); return []; })
    ]);
    all = all.concat(upworkJobs, indeedJobs);

    if (upworkJobs.length > 0 || indeedJobs.length > 0) {
      log('info', `Found ${upworkJobs.length + indeedJobs.length} jobs`, { keyword });
    }
  }

  const inserted = await insertJobs(all);
  log('info', 'Auto-scrape complete', { found: all.length, inserted });

  // Trigger auto-apply immediately after scraping if enabled
  if (state.autoApply && inserted > 0) {
    log('info', 'Triggering auto-apply', { newJobs: inserted });
    await runAutoApply();
  }
}

async function runAutoApply() {
  if (!state.autoApply) {
    log('info', 'Auto-apply disabled');
    return;
  }

  log('info', 'Running auto-apply...');
  const t0 = Date.now();

  db.all(`
    SELECT * FROM jobs
    WHERE status = 'available'
      AND ai_confidence >= ?
    ORDER BY ai_confidence DESC, posted_date DESC
    LIMIT 10
  `, [DEFAULT_MIN_CONFIDENCE], async (err, rows) => {
    if (err) {
      log('error', 'Auto-apply error', { message: err.message });
      return;
    }

    if (!rows || rows.length === 0) {
      log('info', 'No jobs available to apply to');
      return;
    }

    log('info', 'High-confidence jobs selected', { count: rows.length });
    let applied = 0;

    for (const job of rows) {
      // Budget filter (basic numeric parse)
      const budgetValue = parseInt(String(job.budget || '0').replace(/[^0-9]/g, ''), 10) || 0;
      // Only enforce budget range for freelance-style platforms. Salary-like platforms (e.g. Remotive)
      // often include large annual compensation numbers that should not block automation.
      const platform = String(job.platform || '').toLowerCase();
      const isFreelanceBudget = platform === 'upwork' || platform === 'fiverr' || platform === 'freelancer';
      if (isFreelanceBudget && budgetValue > 0 && (budgetValue < DEFAULT_MIN_BUDGET || budgetValue > DEFAULT_MAX_BUDGET)) {
        log('info', 'Skipping job - budget out of range', { title: job.title, budget: budgetValue, platform: job.platform });
        continue;
      }

      const proposal = await generateProposal(job.title, job.description, job.budget);

      db.run(`
        INSERT INTO applications (job_id, proposal, status, earnings)
        VALUES (?, ?, 'pending', ?)
      `, [job.id, proposal, job.budget], function (applyErr) {
        if (!applyErr) {
          db.run('UPDATE jobs SET status = ? WHERE id = ?', ['applied', job.id]);
          applied++;
          log('info', 'Auto-applied', { title: job.title, confidence: job.ai_confidence, budget: job.budget });
        }
      });

      // Small delay between applications to avoid spam
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    metrics.timings.autoApplyMs.push(Date.now() - t0);
    log('info', 'Auto-apply complete', { applicationsSubmitted: applied });
  });
}

function startAutoScrape() {
  const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;
  autoScrapeInterval = setInterval(runAutoScrape, intervalMs);
}

function startAutoApply() {
  // Run auto-apply every scrape interval for simplicity
  const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;
  autoApplyInterval = setInterval(runAutoApply, intervalMs);
}

function stopAutoScrape() {
  if (autoScrapeInterval) clearInterval(autoScrapeInterval);
  autoScrapeInterval = undefined;
}

function stopAutoApply() {
  if (autoApplyInterval) clearInterval(autoApplyInterval);
  autoApplyInterval = undefined;
}

function ensureAutomationSchedulers() {
  // Start schedulers if state indicates they should be enabled.
  // No-op if already running.
  if (state.autoScrape) {
    if (!autoScrapeInterval) startAutoScrape();
    setImmediate(() => runAutoScrape().catch(e => log('error', 'Immediate auto-scrape failed', { message: e.message })));
  }
  if (state.autoApply) {
    if (!autoApplyInterval) startAutoApply();
  }
}

// Start server
const server = app.listen(PORT, HOST, () => {
  // Single concise startup entry for clean production logs
  log('info', 'Service started', {
    server: `http://localhost:${PORT}`,
    bind: { host: HOST, port: PORT },
    endpoints: [
      'GET /api/health',
      'GET /api/jobs',
      'POST /api/scrape',
      'POST /api/generate-proposal',
      'POST /api/apply',
      'GET /api/applications',
      'GET /api/stats',
      'GET /api/settings',
      'PUT /api/settings'
    ],
    automation: {
      autoApply: state.autoApply ? 'ENABLED' : 'DISABLED',
      autoScrape: state.autoScrape ? 'ENABLED' : 'DISABLED',
      scrapeIntervalMinutes: SCRAPE_INTERVAL_MINUTES,
      budgetRange: `$${DEFAULT_MIN_BUDGET}-$${DEFAULT_MAX_BUDGET}`,
      minConfidencePercent: DEFAULT_MIN_CONFIDENCE
    }
  });

  // Start scheduled tasks
  if (state.autoScrape) {
    // Run initial scrape quickly, then start interval
    setTimeout(() => {
      runAutoScrape().then(() => {
        log('info', 'Setting up recurring auto-scraper...');
        startAutoScrape();
        if (state.autoApply) startAutoApply();
      }).catch(err => {
        log('error', 'Auto-scrape failed', { message: err.message });
      });
    }, 10000);
  } else {
    if (state.autoApply) startAutoApply();
  }
});

server.on('error', (err) => {
  // Common on platforms that accidentally start two processes or when PORT is wrong
  log('error', 'HTTP server failed to start', {
    code: err && err.code,
    message: err && err.message,
    stack: err && err.stack
  });
  // Exit non-zero so the platform restarts with a clear reason in logs
  process.exit(1);
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create checkout session (one-time payment)
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create checkout session (one-time payment)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    log('warn', 'Create checkout session attempted without Stripe');
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  try {
    const { line_items } = req.body;
    const base = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment', // ONE-TIME PAYMENT
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cancel`,
    });

    log('info', 'Checkout session created', { sessionId: session.id });
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    log('error', 'Checkout session error', { message: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Create subscription session
app.post('/api/create-subscription-session', async (req, res) => {
  if (!stripe) {
    log('warn', 'Create subscription session attempted without Stripe');
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  try {
    const { line_items } = req.body;
    const base = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'subscription', // RECURRING PAYMENT
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cancel`,
    });

    log('info', 'Subscription session created', { sessionId: session.id });
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    log('error', 'Subscription session error', { message: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Success page
app.get('/success', (req, res) => {
  res.send(`
    <h1>✅ Payment Successful!</h1>
    <p>Session ID: ${req.query.session_id}</p>
    <a href="/">Back to home</a>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
  res.send(`
    <h1>❌ Payment Cancelled</h1>
    <a href="/">Back to home</a>
  `);
});

// Test checkout endpoint: create a small test session and redirect
app.get('/api/test-checkout', async (req, res) => {
  if (!stripe) {
    log('warn', 'Test checkout attempted without Stripe');
    return res.status(503).send('Stripe is not configured');
  }
  try {
    const amount = parseInt(String(req.query.amount || '500'), 10); // cents
    const name = String(req.query.name || 'Test Item');
    const application_id = req.query.application_id ? String(req.query.application_id) : null;
    const base = getBaseUrl(req);

    const payload = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cancel`,
    };
    if (application_id) payload.metadata = { application_id };

    const session = await stripe.checkout.sessions.create(payload);
    log('info', 'Test checkout session created', { sessionId: session.id, amount });
    return res.redirect(session.url);
  } catch (error) {
    log('error', 'Test checkout error', { message: error.message });
    return res.status(500).send(error.message);
  }
});

// ============================================
// AUTOMATION CONTROL ENDPOINTS (manual triggers and status)
// ============================================

// Report automation status and effective config
app.get('/api/automation-status', (req, res) => {
  res.json({
    automation: {
      autoScrapeEnabled: state.autoScrape,
      autoApplyEnabled: state.autoApply,
      scrapeIntervalMinutes: SCRAPE_INTERVAL_MINUTES,
      minConfidence: DEFAULT_MIN_CONFIDENCE,
      budgetRange: { min: DEFAULT_MIN_BUDGET, max: DEFAULT_MAX_BUDGET },
      defaultKeywords: DEFAULT_KEYWORDS,
      pythonScraper: {
        configured: Boolean(PY_SCRAPER_BASE_URL),
        baseUrl: PY_SCRAPER_BASE_URL
      }
    }
  });
});

// Trigger auto-scrape in the background; respond immediately
app.post('/api/trigger-auto-scrape', (req, res) => {
  setImmediate(() => {
    runAutoScrape().catch(err => log('error', 'Manual auto-scrape failed', { message: err.message }));
  });
  res.status(202).json({ triggered: true });
});

// Trigger auto-apply in the background; respond immediately
app.post('/api/trigger-auto-apply', (req, res) => {
  setImmediate(() => {
    runAutoApply().catch(err => log('error', 'Manual auto-apply failed', { message: err.message }));
  });
  res.status(202).json({ triggered: true });
});

// Enable/disable automation via API and persist to settings
app.put('/api/automation-toggle', (req, res) => {
  const { auto_scrape, auto_apply } = req.body || {};

  let changed = false;
  if (typeof auto_scrape === 'boolean') {
    state.autoScrape = auto_scrape;
    changed = true;
    if (auto_scrape) {
      if (!autoScrapeInterval) startAutoScrape();
      setImmediate(() => runAutoScrape().catch(e => log('error', 'Immediate auto-scrape failed', { message: e.message })));
    } else {
      stopAutoScrape();
    }
  }
  if (typeof auto_apply === 'boolean') {
    state.autoApply = auto_apply;
    changed = true;
    if (auto_apply) {
      if (!autoApplyInterval) startAutoApply();
    } else {
      stopAutoApply();
    }
  }

  if (changed) {
    db.run('UPDATE settings SET auto_apply = ?, auto_scrape = ? WHERE id = 1', [state.autoApply ? 1 : 0, state.autoScrape ? 1 : 0], (err) => {
      if (err) {
        log('error', 'Failed to persist automation toggle', { message: err.message });
      }
    });
  }

  res.json({ success: true, automation: { autoScrapeEnabled: state.autoScrape, autoApplyEnabled: state.autoApply } });
});

// Serve frontend for non-API routes (SPA fallback)
// Use a route regex to exclude /api and /webhook without needing an inline if-statement
app.get(/^\/(?!api|webhook).*/, (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) return next(err);
  });
});

// (Webhook route moved above express.json to preserve raw body)

// Graceful shutdown
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  log('info', `Shutting down (${signal})...`);
  clearInterval(autoScrapeInterval);
  clearInterval(autoApplyInterval);

  // Stop accepting new connections; close DB; then exit.
  try {
    server.close(() => {
      db.close((err) => {
        if (err) log('warn', 'DB close warning', { message: err.message });
        process.exit(0);
      });
    });
  } catch (e) {
    log('warn', 'Shutdown sequence warning', { message: e && e.message ? e.message : String(e) });
    try {
      db.close(() => process.exit(0));
    } catch (_) {
      process.exit(0);
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));