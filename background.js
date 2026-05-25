const DEFAULTS = {
  enabled: true,
  pro: false,
  blockedSites: ["youtube.com", "instagram.com", "reddit.com", "x.com", "facebook.com", "netflix.com"],
  parentPin: "1234",
  childMode: false,
  dailyLimitMinutes: 120,
  focusMode: false,
  focusEnd: 0,
  sessionsCompleted: 0,
  today: new Date().toISOString().slice(0,10),
  stats: {},
  active: { tabId: null, url: "", domain: "", start: Date.now() }
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(null);
  await chrome.storage.local.set({ ...DEFAULTS, ...existing });
  chrome.alarms.create("tick", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tick") updateActiveTime();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await updateActiveTime();
  try {
    const tab = await chrome.tabs.get(tabId);
    await setActive(tabId, tab.url || "");
    await enforceBlock(tabId, tab.url || "");
  } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    await updateActiveTime();
    await setActive(tabId, tab.url || "");
    await enforceBlock(tabId, tab.url || "");
  }
});

chrome.idle.onStateChanged.addListener(async (state) => {
  if (state !== "active") await updateActiveTime(true);
});

async function getState(){ return { ...DEFAULTS, ...(await chrome.storage.local.get(null)) }; }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function domainOf(url){
  try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ""; }
}
function isBlocked(domain, sites){ return domain && sites.some(s => domain === s || domain.endsWith("."+s)); }

async function setActive(tabId, url){
  const domain = domainOf(url);
  await chrome.storage.local.set({ active: { tabId, url, domain, start: Date.now() } });
}

async function updateActiveTime(reset=false){
  const s = await getState();
  const key = todayKey();
  if (s.today !== key) {
    await chrome.storage.local.set({ today: key, stats: { ...s.stats, [key]: s.stats[key] || {} } });
  }
  const active = s.active || DEFAULTS.active;
  const domain = active.domain;
  if (!domain || domain.startsWith("chrome") || domain === "newtab") return;
  const elapsed = Math.max(0, Math.floor((Date.now() - (active.start || Date.now())) / 1000));
  if (elapsed > 0 && elapsed < 3600) {
    const stats = s.stats || {};
    stats[key] = stats[key] || {};
    stats[key][domain] = (stats[key][domain] || 0) + elapsed;
    await chrome.storage.local.set({ stats, active: { ...active, start: Date.now() } });
  }
  if (reset) await chrome.storage.local.set({ active: { ...active, start: Date.now() } });
}

async function enforceBlock(tabId, url){
  const s = await getState();
  if (!s.enabled) return;
  const domain = domainOf(url);
  const now = Date.now();
  const focusActive = s.focusMode && s.focusEnd > now;
  const shouldBlock = isBlocked(domain, s.blockedSites) || (focusActive && isBlocked(domain, s.blockedSites));
  if (shouldBlock && !url.includes(chrome.runtime.getURL("blocked.html"))) {
    const blockedUrl = chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(domain)}`);
    chrome.tabs.update(tabId, { url: blockedUrl });
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "GET_STATE") sendResponse(await getState());
    if (msg.type === "SET_STATE") { await chrome.storage.local.set(msg.patch); sendResponse({ ok:true }); }
    if (msg.type === "START_FOCUS") {
      const minutes = Number(msg.minutes || 25);
      await chrome.storage.local.set({ focusMode:true, focusEnd: Date.now()+minutes*60*1000 });
      chrome.notifications.create({ type:"basic", iconUrl:"icons/icon128.png", title:"FocusGuard started", message:`Focus mode is on for ${minutes} minutes.` });
      sendResponse({ ok:true });
    }
    if (msg.type === "STOP_FOCUS") { await chrome.storage.local.set({ focusMode:false, focusEnd:0 }); sendResponse({ ok:true }); }
    if (msg.type === "ADD_SITE") {
      const s = await getState();
      const site = String(msg.site || "").replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].trim();
      if(site && !s.blockedSites.includes(site)) await chrome.storage.local.set({ blockedSites:[...s.blockedSites, site] });
      sendResponse({ ok:true });
    }
    if (msg.type === "REMOVE_SITE") {
      const s = await getState();
      await chrome.storage.local.set({ blockedSites:s.blockedSites.filter(x=>x!==msg.site) });
      sendResponse({ ok:true });
    }
  })();
  return true;
});
