// ================================
// 🏠 부동산 매물 메모장 완성 main.js (2025-10 최신)
// ================================

// 지도 초기화
let map = L.map("map").setView([37.5665, 126.9780], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

let markerGroup = L.markerClusterGroup();
map.addLayer(markerGroup);

// LocalStorage 로드
let properties = JSON.parse(localStorage.getItem("properties")) || [];

// 매물 표시
function renderProperties(filterType = "전체") {
  markerGroup.clearLayers();
  const list = document.getElementById("propertyList");
  list.innerHTML = "";

  properties
    .filter((p) => filterType === "전체" || p.type === filterType)
    .forEach((p) => {
      const marker = L.marker([p.lat, p.lng]).bindPopup(
        `<b>${p.type}</b><br>${p.dealType}<br>${p.price}/${p.monthly}<br>${p.address}`
      );
      markerGroup.addLayer(marker);

      const item = document.createElement("div");
      item.className = "border p-2 rounded bg-gray-50 cursor-pointer hover:bg-blue-50 transition";
      item.innerHTML = `
        <b>${p.type}</b> | ${p.dealType}<br/>
        💰 ${p.price} / ${p.monthly}<br/>
        📍 ${p.address}
      `;
      item.addEventListener("click", () => {
        map.setView([p.lat, p.lng], 17);
        marker.openPopup();
      });
      list.appendChild(item);
    });
}
renderProperties();

// 폼 열기/닫기
const formLayer = document.getElementById("propertyFormLayer");
document.getElementById("openFormBtn").addEventListener("click", () => {
  formLayer.style.display = "flex";
});
document.getElementById("closeFormBtn").addEventListener("click", () => {
  formLayer.style.display = "none";
});

// ✅ 엔터키로 등록 방지
document.getElementById("propertyForm").addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

// ✅ 카카오 주소검색 팝업
document.getElementById("address").addEventListener("click", function () {
  new daum.Postcode({
    oncomplete: function (data) {
      document.getElementById("address").value = data.address;
    },
  }).open();
});

// ✅ 카카오 좌표 변환 API (JavaScript 키 + appkey 방식)
async function getCoordsFromKakao(address) {
  const JS_KEY = "4a7ad4f99cd514542c44be5cd36d3076c"; // ✅ JavaScript 키 (himkong.com 등록)
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
      address
    )}&appkey=${JS_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("카카오 API 오류:", res.status, await res.text());
      alert("❌ 카카오 주소검색 실패 (" + res.status + ")");
      return null;
    }

    const data = await res.json();
    if (!data.documents || data.documents.length === 0) {
      alert("⚠️ 주소를 찾을 수 없습니다. 다시 입력해주세요.");
      return null;
    }

    const { x, y } = data.documents[0];
    return { lat: parseFloat(y), lng: parseFloat(x) };
  } catch (err) {
    console.error("카카오 주소 변환 오류:", err);
    alert("⚠️ 주소 변환 중 오류 발생!");
    return null;
  }
}

// ✅ 매물 등록
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
    alert("주소를 입력해주세요.");
    return;
  }

  const coords = await getCoordsFromKakao(address);
  if (!coords) return;

  const newProperty = {
    address,
    type,
    dealType,
    price,
    monthly,
    area,
    floor,
    maintenance,
    memo,
    lat: coords.lat,
    lng: coords.lng,
  };

  properties.push(newProperty);
  localStorage.setItem("properties", JSON.stringify(properties));

  formLayer.style.display = "none";
  renderProperties();
  alert("✅ 매물이 등록되었습니다!");
});

// ✅ 카테고리 필터
document.querySelectorAll(".category-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-btn").forEach((b) =>
      b.classList.remove("bg-blue-200")
    );
    btn.classList.add("bg-blue-200");
    renderProperties(btn.dataset.type);
  });
});

// ✅ 엑셀 내보내기
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
