// AI FREELANCE AUTOMATION BACKEND
// server.js - Main Express Server

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Parser = require('rss-parser');
const sqlite3 = require('sqlite3').verbose();
const { OpenAI } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

// Runtime configuration via env (with sane defaults)
const PORT = process.env.PORT || 5000;
const SCRAPE_INTERVAL_MINUTES = Number(process.env.SCRAPE_INTERVAL || 30);
const AUTO_APPLY_ENABLED = process.env.AUTO_APPLY === 'true';
const DEFAULT_MIN_BUDGET = Number(process.env.DEFAULT_MIN_BUDGET || 100);
const DEFAULT_MAX_BUDGET = Number(process.env.DEFAULT_MAX_BUDGET || 5000);
const DEFAULT_MIN_CONFIDENCE = Number(process.env.DEFAULT_MIN_CONFIDENCE || 85);
const DEFAULT_KEYWORDS = (process.env.DEFAULT_KEYWORDS || 'web development,python script,react,nodejs,data entry,automation')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

const app = express();
const parser = new Parser();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenAI Setup (You'll need to add your API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Database Setup
const db = new sqlite3.Database('./freelance.db', (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('📊 Database connected');
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

  console.log('✅ Database initialized');
}

// ============================================
// JOB SCRAPING FUNCTIONS
// ============================================

// Scrape Upwork RSS Feed
async function scrapeUpworkRSS(keyword = 'web development') {
  try {
    const rssUrl = `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(keyword)}&sort=recency`;
    const feed = await parser.parseURL(rssUrl);

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

    return jobs;
  } catch (error) {
    console.error('Upwork scraping error:', error.message);
    return [];
  }
}

// Scrape Indeed RSS Feed
async function scrapeIndeedRSS(keyword = 'web development', location = '') {
  try {
    const q = encodeURIComponent(keyword);
    const loc = encodeURIComponent(location || '');
    const rssUrl = `https://www.rss.indeed.com/rss?q=${q}&l=${loc}`;
    const feed = await parser.parseURL(rssUrl);

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

    return jobs;
  } catch (error) {
    console.error('Indeed scraping error:', error.message);
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

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.log('⚠️ OpenAI error, using fallback proposal');
      // Fall through to fallback
    }
  }

  // Fallback proposal template (works without OpenAI)
  const techKeywords = jobDescription.toLowerCase().includes('python') ? 'Python' :
    jobDescription.toLowerCase().includes('react') ? 'React & JavaScript' :
      jobDescription.toLowerCase().includes('node') ? 'Node.js' :
        jobDescription.toLowerCase().includes('data') ? 'data processing' :
          'web development';

  return `Hi,

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
}
// ============================================
// API ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    message: '🤖 AI Freelance Backend is active!',
    timestamp: new Date().toISOString()
  });
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
    const { keywords } = req.body;
    const searchTerms = keywords || DEFAULT_KEYWORDS;

    let allJobs = [];

    // support querying Indeed as an alternative source
    const { source = 'upwork', location = '' } = req.body;

    for (const keyword of searchTerms) {
      let jobs = [];
      if (source === 'indeed') {
        jobs = await scrapeIndeedRSS(keyword, location);
      } else if (source === 'both') {
        const up = await scrapeUpworkRSS(keyword);
        const indd = await scrapeIndeedRSS(keyword, location);
        jobs = up.concat(indd);
      } else {
        jobs = await scrapeUpworkRSS(keyword);
      }
      allJobs = allJobs.concat(jobs);
    }

    const inserted = await insertJobs(allJobs);

    res.json({
      success: true,
      scraped: allJobs.length,
      inserted: inserted,
      message: `Found ${allJobs.length} jobs, added ${inserted} new ones`
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

      // Create application
      db.run(`
        INSERT INTO applications (job_id, proposal, status, earnings)
        VALUES (?, ?, 'pending', ?)
      `, [job_id, proposal, job.budget], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Update job status
        db.run('UPDATE jobs SET status = ? WHERE id = ?', ['applied', job_id]);

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
// Apply to a job
app.get('/api/stats', (req, res) => {
  const stats = {};

  // Total earnings
  db.get(`
    SELECT SUM(CAST(REPLACE(REPLACE(earnings, '$', ''), ',', '') AS INTEGER)) as total
    FROM applications 
    WHERE status = 'completed'
  `, [], (err, row) => {
    stats.totalEarnings = row?.total || 0;
  });

  // Active jobs count
  db.get(`
    SELECT COUNT(*) as count
    FROM applications
    WHERE status IN ('pending', 'in-progress')
  `, [], (err, row) => {
    stats.activeJobs = row?.count || 0;
  });

  // Completed jobs
  db.get(`
    SELECT COUNT(*) as count
    FROM applications
    WHERE status = 'completed'
  `, [], (err, row) => {
    stats.completedJobs = row?.count || 0;
  });

  // Success rate
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('completed', 'in-progress') THEN 1 ELSE 0 END) as successful
    FROM applications
  `, [], (err, row) => {
    stats.successRate = row?.total > 0 ? Math.round((row.successful / row.total) * 100) : 0;
  });

  setTimeout(() => {
    res.json({ stats });
  }, 500);
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
  console.log('🔍 Auto-scraping jobs...');
  let all = [];
  for (const keyword of DEFAULT_KEYWORDS) {
    const jobs = await scrapeUpworkRSS(keyword);
    all = all.concat(jobs);
  }
  const inserted = await insertJobs(all);
  console.log(`✅ Auto-scrape: ${all.length} found, ${inserted} inserted`);
}

function startAutoScrape() {
  const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;
  autoScrapeInterval = setInterval(runAutoScrape, intervalMs);
}

async function runAutoApply() {
  if (!AUTO_APPLY_ENABLED) return;

  db.all(`
    SELECT * FROM jobs
    WHERE status = 'available'
      AND ai_confidence >= ?
  `, [DEFAULT_MIN_CONFIDENCE], async (err, rows) => {
    if (err || !rows || rows.length === 0) return;

    for (const job of rows.slice(0, 3)) { // apply to a few at a time
      // Budget filter (basic numeric parse)
      const budgetValue = parseInt(String(job.budget || '0').replace(/[^0-9]/g, ''), 10) || 0;
      if (budgetValue < DEFAULT_MIN_BUDGET || budgetValue > DEFAULT_MAX_BUDGET) continue;

      const proposal = await generateProposal(job.title, job.description, job.budget);

      db.run(`
        INSERT INTO applications (job_id, proposal, status, earnings)
        VALUES (?, ?, 'pending', ?)
      `, [job.id, proposal, job.budget], function (applyErr) {
        if (!applyErr) {
          db.run('UPDATE jobs SET status = ? WHERE id = ?', ['applied', job.id]);
          console.log(`✅ Auto-applied to: ${job.title}`);
        }
      });
    }
  });
}

function startAutoApply() {
  // Run auto-apply every scrape interval for simplicity
  const intervalMs = SCRAPE_INTERVAL_MINUTES * 60 * 1000;
  autoApplyInterval = setInterval(runAutoApply, intervalMs);
}

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 AI FREELANCE BACKEND RUNNING!
  
  📡 Server: http://localhost:${PORT}
  🔗 API Endpoints:
     GET  /api/health - Check status
     GET  /api/jobs - Get all jobs
     POST /api/scrape - Scrape new jobs
     POST /api/generate-proposal - Generate AI proposal
     POST /api/apply - Apply to job
     GET  /api/applications - Get applications
     GET  /api/stats - Get statistics
     GET  /api/settings - Get settings
     PUT  /api/settings - Update settings
  
  💡 Starting auto-scraper in 1 minute...
  `);

  // Start auto-scraping after 1 minute
  setTimeout(startAutoScrape, 60000);
  if (AUTO_APPLY_ENABLED) {
    setTimeout(startAutoApply, 60000);
    console.log('🤖 Auto-apply is enabled via AUTO_APPLY=true');
  }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create checkout session (one-time payment)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { line_items } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment', // ONE-TIME PAYMENT
      success_url: `http://localhost:${process.env.PORT || 5000}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:${process.env.PORT || 5000}/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription session
app.post('/api/create-subscription-session', async (req, res) => {
  try {
    const { line_items } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'subscription', // RECURRING PAYMENT
      success_url: `http://localhost:${process.env.PORT || 5000}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:${process.env.PORT || 5000}/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
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

// Catch 404 - must be at END
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  clearInterval(autoScrapeInterval);
  db.close();
  process.exit(0);
});