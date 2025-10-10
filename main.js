// 지도 초기화
let map = L.map("map").setView([37.5665, 126.9780], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

let markerGroup = L.markerClusterGroup();
map.addLayer(markerGroup);

let properties = JSON.parse(localStorage.getItem("properties")) || [];

// 매물 렌더링
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
      item.className = "border p-2 rounded bg-gray-50 cursor-pointer";
      item.innerHTML = `<b>${p.type}</b> | ${p.dealType}<br/>💰 ${p.price} / ${p.monthly}<br/>📍 ${p.address}`;
      item.addEventListener("click", () => {
        map.setView([p.lat, p.lng], 17);
        marker.openPopup();
      });
      list.appendChild(item);
    });
}
renderProperties();

// 폼 제어
const formLayer = document.getElementById("propertyFormLayer");
document.getElementById("openFormBtn").addEventListener("click", () => {
  formLayer.style.display = "flex";
});
document.getElementById("closeFormBtn").addEventListener("click", () => {
  formLayer.style.display = "none";
});

// 주소검색
document.getElementById("address").addEventListener("click", function () {
  new daum.Postcode({
    oncomplete: function (data) {
      document.getElementById("address").value = data.address;
    },
  }).open();
});

// 카카오 지오코딩 (좌표 변환)
async function getCoordsFromKakao(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else reject("주소 검색 실패");
    });
  });
}

// 등록 버튼
document.getElementById("submitBtn").addEventListener("click", async () => {
  const address = document.getElementById("address").value.trim();
  if (!address) return alert("주소를 입력해주세요.");

  try {
    const coords = await getCoordsFromKakao(address);
    const data = {
      address,
      type: document.getElementById("type").value,
      dealType: document.getElementById("dealType").value,
      price: document.getElementById("price").value,
      monthly: document.getElementById("monthly").value,
      area: document.getElementById("area").value,
      floor: document.getElementById("floor").value,
      maintenance: document.getElementById("maintenance").value,
      memo: document.getElementById("memo").value,
      ...coords,
    };

    properties.push(data);
    localStorage.setItem("properties", JSON.stringify(properties));
    formLayer.style.display = "none";
    renderProperties();
  } catch (e) {
    alert("❌ 카카오 주소검색 실패: " + e);
  }
});
