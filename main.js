// ✅ 카카오맵 생성
let mapContainer = document.getElementById("map");
let mapOption = {
  center: new kakao.maps.LatLng(37.5665, 126.9780),
  level: 5,
};
let map = new kakao.maps.Map(mapContainer, mapOption);
let geocoder = new kakao.maps.services.Geocoder();
let markers = [];
let properties = JSON.parse(localStorage.getItem("properties")) || [];

// ✅ 매물 표시
function renderProperties() {
  markers.forEach((m) => m.setMap(null));
  markers = [];

  const list = document.getElementById("propertyList");
  list.innerHTML = "";

  properties.forEach((p) => {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(p.lat, p.lng),
      map: map,
    });

    const info = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;">${p.type} | ${p.dealType}<br>${p.address}</div>`,
    });
    kakao.maps.event.addListener(marker, "click", () => info.open(map, marker));
    markers.push(marker);

    const item = document.createElement("div");
    item.className = "border p-2 rounded bg-gray-50 cursor-pointer";
    item.innerHTML = `<b>${p.type}</b> | ${p.dealType}<br/>💰 ${p.price}/${p.monthly}<br/>📍 ${p.address}`;
    item.onclick = () => map.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
    list.appendChild(item);
  });
}
renderProperties();

// ✅ 폼 제어
const formLayer = document.getElementById("propertyFormLayer");
document.getElementById("openFormBtn").onclick = () => (formLayer.style.display = "flex");
document.getElementById("closeFormBtn").onclick = () => (formLayer.style.display = "none");

// ✅ 매물 등록
document.getElementById("submitBtn").onclick = () => {
  const address = document.getElementById("address").value.trim();
  const type = document.getElementById("type").value;
  const dealType = document.getElementById("dealType").value;
  const price = document.getElementById("price").value;
  const monthly = document.getElementById("monthly").value;
  const memo = document.getElementById("memo").value;

  if (!address) return alert("주소를 입력해주세요.");

  geocoder.addressSearch(address, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const lat = parseFloat(result[0].y);
      const lng = parseFloat(result[0].x);
      const newProperty = { address, type, dealType, price, monthly, memo, lat, lng };

      properties.push(newProperty);
      localStorage.setItem("properties", JSON.stringify(properties));
      renderProperties();
      formLayer.style.display = "none";
    } else {
      alert("❌ 주소 검색 실패 (확인 필요)");
    }
  });
};
