// -------------------------------
// 🏠 Himkong Real Estate Map (Supabase 연결 버전)
// -------------------------------

const SUPABASE_URL = 'https://ayokcqbqrmgrssxujqvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b2tjcWJxcm1ncnNzeHVqcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNjk2MzAsImV4cCI6MjA3NTY0NTYzMH0.iAZLbT6Uqk5FP8vfx7FZuBCg03P6M3dXeQQjc5ACfm0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ 지도 초기화
const map = L.map('map').setView([37.5665, 126.9780], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// ✅ 매물 불러오기
async function loadProperties() {
  const { data, error } = await supabase.from('properties').select('*');
  if (error) {
    alert('서버 오류: ' + error.message);
    return;
  }

  const list = document.getElementById('property-list');
  list.innerHTML = '';

  data.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'border-b p-3 hover:bg-gray-50 transition';
    item.innerHTML = `
      <div class="font-bold">${p.type} | ${p.dealType}</div>
      <div>${p.address}</div>
      <div class="text-blue-600">${p.price ?? '-'} / ${p.monthly ?? '-'}</div>
      <div class="text-sm text-gray-500">${p.area ?? ''}㎡ ${p.floor ?? ''}</div>
    `;
    list.appendChild(item);

    if (p.lat && p.lng) {
      L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(`<b>${p.type}</b><br>${p.address}<br>${p.price ?? '-'} / ${p.monthly ?? '-'}`);
    }
  });
}

// ✅ 매물 등록
async function addProperty(form) {
  const newProperty = {
    address: form.address.value,
    type: form.type.value,
    dealType: form.dealType.value,
    price: parseFloat(form.price.value) || null,
    monthly: parseFloat(form.monthly.value) || null,
    area: parseFloat(form.area.value) || null,
    floor: form.floor.value,
    maintenance: parseFloat(form.maintenance.value) || null,
    memo: form.memo.value,
    lat: parseFloat(form.lat.value) || null,
    lng: parseFloat(form.lng.value) || null,
  };

  const { error } = await supabase.from('properties').insert([newProperty]);
  if (error) {
    alert('❌ 매물 등록 실패: ' + error.message);
  } else {
    alert('✅ 매물 등록 완료!');
    form.reset();
    formModal.classList.add('hidden');
    loadProperties();
  }
}

// ✅ 초기 실행
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addProperty(form);
  });
  loadProperties();
});
