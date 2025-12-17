// AI FREELANCE AUTOMATION BACKEND
// server.js - Main Express Server
// Handles job scraping, AI proposals, auto-apply, and Stripe payments

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Parser = require('rss-parser');
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
const PORT = process.env.PORT || 5000;
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

const app = express();
const parser = new Parser();
const VERSION = require('./package.json').version || '0.0.0';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
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

// Database Setup - use in-memory for Railway (ephemeral filesystem)
const dbPath = process.env.DATABASE_PATH || (process.env.RAILWAY_ENVIRONMENT ? ':memory:' : './freelance.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    log('error', 'Database error', { error: err && err.message ? err.message : String(err) });
  } else {
    log('info', `Database connected (${dbPath})`);
    initDatabase();
  }
});

// Initialize Database Schema
function initDatabase() {
  db.run(`
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

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      auto_apply BOOLEAN DEFAULT 0,
      min_budget INTEGER DEFAULT 100,
      max_budget INTEGER DEFAULT 5000,
      min_confidence INTEGER DEFAULT 85,
      platforms TEXT DEFAULT '["Upwork","Fiverr","Freelancer"]',
      job_types TEXT DEFAULT '["coding","data-entry","research"]'
    )
  `);

  // Insert default settings if not exists
  db.run(`
    INSERT OR IGNORE INTO settings (id, auto_apply, min_budget, max_budget)
    VALUES (1, 0, 100, 5000)
  `);

  log('info', 'Database initialized');
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

// Scrape Upwork RSS Feed
async function scrapeUpworkRSS(keyword = 'web development') {
  try {
    const t0 = Date.now();
    const rssUrl = `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(keyword)}&sort=recency`;
    const feed = await withTimeout(parser.parseURL(rssUrl), SCRAPE_TIMEOUT_MS, 'Upwork RSS');

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
    const t0 = Date.now();
    const response = await axios.get(`http://localhost:8000/jobs/search`, {
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
    const rssUrl = `https://rss.indeed.com/rss?q=${q}&l=${loc}`;
    const feed = await withTimeout(parser.parseURL(rssUrl), SCRAPE_TIMEOUT_MS, 'Indeed RSS');

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
    let inserted = 0;

    jobs.forEach((job) => {
      db.run(`
        INSERT OR IGNORE INTO jobs 
        (external_id, title, description, budget, platform, job_type, difficulty, url, posted_date, ai_confidence, estimated_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ], function (err) {
        if (!err && this.changes > 0) inserted++;
      });
    });

    // small delay to allow inserts to finish
    setTimeout(() => resolve(inserted), 300);
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

async function generateProposal(jobTitle, jobDescription, jobBudget) {
  const t0 = Date.now();
  // Check if we have a real OpenAI key
  const hasRealKey = process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'demo-mode' &&
    process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';

  if (hasRealKey) {
    try {
      const prompt = `Write a professional, winning Upwork proposal for this job. Make it personal, specific, and under 150 words.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION: ${jobDescription}

BUDGET: ${jobBudget}

Requirements for the proposal:
- Address the client professionally
- Show you understand their specific needs
- Mention relevant skills (React, Node.js, Python, data entry, etc.)
- Ask one smart question about their requirements
- Mention quick delivery time
- Keep it friendly and confident
- End with "NetworkNiceIT Tec" as signature

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
  const techKeywords = jobDescription.toLowerCase().includes('python') ? 'Python' :
    jobDescription.toLowerCase().includes('react') ? 'React & JavaScript' :
      jobDescription.toLowerCase().includes('node') ? 'Node.js' :
        jobDescription.toLowerCase().includes('data') ? 'data processing' :
          'web development';

  const fallback = `Hi,

I can complete your "${jobTitle}" with high quality and fast delivery.

✅ Experience with ${techKeywords} and full-stack development
✅ Clean, well-documented code
✅ Clear communication throughout
✅ Fast turnaround time
✅ Unlimited revisions included

I've built similar projects including the NNIT Platform (full-stack application with React, Node.js, and PostgreSQL). I understand your requirements and can deliver exactly what you need.

Quick question: ${jobDescription.toLowerCase().includes('deadline') ? 'What is your preferred timeline?' : 'Do you have any specific requirements for the deliverables?'}

Available to start immediately!

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
          return await scrapeIndeedRSS(keyword, location);
        } else if (source === 'both') {
          const [up, indd] = await Promise.allSettled([
            scrapeUpworkRSS(keyword),
            scrapeIndeedRSS(keyword, location)
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
  const { auto_apply, min_budget, max_budget, min_confidence, platforms, job_types } = req.body;

  db.run(`
    UPDATE settings 
    SET auto_apply = ?, min_budget = ?, max_budget = ?, min_confidence = ?, platforms = ?, job_types = ?
    WHERE id = 1
  `, [
    auto_apply ? 1 : 0,
    min_budget,
    max_budget,
    min_confidence,
    JSON.stringify(platforms),
    JSON.stringify(job_types)
  ], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
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
    // Try RSS feeds (Python service not available on Railway)
    const [upworkJobs, indeedJobs] = await Promise.all([
      scrapeUpworkRSS(keyword).catch(e => { log('warn', 'Upwork scrape error', { message: e.message }); return []; }),
      scrapeIndeedRSS(keyword).catch(e => { log('warn', 'Indeed scrape error', { message: e.message }); return []; })
    ]);
    all = all.concat(upworkJobs, indeedJobs);

    if (upworkJobs.length > 0 || indeedJobs.length > 0) {
      log('info', `Found ${upworkJobs.length + indeedJobs.length} jobs`, { keyword });
    }
  }

  const inserted = await insertJobs(all);
  log('info', 'Auto-scrape complete', { found: all.length, inserted });

  // Trigger auto-apply immediately after scraping if enabled
  if (AUTO_APPLY_ENABLED && inserted > 0) {
    log('info', 'Triggering auto-apply', { newJobs: inserted });
    await runAutoApply();
  }
}

async function runAutoApply() {
  if (!AUTO_APPLY_ENABLED) {
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
      if (budgetValue > 0 && (budgetValue < DEFAULT_MIN_BUDGET || budgetValue > DEFAULT_MAX_BUDGET)) {
        log('info', 'Skipping job - budget out of range', { title: job.title, budget: budgetValue });
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

// Start server
app.listen(PORT, () => {
  // Single concise startup entry for clean production logs
  log('info', 'Service started', {
    server: `http://localhost:${PORT}`,
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
      autoApply: AUTO_APPLY_ENABLED ? 'ENABLED' : 'DISABLED',
      autoScrape: AUTO_SCRAPE_ENABLED ? 'ENABLED' : 'DISABLED',
      scrapeIntervalMinutes: SCRAPE_INTERVAL_MINUTES,
      budgetRange: `$${DEFAULT_MIN_BUDGET}-$${DEFAULT_MAX_BUDGET}`,
      minConfidencePercent: DEFAULT_MIN_CONFIDENCE
    }
  });

  // Start scheduled tasks
  if (AUTO_SCRAPE_ENABLED) {
    // Run initial scrape quickly, then start interval
    setTimeout(() => {
      runAutoScrape().then(() => {
        log('info', 'Setting up recurring auto-scraper...');
        startAutoScrape();
        if (AUTO_APPLY_ENABLED) startAutoApply();
      }).catch(err => {
        log('error', 'Auto-scrape failed', { message: err.message });
      });
    }, 10000);
  } else {
    if (AUTO_APPLY_ENABLED) startAutoApply();
  }
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
        autoScrapeEnabled: AUTO_SCRAPE_ENABLED,
        autoApplyEnabled: AUTO_APPLY_ENABLED,
        scrapeIntervalMinutes: SCRAPE_INTERVAL_MINUTES,
        minConfidence: DEFAULT_MIN_CONFIDENCE,
        budgetRange: { min: DEFAULT_MIN_BUDGET, max: DEFAULT_MAX_BUDGET },
        defaultKeywords: DEFAULT_KEYWORDS
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

// Serve frontend for non-API routes (SPA fallback)
// Use a route regex to exclude /api and /webhook without needing an inline if-statement
app.get(/^\/(?!api|webhook).*/, (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) return next(err);
  });
});

// (Webhook route moved above express.json to preserve raw body)

// Graceful shutdown
process.on('SIGINT', () => {
  log('info', 'Shutting down...');
  clearInterval(autoScrapeInterval);
  clearInterval(autoApplyInterval);
  db.close();
  process.exit(0);
});