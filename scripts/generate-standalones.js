const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'frontend');
const outDir = path.join(__dirname, '..', 'frontend-standalone');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(frontendDir).filter(f => f.endsWith('.js'));

const templateHtml = (name) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Standalone - ${name}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;margin:12px;padding:0;color:#111}
    header{display:flex;align-items:center;justify-content:space-between}
    pre{background:#f6f8fa;padding:10px;border-radius:6px;overflow:auto}
    input,button{font-size:16px;padding:8px;margin:6px 0}
    .mobile{max-width:720px;margin:0 auto}
  </style>
</head>
<body>
  <div class="mobile">
    <header>
      <h2>${name}</h2>
      <a href="/admin">Admin</a>
    </header>
    <p>Lightweight mobile-friendly test UI for <strong>${name}</strong>.</p>
    <div>
      <button id="health">Health</button>
      <button id="call">Call API</button>
      <input id="path" placeholder="Enter API path (eg /api/auth)" style="width:100%" />
    </div>
    <pre id="out">Waiting...</pre>
    <script src="app.js"></script>
  </div>
</body>
</html>`;

const templateApp = (name) => `async function call(p){try{const r=await fetch(p);const text=await r.text();try{return JSON.parse(text)}catch(e){return text}}catch(e){return {error:e.message}}}

const out=document.getElementById('out');
const healthBtn=document.getElementById('health');
const callBtn=document.getElementById('call');
const pathInput=document.getElementById('path');

healthBtn.addEventListener('click',async()=>{out.textContent='...';const r=await call('/health');out.textContent=JSON.stringify(r,null,2)});
callBtn.addEventListener('click',async()=>{const p=pathInput.value.trim()||'/api/${name}';out.textContent='...';const r=await call(p);out.textContent=typeof r==='string'?r:JSON.stringify(r,null,2)});

// Auto-run health on load
(async()=>{healthBtn.click();})();
`;

let created = 0;
for (const file of files) {
  const name = path.basename(file, '.js');
  const dir = path.join(outDir, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), templateHtml(name), { encoding: 'utf8' });
  fs.writeFileSync(path.join(dir, 'app.js'), templateApp(name), { encoding: 'utf8' });
  created++;
}

console.log(`Generated ${created} standalone pages in ${outDir}`);
