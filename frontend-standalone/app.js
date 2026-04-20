(function(){
  const out = v=>{document.getElementById('output').textContent = typeof v==='string'?v:JSON.stringify(v,null,2)};
  const $=(id)=>document.getElementById(id);
  let token = null;

  async function register(){
    const email=$('email').value; const password=$('password').value;
    out('Registering...');
    const res = await window.standaloneApi.request('POST','/auth/register',{ email, password });
    out(res);
  }
  async function login(){
    const email=$('email').value; const password=$('password').value;
    out('Logging in...');
    const res = await window.standaloneApi.request('POST','/auth/login',{ email, password });
    if(res && res.status===200 && res.data && res.data.token){ token = res.data.token; out('Login OK — token stored in-memory'); }
    else out(res);
  }
  async function profile(){
    if(!token) return out('No token — login first');
    const res = await window.standaloneApi.request('GET','/auth/profile',null,token);
    out(res);
  }
  async function logout(){ token=null; out('Token cleared'); }

  async function notifs(){ if(!token) return out('No token'); const res = await window.standaloneApi.notificationsAPI.getAll(token); out(res); }
  async function audit(){ if(!token) return out('No token'); const res = await window.standaloneApi.request('GET','/audit-log',null,token); out(res); }

  async function listJobs(){ const res = await window.standaloneApi.request('GET','/jobs'); out(res); }
  async function applyFirst(){ out('Apply stub — implement per your API'); }

  document.addEventListener('DOMContentLoaded', ()=>{
    $('btn-register').addEventListener('click', register);
    $('btn-login').addEventListener('click', login);
    $('btn-profile').addEventListener('click', profile);
    $('btn-logout').addEventListener('click', logout);
    $('btn-notifs').addEventListener('click', notifs);
    $('btn-audit').addEventListener('click', audit);
    $('btn-jobs').addEventListener('click', listJobs);
    $('btn-apply').addEventListener('click', applyFirst);
  });
})();