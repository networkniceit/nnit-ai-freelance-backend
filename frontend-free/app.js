(function(){
  const messages = (v)=>{document.getElementById('messages').textContent = typeof v === 'string' ? v : JSON.stringify(v,null,2)};
  const $ = (id)=>document.getElementById(id);
  let token = null;

  async function login(){
    const email = $('email').value; const password = $('password').value;
    messages('Logging in...');
    const res = await window.apiRequest('POST','/auth/login',{ email, password });
    if(res.status===200 && res.body && res.body.token){ token = res.body.token; messages('Login ok. Token stored.'); }
    else messages(res.body || res);
  }

  async function register(){
    const email = $('email').value; const password = $('password').value;
    messages('Registering...');
    const res = await window.apiRequest('POST','/auth/register',{ email, password, name: email.split('@')[0] });
    messages(res.body || res);
  }

  async function profile(){
    if(!token) return messages('No token — please login');
    const res = await window.apiRequest('GET','/auth/profile',null,token);
    messages(res.body || res);
  }

  async function notifs(){
    if(!token) return messages('No token — please login');
    const res = await window.notificationsAPI.getAll(token);
    messages(res.body || res);
  }

  async function audit(){
    if(!token) return messages('No token — please login');
    const res = await window.apiRequest('GET','/audit-log',null,token);
    messages(res.body || res);
  }

  // Wire buttons
  document.addEventListener('DOMContentLoaded', ()=>{
    $('btn-login').addEventListener('click', login);
    $('btn-register').addEventListener('click', register);
    $('btn-profile').addEventListener('click', profile);
    $('btn-notifs').addEventListener('click', notifs);
    $('btn-audit').addEventListener('click', audit);
  });
})();
