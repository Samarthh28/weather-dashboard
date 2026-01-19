// ====== CONFIG ======
const API_KEY ="Your API KEY".trim(); // <-- इथे तुमची OpenWeather key टाका
const BASE = "https://api.openweathermap.org/data/2.5";

// ====== ELEMENTS ======
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const unitBtn = document.getElementById("unitBtn");

const statusBox = document.getElementById("status");
const currentEl = document.getElementById("current");
const forecastEl = document.getElementById("forecast");

const historyEl = document.getElementById("history");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// ====== STATE ======
let unit = "C"; // "C" or "F"
let lastMode = { type: "city", value: "" }; // remember last search to re-render on toggle
let history = JSON.parse(localStorage.getItem("cities")) || [];

// ====== HELPERS ======
function showStatus(msg, isError=false){
  statusBox.textContent = msg;
  statusBox.classList.remove("hidden");
  statusBox.style.borderColor = isError ? "rgba(239,68,68,.65)" : "rgba(255,255,255,.18)";
}
function hideStatus(){ statusBox.classList.add("hidden"); }

function kToC(k){ return Math.round(k - 273.15); }
function cToF(c){ return Math.round((c * 9/5) + 32); }
function formatTempFromK(k){
  const c = kToC(k);
  return unit === "C" ? `${c}°C` : `${cToF(c)}°F`;
}

function setBackgroundByWeather(main){
  const cls = (main || "").toLowerCase();
  // reset all known classes
  document.body.className = "";
  // apply (keep only one)
  document.body.classList.add(cls || "clear");
}

function saveCity(city){
  const clean = city.trim();
  if(!clean) return;
  history = history.filter(c => c.toLowerCase() !== clean.toLowerCase());
  history.unshift(clean);
  history = history.slice(0, 6);
  localStorage.setItem("cities", JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  historyEl.innerHTML = "";
  if(history.length === 0){
    historyEl.innerHTML = `<div style="opacity:.8">No recent searches yet.</div>`;
    return;
  }
  history.forEach(city => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = city;
    chip.addEventListener("click", () => {
      cityInput.value = city;
      searchCity();
    });
    historyEl.appendChild(chip);
  });
}

// ====== API CALLS ======
async function fetchJson(url){
  const res = await fetch(url);
  if(!res.ok){
    let msg = `API error (${res.status})`;
    try{
      const data = await res.json();
      if(data?.message) msg = data.message;
    }catch(_){}
    throw new Error(msg);
  }
  return res.json();
}

function urlWeatherByCity(city){
  return `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(API_KEY)}`;
}
function urlForecastByCity(city){
  return `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${encodeURIComponent(API_KEY)}`;
}
function urlWeatherByCoords(lat, lon){
  return `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(API_KEY)}`;
}
function urlForecastByCoords(lat, lon){
  return `${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(API_KEY)}`;
}

// ====== RENDER ======
function renderCurrent(data){
  const icon = data.weather?.[0]?.icon;
  const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : "";

  const main = data.weather?.[0]?.main || "Clear";
  const desc = data.weather?.[0]?.description || "—";
  const city = `${data.name}, ${data.sys?.country ?? ""}`.trim();

  const temp = formatTempFromK(data.main.temp);
  const feels = formatTempFromK(data.main.feels_like);

  const hum = data.main.humidity;
  const wind = Math.round(data.wind.speed);

  setBackgroundByWeather(main);

  currentEl.innerHTML = `
    <div class="left">
      ${iconUrl ? `<img src="${iconUrl}" alt="icon" />` : ""}
      <div class="big">${temp}</div>
    </div>
    <div class="meta">
      <div><b>${city}</b></div>
      <div style="text-transform:capitalize">${desc}</div>
      <div>Feels like: ${feels}</div>
      <div>Humidity: ${hum}%</div>
      <div>Wind: ${wind} m/s</div>
    </div>
  `;
}

function pickOnePerDay(list){
  // pick closest to 12:00 for each day (forecast is 3-hour steps)
  const byDate = new Map();
  for(const item of list){
    const dt = new Date(item.dt * 1000);
    const dateKey = dt.toISOString().slice(0,10);
    const hour = dt.getUTCHours();
    const score = Math.abs(hour - 12);

    if(!byDate.has(dateKey) || score < byDate.get(dateKey).score){
      byDate.set(dateKey, { item, score });
    }
  }
  return Array.from(byDate.values()).map(v => v.item).slice(0,5);
}

function renderForecast(data){
  forecastEl.innerHTML = "";
  const picked = pickOnePerDay(data.list);

  picked.forEach(f => {
    const dt = new Date(f.dt * 1000);
    const day = dt.toDateString().slice(0,10);

    const icon = f.weather?.[0]?.icon;
    const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}.png` : "";

    const temp = formatTempFromK(f.main.temp);
    const min = formatTempFromK(f.main.temp_min);
    const max = formatTempFromK(f.main.temp_max);
    const desc = f.weather?.[0]?.description ?? "—";

    const div = document.createElement("div");
    div.className = "fitem";
    div.innerHTML = `
      <div class="day">${day}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        ${iconUrl ? `<img src="${iconUrl}" alt="i" width="28" height="28"/>` : ""}
        <div class="t">${temp}</div>
      </div>
      <div class="d" style="text-transform:capitalize">${desc}</div>
      <div class="d">Min: ${min} | Max: ${max}</div>
    `;
    forecastEl.appendChild(div);
  });
}

// ====== ACTIONS ======
async function searchCity(){
  const city = cityInput.value.trim();
  if(!city) return showStatus("Enter a city name.", true);

  try{
    hideStatus();
    showStatus("Loading...");

    const [cur, fore] = await Promise.all([
      fetchJson(urlWeatherByCity(city)),
      fetchJson(urlForecastByCity(city))
    ]);

    renderCurrent(cur);
    renderForecast(fore);

    saveCity(city);
    lastMode = { type: "city", value: city };

    showStatus("Done ✅");
    setTimeout(hideStatus, 900);
  }catch(err){
    showStatus(`${err.message} (Check city / API key)`, true);
  }
}

async function useMyLocation(){
  if(!navigator.geolocation){
    return showStatus("Geolocation not supported in this browser.", true);
  }

  showStatus("Getting your location...");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try{
      const { latitude, longitude } = pos.coords;

      const [cur, fore] = await Promise.all([
        fetchJson(urlWeatherByCoords(latitude, longitude)),
        fetchJson(urlForecastByCoords(latitude, longitude))
      ]);

      renderCurrent(cur);
      renderForecast(fore);

      lastMode = { type: "coords", value: { lat: latitude, lon: longitude } };

      showStatus("Done ✅");
      setTimeout(hideStatus, 900);
    }catch(err){
      showStatus(err.message, true);
    }
  }, () => {
    showStatus("Location permission denied / error.", true);
  }, { enableHighAccuracy: true, timeout: 10000 });
}

function refreshLast(){
  if(lastMode.type === "city" && lastMode.value){
    cityInput.value = lastMode.value;
    searchCity();
  }else if(lastMode.type === "coords" && lastMode.value){
    useMyLocation();
  }
}

// ====== EVENTS ======
searchBtn.addEventListener("click", searchCity);
geoBtn.addEventListener("click", useMyLocation);

cityInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") searchCity();
});

unitBtn.addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  unitBtn.innerText = unit === "C" ? "°F" : "°C";
  refreshLast();
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("cities");
  renderHistory();
});

// ====== INIT ======
renderHistory();
showStatus("Tip: Search a city like Pune, Mumbai, Delhi");
setTimeout(hideStatus, 2000);
