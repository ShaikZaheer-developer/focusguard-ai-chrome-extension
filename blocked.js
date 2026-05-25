const quotes=["Discipline is choosing what you want most over what you want now.","One focused hour beats ten distracted hours.","You do not need more time. You need fewer leaks.","Your attention is your most expensive asset.","Close the loop. Finish the task."];
const site=new URLSearchParams(location.search).get('site')||'this site';
document.getElementById('msg').textContent=`${site} is blocked by FocusGuard.`;
document.getElementById('quote').textContent=quotes[Math.floor(Math.random()*quotes.length)];
document.getElementById('work').onclick=()=>chrome.runtime.openOptionsPage();
document.getElementById('back').onclick=()=>history.back();
