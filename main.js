// 지도 초기화
let map = L.map("map").setView([37.5665, 126.9780], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

let markerGroup = L.markerClusterGroup();
map.addLayer(markerGroup);

// 매물 등록 폼 열기/닫기
const openFormBtn = document.getElementById("openFormBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const propertyFormLayer = document.getElementById("propertyFormLayer");

openFormBtn.addEventListener("click", () => {
  propertyFormLayer.style.display = "flex";
});

closeFormBtn.addEventListener("click", () => {
  propertyFormLayer.style.display = "none";
});

// 폼 제출 이벤트
document.getElementById("propertyForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const address = document.getElementById("address").value.trim();
  const type = document.getElementById("type").value;
  const dealType = document.getElementById("dealType").value;
  const price = document.getElementById("price").value;
  const monthly = document.getElementById("monthly").value;

  const item = document.createElement("div");
  item.className = "border p-2 rounded bg-gray-50";
  item.innerHTML = `
    <strong>${type}</strong> | ${dealType}<br/>
    💰 ${price} / ${monthly}<br/>
    📍 ${address}
  `;
  document.getElementById("propertyList").appendChild(item);

  propertyFormLayer.style.display = "none";
  e.target.reset();
});
