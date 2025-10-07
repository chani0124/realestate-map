console.log("JS 시작 ✅");

// 📌 매물 등록 레이어 열고 닫기
const openFormBtn = document.getElementById("openFormBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const propertyFormLayer = document.getElementById("propertyFormLayer");

openFormBtn.addEventListener("click", () => {
  propertyFormLayer.classList.remove("hidden");
  propertyFormLayer.classList.add("flex");
});

closeFormBtn.addEventListener("click", () => {
  propertyFormLayer.classList.add("hidden");
  propertyFormLayer.classList.remove("flex");
});

// ======================
// 카카오 지도 초기화
// ======================
let map;
let clusterer;
let geocoder;

function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  // 서울시청 기준
  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 5,
  });

  // 숫자 클러스터
  clusterer = new kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    minLevel: 4,
  });

  // 주소 → 좌표 변환
  geocoder = new kakao.maps.services.Geocoder();
}

window.addEventListener("load", initMap);

// ======================
// 매물 등록 처리
// ======================
const propertyForm = document.getElementById("propertyForm");
const propertyList = document.getElementById("propertyList");

let properties = []; // 등록된 매물 저장 (초기에는 메모리. 나중에 LocalStorage/DB로 변경)

propertyForm.addEventListener("submit", (e) => {
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

  if (!address) {
    alert("주소를 입력해주세요.");
    return;
  }

  // 주소 → 좌표 변환
  geocoder.addressSearch(address, function (result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

      // 마커 생성
      const marker = new kakao.maps.Marker({ position: coords });

      // 데이터 저장
      const item = {
        id: Date.now(),
        marker,
        coords,
        address,
        type,
        dealType,
        price,
        monthly,
        area,
        floor,
        maintenance,
        memo,
      };
      properties.push(item);

      // 클러스터러에 마커 추가
      clusterer.addMarker(marker);

      // 리스트 카드 추가
      const card = document.createElement("div");
      card.className =
        "border rounded p-3 hover:bg-gray-50 cursor-pointer flex flex-col gap-1";
      card.innerHTML = `
        <div class="font-semibold">${type} | ${dealType} | ${price || "-"}${monthly ? ` / ${monthly}` : ""}</div>
        <div class="text-xs text-gray-500">${address}</div>
        <div class="text-xs text-gray-500">면적: ${area || "-"}㎡ / 층수: ${floor || "-"}</div>
      `;
      card.addEventListener("click", () => {
        map.panTo(coords);
      });
      propertyList.prepend(card);

      // 폼 초기화 + 닫기
      propertyForm.reset();
      propertyFormLayer.classList.add("hidden");
      propertyFormLayer.classList.remove("flex");

      // 지도 포커스
      map.panTo(coords);
    } else {
      alert("주소를 찾을 수 없습니다. 정확하게 입력해주세요!");
    }
  });
});
