(function () {
  const $ = id => document.getElementById(id);
  let token = localStorage.getItem('nnit_token') || null;
  let firstJobId = null;

  function log(data) {
    const out = $('output');
    const ts  = new Date().toLocaleTimeString();
    const txt = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    out.textContent += `\n[${ts}] ${txt}`;
    out.scrollTop = out.scrollHeight;
  }
  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
  function setStatus(loggedIn, email) {
    const s = $('stat-status'), u = $('status-user');
    if (s) s.textContent = loggedIn ? 'Online' : 'Offline';
    if (u) u.textContent = loggedIn ? (email || 'signed in') : 'not signed in';
  }

  async function register() {
    const email = $('email').value.trim(), pass = $('password').value;
    if (!email || !pass) return toast('Enter email & password');
    log('Registering...');
    const res = await window.standaloneApi.auth.register(email, pass);
    log(res.data);
    if (res.ok) toast('Registered ✓');
  }
  async function login() {
    const email = $('email').value.trim(), pass = $('password').value;
    if (!email || !pass) return toast('Enter email & password');
    log('Logging in...');
    const res = await window.standaloneApi.auth.login(email, pass);
    if (res.ok && res.data?.token) {
      token = res.data.token;
      localStorage.setItem('nnit_token', token);
      localStorage.setItem('nnit_email', email);
      setStatus(true, email);
      toast('Logged in ✓');
      log('Login OK — token saved');
    } else { log(res.data); toast('Login failed'); }
  }
  async function profile() {
    if (!token) return toast('Login first');
    const res = await window.standaloneApi.auth.profile(token);
    log(res.data);
  }
  function logout() {
    token = null;
    localStorage.removeItem('nnit_token');
    localStorage.removeItem('nnit_email');
    setStatus(false);
    toast('Logged out');
    log('Token cleared');
  }

  async function loadNotifs() {
    if (!token) return toast('Login first');
    log('Fetching notifications...');
    const res = await window.standaloneApi.notificationsAPI.getAll(token);
    log(res.data);
    const list = $('notif-list'), badge = $('notif-count'), stat = $('stat-notifs');
    if (!res.ok || !Array.isArray(res.data)) return;
    const items = res.data;
    if (badge) badge.textContent = items.length;
    if (stat)  stat.textContent  = items.length;
    if (!list) return;
    if (items.length === 0) { list.innerHTML = '<div style="color:var(--muted);padding:8px 0;font-size:13px">No notifications.</div>'; return; }
    const icons = ['ni-accent','ni-blue','ni-warn'], emojis = ['✉️','🔔','⚡'];
    list.innerHTML = items.map((n,i) => `
      <div class="notif-item">
        <div class="notif-icon ${icons[i%3]}">${emojis[i%3]}</div>
        <div class="notif-body">
          <div class="notif-title">${n.message||n.title||JSON.stringify(n)}</div>
          <div class="notif-time">${n.createdAt?new Date(n.createdAt).toLocaleString():''}</div>
        </div>
      </div>`).join('');
  }

  async function loadAudit() {
    if (!token) return toast('Login first');
    log('Fetching audit logs...');
    const res = await window.standaloneApi.audit.getLogs(token);
    log(res.data);
    const list = $('audit-list'), badge = $('audit-count');
    if (!res.ok || !Array.isArray(res.data)) return;
    const entries = res.data;
    if (badge) badge.textContent = `${entries.length} entries`;
    if (!list) return;
    if (entries.length === 0) { list.innerHTML = '<div style="color:var(--muted);font-size:13px">No audit entries.</div>'; return; }
    list.innerHTML = entries.map(e => `
      <div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--border);align-items:baseline">
        <span style="font-size:11px;color:var(--muted);white-space:nowrap">${e.createdAt?new Date(e.createdAt).toLocaleString():'—'}</span>
        <span style="color:var(--accent2);font-size:12px">${e.action||e.event||'?'}</span>
        <span style="color:var(--muted);font-size:12px">${e.details||e.meta||''}</span>
      </div>`).join('');
  }

  async function listJobs() {
    log('Fetching jobs...');
    const res = await window.standaloneApi.jobs.list();
    log(res.data);
    const list = $('job-list'), stat = $('stat-jobs');
    if (!res.ok || !Array.isArray(res.data)) return;
    const jobs = res.data;
    firstJobId = jobs[0]?._id || jobs[0]?.id || null;
    if (stat) stat.textContent = jobs.length;
    if (!list) return;
    if (jobs.length === 0) { list.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">No jobs listed.</div>'; return; }
    const tags = ['tag-green','tag-blue'];
    list.innerHTML = jobs.map((j,i) => `
      <div class="job-item">
        <div>
          <div class="job-title">${j.title||j.name||'Untitled'}</div>
          <div class="job-meta">${j.location||'Remote'} · ${j.type||'Contract'}</div>
        </div>
        <span class="job-tag ${tags[i%2]}">${j.status||'Open'}</span>
      </div>`).join('');
    toast(`${jobs.length} jobs loaded`);
  }

  async function applyFirst() {
    if (!token) return toast('Login first');
    if (!firstJobId) return toast('Load jobs first');
    log(`Applying to job ${firstJobId}...`);
    const res = await window.standaloneApi.jobs.apply(firstJobId, token);
    log(res.data);
    if (res.ok) toast('Applied ✓');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (token) setStatus(true, localStorage.getItem('nnit_email') || '');
    $('btn-register').addEventListener('click', register);
    $('btn-login').addEventListener('click', login);
    $('btn-profile').addEventListener('click', profile);
    $('btn-logout').addEventListener('click', logout);
    $('btn-notifs').addEventListener('click', loadNotifs);
    $('btn-audit').addEventListener('click', loadAudit);
    $('btn-jobs').addEventListener('click', listJobs);
    $('btn-apply').addEventListener('click', applyFirst);
  });
})();
