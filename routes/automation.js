// routes/automation.js  ->  mounted automatically at /api/automation
// NNIT automatic freelance machine: finds jobs, scores them, writes a proposal for each good one,
// and keeps everything in PostgreSQL (survives restarts and redeploys).
// Restored and rebuilt from the December 2025 server (auto-scrape / auto-apply / toggles).
// Honest scope: "apply" prepares and stores a ready proposal (status 'ready'); it does not log in to Upwork and press send.
const express = require('express');
const axios = require('axios');
const router = express.Router();

const INTERVAL_MIN = Math.max(5, parseInt(process.env.AUTOMATION_INTERVAL_MINUTES || '30', 10) || 30);
const MIN_CONFIDENCE = parseInt(process.env.AUTOMATION_MIN_CONFIDENCE || '75', 10) || 75;
const MIN_BUDGET = parseInt(process.env.AUTOMATION_MIN_BUDGET || '20', 10) || 20;
const MAX_BUDGET = parseInt(process.env.AUTOMATION_MAX_BUDGET || '5000', 10) || 5000;
const MAX_APPLY_PER_RUN = parseInt(process.env.AUTOMATION_MAX_APPLY || '5', 10) || 5;
const SIGNATURE = (process.env.PROPOSAL_SIGNATURE || 'Solomon Ayodele - NNIT Enterprise').replace(/\\n/g, '\n');
const KEYWORDS = (process.env.AUTOMATION_KEYWORDS || 'web development,react,node.js,python,automation,api')
  .split(',').map(s => s.trim()).filter(Boolean);
const UA = 'Mozilla/5.0 (compatible; NNITBot/1.0)';

const pool = () => global.pgPool;
const log = (...a) => console.log('[Automation]', ...a);

const state = { autoScrape: true, autoApply: true, lastScrape: null, lastApply: null, lastError: null, running: false };
let timer = null;

// ---------- storage ----------
async function ensureTables() {
  const p = pool();
  if (!p) throw new Error('PostgreSQL not ready');
  await p.query(`CREATE TABLE IF NOT EXISTS auto_settings (id INT PRIMARY KEY, auto_scrape BOOLEAN DEFAULT TRUE, auto_apply BOOLEAN DEFAULT TRUE)`);
  await p.query(`INSERT INTO auto_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
  await p.query(`CREATE TABLE IF NOT EXISTS auto_jobs (
    id SERIAL PRIMARY KEY, external_id TEXT UNIQUE, title TEXT, description TEXT, budget TEXT, platform TEXT,
    job_type TEXT, difficulty TEXT, url TEXT, posted_date TIMESTAMPTZ, ai_confidence INT,
    status TEXT DEFAULT 'available', created_at TIMESTAMPTZ DEFAULT NOW())`);
  await p.query(`CREATE TABLE IF NOT EXISTS auto_applications (
    id SERIAL PRIMARY KEY, job_id INT REFERENCES auto_jobs(id) ON DELETE CASCADE, proposal TEXT,
    status TEXT DEFAULT 'ready', earnings TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);
  const s = (await p.query('SELECT auto_scrape, auto_apply FROM auto_settings WHERE id=1')).rows[0];
  state.autoScrape = s.auto_scrape; state.autoApply = s.auto_apply;
}

// ---------- scoring (from the Dec 2025 server) ----------
function categorize(t, d) {
  const x = ((t || '') + ' ' + (d || '')).toLowerCase();
  if (/python|javascript|react|node|code|programming|api|web dev/.test(x)) return 'coding';
  if (/data entry|excel|spreadsheet|csv|typing/.test(x)) return 'data-entry';
  if (/research|report|analysis|writing/.test(x)) return 'research';
  if (/design|logo|graphic|ui|ux/.test(x)) return 'design';
  return 'general';
}
function difficulty(d) {
  const x = (d || '').toLowerCase();
  if (/simple|easy|quick|basic|beginner/.test(x)) return 'Easy';
  if (/complex|advanced|expert|senior/.test(x)) return 'Hard';
  return 'Medium';
}
function confidence(t, d) {
  const x = ((t || '') + ' ' + (d || '')).toLowerCase();
  let s = 70;
  if (/python|javascript|react|node/.test(x)) s += 10;
  if (/simple|quick|easy/.test(x)) s += 5;
  if (/data entry|excel|csv/.test(x)) s += 8;
  if (/automation|script|api/.test(x)) s += 7;
  if (/expert|senior|years of experience/.test(x)) s -= 10;
  if (/interview|phone call|meeting/.test(x)) s -= 5;
  return Math.min(Math.max(s, 50), 99);
}
const strip = h => String(h || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const mk = (o) => ({
  external_id: String(o.external_id), title: String(o.title || '').slice(0, 300), description: strip(o.description).slice(0, 4000),
  budget: o.budget || 'Not specified', platform: o.platform, url: o.url,
  posted_date: new Date(o.posted_date || Date.now()).toISOString(),
  job_type: categorize(o.title, o.description), difficulty: difficulty(o.description),
  ai_confidence: confidence(o.title, strip(o.description))
});

// ---------- sources (each one fails on its own without stopping the others) ----------
async function get(url, extra = {}) {
  return axios.get(url, { timeout: 15000, maxRedirects: 5, headers: { 'User-Agent': UA, Accept: '*/*' }, ...extra });
}
function rssItems(xml) {
  const out = [];
  (String(xml).match(/<item[\s\S]*?<\/item>/g) || []).forEach(block => {
    const g = tag => { const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>')); return m ? strip(m[1]) : ''; };
    out.push({ title: g('title'), link: g('link'), guid: g('guid') || g('link'), description: g('description'), pubDate: g('pubDate') });
  });
  return out;
}
async function fromRemotive(kw) {
  const r = await get('https://remotive.com/api/remote-jobs?limit=40&search=' + encodeURIComponent(kw));
  return (r.data.jobs || []).map(j => mk({ external_id: 'remotive-' + j.id, title: j.title, description: j.description, budget: j.salary || 'Not specified', platform: 'Remotive', url: j.url, posted_date: j.publication_date }));
}
async function fromRemoteOK() {
  const r = await get('https://remoteok.com/api');
  return (Array.isArray(r.data) ? r.data : []).filter(j => j && j.id && j.position).slice(0, 80).map(j => mk({
    external_id: 'remoteok-' + j.id, title: j.position, description: j.description, budget: j.salary_min ? '$' + j.salary_min : 'Not specified', platform: 'RemoteOK', url: j.url || ('https://remoteok.com/' + j.slug), posted_date: j.date }));
}
async function fromWWR() {
  const r = await get('https://weworkremotely.com/categories/remote-programming-jobs.rss');
  return rssItems(r.data).map(i => mk({ external_id: 'wwr-' + i.guid, title: i.title, description: i.description, platform: 'WeWorkRemotely', url: i.link, posted_date: i.pubDate }));
}
async function fromIndeed(kw) {
  const r = await get('https://www.rss.indeed.com/rss?q=' + encodeURIComponent(kw) + '&l=');
  return rssItems(r.data).map(i => mk({ external_id: 'indeed-' + i.guid, title: i.title, description: i.description, platform: 'Indeed', url: i.link, posted_date: i.pubDate }));
}
async function fromUpwork(kw) {
  const r = await get('https://www.upwork.com/ab/feed/jobs/rss?sort=recency&q=' + encodeURIComponent(kw));
  if (!/<rss|<feed/.test(String(r.data))) return [];
  return rssItems(r.data).map(i => { const b = i.description.match(/\$[\d,]+/); return mk({ external_id: 'upwork-' + i.guid, title: i.title, description: i.description, budget: b ? b[0] : 'Not specified', platform: 'Upwork', url: i.link, posted_date: i.pubDate }); });
}

const FITS = /(develop|engineer|programmer|software|full.?stack|front.?end|back.?end|react|node|python|javascript|typescript|web|api|devops|data|machine learning|\bml\b|\bai\b|automation|mobile|android|ios|\bqa\b|test|cloud|security|sre|wordpress|ui\b|ux\b|designer|freelance)/i;
const NOT_FITS = /(sales|account manager|account executive|recruit|talent|customer success|customer support|support specialist|marketing manager|accountant|legal|counsel|finance manager|hr |people partner|director|vp |head of|chief)/i;
const isFit = j => FITS.test(j.title) && !NOT_FITS.test(j.title);

async function saveJobs(jobs) {
  let inserted = 0;
  for (const j of jobs) {
    if (!j.title || !j.url || !isFit(j)) continue;
    const r = await pool().query(
      `INSERT INTO auto_jobs (external_id,title,description,budget,platform,job_type,difficulty,url,posted_date,ai_confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (external_id) DO NOTHING`,
      [j.external_id, j.title, j.description, j.budget, j.platform, j.job_type, j.difficulty, j.url, j.posted_date, j.ai_confidence]);
    inserted += r.rowCount;
  }
  return inserted;
}

async function runScrape() {
  const found = []; const errors = [];
  const jobs = [];
  const tryRun = async (name, fn) => { try { const r = await fn(); jobs.push(...r); found.push(name + ':' + r.length); } catch (e) { errors.push(name + ': ' + e.message); } };
  await tryRun('remoteok', fromRemoteOK);
  await tryRun('weworkremotely', fromWWR);
  for (const kw of KEYWORDS) {
    await tryRun('remotive/' + kw, () => fromRemotive(kw));
    await tryRun('indeed/' + kw, () => fromIndeed(kw));
    await tryRun('upwork/' + kw, () => fromUpwork(kw));
  }
  const inserted = await saveJobs(jobs);
  state.lastScrape = { at: new Date().toISOString(), found: jobs.length, inserted, sources: found, errors: errors.slice(0, 8) };
  log('scrape done', state.lastScrape.found, 'found', inserted, 'new');
  return state.lastScrape;
}

// ---------- proposals ----------
function profileFor(title, desc) {
  const t = String(title || '').toLowerCase() + ' ' + (/(devops|aws|terraform|kubernetes|docker|react native|android|ios)/i.test(title || '') ? String(desc || '').toLowerCase() : '');
  if (/\b(devops|aws|terraform|kubernetes|docker|ci\/?cd)\b/.test(t)) return { skills: ['AWS', 'Docker/Kubernetes', 'CI/CD'], q: 'What is the current infrastructure setup and your top priority for the first week?' };
  if (/\b(copywriter|content writer|blog|seo|newsletter)\b/.test(t)) return { skills: ['SEO content writing', 'Research & outlining', 'Editing & tone matching'], q: 'Do you have a preferred tone and examples of content you like?' };
  if (/\b(react native|ios|android|mobile app|expo)\b/.test(t)) return { skills: ['React Native', 'Performance tuning', 'Release readiness'], q: 'What are the top issues right now and do you have crash logs?' };
  if (/\b(data entry|excel|spreadsheet|csv|scrap)/.test(t)) return { skills: ['Data entry', 'Excel/Sheets', 'Data cleaning'], q: 'What format do you want the final delivery in?' };
  return { skills: ['React', 'Node.js', 'Python / APIs'], q: 'What are the exact deliverables and your preferred timeline?' };
}
async function makeProposal(job) {
  const p = profileFor(job.title, job.description || '');
  const key = process.env.OPENAI_API_KEY;
  if (key && !/demo|your-openai/i.test(key)) {
    try {
      const OpenAI = require('openai');
      const ai = new OpenAI({ apiKey: key });
      const r = await ai.chat.completions.create({
        model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 300,
        messages: [{ role: 'user', content: `Write a concise, specific proposal under 140 words for this freelance job. Do not invent past projects. Address the client professionally, show understanding in one sentence, give 3 short checkmark bullets, ask exactly one smart question, mention quick turnaround, and end with "${SIGNATURE}".\n\nJOB TITLE: ${job.title}\nDESCRIPTION: ${(job.description || '').slice(0, 1500)}\nBUDGET: ${job.budget}\nSuggested skills: ${p.skills.join(', ')}\n\nWrite only the proposal text.` }]
      });
      const t = (r.choices[0].message.content || '').trim();
      if (t) return t;
    } catch (e) { log('OpenAI unavailable, using template:', e.message); }
  }
  return `Hi,\n\nI can help with your "${job.title}" and start immediately.\n\n✅ ${p.skills[0]}\n✅ ${p.skills[1]}\n✅ ${p.skills[2]}\n\nI keep communication clear and move fast, with a first update within 24 hours.\n\nQuick question: ${p.q}\n\nBest regards,\n${SIGNATURE}`;
}

async function runApply() {
  const rows = (await pool().query(
    `SELECT * FROM auto_jobs WHERE status='available' AND ai_confidence >= $1 ORDER BY ai_confidence DESC, posted_date DESC LIMIT 40`, [MIN_CONFIDENCE])).rows;
  let done = 0;
  for (const job of rows) {
    if (done >= MAX_APPLY_PER_RUN) break;
    const bv = parseInt(String(job.budget || '0').replace(/[^0-9]/g, ''), 10) || 0;
    const freelanceBudget = /upwork|fiverr|freelancer/i.test(job.platform || '');
    if (freelanceBudget && bv > 0 && (bv < MIN_BUDGET || bv > MAX_BUDGET)) { await pool().query(`UPDATE auto_jobs SET status='skipped' WHERE id=$1`, [job.id]); continue; }
    const proposal = await makeProposal(job);
    await pool().query(`INSERT INTO auto_applications (job_id, proposal, status, earnings) VALUES ($1,$2,'ready',$3)`, [job.id, proposal, job.budget]);
    await pool().query(`UPDATE auto_jobs SET status='applied' WHERE id=$1`, [job.id]);
    done++;
  }
  state.lastApply = { at: new Date().toISOString(), prepared: done };
  log('apply done', done, 'proposals ready');
  return state.lastApply;
}

async function cycle() {
  if (state.running) return;
  state.running = true;
  try {
    if (state.autoScrape) await runScrape();
    if (state.autoApply) await runApply();
    state.lastError = null;
  } catch (e) { state.lastError = e.message; log('cycle error', e.message); }
  finally { state.running = false; }
}

// starts by itself when the server starts and keeps going after every restart
(async () => {
  for (let i = 0; i < 10; i++) {
    try { await ensureTables(); break; } catch (e) { state.lastError = e.message; await new Promise(r => setTimeout(r, 5000)); }
  }
  try { // ONE-TIME tidy (runs once, then never again): drop jobs that do not fit a developer and re-make proposals written with the old skills list
    await pool().query('ALTER TABLE auto_settings ADD COLUMN IF NOT EXISTS tidy_v INT DEFAULT 0');
    const v = (await pool().query('SELECT tidy_v FROM auto_settings WHERE id=1')).rows[0].tidy_v || 0;
    if (v < 1) {
      const all = (await pool().query('SELECT id, title FROM auto_jobs')).rows;
      const bad = all.filter(r => !isFit(r)).map(r => r.id);
      if (bad.length) await pool().query('DELETE FROM auto_jobs WHERE id = ANY($1::int[])', [bad]);
      await pool().query(`DELETE FROM auto_applications WHERE status='ready'`);
      await pool().query(`UPDATE auto_jobs SET status='available' WHERE status='applied' AND id NOT IN (SELECT job_id FROM auto_applications)`);
      await pool().query('UPDATE auto_settings SET tidy_v=1 WHERE id=1');
    }
  } catch (e) { log('tidy skipped:', e.message); }
  if (timer) clearInterval(timer);
  timer = setInterval(() => cycle().catch(() => {}), INTERVAL_MIN * 60 * 1000);
  setTimeout(() => cycle().catch(() => {}), 20000);
})();

// ---------- access: admin login token, or the shop admin key ----------
function admin(req, res, next) {
  const key = process.env.SHOP_ADMIN_KEY;
  if (key && req.headers['x-admin-key'] === key) return next();
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    try {
      const u = require('jsonwebtoken').verify(h.slice(7), process.env.JWT_SECRET);
      const admins = String(process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      if (u.role === 'admin' || admins.includes(String(u.email || '').toLowerCase())) { req.user = u; return next(); }
    } catch (_) { /* fall through */ }
  }
  return res.status(401).json({ success: false, message: 'Admin access required' });
}

// ---------- routes ----------
function publicStatus() {
  return { autoScrape: state.autoScrape, autoApply: state.autoApply, intervalMinutes: INTERVAL_MIN, minConfidence: MIN_CONFIDENCE,
    budgetRange: { min: MIN_BUDGET, max: MAX_BUDGET }, keywords: KEYWORDS, running: state.running,
    lastScrape: state.lastScrape, lastApply: state.lastApply, lastError: state.lastError };
}
router.get('/', (req, res) => res.json({ success: true, service: 'NNIT Automatic Freelance', ...publicStatus() }));
router.get('/status', async (req, res) => {
  try {
    const c = await pool().query(`SELECT (SELECT COUNT(*) FROM auto_jobs) jobs, (SELECT COUNT(*) FROM auto_applications) applications`);
    res.json({ success: true, ...publicStatus(), totals: c.rows[0] });
  } catch (e) { res.json({ success: true, ...publicStatus(), totals: null, note: e.message }); }
});
router.get('/jobs', async (req, res) => {
  const lim = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const r = await pool().query(`SELECT * FROM auto_jobs ORDER BY posted_date DESC NULLS LAST LIMIT $1`, [lim]);
  res.json({ success: true, jobs: r.rows });
});
router.get('/applications', async (req, res) => {
  const lim = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const r = await pool().query(`SELECT a.*, j.title, j.platform, j.url, j.budget FROM auto_applications a JOIN auto_jobs j ON j.id=a.job_id ORDER BY a.created_at DESC LIMIT $1`, [lim]);
  res.json({ success: true, applications: r.rows });
});
router.put('/applications/:id', admin, async (req, res) => {
  const st = String((req.body || {}).status || '');
  if (!['ready', 'sent', 'won', 'lost', 'rejected'].includes(st)) return res.status(400).json({ success: false, message: 'Bad status' });
  await pool().query(`UPDATE auto_applications SET status=$1, updated_at=NOW() WHERE id=$2`, [st, req.params.id]);
  res.json({ success: true });
});
router.put('/toggle', admin, async (req, res) => {
  const { auto_scrape, auto_apply } = req.body || {};
  if (typeof auto_scrape === 'boolean') state.autoScrape = auto_scrape;
  if (typeof auto_apply === 'boolean') state.autoApply = auto_apply;
  await pool().query(`UPDATE auto_settings SET auto_scrape=$1, auto_apply=$2 WHERE id=1`, [state.autoScrape, state.autoApply]);
  res.json({ success: true, autoScrape: state.autoScrape, autoApply: state.autoApply });
});
router.post('/run', admin, (req, res) => { setImmediate(() => cycle().catch(() => {})); res.status(202).json({ success: true, triggered: true }); });

module.exports = router;
