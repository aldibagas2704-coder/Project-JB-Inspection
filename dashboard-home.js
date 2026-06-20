(() => {

const WORKER_URL = "https://jb-inspection-27a4.aldibagas2704.workers.dev/";
const AUTO_REFRESH_MS = 60000;

// ============================
// HELPERS
// ============================

function parseDateFromRow(row){
  const raw = row.Tanggal || row.tanggal || row.Date || row.date || "";
  if(!raw) return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)) return new Date(raw.slice(0,10));
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(raw).trim());
  if(m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function filterByDays(rows, days){
  if(!days || days === "all") return rows;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));
  return rows.filter(r => {
    const d = parseDateFromRow(r);
    return d && d >= cutoff;
  });
}

function getComponent(row){
  return (
    row["Bab"] ||
    row["Bab (Component Group)"] ||
    row.bab ||
    row.componentGroup ||
    ""
  ).toString().trim();
}

function classifyPriority(row){
  const u = String(
    row["Urgency"] || row["Priority"] || row.urgency || row.priority || ""
  ).toLowerCase();

  if(/high|urgent|p1|critical/.test(u)) return "P1";
  if(/medium|sedang|p2/.test(u))        return "P2";
  if(/low|rendah|p3/.test(u))           return "P3";
  return "Lainnya";
}

function formatDDMMYYYY(date) {
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function getDateYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getMonthYM(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

// ============================
// FETCH
// ============================

async function postWorker(payload){
  const r = await fetch(WORKER_URL, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  return await r.json();
}

async function fetchInspeksi(){
  const res = await postWorker({ action:"getInspeksi" });
  return (res.success && Array.isArray(res.data)) ? res.data : [];
}

async function fetchJadwal(){
  const res = await postWorker({ action:"getJadwal" });
  return (res.success && Array.isArray(res.data)) ? res.data : [];
}

// ============================
// COMPLIANCE DESC TEXT
// ============================

function complianceDescText(rate){
  if(rate >= 95) return "Sangat baik, tingkat kepatuhan inspeksi berada pada kategori optimal.";
  if(rate >= 80) return "Tingkat penyelesaian jadwal inspeksi menunjukkan performa yang sangat baik.";
  if(rate >= 60) return "Baik, namun masih terdapat peluang peningkatan konsistensi.";
  return "Perlu perhatian karena tingkat kepatuhan masih rendah.";
}

// ============================
// STAT CARDS + DECISION SECTION
// ============================

function renderStats(inspeksi, jadwal){

  const totalInspection = inspeksi.length;
  const priority1 = inspeksi.filter(r => classifyPriority(r) === "P1").length;

  const selesai = jadwal.filter(r =>
    String(r.status || '').toLowerCase() === "selesai"
  ).length;

  const totalJadwal = jadwal.length;
  const compliance = totalJadwal > 0
    ? Math.round((selesai / totalJadwal) * 100)
    : 0;

  const count = {};
  inspeksi.forEach(r => {
    const c = getComponent(r);
    if(!c) return;
    count[c] = (count[c] || 0) + 1;
  });

  const sorted = Object.entries(count).sort((a,b) => b[1] - a[1]);
  const totalKomponen = sorted.reduce((s,[,v]) => s+v, 0);
  const dominant = sorted.length ? sorted[0][0] : "—";
  const dominantPct = sorted.length && totalKomponen
    ? ((sorted[0][1] / totalKomponen) * 100).toFixed(1)
    : "0";

  document.getElementById("totalInspection").textContent = totalInspection;
  document.getElementById("highPriority").textContent = priority1;
  document.getElementById("complianceRate").textContent = compliance + "%";

  document.getElementById("dcKomponen").textContent = dominant;
  document.getElementById("dcKomponenPct").textContent =
    sorted.length ? `(${dominantPct.replace('.', ',')}%)` : "";

  document.getElementById("dcPriority").textContent = `${priority1} Temuan P1`;
  document.getElementById("dcCompliance").textContent = compliance + "%";
  document.getElementById("dcComplianceDesc").textContent = complianceDescText(compliance);

  const rekom = [];
  if(sorted.length) rekom.push(`Fokus inspeksi ${dominant}`);
  if(priority1 > 0) rekom.push(`Segera tindak lanjuti temuan P1`);
  if(sorted.length) rekom.push(`Siapkan spare part ${dominant}`);
  rekom.push(
    compliance >= 90
      ? "Pertahankan compliance >90%"
      : "Tingkatkan compliance inspeksi"
  );

  document.getElementById("dcRekomendasi").innerHTML =
    rekom.map(r => `<li>${r}</li>`).join("");
}

// ============================
// TOP PROBLEM COMPONENT
// ============================

const barColors = ["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#06b6d4"];

function renderTopComponents(rows){

  const count = {};
  rows.forEach(r => {
    const c = getComponent(r);
    if(!c) return;
    count[c] = (count[c] || 0) + 1;
  });

  const sorted = Object.entries(count)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 8);

  const sub  = document.getElementById("topCompSub");
  const list = document.getElementById("topCompList");

  if(!sorted.length){
    if(sub)  sub.textContent  = "Belum ada data temuan.";
    if(list) list.innerHTML   = "";
    return;
  }

  const max = sorted[0][1];
  if(sub) sub.textContent = `${sorted.length} komponen teratas • frekuensi temuan`;

  list.innerHTML = sorted.map(([name, freq], i) => {
    const width = max ? (freq / max) * 100 : 0;
    const color = barColors[i % barColors.length];
    return `
      <div class="bar-row">
        <div class="bar-name">${name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%;background:${color}"></div>
        </div>
        <div class="bar-value">${freq}</div>
      </div>
    `;
  }).join("");
}

// ============================
// PRIORITY DISTRIBUTION
// ============================

let prioChart;

const PRIO_COLORS = {
  "P1 — Critical": "#ef4444",
  "P2 — Medium":   "#f59e0b",
  "P3 — Low":      "#10b981",
  "Lainnya":       "#64748b"
};

function renderPriorityDistribution(rows){

  const buckets = { "P1 — Critical":0, "P2 — Medium":0, "P3 — Low":0, "Lainnya":0 };

  rows.forEach(r => {
    const p = classifyPriority(r);
    if(p === "P1")      buckets["P1 — Critical"]++;
    else if(p === "P2") buckets["P2 — Medium"]++;
    else if(p === "P3") buckets["P3 — Low"]++;
    else                buckets["Lainnya"]++;
  });

  const total  = rows.length;
  const labels = Object.keys(buckets);
  const values = Object.values(buckets);
  const colors = labels.map(l => PRIO_COLORS[l]);

  const canvas = document.getElementById("prioChart");

  if(prioChart){
    prioChart.data.datasets[0].data = values;
    prioChart.update();
  } else if(canvas){
    prioChart = new Chart(canvas, {
      type: 'doughnut',
      data:{
        labels,
        datasets:[{ data: values, backgroundColor: colors, borderWidth: 0 }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:'68%',
        plugins:{ legend:{ display:false } }
      }
    });
  }

  const legendEl = document.getElementById("prioLegend");
  if(legendEl){
    legendEl.innerHTML = labels.map((label, i) => {
      const val = values[i];
      const pct = total ? ((val / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="prio-legend-item">
          <span class="prio-dot" style="background:${colors[i]}"></span>
          <span class="prio-label">${label}</span>
          <span class="prio-val">${val} <em>(${pct}%)</em></span>
        </div>
      `;
    }).join("");
  }
}

// ============================
// STATUS JADWAL HARI INI (Donut)
// ============================

let statusHariIniChart;

function renderStatusHariIni(jadwalRows) {
  const today    = new Date();
  const todayYMD = getDateYMD(today);

  const todayRows = jadwalRows.filter(r => {
    const d = parseDateFromRow(r);
    if (!d) return false;
    return getDateYMD(d) === todayYMD;
  });

  const selesai  = todayRows.filter(r => String(r.status||'').toLowerCase() === 'selesai').length;
  const belum    = todayRows.length - selesai;

  const canvas   = document.getElementById('statusHariIniChart');
  const legendEl = document.getElementById('statusHariIniLegend');

  const data   = [selesai, belum];
  const labels = ['Selesai', 'Belum'];
  const colors = ['#10b981', '#ef4444'];

  if (statusHariIniChart) {
    statusHariIniChart.data.datasets[0].data = data;
    statusHariIniChart.update();
  } else if (canvas) {
    statusHariIniChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { display: false } }
      }
    });
  }

  if (legendEl) {
    legendEl.innerHTML = labels.map((lbl, i) => `
      <div class="prio-legend-item">
        <span class="prio-dot" style="background:${colors[i]}"></span>
        <span class="prio-label">${lbl}</span>
        <span class="prio-val">${data[i]}</span>
      </div>
    `).join('');
  }
}

// ============================
// JADWAL vs SELESAI BULANAN (Bar Chart)
// ============================

let bulananChart;

function renderBulanan(jadwalRows, ym) {
  const [year, month] = ym.split('-').map(Number);
  const daysInMonth   = new Date(year, month, 0).getDate();

  const labels        = Array.from({length: daysInMonth}, (_, i) => String(i+1));
  const jadwalPerDay  = new Array(daysInMonth).fill(0);
  const selesaiPerDay = new Array(daysInMonth).fill(0);

  let totalJadwal = 0, totalSelesai = 0;

  jadwalRows.forEach(r => {
    const d = parseDateFromRow(r);
    if (!d) return;
    if (getMonthYM(d) !== ym) return;
    const dayIdx = d.getDate() - 1;
    jadwalPerDay[dayIdx]++;
    totalJadwal++;
    if (String(r.status||'').toLowerCase() === 'selesai') {
      selesaiPerDay[dayIdx]++;
      totalSelesai++;
    }
  });

  const subEl = document.getElementById('bulananSub');
  const pct   = totalJadwal ? Math.round((totalSelesai / totalJadwal) * 100) : 0;
  if (subEl) subEl.textContent = `Total bulan ini: ${totalJadwal} jadwal • Selesai: ${totalSelesai} (${pct}%)`;

  const labelEl = document.getElementById('bulananMonthLabel');
  if (labelEl) {
    const d = new Date(year, month - 1, 1);
    labelEl.textContent = d.toLocaleString('id-ID', {month:'long', year:'numeric'});
  }

  const canvas = document.getElementById('bulananChart');
  if (!canvas) return;

  if (bulananChart) {
    bulananChart.data.labels = labels;
    bulananChart.data.datasets[0].data = jadwalPerDay;
    bulananChart.data.datasets[1].data = selesaiPerDay;
    bulananChart.update();
  } else {
    bulananChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Jadwal',
            data: jadwalPerDay,
            backgroundColor: '#06b6d4',
            borderRadius: 3,
            barPercentage: 0.7
          },
          {
            label: 'Selesai',
            data: selesaiPerDay,
            backgroundColor: '#10b981',
            borderRadius: 3,
            barPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 9 } },
            grid:  { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: '#94a3b8', stepSize: 1, font: { size: 10 } },
            grid:  { color: 'rgba(255,255,255,0.07)' },
            beginAtZero: true
          }
        }
      }
    });
  }
}

// ============================
// TABEL JADWAL HARI INI
// ============================

function renderJadwalHariIniTable(jadwalRows) {
  const today    = new Date();
  const todayYMD = getDateYMD(today);

  const todayRows = jadwalRows.filter(r => {
    const d = parseDateFromRow(r);
    if (!d) return false;
    return getDateYMD(d) === todayYMD;
  });

  const dateEl = document.getElementById('jadwalHariIniDate');
  if (dateEl) dateEl.textContent = `Hari ini: ${formatDDMMYYYY(today)}`;

  const tbody = document.getElementById('jadwalHariIniBody');
  if (!tbody) return;

  if (!todayRows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted" style="text-align:center;padding:16px;">Tidak ada jadwal hari ini</td></tr>';
    return;
  }

  tbody.innerHTML = todayRows.map(r => {
    const kode   = r.kode || r['kode unit'] || r['Kode Unit'] || '-';
    const d      = parseDateFromRow(r);
    const tgl    = d ? formatDDMMYYYY(d) : '-';
    const lokasi = r.lokasi || r.Lokasi || r.site || '-';
    const status = r.status || r.Status || '';
    const cls    = status.toLowerCase() === 'selesai' ? 'status-selesai'
                 : status.toLowerCase() === 'ditunda' ? 'status-ditunda'
                 : 'status-belum';
    return `<tr>
      <td>${kode}</td>
      <td>${tgl}</td>
      <td>${lokasi}</td>
      <td class="${cls}">${status || 'Belum'}</td>
    </tr>`;
  }).join('');
}

// ============================
// LOAD + EVENTS
// ============================

let rawInspeksi = [];
let rawJadwal   = [];

async function loadDashboard(){
  rawInspeksi = await fetchInspeksi();
  rawJadwal   = await fetchJadwal();

  renderStats(rawInspeksi, rawJadwal);
  applyTopCompFilter();
  applyPrioFilter();

  // Grafik & tabel jadwal
  renderStatusHariIni(rawJadwal);

  const picker = document.getElementById('bulananMonthPicker');
  const now    = new Date();
  const currentYM = getMonthYM(now);
  if (picker && !picker.value) picker.value = currentYM;
  renderBulanan(rawJadwal, picker ? picker.value : currentYM);

  renderJadwalHariIniTable(rawJadwal);
}

function applyTopCompFilter(){
  const el   = document.getElementById("topCompFilter");
  const days = el ? el.value : "all";
  renderTopComponents(filterByDays(rawInspeksi, days));
}

function applyPrioFilter(){
  const el   = document.getElementById("prioFilter");
  const days = el ? el.value : "all";
  renderPriorityDistribution(filterByDays(rawInspeksi, days));
}

function startAutoRefresh(){
  setInterval(loadDashboard, AUTO_REFRESH_MS);
}

window.addEventListener("DOMContentLoaded", () => {

  loadDashboard();
  startAutoRefresh();

  document.getElementById("topCompFilter")
    ?.addEventListener("change", applyTopCompFilter);

  document.getElementById("prioFilter")
    ?.addEventListener("change", applyPrioFilter);

  document.getElementById('bulananMonthPicker')
    ?.addEventListener('change', (e) => {
      renderBulanan(rawJadwal, e.target.value);
    });

  document.getElementById('btnRefreshJadwalHariIni')
    ?.addEventListener('click', async () => {
      const btn = document.getElementById('btnRefreshJadwalHariIni');
      if (btn) { btn.disabled = true; btn.textContent = '...'; }
      await loadDashboard();
      if (btn) { btn.disabled = false; btn.textContent = 'Refresh'; }
    });

});

})();
