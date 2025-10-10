// ====== 전역 상태 ======
let map, markerGroup;
let properties = JSON.parse(localStorage.getItem("properties") || "[]");
let activeFilter = "전체";

// ====== 지도 초기화 (Leaflet + OSM) ======
function initMap() {
  map = L.map("map", { zoomControl: true }).setView([37.5665, 126.9780], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  markerGroup = L.markerClusterGroup();
  map.addLayer(markerGroup);
}

// ====== 주소 → 좌표 (Nominatim) ======
async function geocodeByNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "ko" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  const { lat, lon } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon) };
}

// ====== 목록/마커 렌더링 ======
function renderProperties(filterType = "전체") {
  markerGroup.clearLayers();
  const list = document.getElementById("propertyList");
  list.innerHTML = "";

  const filtered = properties.filter(p => filterType === "전체" || p.type === filterType);

  filtered.forEach((p, idx) => {
    // 마커
    const marker = L.marker([p.lat, p.lng]).bindPopup(
      `<b>${p.type}</b> | ${p.dealType}<br/>💰 ${p.price || 0} / ${p.monthly || 0}<br/>📍 ${p.address}`
    );
    markerGroup.addLayer(marker);

    // 카드
    const item = document.createElement("div");
    item.className = "property-card border p-2 rounded bg-white cursor-pointer";
    item.innerHTML = `
      <div class="font-semibold">${p.type} | ${p.dealType}</div>
      <div>💰 ${p.price || 0} / ${p.monthly || 0}</div>
      <div class="text-gray-600 truncate">📍 ${p.address}</div>
      <div class="mt-1 text-xs text-gray-500">면적 ${p.area || "-"}㎡ · 층수 ${p.floor || "-"} · 관리비 ${p.maintenance || "-"}</div>
      <div class="mt-2 flex gap-2">
        <button class="goto bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-xs">지도이동</button>
        <button class="del bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs">삭제</button>
      </div>
    `;

    item.querySelector(".goto").addEventListener("click", (e) => {
      e.stopPropagation();
      map.setView([p.lat, p.lng], 17);
      marker.openPopup();
    });
    item.querySelector(".del").addEventListener("click", (e) => {
      e.stopPropagation();
      properties.splice(properties.indexOf(p), 1);
      localStorage.setItem("properties", JSON.stringify(properties));
      renderProperties(activeFilter);
    });

    item.addEventListener("click", () => {
      map.setView([p.lat, p.lng], 17);
      marker.openPopup();
    });
    list.appendChild(item);
  });
}

// ====== 모달 열고 닫기 ======
const formLayer = document.getElementById("propertyFormLayer");
document.getElementById("openFormBtn").addEventListener("click", () => {
  formLayer.style.display = "flex";
});
document.getElementById("closeFormBtn").addEventListener("click", () => {
  formLayer.style.display = "none";
});

// ====== Enter 키로 제출 방지(반드시 클릭으로만 등록) ======
document.getElementById("propertyFormLayer").addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

// ====== 주소검색 버튼 (다음 우편번호 있으면 사용) ======
document.getElementById("searchAddr").addEventListener("click", () => {
  if (window.daum && window.daum.Postcode) {
    new daum.Postcode({
      oncomplete: function (data) {
        document.getElementById("address").value = data.address;
      },
    }).open();
  } else {
    alert("주소검색 모듈이 없어요. 주소를 직접 입력하세요.");
  }
});

// ====== 매물 등록 (클릭으로만) ======
document.getElementById("submitBtn").addEventListener("click", async () => {
  const address = document.getElementById("address").value.trim();
  const type = document.getElementById("type").value;
  const dealType = document.getElementById("dealType").value;
  const price = document.getElementById("price").value;
  const monthly = document.getElementById("monthly").value;
  const area = document.getElementById("area").value;
  const floor = document.getElementById("floor").value;
  const maintenance = document.getElementById("maintenance").value;
  const memo = document.getElementById("memo").value;

  if (!address) {
    alert("주소를 입력하세요.");
    return;
  }

  // 주소 → 좌표
  const coords = await geocodeByNominatim(address);
  if (!coords) {
    alert("주소 좌표를 찾지 못했습니다. 주소를 좀 더 정확히 입력해 주세요.");
    return;
  }

  const newProperty = {
    id: Date.now(),
    address, type, dealType, price, monthly, area, floor, maintenance, memo,
    lat: coords.lat, lng: coords.lng
  };

  properties.push(newProperty);
  localStorage.setItem("properties", JSON.stringify(properties));

  formLayer.style.display = "none";
  // 입력값 리셋
  document.getElementById("address").value = "";
  document.getElementById("price").value = "";
  document.getElementById("monthly").value = "";
  document.getElementById("area").value = "";
  document.getElementById("floor").value = "";
  document.getElementById("maintenance").value = "";
  document.getElementById("memo").value = "";

  renderProperties(activeFilter);
});

// ====== 카테고리 필터 ======
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("bg-blue-600","text-white"));
    btn.classList.add("bg-blue-600","text-white");
    activeFilter = btn.dataset.type;
    renderProperties(activeFilter);
  });
});

// ====== 엑셀 내보내기 ======
document.getElementById("exportExcel").addEventListener("click", () => {
  if (properties.length === 0) {
    alert("등록된 매물이 없습니다.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(properties);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "매물목록");
  XLSX.writeFile(wb, "매물목록.xlsx");
});

// ====== 시작 ======
initMap();
renderProperties();
