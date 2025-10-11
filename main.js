// ============================
// 지도 초기화
// ============================
const map = L.map("map", {
  zoomControl: true,
}).setView([37.5665, 126.9780], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// 마커 레이어 관리
const markerLayer = L.layerGroup().addTo(map);

// ============================
// LocalStorage 유틸
// ============================
const STORAGE_KEY = "properties";

const loadProperties = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveProperties = (arr) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
};

// 전역 데이터
let properties = loadProperties();

// ============================
// UI 엘리먼트
// ============================
const $formLayer = document.getElementById("formLayer");
const $openFormBtn = document.getElementById("openFormBtn");
const $closeFormBtn = document.getElementById("closeFormBtn");
const $propertyForm = document.getElementById("propertyForm");
const $propertyList = document.getElementById("propertyList");

// 모달 열기/닫기
$openFormBtn.addEventListener("click", () => {
  $formLayer.classList.remove("hidden");
});
$closeFormBtn.addEventListener("click", () => {
  $formLayer.classList.add("hidden");
});

// 엔터키로 제출 방지 (반드시 버튼 클릭으로만 등록)
$propertyForm.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

// 모달 열려있을 때 지도 클릭 → 위경도 자동 입력
let tempMarker = null;
map.on("click", (e) => {
  if ($formLayer.classList.contains("hidden")) return;
  const { lat, lng } = e.latlng;
  $propertyForm.lat.value = lat.toFixed(6);
  $propertyForm.lng.value = lng.toFixed(6);

  if (!tempMarker) {
    tempMarker = L.marker([lat, lng]).addTo(map);
  } else {
    tempMarker.setLatLng([lat, lng]);
  }
});

// ============================
// 렌더링
// ============================
function render() {
  // 리스트
  $propertyList.innerHTML = "";
  if (properties.length === 0) {
    $propertyList.innerHTML =
      `<p class="text-gray-500 text-sm text-center mt-6">등록된 매물이 없습니다.</p>`;
  } else {
    properties.forEach((p, idx) => {
      const el = document.createElement("div");
      el.className = "border rounded p-3 mb-3 bg-white shadow-sm";
      el.innerHTML = `
        <div class="flex justify-between items-center">
          <div class="font-semibold">${p.type || "-"} | ${p.dealType || "-"}</div>
          <button data-del="${idx}" class="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">삭제</button>
        </div>
        <div class="text-sm text-gray-600 mt-1">${p.address || "-"}</div>
        <div class="text-sm mt-1">💰 ${p.price || 0} / ${p.monthly || 0}</div>
        <div class="text-xs text-gray-500">면적 ${p.area || "-"}㎡ · 층수 ${p.floor || "-"} · 관리비 ${p.maintenance || 0}</div>
        <div class="mt-2">
          <button data-move="${idx}" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">지도이동</button>
        </div>
      `;
      $propertyList.appendChild(el);
    });
  }

  // 삭제/이동 이벤트
  $propertyList.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.del);
      properties.splice(i, 1);
      saveProperties(properties);
      render();
    });
  });

  $propertyList.querySelectorAll("button[data-move]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = properties[Number(btn.dataset.move)];
      if (p?.lat && p?.lng) {
        map.setView([p.lat, p.lng], 16);
      }
    });
  });

  // 마커
  markerLayer.clearLayers();
  properties.forEach(p => {
    if (p.lat && p.lng) {
      L.marker([p.lat, p.lng])
        .bindPopup(`<b>${p.type || "-"}</b><br>${p.dealType || "-"}<br>${p.address || "-"}`)
        .addTo(markerLayer);
    }
  });
}

// ============================
// 등록 처리
// ============================
$propertyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // 폼 → 객체
  const data = Object.fromEntries(new FormData($propertyForm).entries());

  // 숫자형 변환
  data.price = Number(data.price || 0);
  data.monthly = Number(data.monthly || 0);
  data.area = Number(data.area || 0);
  data.maintenance = Number(data.maintenance || 0);
  data.lat = data.lat ? Number(data.lat) : null;
  data.lng = data.lng ? Number(data.lng) : null;

  properties.unshift(data);
  saveProperties(properties);

  // 폼 리셋 및 모달 닫기
  $propertyForm.reset();
  $formLayer.classList.add("hidden");

  // 임시 마커 제거
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }

  render();
});

// 초기 렌더링
render();
