// ===== 기본 요소 =====
const openFormBtn = document.getElementById("openFormBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const propertyFormLayer = document.getElementById("propertyFormLayer");
const propertyForm = document.getElementById("propertyForm");
const propertyList = document.getElementById("propertyList");

// 레이어 열기/닫기
openFormBtn.addEventListener("click", () => {
  propertyFormLayer.classList.remove("hidden");
  propertyFormLayer.classList.add("flex");
});
closeFormBtn.addEventListener("click", () => {
  propertyFormLayer.classList.add("hidden");
  propertyFormLayer.classList.remove("flex");
});

// ===== Leaflet 지도 =====
let map, cluster, properties = [];

function initMap() {
  // 서울시청 기준
  map = L.map('map', {
    center: [37.5665, 126.9780],
    zoom: 13,
    zoomControl: true
  });

  // OSM 타일
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 숫자 클러스터
  cluster = L.markerClusterGroup({ spiderfyOnEveryZoom: true });
  map.addLayer(cluster);

  // 샘플 하나
  addProperty({
    address: "서울특별시 중구 태평로1가 31",
    type: "오피스텔",
    dealType: "월세",
    price: "1000",
    monthly: "80",
    area: "33",
    floor: "11",
    maintenance: "12",
    memo: "샘플 매물",
    moveCenter: false,
    silent: true,
  });
}
window.addEventListener("load", initMap);

// ===== 지오코딩 (Nominatim; 키 불필요) =====
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=0`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'ko' }
  });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// ===== 리스트 카드 UI =====
function addListCard(item) {
  const card = document.createElement("div");
  card.className = "border rounded p-3 hover:bg-gray-50 cursor-pointer flex flex-col gap-1";
  card.innerHTML = `
    <div class="font-semibold">${item.type} | ${item.dealType} | ${item.price || "-"}${item.monthly ? ` / ${item.monthly}` : ""}</div>
    <div class="text-xs text-gray-500">${item.address}</div>
    <div class="text-xs text-gray-500">면적: ${item.area || "-"}㎡ / 층수: ${item.floor || "-"}</div>
  `;
  card.addEventListener("click", () => {
    map.setView([item.lat, item.lon], 17, { animate: true });
    item.marker.openPopup();
  });
  propertyList.prepend(card);
}

// ===== 매물 추가 =====
async function addProperty({
  address, type, dealType, price, monthly, area, floor, maintenance, memo,
  moveCenter = true, silent = false
}) {
  if (!address) return;

  const coord = await geocode(address);
  if (!coord) {
    if (!silent) alert("주소를 찾을 수 없습니다. 정확히 입력해주세요.");
    return;
  }

  const marker = L.marker([coord.lat, coord.lon]);
  marker.bindPopup(`
    <div style="min-width:220px; font-size:12px;">
      <div style="font-weight:700; margin-bottom:4px;">${type} | ${dealType}</div>
      <div>가격: ${price ?? "-"}${monthly ? ` / ${monthly}` : ""}</div>
      <div>면적: ${area ?? "-"}㎡ / 층수: ${floor ?? "-"}</div>
      <div style="color:#666; margin-top:4px;">${address}</div>
    </div>
  `);

  cluster.addLayer(marker);

  const item = {
    id: Date.now(),
    marker,
    address, type, dealType, price, monthly, area, floor, maintenance, memo,
    lat: coord.lat, lon: coord.lon,
  };
  properties.push(item);

  addListCard(item);
  if (moveCenter) map.setView([coord.lat, coord.lon], 17, { animate: true });
}

// ===== 폼 제출 처리 =====
propertyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const address = document.getElementById("address").value.trim();
  const type = document.getElementById("type").value;
  const dealType = document.getElementById("dealType").value;
  const price = document.getElementById("price").value;
  const monthly = document.getElementById("monthly").value;
  const area = document.getElementById("area").value;
  const floor = document.getElementById("floor").value;
  const maintenance = document.getElementById("maintenance").value;
  const memo = document.getElementById("memo").value;

  await addProperty({ address, type, dealType, price, monthly, area, floor, maintenance, memo });

  propertyForm.reset();
  propertyFormLayer.classList.add("hidden");
  propertyFormLayer.classList.remove("flex");
});
