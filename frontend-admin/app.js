function toJSONSafe(text){try{return JSON.parse(text)}catch(e){return text}}
async function call(p, opts = {}){
  try{
    const res = await fetch(p, opts);
    const text = await res.text();
    return { status: res.status, body: toJSONSafe(text) };
  }catch(e){return { error: e.message }}
}

let token = '';
document.addEventListener('DOMContentLoaded', async ()=>{
  const setBtn = document.getElementById('setToken');
  const tokenInput = document.getElementById('adminToken');
  const useDev = document.getElementById('useDev');

  setBtn.addEventListener('click', ()=>{ token = tokenInput.value.trim(); document.getElementById('status').textContent = token ? 'Token set' : 'Token cleared'; });
  useDev.addEventListener('click', async ()=>{
    document.getElementById('status').textContent = 'Calling dev summary...';
    const r = await call('/api/admin/summary-dev');
    document.getElementById('summary').textContent = JSON.stringify(r,null,2);
    document.getElementById('status').textContent = 'Loaded (dev)';
  });

  document.getElementById('mockIncome').addEventListener('click', async ()=>{
    document.getElementById('status').textContent = 'Fetching mock income...';
    const r = await call('/api/admin/mock-income');
    document.getElementById('summary').innerHTML = renderIncome(r.body || r);
    document.getElementById('status').textContent = 'Loaded (mock income)';
  });
  document.getElementById('mockTransactions').addEventListener('click', async ()=>{
    document.getElementById('status').textContent = 'Fetching mock transactions...';
    const r = await call('/api/admin/mock-transactions');
    document.getElementById('summary').innerHTML = renderTransactions(r.body || r);
    document.getElementById('status').textContent = 'Loaded (mock transactions)';
  });
  document.getElementById('mockAudit').addEventListener('click', async ()=>{
    document.getElementById('status').textContent = 'Fetching mock audit...';
    const r = await call('/api/admin/mock-audit');
    document.getElementById('summary').innerHTML = renderAudit(r.body || r);
    document.getElementById('status').textContent = 'Loaded (mock audit)';
  });

  // attempt secure call if token present, otherwise fall back to dev summary
  document.getElementById('status').textContent = 'Loading summary...';
  try {
    if (token) {
      const authRes = await call('/api/admin/summary', { headers: { Authorization: 'Bearer ' + token } });
      if (authRes && authRes.status === 200) {
        document.getElementById('summary').textContent = JSON.stringify(authRes.body, null, 2);
        document.getElementById('status').textContent = 'Loaded (secure)';
      } else {
        const devRes = await call('/api/admin/summary-dev');
        document.getElementById('summary').textContent = JSON.stringify(devRes, null, 2);
        document.getElementById('status').textContent = 'Loaded (dev fallback)';
      }
    } else {
      const devRes = await call('/api/admin/summary-dev');
      document.getElementById('summary').textContent = JSON.stringify(devRes, null, 2);
      document.getElementById('status').textContent = 'Loaded (dev)';
    }
  } catch (e) {
    document.getElementById('summary').textContent = JSON.stringify({ error: e.message }, null, 2);
    document.getElementById('status').textContent = 'Error';
  }
});

// Expose a helper to make authenticated fetches from console if needed
window.adminCall = async function(path){
  const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
  return await call(path, { headers });
}

function renderIncome(data){
  if(!data) return '<em>No data</em>';
  const total = data.totalRevenue || data.totalRevenue === 0 ? (data.totalRevenue).toFixed(2) : 'N/A';
  const monthly = (data.monthly||[]).map(m=>`<tr><td>${m.month}</td><td style="text-align:right">${m.revenue.toFixed(2)}</td></tr>`).join('');
  // simple SVG bar chart for monthly revenue
  const months = data.monthly || [];
  const max = Math.max(...months.map(m=>m.revenue), 1);
  const svgBars = months.map((m,i)=>{
    const w = 14; const gap = 6;
    const h = Math.round((m.revenue / max) * 120);
    const x = i * (w + gap);
    const y = 140 - h;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3b82f6"></rect>`;
  }).join('');
  const labels = months.map((m,i)=>{
    const x = i * 20 + 7;
    return `<text x="${x}" y="155" font-size="10" text-anchor="middle">${m.month.split('-')[1]}</text>`;
  }).join('');

  return `
    <h3>Income Summary</h3>
    <p><strong>Total Revenue:</strong> $${total}</p>
    <p><strong>Outstanding Invoices:</strong> ${data.outstandingInvoices||0}</p>
    <div style="margin:8px 0">
      <svg width="${(months.length*(14+6))||200}" height="160" style="background:#fff;border:1px solid #eee;padding:4px">${svgBars}${labels}</svg>
    </div>
    <table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Month</th><th style="text-align:right">Revenue</th></tr></thead><tbody>${monthly}</tbody></table>
  `;
}

function renderTransactions(data){
  const tx = (data.transactions||[]);
  // simple client-side pagination
  const pageSize = 10;
  let page = 0;
  function renderPage(p){
    const start = p*pageSize;
    const slice = tx.slice(start, start+pageSize);
    const rows = slice.map(t=>`<tr><td>${t.id}</td><td>${t.type}</td><td style="text-align:right">${t.amount.toFixed(2)}</td><td>${t.currency}</td><td>${t.date}</td></tr>`).join('');
    return `
      <h3>Transactions</h3>
      <div style="margin-bottom:6px">Showing ${start+1} - ${Math.min(start+pageSize, tx.length)} of ${tx.length}</div>
      <table id="txTable" style="width:100%;border-collapse:collapse"><thead><tr><th>ID</th><th>Type</th><th style="text-align:right">Amount</th><th>Currency</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:8px"><button id="txPrev">Prev</button> <button id="txNext">Next</button></div>
    `;
  }
  // render initial
  setTimeout(()=>{
    const container = document.getElementById('summary');
    if(!container) return;
    let current = 0;
    container.innerHTML = renderPage(current);
    const prev = document.getElementById('txPrev');
    const next = document.getElementById('txNext');
    if(prev) prev.onclick = ()=>{ if(current>0){ current--; container.innerHTML = renderPage(current); }};
    if(next) next.onclick = ()=>{ if((current+1)*pageSize < tx.length){ current++; container.innerHTML = renderPage(current); }};
  }, 20);
  return `<div id="txContainer"></div>`;
}

function renderAudit(data){
  const rows = (data.recent||[]).map(a=>`<li><strong>${a.user}</strong> — ${a.action} <small>at ${a.at}</small></li>`).join('');
  return `<h3>Recent Audit Events</h3><ul>${rows}</ul>`;
}