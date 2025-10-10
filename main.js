// Supabase 연결 설정
const SUPABASE_URL = "https://ayokcqbqrmgrssxujqvy.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b2tjcWJxcm1ncnNzeHVqcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNjk2MzAsImV4cCI6MjA3NTY0NTYzMH0.iAZLbT6Uqk5FP8vfx7FZuBCg03P6M3dXeQQjc5ACfm0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 지도 초기화 (서울 기준)
const map = L.map("map").setView([37.5665, 126.978], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const propertyList = document.getElementById("property-list");

// 매물 목록 불러오기
async function loadProperties() {
  propertyList.innerHTML = "<p class='text-gray-500 text-center mt-5'>불러오는 중...</p>";
  const { data, error } = await supabase.from("properties").select("*").order("id", { ascending: false });

  if (error) {
    propertyList.innerHTML = `<p class='text-red-500 text-center'>데이터 불러오기 실패 😢</p>`;
    console.error(error);
    return;
  }

  propertyList.innerHTML = "";
  data.forEach((item) => addPropertyCard(item));
}

// 매물 카드 생성
function addPropertyCard(item) {
  const card = document.createElement("div");
  card.className = "border rounded p-3 mb-2 shadow hover:bg-gray-50";
  card.innerHTML = `
    <h3 class="font-bold text-lg">${item.type} | ${item.dealType}</h3>
    <p class="text-sm text-gray-600">${item.address}</p>
    <p class="mt-1">💰 ${item.price || 0} / ${item.monthly || 0}</p>
    <p class="text-sm text-gray-500">${item.area || "-"}㎡ | ${item.floor || "-"}층 | 관리비 ${item.maintenance || 0}</p>
    <button class="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">지도이동</button>
  `;
  propertyList.appendChild(card);

  if (item.lat && item.lng) {
    const marker = L.marker([item.lat, item.lng]).addTo(map);
    marker.bindPopup(`<b>${item.type}</b><br>${item.address}<br>${item.dealType} ${item.price || 0}/${item.monthly || 0}`);
    card.querySelector("button").addEventListener("click", () => {
      map.setView([item.lat, item.lng], 16);
      marker.openPopup();
    });
  }
}

// 새 매물 등록
const addForm = document.getElementById("add-form");
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(addForm));
  formData.price = Number(formData.price || 0);
  formData.monthly = Number(formData.monthly || 0);
  formData.area = Number(formData.area || 0);
  formData.maintenance = Number(formData.maintenance || 0);
  formData.lat = Number(formData.lat || 0);
  formData.lng = Number(formData.lng || 0);

  const { data, error } = await supabase.from("properties").insert([formData]).select();
  if (error) {
    alert("등록 실패 😢");
    console.error(error);
  } else {
    alert("등록 완료 🎉");
    addForm.reset();
    document.getElementById("formModal").classList.add("hidden");
    addPropertyCard(data[0]);
  }
});

// 모달 열기/닫기
document.getElementById("openForm").addEventListener("click", () => {
  document.getElementById("formModal").classList.remove("hidden");
});
document.getElementById("closeForm").addEventListener("click", () => {
  document.getElementById("formModal").classList.add("hidden");
});

// 실행
loadProperties();
