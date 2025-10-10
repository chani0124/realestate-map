// =========================
// 환경설정 (여기만 손보시면 됩니다)
// =========================
const CONFIG = {
  BRAND_NAME: "HimKong",
  STORAGE: "local",          // "local" | "supabase"
  SUPABASE_URL: "",          // 예: https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "",     // Supabase 프로젝트 anon key
  TABLE: "properties"        // Supabase 테이블명
};

// 상태 뱃지
const storageBadge = document.getElementById("storageBadge");
storageBadge.textContent = CONFIG.STORAGE === "supabase" ? "서버저장: Supabase" : "로컬저장: 브라우저";

// =========================
// 지도 초기화 (Leaflet + OSM)
// =========================
let map = L.map("map").setView([37.5665, 126.9780], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const markerGroup = L.markerClusterGroup();
map.addLayer(markerGroup);

// =========================
// 주소 → 좌표 (Nominatim)
// =========================
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "ko" } });
  const arr = await res.json();
  if (!arr || arr.length === 0) return null;
  return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
}

// 주소 검색 모달 (키워드 결과 리스트)
async function searchAddresses(keyword) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(keyword)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "ko" } });
  const arr = await res.json();
  return arr.map(d => ({ display: d.display_name, lat: +d.lat, lng: +d.lon }));
}

// =========================
// 데이터 저장소 (local ↔ supabase)
// =========================
let supabase = null;
if (CONFIG.STORAGE === "supabase") {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    alert("Supabase URL / ANON KEY가 비어 있어 로컬 저장으로 동작합니다.");
    CONFIG.STORAGE = "local";
    storageBadge.textContent = "로컬저장: 브라우저";
  } else {
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
}

// CRUD 추상화
async function db_list() {
  if (CONFIG.STORAGE === "supabase") {
    const { data, error } = await supabase.from(CONFIG.TABLE).select("*").order("id", { ascending: false });
    if (error) { console.error(error); alert("서버 목록 로드 실패"); return []; }
    return data;
  } else {
    return JSON.parse(localStorage.getItem("properties") || "[]");
  }
}
async function db_insert(obj) {
  if (CONFIG.STORAGE === "supabase") {
    const { data, error } = await supabase.from(CONFIG.TABLE).insert(obj).select().single();
    if (error) { console.error(error); alert("서버 저장 실패"); return null; }
    return data;
  } else {
    const arr = await db_list();
    obj.id = Date.now();
    arr.unshift(obj);
    localStorage.setItem("properties", JSON.stringify(arr));
    return obj;
  }
}
async function db_delete(id) {
  if (CONFIG.STORAGE === "supabase") {
    const { error } = await supabase.from(CONFIG.TABLE).delete().eq("id", id);
    if (error) { console.error(error); alert("삭제 실패"); }
  } else {
    const arr = await db_list();
    const next = arr.filter(p => p.id !== id);
    localStorage.setItem("properties", JSON.stringify(next));
  }
}
async function db_clear() {
  if (CONFIG.STORAGE === "supabase") {
    const { error } = await supabase.from(CONFIG.TABLE).delete().neq("id", null);
    if (error) { console.error(error); alert("전체 삭제 실패"); }
  } else {
    localStorage.removeItem("properties");
  }
}

// =========================
// 렌더링
// =========================
let properties = [];
const listEl = document.getElementById("propertyList");

function propertyCard(p) {
  const price = p.dealType === "월세" ? `${fmt(p.price)} / ${fmt(p.monthly)}` : `${fmt(p.price)}${p.dealType === "매매" ? "" : ""}`;
  return `
    <div class="property-item" data-id="${p.id}">
      <div class="title">${p.type} <span class="text-slate-400">|</span> ${p.dealType}</div>
      <div class="meta mt-1">
        💰 ${price || "-"}<br/>
        📍 ${p.address}<br/>
        <span class="text-xs text-slate-500">면적 ${p.area || "-"}㎡ · 층수 ${p.floor || "-"} · 관리비 ${p.maintenance || "-"}</span>
      </div>
      <div class="actions">
        <button class="btn text-slate-700 bg-slate-100 hover:bg-slate-200" data-action="focus">지도이동</button>
        <button class="btn text-rose-700 bg-rose-50 hover:bg-rose-100" data-action="remove">삭제</button>
      </div>
    </div>
  `;
}
function fmt(v){ if(v==null||v==='') return ''; return Number(v).toLocaleString(); }

function bindCardEvents(card, p) {
  card.querySelector('[data-action="focus"]').addEventListener("click", () => {
    map.setView([p.lat, p.lng], 17);
  });
  card.querySelector('[data-action="remove"]').addEventListener("click", async () => {
    if (!confirm("해당 매물을 삭제하시겠습니까?")) return;
    await db_delete(p.id);
    await refresh();
  });
}

function drawMarkers(items){
  markerGroup.clearLayers();
  items.forEach(p=>{
    const marker = L.marker([p.lat, p.lng]).bindPopup(
      `<b>${p.type}</b> | ${p.dealType}<br/>💰 ${p.price || ""} ${p.dealType==="월세" ? "/ "+(p.monthly||""):""}<br/>📍 ${p.address}`
    );
    markerGroup.addLayer(marker);
  });
}

async function refresh(filterType="전체") {
  properties = await db_list();
  const show = properties.filter(p => filterType === "전체" || p.type === filterType);

  // 목록
  listEl.innerHTML = show.map(propertyCard).join("");
  listEl.querySelectorAll(".property-item").forEach((el, i)=>{
    bindCardEvents(el, show[i]);
  });

  // 마커
  drawMarkers(show);
}

// =========================
// 필터 버튼
// =========================
document.querySelectorAll(".category-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".category-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    refresh(btn.dataset.type);
  });
});

// =========================
// 모달 열고 닫기 + Enter 방지
// =========================
const formLayer = document.getElementById("propertyFormLayer");
document.getElementById("openFormBtn").addEventListener("click", ()=>{
  formLayer.style.display = "flex";
});
document.getElementById("closeFormBtn").addEventListener("click", ()=>{
  formLayer.style.display = "none";
});
document.getElementById("propertyForm").addEventListener("keydown", e=>{
  if (e.key === "Enter") e.preventDefault();
});

// =========================
// 주소검색 모달 (Nominatim)
// =========================
const addressLayer = document.getElementById("addressSearchLayer");
document.getElementById("openAddressSearch").addEventListener("click", ()=>{
  addressLayer.style.display = "flex";
  document.getElementById("addressKeyword").focus();
});
document
