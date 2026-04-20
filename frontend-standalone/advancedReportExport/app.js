async function call(p){try{const r=await fetch(p);const text=await r.text();try{return JSON.parse(text)}catch(e){return text}}catch(e){return {error:e.message}}}

const out=document.getElementById('out');
const healthBtn=document.getElementById('health');
const callBtn=document.getElementById('call');
const pathInput=document.getElementById('path');

healthBtn.addEventListener('click',async()=>{out.textContent='...';const r=await call('/health');out.textContent=JSON.stringify(r,null,2)});
callBtn.addEventListener('click',async()=>{const p=pathInput.value.trim()||'/api/advancedReportExport';out.textContent='...';const r=await call(p);out.textContent=typeof r==='string'?r:JSON.stringify(r,null,2)});

// Auto-run health on load
(async()=>{healthBtn.click();})();
