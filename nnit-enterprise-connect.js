/* NNIT_ACCOUNT_LINK_V1: tokens only through origin-checked window messages and HTTPS bodies. */
(() => {
  if (location.hash !== '#nnit-enterprise-connect' || !window.opener) return;
  const origins = ['http://127.0.0.1:5173','http://localhost:5173','https://nnit-enterprise-production.up.railway.app'];
  const box = document.createElement('section');
  box.style.cssText='position:relative;z-index:5;margin:24px;padding:24px;border:2px solid #00c6ff;background:#071520;color:white;border-radius:12px';
  const title=document.createElement('h2'); title.textContent='Connect your NNIT accounts';
  const status=document.createElement('p'); status.textContent='Waiting for your signed-in Enterprise page…';
  const button=document.createElement('button');button.textContent='Confirm link to my signed-in Freelancer account';button.hidden=true;
  box.append(title,status,button);document.body.prepend(box);
  let received=false, enterpriseToken=null, origin=null, nonce=null;
  const request=async(path,body,auth) => {
    const headers={'Content-Type':'application/json'};
    if(auth)headers.Authorization='Bearer '+auth;
    const r=await fetch('/api/enterprise-link/'+path,{method:'POST',headers,body:JSON.stringify(body),redirect:'error'});
    const data=await r.json(); return data;
  };
  const notify=message=>{if(window.opener&&!window.opener.closed)window.opener.postMessage({type:'NNIT_LINK_RESULT',nonce,message},origin);};
  async function exchange() {
    const data=await request('session',{enterpriseToken});
    if(data.success&&typeof data.token==='string') {
      localStorage.setItem('nnit_token',data.token);
      enterpriseToken=null;notify('Connected to your existing Freelancer account.');
      location.replace(location.pathname+location.search);return;
    }
    if(data.code!=='LINK_REQUIRED')throw new Error(data.message||'Connection failed.');
    status.textContent='First link: sign in to your existing Freelancer account on this page, then confirm below. Existing projects and applications stay with that account.';
    button.hidden=false;
  }
  window.addEventListener('message',async event=>{
    if(received||event.source!==window.opener||!origins.includes(event.origin)||event.data?.type!=='NNIT_ENTERPRISE_SESSION')return;
    if(typeof event.data.token!=='string'||event.data.token.length>16384||typeof event.data.nonce!=='string')return;
    received=true;enterpriseToken=event.data.token;origin=event.origin;nonce=event.data.nonce;
    try { await exchange(); } catch(error) {status.textContent=error.message;enterpriseToken=null;}
  });
  button.addEventListener('click',async()=>{
    if(!enterpriseToken)return;
    const current=localStorage.getItem('nnit_token');
    if(!current){status.textContent='Sign in using Login first, then click Confirm link.';return;}
    button.disabled=true;
    try {
      const profile=await fetch('/api/auth/profile',{headers:{Authorization:'Bearer '+current},redirect:'error'});
      const result=await profile.json();
      if(!profile.ok||!result.success)throw new Error('Sign in to your existing Freelancer account first.');
      if(!window.confirm('Link Enterprise to Freelancer account '+result.user.email+'? Your existing records will stay with this account.'))return;
      const linked=await request('link',{enterpriseToken},current);
      if(!linked.success)throw new Error(linked.message||'Link failed.');
      await exchange();
    } catch(error){status.textContent=error.message;} finally {button.disabled=false;}
  });
  for(const allowed of origins)window.opener.postMessage({type:'NNIT_LINK_READY'},allowed);
  setTimeout(()=>{enterpriseToken=null;button.disabled=true;if(location.hash==='#nnit-enterprise-connect')status.textContent='Connection window expired. Open Connect from Enterprise again.';},300000);
})();
