const $ = id => document.getElementById(id);
const send = msg => chrome.runtime.sendMessage(msg);
function fmt(sec){ const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
function score(total, blockedCount){ return Math.max(0, Math.min(100, 100 - Math.floor(total/900) - blockedCount*2)); }
async function load(){
  const s = await send({type:"GET_STATE"});
  $("enabled").checked = s.enabled;
  const today = new Date().toISOString().slice(0,10);
  const day = s.stats?.[today] || {};
  const total = Object.values(day).reduce((a,b)=>a+b,0);
  $("hours").textContent = fmt(total);
  $("blocked").textContent = s.blockedSites.length;
  $("score").textContent = `Score ${score(total, s.blockedSites.length)}`;
  $("sites").innerHTML = s.blockedSites.map(site => `<div class="site"><div><b>${site}</b><br><small>Blocked</small></div><button data-site="${site}" class="btn secondary remove">Remove</button></div>`).join("");
  document.querySelectorAll('.remove').forEach(b=>b.onclick=async()=>{await send({type:'REMOVE_SITE', site:b.dataset.site}); load();});
  tickTimer(s);
}
function tickTimer(s){
  const end = s.focusEnd || 0;
  const left = Math.max(0, Math.floor((end-Date.now())/1000));
  const m = String(Math.floor(left/60)).padStart(2,'0'), sec=String(left%60).padStart(2,'0');
  $("timer").textContent = left ? `${m}:${sec}` : "25:00";
}
$("enabled").onchange = async e => { await send({type:"SET_STATE", patch:{enabled:e.target.checked}}); load(); };
$("start25").onclick = async()=>{ await send({type:"START_FOCUS", minutes:25}); load(); };
$("stop").onclick = async()=>{ await send({type:"STOP_FOCUS"}); load(); };
$("dashboard").onclick = ()=> chrome.runtime.openOptionsPage();
$("addSite").onclick = async()=>{ await send({type:"ADD_SITE", site:$("newSite").value}); $("newSite").value=""; load(); };
load(); setInterval(load, 30000);
