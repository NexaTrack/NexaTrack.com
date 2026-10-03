const DEMO_TRACKING = "NEXA-482913";
const DEMO_EMAIL = "charityamadi625@gmail.com";

// Shipment schedule. The page calculates the current status from the visitor's
// live browser clock, so the tracking state changes automatically over time.
const SHIPMENT_SCHEDULE = [
  {
    key: "booked",
    label: "Shipment booked",
    location: "Kyiv, Ukraine",
    at: "2026-10-03T08:13:00+03:00",
    timezone: "Europe/Kyiv",
    progress: 8
  },
  {
    key: "picked",
    label: "Shipment picked up",
    location: "Kyiv, Ukraine",
    at: "2026-10-03T11:20:00+03:00",
    timezone: "Europe/Kyiv",
    progress: 20
  },
  {
    key: "departed",
    label: "Departed origin facility",
    location: "Kyiv, Ukraine",
    at: "2026-10-03T15:30:00+03:00",
    timezone: "Europe/Kyiv",
    progress: 32
  },
  {
    key: "export",
    label: "Export processing",
    location: "Kyiv, Ukraine",
    at: "2026-10-03T20:00:00+03:00",
    timezone: "Europe/Kyiv",
    progress: 43
  },
  {
    key: "customs",
    label: "Customs clearance processing",
    location: "Minsk, Belarus",
    at: "2026-10-04T10:00:00+03:00",
    timezone: "Europe/Minsk",
    progress: 55,
    stop: true
  },
  {
    key: "arrival",
    label: "Arrived at destination facility",
    location: "Minsk, Belarus",
    at: "2026-10-04T18:42:00+03:00",
    timezone: "Europe/Minsk",
    progress: 65,
    blocked: true
  },
  {
    key: "handoff",
    label: "Last-mile carrier handoff",
    location: "Minsk, Belarus",
    at: "2026-10-05T06:30:00+03:00",
    timezone: "Europe/Minsk",
    progress: 80,
    blocked: true
  },
  {
    key: "out",
    label: "Out for delivery",
    location: "Minsk, Belarus",
    at: "2026-10-05T08:00:00+03:00",
    timezone: "Europe/Minsk",
    progress: 91,
    blocked: true
  },
  {
    key: "delivered",
    label: "Delivered",
    location: "Minsk, Belarus",
    at: "2026-10-05T16:00:00+03:00",
    timezone: "Europe/Minsk",
    progress: 100,
    blocked: true
  }
];

const shipments = {
  [DEMO_TRACKING]: {
    carrier: "Nexa Logistics",
    service: "International Priority",
    pieces: "3 pieces",
    weight: "48.6 kg",
    destination: "Minsk, Belarus",
    destinationFull: "220034, Republic of Belarus, Minsk, Krasnozvezdnaya Street, 1",
    origin: "Kyiv, Ukraine",
    mid: "Minsk, Belarus",
    tracking: DEMO_TRACKING,
    shipmentDate: "October 3, 2026",
    eta: "Oct 5, 2026"
  }
};

function getShipment(){ return shipments[DEMO_TRACKING]; }
function getShipmentState(now = new Date()){
  const s=getShipment();
  const t=now.getTime();
  const stopEvent=SHIPMENT_SCHEDULE.find(e=>e.stop);
  const stopAt=Date.parse(stopEvent.at);
  const hasReachedStop=t>=stopAt;
  const effectiveNow=hasReachedStop ? new Date(stopAt) : now;
  const completed=SHIPMENT_SCHEDULE.filter(e=>!e.blocked && effectiveNow.getTime()>=Date.parse(e.at));
  let current=completed.length ? completed[completed.length-1] : null;
  let status=current ? (current.key==='customs' ? 'Customs clearance processing' : current.key==='export' ? 'Export processing' : current.key==='departed' ? 'In transit' : 'Processing') : 'Scheduled';
  let progress=current ? current.progress : 0;
  if(current && current.key!=='customs'){
    const next=SHIPMENT_SCHEDULE.find(e=>!e.blocked && Date.parse(e.at)>t);
    if(next){
      const a=Date.parse(current.at), b=Date.parse(next.at);
      const ratio=Math.min(1,Math.max(0,(t-a)/(b-a)));
      progress=Number((current.progress+(next.progress-current.progress)*ratio).toFixed(1));
    }
  }
  if(hasReachedStop){
    current=stopEvent;
    status='Customs clearance processing';
    progress=55;
  }
  const location=current ? current.location : s.origin;
  const last=current ? current.label : 'Shipment is scheduled for processing';
  const lastTime=current ? formatDateTime(current.at, current.timezone) : 'Scheduled · October 3, 2026 · 08:15';
  return { ...s, status, progress, location, last, lastTime, current, completed, first:Date.parse(SHIPMENT_SCHEDULE[0].at), finalEventAt:stopAt, now, stoppedAtCustoms:hasReachedStop };
}
function formatDateTime(value, timezone){
  const d=new Date(value);
  const parts=new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:timezone || 'Europe/Kyiv'}).formatToParts(d);
  const get=k=>parts.find(p=>p.type===k)?.value||'';
  return `${get('month')} ${get('day')}, ${get('year')} · ${get('hour')}:${get('minute')}`;
}
function formatLiveClock(d=new Date()){
  return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);
}
function relativeUpdate(value, now=new Date()){
  const diff=Math.max(0, now.getTime()-Date.parse(value));
  const mins=Math.floor(diff/60000), hrs=Math.floor(mins/60), days=Math.floor(hrs/24);
  if(days) return `${days}d ago`;
  if(hrs) return `${hrs}h ${mins%60}m ago`;
  if(mins) return `${mins}m ago`;
  return 'Just now';
}
function eventRows(state){
  return SHIPMENT_SCHEDULE.map(e=>{
    const t=state.now.getTime();
    const stopReached=state.stoppedAtCustoms;
    const done=!e.blocked && t>=Date.parse(e.at);
    const current=state.current && state.current.key===e.key;
    let time;
    let blocked=e.blocked && stopReached;
    if(done) time=formatDateTime(e.at, e.timezone);
    else if(blocked) time='On hold · Awaiting customs clearance';
    else time=`Estimated · ${formatDateTime(e.at, e.timezone)}`;
    return { ...e, done, current, blocked, time };
  });
}

function bootScreen(message = "NEXATRACK", duration = 650) {
  let screen = document.getElementById("bootScreen");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "bootScreen";
    screen.className = "boot-screen";
    screen.innerHTML = `<div class="boot-spinner" aria-label="Loading"><i></i><i></i><i></i><i></i></div>`;
    document.body.appendChild(screen);
  }
  screen.classList.remove("is-hidden");
  document.body.classList.add("is-booting");
  return new Promise(resolve => setTimeout(() => { screen.classList.add("is-hidden"); document.body.classList.remove("is-booting"); setTimeout(resolve, 120); }, duration));
}


function protectDashboard(){
  const content=document.getElementById("dashboardContent");
  const lock=document.getElementById("dashboardLock");
  if(!content || !lock) return true;
  const verified=sessionStorage.getItem("nexaTrackingVerified")==="1";
  if(!verified){
    content.hidden=true;
    lock.hidden=false;
    return false;
  }
  content.hidden=false;
  lock.hidden=true;
  return true;
}

function renderDashboard(){
  if(!document.getElementById("timeline")) return;
  if(!protectDashboard()) return;
  const s=getShipmentState();
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  set("dashTitle",s.tracking); set("dashSub",`${s.carrier} · ${s.service}`); set("dashStatus",s.status);
  set("dashEta",s.eta); set("dashLast",s.last); set("dashCarrier",s.carrier); set("dashOrigin",s.origin);
  set("dashMid",s.mid); set("dashDestination",s.destination); set("detailId",s.tracking); set("detailService",s.service);
  set("detailPieces",s.pieces); set("detailWeight",s.weight); set("detailDest",s.destination);
  const progress=document.getElementById("dashProgress");if(progress)progress.style.width=s.progress+"%";
  set("dashProgressText",s.progress+"%");
  const live=document.getElementById("dashLiveTime");if(live)live.textContent=`Live · ${formatLiveClock(s.now)}`;
  const timeline=document.getElementById("timeline");
  timeline.innerHTML=eventRows(s).map(e=>`<div class="event ${e.done?'done':''} ${e.current?'current':''} ${e.blocked?'blocked':''}"><time>${e.time}${e.current?' · Current':''}</time><strong>${e.label}</strong><p>${e.location}</p></div>`).join("");
}

function renderTrackingResult(){
  const result=document.getElementById("trackingResult");
  const timeline=document.getElementById("trackTimeline");
  if(!result || !timeline) return;
  const s=getShipmentState();
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  set("trackResultId",s.tracking); set("trackEta",s.eta); set("trackProgressText",s.progress+"%");
  set("trackShipmentDate",s.shipmentDate); set("trackLastUpdate",s.last); set("trackLastUpdateTime",s.lastTime);
  set("trackLastLocation",s.location); set("trackOrigin",s.origin); set("trackDestination",s.destination);
  set("trackDestinationFull",s.destinationFull); set("trackCarrier",s.carrier); set("trackService",s.service);
  set("trackStatus",s.status); set("trackStatusDetail",s.status==='Customs clearance processing'?'Shipment is being processed by customs':s.status==='Scheduled'?'Shipment is scheduled for processing':s.status==='Delivered'?'Shipment delivered successfully':'Shipment is moving toward destination');
  set("trackLiveTime",`Live · ${formatLiveClock(s.now)}`);
  const progress=document.getElementById("trackProgress");if(progress)progress.style.width=s.progress+"%";
  // Keep the compact progress summary synchronized with the detailed timeline.
  // The old version used generic Ordered/Confirmed/Shipped stages, which could
  // contradict the live shipment state (for example, 37.9% while Shipped was pending).
  const steps=document.querySelectorAll("#trackingResult .progress-step");
  const summaryEvents=[SHIPMENT_SCHEDULE[0], SHIPMENT_SCHEDULE[1], SHIPMENT_SCHEDULE[4], SHIPMENT_SCHEDULE[8]];
  steps.forEach((el,i)=>{
    const e=summaryEvents[i];
    if(!e) return;
    const done=!e.blocked && s.now.getTime()>=Date.parse(e.at);
    const blocked=e.blocked && s.stoppedAtCustoms;
    const current=s.current && s.current.key===e.key;
    el.classList.toggle('done',done);
    el.classList.toggle('current',current);
    el.classList.toggle('blocked',blocked);
    const icon=el.querySelector('span');if(icon)icon.textContent=done?'✓':blocked?'–':'○';
    const label=el.querySelector('b');if(label)label.textContent=e.key==='customs'?'Customs clearance':e.key==='picked'?'Picked up':e.label.replace('Shipment ','');
    const date=el.querySelector('small');if(date){ const dateText=formatDateTime(e.at,e.timezone).replace(/, \d{4} · \d{2}:\d{2}$/,''); date.textContent=(done||current)?dateText:'Est. '+dateText; }
  });
  timeline.innerHTML=eventRows(s).map(e=>`<div class="result-event ${e.done?'done':''} ${e.current?'current':''} ${e.blocked?'blocked':''}"><span class="result-event-dot">${e.done?'✓':e.blocked?'–':'○'}</span><div><strong>${e.label}</strong><small>${e.location}</small><time>${e.time}${e.current?' · Current':''}</time></div></div>`).join("");
}

function startLiveTracking(){
  if(!document.getElementById('trackingResult') && !document.getElementById('timeline')) return;
  setInterval(()=>{
    if(document.getElementById('trackingResult')?.hidden===false) renderTrackingResult();
    if(document.getElementById('timeline')) renderDashboard();
    const live=document.getElementById('globalLiveClock');
    if(live) live.textContent=formatLiveClock(new Date());
  },1000);
}

async function handleTracking(e){
  e.preventDefault();
  const form=e.target;
  const data=new FormData(form);
  const tracking=String(data.get("tracking")||"").trim().toUpperCase();
  const email=String(data.get("email")||"").trim().toLowerCase();
  const error=document.getElementById("trackingError");
  const result=document.getElementById("trackingResult");
  if(error) error.hidden=true;
  if(result) result.hidden=true;
  await bootScreen("VERIFYING SHIPMENT", 850);
  // Both values must match. No valid tracking detail is exposed by an invalid attempt.
  if(tracking !== DEMO_TRACKING || email !== DEMO_EMAIL){
    if(error){ error.hidden=false; error.textContent="We could not verify those shipment details. Please check your tracking information and try again."; }
    return;
  }
  sessionStorage.setItem("nexaTrackingVerified", "1");
  renderTrackingResult();
  if(result){ result.hidden=false; result.scrollIntoView({behavior:"smooth",block:"start"}); }
}

document.querySelectorAll(".track-form").forEach(f=>f.addEventListener("submit",handleTracking));

// Landing-page slideshow: automatic rotation every 3 seconds.
const slides=document.querySelectorAll(".hero-slide"), dots=document.querySelectorAll(".slider-dots button"), count=document.querySelector(".slide-count strong");
let current=0, timer;
function goSlide(n){if(!slides.length)return;current=n;slides.forEach((s,i)=>s.classList.toggle("is-active",i===n));dots.forEach((d,i)=>d.classList.toggle("is-active",i===n));if(count)count.textContent=String(n+1).padStart(2,"0");}
function startSlider(){clearInterval(timer);timer=setInterval(()=>goSlide((current+1)%slides.length),3000);}
dots.forEach(d=>d.addEventListener("click",()=>{clearInterval(timer);goSlide(Number(d.dataset.slide));startSlider();}));
startSlider();

document.querySelector(".nav-toggle")?.addEventListener("click",()=>document.querySelector(".nav-links")?.classList.toggle("mobile-open"));
renderDashboard();
startLiveTracking();

function openTawkChat(){
  let attempts=0;
  const tryOpen=()=>{
    if(window.Tawk_API && typeof window.Tawk_API.maximize === "function"){window.Tawk_API.maximize();return true;}
    if(window.Tawk_API && typeof window.Tawk_API.toggle === "function"){window.Tawk_API.toggle();return true;}
    return false;
  };
  if(tryOpen()) return;
  const wait=setInterval(()=>{attempts++;if(tryOpen()||attempts>=100)clearInterval(wait);},100);
}
window.openTawkChat=openTawkChat;

// Global boot animation for navigation, support actions and page-changing links.
document.addEventListener("click", async event=>{
  const control=event.target.closest("a,button");
  if(!control || control.closest(".slider-dots")) return;
  const href=(control.getAttribute("href")||"");
  const text=(control.textContent||"").trim().toLowerCase();
  const isChat=control.hasAttribute("data-open-chat") || href==="#chat" || /\b(contact|support|talk to (our )?team|live support|open live chat)\b/.test(text);
  const isInternal=control.tagName==="A" && href && !href.startsWith("#") && !href.startsWith("http") && !href.startsWith("mailto:") && !href.startsWith("tel:");
  if(isChat){
    event.preventDefault();
    await bootScreen("CONNECTING TO SUPPORT", 550);
    openTawkChat();
    return;
  }
  if(isInternal){
    event.preventDefault();
    await bootScreen("LOADING PAGE", 500);
    window.location.href=href;
  }
});

window.addEventListener("load",()=>bootScreen("NEXATRACK",650));


document.querySelectorAll("form:not(.track-form)").forEach(form=>{
  form.addEventListener("submit", async event=>{
    if(form.classList.contains("track-form")) return;
    if(form.getAttribute("action")) return;
    event.preventDefault();
    await bootScreen("PROCESSING REQUEST", 650);
    if(form.classList.contains("contact-form")){
      alert("Thanks — your message has been captured in this demo. Connect this form to your backend/email service for production.");
      form.reset();
    }
  });
});
