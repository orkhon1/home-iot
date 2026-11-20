// ===== ТОХИРГОО =====
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz3dFCoEIVP0IPixLuil37XjgVEpHa2KI_1D23g8AT5WcnTJZu8aiQuKcipS8OolW7Q/exec";
const REFRESH_MS = 4000;
const MAX_POINTS = 60;
// =====================

const $ = id => document.getElementById(id);
const hist = {temp:[], humidity:[], sound:[], air:[]};

function pick(o, keys){
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
  return null;
}

function drawChart(canvas, series){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w*dpr; canvas.height = h*dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  const line = cs.getPropertyValue("--line").trim();
  const muted = cs.getPropertyValue("--muted").trim();
  const pad = {l:36,r:8,t:8,b:18};
  const all = series.flatMap(s => s.data.filter(v => v !== null));
  if (!all.length){ return; }
  let min = Math.min(...all), max = Math.max(...all);
  if (min === max){ min -= 1; max += 1; }
  const range = max - min; min -= range*0.1; max += range*0.1;
  ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.font = "11px system-ui"; ctx.lineWidth = 1;
  for (let i=0;i<=4;i++){
    const y = pad.t + (h-pad.t-pad.b)*i/4;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    ctx.fillText((max-(max-min)*i/4).toFixed(max-min>20?0:1), 2, y+4);
  }
  series.forEach(s => {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath();
    let started = false;
    s.data.forEach((v,i) => {
      if (v === null) return;
      const x = pad.l + (w-pad.l-pad.r) * (s.data.length>1 ? i/(MAX_POINTS-1) : 0);
      const y = pad.t + (h-pad.t-pad.b) * (1-(v-min)/(max-min));
      if (!started){ ctx.moveTo(x,y); started = true; } else ctx.lineTo(x,y);
    });
    ctx.stroke();
  });
}

function render(){
  drawChart($("c1"), [
    {data:hist.temp, color:"#ef4444"},
    {data:hist.humidity, color:"#3b82f6"}
  ]);
  drawChart($("c2"), [
    {data:hist.sound, color:"#f59e0b"},
    {data:hist.air, color:"#10b981"}
  ]);
}

function push(key, v){
  hist[key].push(v === null ? null : Number(v));
  if (hist[key].length > MAX_POINTS) hist[key].shift();
}

function airText(v){
  if (v === null) return "0 – 4095";
  return v < 1500 ? "Сайн" : v < 2500 ? "Дунд" : "Муу";
}

async function load(){
  try{
    const r = await fetch(SCRIPT_URL, {redirect:"follow"});
    const d = await r.json();

    const temp = pick(d, ["temp","temperature"]);
    const hum  = pick(d, ["humidity","hum"]);
    const snd  = pick(d, ["sound"]);
    const air  = pick(d, ["air"]);

    $("temp").textContent  = temp !== null ? Number(temp).toFixed(1) : "--";
    $("hum").textContent   = hum  !== null ? Number(hum).toFixed(0)  : "--";
    $("sound").textContent = snd  !== null ? snd : "--";
    $("air").textContent   = air  !== null ? air : "--";
    $("airNote").textContent = airText(air !== null ? Number(air) : null);

    push("temp", temp); push("humidity", hum); push("sound", snd); push("air", air);
    render();

    $("dot").classList.add("on");
    $("st").textContent = "Холбогдсон";
    $("upd").textContent = new Date().toLocaleTimeString();
  }catch(e){
    $("dot").classList.remove("on");
    $("st").textContent = "Алдаа: өгөгдөл авч чадсангүй";
    console.error(e);
  }
}

const oledForm = $("oled-form");
const oledInput = $("oled-input");
const oledStatus = $("oled-status");
const oledButton = oledForm.querySelector("button");

oledForm.addEventListener("submit", async event => {
  event.preventDefault();
  const message = oledInput.value.trim();
  if (!message || oledButton.disabled) return;

  oledButton.disabled = true;
  oledStatus.textContent = "Илгээж байна…";
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams({action: "setOledMessage", lcdMsg: message})
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    if (result.ok !== true || result.lcdMsg !== message) {
      throw new Error("OLED message was not acknowledged");
    }

    if (oledInput.value.trim() === message) oledInput.value = "";
    oledStatus.textContent = "Мессеж серверт хадгалагдлаа.";
    void load();
  } catch (error) {
    oledStatus.textContent = "Мессеж хадгалагдсан эсэхийг баталгаажуулж чадсангүй.";
    console.error(error);
  } finally {
    oledButton.disabled = false;
  }
});

window.addEventListener("resize", render);
load();
setInterval(load, REFRESH_MS);
