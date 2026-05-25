const $=id=>document.getElementById(id); const send=msg=>chrome.runtime.sendMessage(msg);
function fmt(sec){const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h}h ${m}m`:`${m}m`;}
function focusScore(total, blocked){return Math.max(1,Math.min(100,100-Math.floor(total/1200)-blocked));}
function report(score,total,top){
 if(score>=80) return `Excellent focus week. Your browsing pattern is controlled. Keep using Pomodoro blocks and protect your first 2 morning hours from ${top||'distraction sites'}.`;
 if(score>=55) return `Moderate focus. Your biggest leak is ${top||'unplanned browsing'}. Set a hard limit, start with 25-minute sessions, and block entertainment during study/work hours.`;
 return `High distraction risk. Your attention is being fragmented. Keep only essential sites open, use 50-minute deep-work blocks, and review your top site every night.`;
}
async function load(){
 const s=await send({type:'GET_STATE'}); const today=new Date().toISOString().slice(0,10); const day=s.stats?.[today]||{}; const entries=Object.entries(day).sort((a,b)=>b[1]-a[1]); const total=entries.reduce((a,[,v])=>a+v,0); const top=entries[0]?.[0]||'-'; const score=focusScore(total,s.blockedSites.length);
 $('totalTime').textContent=fmt(total); $('topSite').textContent=top; $('limit').textContent=`${s.dailyLimitMinutes}m`; $('mode').textContent=s.focusMode && s.focusEnd>Date.now()?'On':'Off'; $('dashScore').textContent=score; $('aiReport').textContent=report(score,total,top);
 $('usageRows').innerHTML=entries.length?entries.map(([site,sec])=>`<tr><td>${site}</td><td>${fmt(sec)}</td><td><div class="bar"><i style="width:${Math.min(100,sec/Math.max(1,total)*100)}%"></i></div></td></tr>`).join(''):'<tr><td colspan="3" class="muted">No browsing data yet. Open a few websites and come back.</td></tr>';
 $('blockedList').innerHTML=s.blockedSites.map(site=>`<div class="site"><b>${site}</b><button class="btn secondary remove" data-site="${site}">Remove</button></div>`).join(''); document.querySelectorAll('.remove').forEach(b=>b.onclick=async()=>{await send({type:'REMOVE_SITE',site:b.dataset.site});load();});
 $('dailyLimit').value=s.dailyLimitMinutes; $('pin').value=s.parentPin; $('childMode').checked=s.childMode;
}
$('add').onclick=async()=>{await send({type:'ADD_SITE',site:$('siteInput').value});$('siteInput').value='';load();};
$('saveParent').onclick=async()=>{await send({type:'SET_STATE',patch:{dailyLimitMinutes:Number($('dailyLimit').value||120),parentPin:$('pin').value||'1234',childMode:$('childMode').checked}});load();};
$('start50').onclick=async()=>{await send({type:'START_FOCUS',minutes:50});load();};
$('resetToday').onclick=async()=>{const s=await send({type:'GET_STATE'});const today=new Date().toISOString().slice(0,10);const stats=s.stats||{};stats[today]={};await send({type:'SET_STATE',patch:{stats}});load();};
$('copyReport').onclick=async()=>navigator.clipboard.writeText($('aiReport').textContent);
load();
