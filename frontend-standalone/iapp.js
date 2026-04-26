<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NNIT Freelance — Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0a0c0f;
      --surface:   #111418;
      --border:    #1e2329;
      --border2:   #2a3040;
      --accent:    #00e5a0;
      --accent2:   #0099ff;
      --warn:      #ff6b35;
      --text:      #e8ecf2;
      --muted:     #6b7a96;
      --muted2:    #3d4a63;
      --success:   #00c97a;
      --radius:    10px;
      --font-head: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --font-mono: 'DM Mono', monospace;
    }

    html, body { height: 100%; }

    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-size: 14px;
    }

    /* ── Top bar ── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      height: 56px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar-logo {
      font-family: var(--font-head);
      font-weight: 800;
      font-size: 17px;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-mark {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border-radius: 7px;
      display: grid;
      place-items: center;
      font-size: 13px;
      font-weight: 800;
      color: #000;
    }
    .topbar-status {
      display: flex;
      align-items: center;
      gap: 18px;
      font-size: 12px;
      color: var(--muted);
      font-family: var(--font-mono);
    }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0,229,160,0.08);
      border: 1px solid rgba(0,229,160,0.2);
      color: var(--accent);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
    }
    .status-dot {
      width: 6px; height: 6px;
      background: var(--accent);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }

    /* ── Layout ── */
    .layout {
      display: flex;
      flex: 1;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-section {
      padding: 6px 16px 2px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--muted2);
      font-family: var(--font-head);
      margin-top: 10px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      margin: 0 8px;
      border-radius: 7px;
      cursor: pointer;
      color: var(--muted);
      font-size: 13.5px;
      font-weight: 500;
      transition: all .15s;
      user-select: none;
    }
    .nav-item:hover { background: var(--border); color: var(--text); }
    .nav-item.active {
      background: rgba(0,229,160,0.1);
      color: var(--accent);
      border: 1px solid rgba(0,229,160,0.15);
    }
    .nav-icon { font-size: 15px; width: 20px; text-align: center; }

    /* ── Main ── */
    .main {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* ── Page title ── */
    .page-title {
      font-family: var(--font-head);
      font-weight: 700;
      font-size: 22px;
      letter-spacing: -0.5px;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    .page-title span {
      font-size: 13px;
      font-weight: 400;
      color: var(--muted);
      font-family: var(--font-body);
      letter-spacing: 0;
    }

    /* ── Cards ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 22px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-title {
      font-family: var(--font-head);
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.2px;
    }
    .card-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--border2);
      color: var(--muted);
    }

    /* ── Grid ── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }

    /* ── Stat tiles ── */
    .stat-tile {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px 20px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .stat-value {
      font-family: var(--font-head);
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
    .accent-val { color: var(--accent); }
    .blue-val   { color: var(--accent2); }
    .warn-val   { color: var(--warn); }

    /* ── Inputs ── */
    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
    .field label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--muted);
    }
    input[type=text], input[type=email], input[type=password], select {
      background: var(--bg);
      border: 1px solid var(--border2);
      border-radius: 7px;
      color: var(--text);
      font-family: var(--font-body);
      font-size: 13.5px;
      padding: 9px 12px;
      width: 100%;
      outline: none;
      transition: border-color .2s;
    }
    input:focus, select:focus { border-color: var(--accent); }
    .pw-wrap { position: relative; }
    .pw-wrap input { padding-right: 36px; }
    .pw-toggle {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      cursor: pointer; color: var(--muted); font-size: 14px;
      background: none; border: none; padding: 0;
    }

    /* ── Buttons ── */
    .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      padding: 9px 16px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      transition: all .15s;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .btn-primary {
      background: var(--accent);
      color: #000;
      font-weight: 600;
    }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-secondary {
      background: var(--border2);
      color: var(--text);
    }
    .btn-secondary:hover { background: #3d4e6a; }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border2);
      color: var(--muted);
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
    .btn-danger {
      background: rgba(255,107,53,0.12);
      color: var(--warn);
      border: 1px solid rgba(255,107,53,0.25);
    }
    .btn-danger:hover { background: rgba(255,107,53,0.22); }
    .btn-blue {
      background: rgba(0,153,255,0.12);
      color: var(--accent2);
      border: 1px solid rgba(0,153,255,0.25);
    }
    .btn-blue:hover { background: rgba(0,153,255,0.22); }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: var(--border);
      margin: 16px 0;
    }

    /* ── Output terminal ── */
    .terminal {
      background: #070a0d;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .terminal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    .terminal-dots { display: flex; gap: 6px; }
    .terminal-dots span {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .dot-r { background: #ff5f57; }
    .dot-y { background: #febc2e; }
    .dot-g { background: #28c840; }
    .terminal-label {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--muted);
    }
    pre#output {
      font-family: var(--font-mono);
      font-size: 12.5px;
      color: var(--accent);
      padding: 16px;
      min-height: 160px;
      max-height: 320px;
      overflow-y: auto;
      white-space: pre-wrap;
      line-height: 1.7;
    }

    /* ── Job list ── */
    .job-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .job-item:last-child { border-bottom: none; }
    .job-title { font-weight: 500; font-size: 13.5px; }
    .job-meta { font-size: 11.5px; color: var(--muted); margin-top: 3px; }
    .job-tag {
      font-size: 10.5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    .tag-green { background: rgba(0,201,122,0.12); color: var(--success); }
    .tag-blue  { background: rgba(0,153,255,0.12); color: var(--accent2); }

    /* ── Notif list ── */
    .notif-item {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      align-items: flex-start;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .ni-accent { background: rgba(0,229,160,0.12); }
    .ni-blue   { background: rgba(0,153,255,0.12); }
    .ni-warn   { background: rgba(255,107,53,0.12); }
    .notif-body .notif-title { font-size: 13px; font-weight: 500; }
    .notif-body .notif-time  { font-size: 11px; color: var(--muted); margin-top: 2px; }

    /* ── Toast ── */
    #toast {
      position: fixed;
      bottom: 24px; right: 24px;
      background: var(--surface);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-family: var(--font-mono);
      font-size: 12px;
      padding: 10px 18px;
      border-radius: 8px;
      opacity: 0;
      transform: translateY(10px);
      transition: all .25s;
      pointer-events: none;
      z-index: 999;
    }
    #toast.show { opacity: 1; transform: translateY(0); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

    /* Animations */
    .card, .stat-tile { animation: fadeUp .3s ease both; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .card:nth-child(1) { animation-delay: .05s; }
    .card:nth-child(2) { animation-delay: .10s; }
    .card:nth-child(3) { animation-delay: .15s; }
    .card:nth-child(4) { animation-delay: .20s; }
  </style>
</head>
<body>

<!-- Top bar -->
<header class="topbar">
  <div class="topbar-logo">
    <div class="logo-mark">N</div>
    NNIT Freelance
  </div>
  <div class="topbar-status">
    <span id="status-user" style="font-size:12px">not signed in</span>
    <div class="status-pill">
      <div class="status-dot"></div>
      API live
    </div>
  </div>
</header>

<div class="layout">

  <!-- Sidebar -->
  <nav class="sidebar">
    <div class="sidebar-section">Account</div>
    <div class="nav-item active" onclick="scrollTo('sec-auth',this)">
      <span class="nav-icon">🔑</span> Auth
    </div>
    <div class="sidebar-section">Platform</div>
    <div class="nav-item" onclick="scrollTo('sec-marketplace',this)">
      <span class="nav-icon">💼</span> Marketplace
    </div>
    <div class="nav-item" onclick="scrollTo('sec-notifs',this)">
      <span class="nav-icon">🔔</span> Notifications
    </div>
    <div class="nav-item" onclick="scrollTo('sec-audit',this)">
      <span class="nav-icon">📋</span> Audit Logs
    </div>
    <div class="sidebar-section">Developer</div>
    <div class="nav-item" onclick="scrollTo('sec-output',this)">
      <span class="nav-icon">⌨️</span> Output
    </div>
  </nav>

  <!-- Main content -->
  <main class="main">

    <div class="page-title">
      Dashboard <span>NNIT Freelance Platform</span>
    </div>

    <!-- Stats row -->
    <div class="grid-3">
      <div class="stat-tile">
        <div class="stat-label">Status</div>
        <div class="stat-value accent-val" id="stat-status">Offline</div>
        <div class="stat-sub">Authentication state</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Notifications</div>
        <div class="stat-value blue-val" id="stat-notifs">—</div>
        <div class="stat-sub">Unread messages</div>
      </div>
      <div class="stat-tile">
        <div class="stat-label">Jobs Listed</div>
        <div class="stat-value warn-val" id="stat-jobs">—</div>
        <div class="stat-sub">Active marketplace</div>
      </div>
    </div>

    <!-- Auth -->
    <div class="card" id="sec-auth">
      <div class="card-header">
        <div class="card-title">🔑 Authentication</div>
        <div class="card-badge">JWT</div>
      </div>
      <div class="grid-2" style="gap:12px 20px">
        <div class="field">
          <label>Email</label>
          <input id="email" type="email" placeholder="user@example.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <div class="pw-wrap">
            <input id="password" type="password" placeholder="••••••••" />
            <button class="pw-toggle" onclick="togglePw()" id="pw-eye">👁</button>
          </div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn-primary" id="btn-register">✦ Register</button>
        <button class="btn-secondary" id="btn-login">→ Login</button>
        <button class="btn-outline" id="btn-profile">👤 Profile</button>
        <button class="btn-danger" id="btn-logout">⏻ Logout</button>
      </div>
    </div>

    <!-- Marketplace + Notifications -->
    <div class="grid-2">

      <!-- Marketplace -->
      <div class="card" id="sec-marketplace">
        <div class="card-header">
          <div class="card-title">💼 Marketplace</div>
          <div class="card-badge">Jobs</div>
        </div>
        <div id="job-list">
          <div class="job-item">
            <div>
              <div class="job-title">Senior Backend Engineer</div>
              <div class="job-meta">Remote · Full-time</div>
            </div>
            <span class="job-tag tag-green">Open</span>
          </div>
          <div class="job-item">
            <div>
              <div class="job-title">Frontend React Developer</div>
              <div class="job-meta">Hybrid · Contract</div>
            </div>
            <span class="job-tag tag-blue">Featured</span>
          </div>
          <div class="job-item">
            <div>
              <div class="job-title">DevOps / Cloud Architect</div>
              <div class="job-meta">Remote · Part-time</div>
            </div>
            <span class="job-tag tag-green">Open</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="btn-row">
          <button class="btn-primary" id="btn-jobs">↻ Refresh Jobs</button>
          <button class="btn-blue" id="btn-apply">⚡ Apply (first)</button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="card" id="sec-notifs">
        <div class="card-header">
          <div class="card-title">🔔 Notifications</div>
          <div class="card-badge" id="notif-count">0</div>
        </div>
        <div id="notif-list">
          <div class="notif-item">
            <div class="notif-icon ni-accent">✉️</div>
            <div class="notif-body">
              <div class="notif-title">Welcome to NNIT Freelance</div>
              <div class="notif-time">Load notifications to see updates</div>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="btn-row">
          <button class="btn-primary" id="btn-notifs">↻ Load Notifications</button>
        </div>
      </div>

    </div>

    <!-- Audit Logs -->
    <div class="card" id="sec-audit">
      <div class="card-header">
        <div class="card-title">📋 Audit Logs</div>
        <div class="card-badge" id="audit-count">0 entries</div>
      </div>
      <div id="audit-list" style="color:var(--muted);font-size:13px;font-family:var(--font-mono)">
        Click "Load Audit Logs" to fetch recent activity.
      </div>
      <div class="divider"></div>
      <div class="btn-row">
        <button class="btn-primary" id="btn-audit">↻ Load Audit Logs</button>
      </div>
    </div>

    <!-- Output terminal -->
    <div class="terminal" id="sec-output">
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="dot-r"></span>
          <span class="dot-y"></span>
          <span class="dot-g"></span>
        </div>
        <div class="terminal-label">API Response</div>
        <button class="btn-outline" style="padding:3px 10px;font-size:11px" onclick="document.getElementById('output').textContent='Ready.\n'">Clear</button>
      </div>
      <pre id="output">Ready.
</pre>
    </div>

  </main>
</div>

<!-- Toast -->
<div id="toast"></div>

<script>
  // Sidebar nav highlight
  function scrollTo(id, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Password toggle
  function togglePw() {
    const inp = document.getElementById('password');
    const eye = document.getElementById('pw-eye');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    eye.textContent = inp.type === 'password' ? '👁' : '🙈';
  }

  // Toast notification
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Output helper
  function log(data) {
    const out = document.getElementById('output');
    const ts = new Date().toLocaleTimeString();
    out.textContent += `\n[${ts}] ` + (typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    out.scrollTop = out.scrollHeight;
  }
</script>

<!-- Your existing scripts -->
<script src="./api.js"></script>
<script src="./app.js"></script>

</body>
</html>