(() => {

const WORKER_URL =
"https://jb-inspection-27a4.aldibagas2704.workers.dev/";

const AUTO_REFRESH_MS = 60000;

// ============================
// HELPER
// ============================

const pad2 = n =>
String(n).padStart(2,'0');

const toDDMMYYYY = d =>
`${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;

const todayYMD = () => {

  const d = new Date();

  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

};

const anyToYMD = v => {

  if (!v) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return v;
  }

  const d = new Date(v);

  if (!isNaN(d)) {

    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

  }

  const m =
  /^(\d{2})\/(\d{2})\/(\d{4})$/
  .exec(String(v).trim());

  if (m) {

    return `${m[3]}-${m[2]}-${m[1]}`;

  }

  return "";

};

const dispFromYMD = ymd =>
ymd
? ymd.split("-").reverse().join("/")
: "-";

const daysInMonth = (y,m1_12) =>
new Date(y, m1_12, 0).getDate();

// ============================
// FETCH API
// ============================

async function postWorker(payload){

  const r = await fetch(WORKER_URL, {

    method:'POST',

    headers:{
      'Content-Type':'application/json'
    },

    body: JSON.stringify(payload)

  });

  return await r.json();

}

async function getWorker(action){

  const r = await fetch(
    `${WORKER_URL}?action=${action}`
  );

  return await r.json();

}

// ============================
// ELEMENT
// ============================

const twTbody =
document.getElementById("tw-tbody");

const twMsg =
document.getElementById("tw-msg");

const twDateEl =
document.getElementById("tw-date");

const monthPicker =
document.getElementById('monthPicker');

const monthSummary =
document.getElementById('monthSummary');

let chartStatus;
let chartMonthly;

// ============================
// MESSAGE
// ============================

function twShowMsg(t){

  if (twMsg){

    twMsg.textContent = t;

    twMsg.classList.remove('tw-hidden');

  }

}

function twHideMsg(){

  if (twMsg){

    twMsg.classList.add('tw-hidden');

  }

}

// ============================
// CHART INIT
// ============================

function ensureCharts(){

  if (typeof Chart === "undefined") return;

  // ======================
  // STATUS CHART
  // ======================

  const cs =
  document.getElementById("chartStatus");

  if (!chartStatus && cs){

    chartStatus = new Chart(cs, {

      type: "doughnut",

      data: {

        labels: ["Selesai","Belum"],

        datasets: [{

          data: [0,0],

          backgroundColor: [
            "#10b981",
            "#ef4444"
          ],

          borderWidth: 0

        }]

      },

      options: {

        maintainAspectRatio: false,

        plugins: {

          legend: {

            position:"bottom",

            labels:{
              color:"#ffffff"
            }

          }

        }

      }

    });

  }

  // ======================
  // MONTHLY CHART
  // ======================

  const cm =
  document.getElementById("chartMonthly");

  if (!chartMonthly && cm){

    chartMonthly = new Chart(cm, {

      type: "bar",

      data: {

        labels: [],

        datasets: [

          {
            label:"Jadwal",
            data:[],
            backgroundColor:"#38bdf8"
          },

          {
            label:"Selesai",
            data:[],
            backgroundColor:"#10b981"
          }

        ]

      },

      options: {

        maintainAspectRatio: false,

        responsive:true,

        plugins:{
          legend:{
            labels:{
              color:"#ffffff"
            }
          }
        },

        scales: {

          y: {

            beginAtZero:true,

            ticks:{
              color:"#ffffff"
            },

            grid:{
              color:"rgba(255,255,255,0.08)"
            }

          },

          x:{
            ticks:{
              color:"#ffffff"
            },

            grid:{
              color:"rgba(255,255,255,0.05)"
            }
          }

        }

      }

    });

  }

}

// ============================
// FETCH JADWAL
// ============================

async function fetchJadwal(){

  return await postWorker({

    action:'getJadwal'

  });

}

// ============================
// NORMALIZE DATA
// ============================

function normalizeRows(raw){

  return raw.map(r => ({

    kode : r.kode || "",

    lokasi : r.lokasi || "",

    status :

      (r.status || "")
      .toString()
      .trim(),

    tanggalYMD :

      anyToYMD(r.tanggal || "")

  }))
  .filter(x => !!x.tanggalYMD);

}

// ============================
// RENDER TODAY
// ============================

function renderToday(rows){

  const today = todayYMD();

  const list = rows
  .filter(r => r.tanggalYMD === today)
  .sort((a,b)=>

    String(a.kode)
    .localeCompare(String(b.kode))

  );

  if (twTbody){

    twTbody.innerHTML = list.length

    ? list.map(r => `

      <tr>
        <td>${r.kode || '-'}</td>
        <td>${dispFromYMD(r.tanggalYMD)}</td>
        <td>${r.lokasi || '-'}</td>
        <td>${r.status || ''}</td>
      </tr>

    `).join('')

    : `

      <tr>
        <td colspan="4">
          Tidak ada jadwal hari ini
        </td>
      </tr>

    `;

  }

  updateStatusChart(list);

}

// ============================
// STATUS CHART
// ============================

function updateStatusChart(todayRows){

  if (!chartStatus) return;

  const c = {

    Selesai:0,
    Belum:0

  };

  for (const r of todayRows){

    const s =
    (r.status || "").toLowerCase();

    if (s === "selesai"){

      c.Selesai++;

    } else {

      c.Belum++;

    }

  }

  chartStatus.data.datasets[0].data = [

    c.Selesai,
    c.Belum

  ];

  chartStatus.update();

}

// ============================
// MONTHLY CHART
// ============================

function updateMonthlyChart(allRows){

  if (!chartMonthly || !monthPicker) return;

  const v = monthPicker.value;

  if (!/^\d{4}-\d{2}$/.test(v || "")) return;

  const [yy,mm] =
  v.split('-').map(Number);

  const dim =
  daysInMonth(yy, mm);

  const labels =
  Array.from(

    {length:dim},

    (_,i)=> String(i+1)

  );

  const total =
  Array(dim).fill(0);

  const done =
  Array(dim).fill(0);

  for (const r of allRows){

    if (!r.tanggalYMD) continue;

    const [y,m,d] =
    r.tanggalYMD
    .split('-')
    .map(Number);

    if (y===yy && m===mm){

      total[d-1] += 1;

      if (
        (r.status || "")
        .toLowerCase() === "selesai"
      ){

        done[d-1] += 1;

      }

    }

  }

  const sumT =
  total.reduce((a,b)=>a+b,0);

  const sumD =
  done.reduce((a,b)=>a+b,0);

  const pct =
  sumT
  ? Math.round(sumD/sumT*100)
  : 0;

  if (monthSummary){

    monthSummary.textContent =

    `Total bulan ini: ${sumT} jadwal • Selesai: ${sumD} (${pct}%)`;

  }

  chartMonthly.data.labels = labels;

  chartMonthly.data.datasets[0].data = total;

  chartMonthly.data.datasets[1].data = done;

  chartMonthly.update();

}

// ============================
// LOAD ALL
// ============================

async function loadAll(){

  try{

    if (twDateEl){

      twDateEl.textContent =
      `Hari ini: ${toDDMMYYYY(new Date())}`;

    }

    twShowMsg("Memuat data...");

    ensureCharts();

    const res =
    await fetchJadwal();

    console.log("JADWAL:", res);

    if(
      !res?.success ||
      !Array.isArray(res.data)
    ){

      twShowMsg(

        res?.message ||
        "Gagal memuat data"

      );

      return;

    }

    twHideMsg();

    const rows =
    normalizeRows(res.data);

    if (
      monthPicker &&
      !monthPicker.value
    ){

      const d = new Date();

      monthPicker.value =

      `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;

    }

    renderToday(rows);

    updateMonthlyChart(rows);

    if (monthPicker){

      monthPicker.onchange = () =>
      updateMonthlyChart(rows);

    }

  } catch(err){

    console.error(err);

    twShowMsg(

      `Gagal memuat: ${err.message}`

    );

  }

}

// ============================
// DECISION MAKING
// ============================

function renderDecision(data){

  const el =
document.getElementById("decisionContent");

  if(!el) return;

  let html = "";

  // ======================
  // COMPLIANCE
  // ======================

  if(data.compliance < 60){

    html += `

      <div class="decision-item decision-danger">

        <b>Compliance Rendah</b><br>

        Jadwal inspeksi yang selesai
        masih di bawah 60%.
        Disarankan melakukan evaluasi
        terhadap kedisiplinan inspeksi
        dan monitoring aktivitas unit.

      </div>

    `;

  } else if(data.compliance < 85){

    html += `

      <div class="decision-item decision-warning">

        <b>Compliance Cukup</b><br>

        Tingkat penyelesaian inspeksi
        sudah cukup baik namun masih
        perlu peningkatan agar mencapai
        target optimal.

      </div>

    `;

  } else {

    html += `

      <div class="decision-item decision-good">

        <b>Compliance Sangat Baik</b><br>

        Sistem inspeksi berjalan optimal
        dan tingkat penyelesaian jadwal
        sudah sangat baik.

      </div>

    `;

  }

  // ======================
  // HIGH PRIORITY
  // ======================

  if(data.highPriority >= 10){

    html += `

      <div class="decision-item decision-danger">

        <b>High Priority Tinggi</b><br>

        Ditemukan banyak temuan prioritas tinggi.
        Disarankan segera melakukan
        preventive maintenance dan
        pengecekan unit kritikal.

      </div>

    `;

  } else if(data.highPriority > 0){

    html += `

      <div class="decision-item decision-warning">

        <b>Terdapat Temuan Prioritas Tinggi</b><br>

        Beberapa unit memerlukan
        perhatian khusus agar tidak
        berkembang menjadi breakdown.

      </div>

    `;

  } else {

    html += `

      <div class="decision-item decision-good">

        <b>Tidak Ada High Priority</b><br>

        Kondisi unit relatif aman
        dan stabil untuk operasional.

      </div>

    `;

  }

  // ======================
  // UPCOMING HM
  // ======================

  if(data.upcoming && data.upcoming.length){

    data.upcoming.forEach(u => {

      html += `

        <div class="decision-item decision-warning">

          <b>Upcoming Inspection HM</b><br>

          Unit <b>${u.unit}</b>
          mendekati interval inspeksi.
          Current HM:
          <b>${u.currentHM}</b>,
          Due HM:
          <b>${u.dueHM}</b>.

        </div>

      `;

    });

  }

  el.innerHTML = html;

}

// ============================
// LOAD ANALYTICS
// ============================

async function loadAnalytics(){

  try{

    const res = await postWorker({
      action:'getDashboardAnalytics'
    });

    console.log("ANALYTICS:", res);

    if(!res.success) return;

    const data = res.data;

    const totalInspection =
    document.getElementById("totalInspection");

    const highPriority =
    document.getElementById("highPriority");

    const compliance =
    document.getElementById("compliance");

    if(totalInspection){

      totalInspection.innerText =
      data.totalInspection || 0;

    }

    if(highPriority){

      highPriority.innerText =
      data.highPriority || 0;

    }

    if(compliance){

      compliance.innerText =
      (data.compliance || 0) + "%";

    }

    renderDecision(data);

  }catch(err){

    console.log(err);

  }

}

// ============================
// EVENT
// ============================

document
.getElementById("tw-refresh")
?.addEventListener(
  "click",
  loadAll
);

// ============================
// ANALYSIS — SHARED STATE
// ============================

let rawInspeksiData = [];  // cache hasil getInspeksi
let chartTopComp = null;
let chartPrio    = null;

// ============================
// ANALYSIS — FETCH DATA
// ============================

async function fetchInspeksiData(){

  try {

    const res = await postWorker({ action: "getInspeksi" });

    if (!res.success || !Array.isArray(res.data)) return [];

    return res.data;

  } catch(e) {

    console.error("[Analysis] fetchInspeksi error:", e);

    return [];

  }

}

// ============================
// ANALYSIS — HELPERS
// ============================

function parseDateFromRow(row){

  // Coba berbagai key nama kolom yang mungkin ada di spreadsheet
  const raw =
    row.tanggal   ||
    row.Tanggal   ||
    row.date      ||
    row.Date      ||
    row.tgl       ||
    "";

  if (!raw) return null;

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw))
    return new Date(raw.slice(0,10));

  // Format DD/MM/YYYY
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(raw).trim());
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);

  const d = new Date(raw);
  return isNaN(d) ? null : d;

}

function filterByDays(rows, days){

  if (!days || days === "all") return rows;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));

  return rows.filter(r => {
    const d = parseDateFromRow(r);
    return d && d >= cutoff;
  });

}

// ============================
// TOP PROBLEM COMPONENT
// ============================

function buildTopComp(rows, topN = 8){

  const count = {};

  rows.forEach(row => {

    // Items bisa berupa array atau string JSON
    let items = row.items || row.Items || [];

    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch(e) { items = []; }
    }

    if (!Array.isArray(items)) return;

    items.forEach(item => {

      // Ambil nama komponen dari berbagai kemungkinan key
      const comp =
        (item.bab         ||
         item.componentGroup ||
         item.component   ||
         item.komponen    ||
         item.namaBarang  ||
         "").toString().trim();

      if (!comp) return;

      count[comp] = (count[comp] || 0) + 1;

    });

  });

  return Object.entries(count)
    .sort((a,b) => b[1] - a[1])
    .slice(0, topN);

}

function renderTopComp(rows){

  const msgEl = document.getElementById("topCompMsg");
  const data   = buildTopComp(rows);

  if (!data.length){
    if (msgEl) msgEl.textContent = "Belum ada data komponen tersedia.";
    if (chartTopComp) { chartTopComp.data.labels = []; chartTopComp.data.datasets[0].data = []; chartTopComp.update(); }
    return;
  }

  if (msgEl) msgEl.textContent = `${data.length} komponen teratas berdasarkan frekuensi temuan`;

  const labels = data.map(d => d[0]);
  const values = data.map(d => d[1]);

  // Palet warna gradient dari accent ke warning
  const colors = [
    "#ef4444","#f97316","#f59e0b",
    "#eab308","#84cc16","#22c55e",
    "#1fd4ff","#4f7cff"
  ];

  const canvas = document.getElementById("chartTopComp");
  if (!canvas) return;

  if (chartTopComp){

    chartTopComp.data.labels            = labels;
    chartTopComp.data.datasets[0].data  = values;
    chartTopComp.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
    chartTopComp.update();

  } else {

    chartTopComp = new Chart(canvas, {

      type: "bar",

      data: {

        labels,

        datasets: [{

          label: "Jumlah Temuan",

          data: values,

          backgroundColor: colors.slice(0, labels.length),

          borderRadius: 8,

          borderSkipped: false,

        }]

      },

      options: {

        indexAxis: "y",   // horizontal bar = lebih mudah dibaca nama komponen

        maintainAspectRatio: false,

        plugins: {

          legend: { display: false },

          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.x} temuan`
            }
          }

        },

        scales: {

          x: {
            beginAtZero: true,
            ticks: { color: "#a8b4cf", precision: 0 },
            grid:  { color: "rgba(255,255,255,0.07)" }
          },

          y: {
            ticks: {
              color: "#f4f7ff",
              font: { size: 12 },
              // Potong label panjang agar tidak overflow
              callback: v => v.length > 22 ? v.slice(0,20)+"…" : v
            },
            grid: { display: false }
          }

        }

      }

    });

  }

}

// ============================
// PRIORITY DISTRIBUTION
// ============================

function buildPrioDist(rows){

  const count = { P1: 0, P2: 0, P3: 0, Other: 0 };

  rows.forEach(row => {

    const p = (
      row.priority ||
      row.Priority ||
      row.prioritas ||
      ""
    ).toString().trim().toUpperCase();

    if      (p.startsWith("P1")) count.P1++;
    else if (p.startsWith("P2")) count.P2++;
    else if (p.startsWith("P3")) count.P3++;
    else if (p)                   count.Other++;

  });

  return count;

}

function renderPrioDist(rows){

  const dist   = buildPrioDist(rows);
  const total  = dist.P1 + dist.P2 + dist.P3 + dist.Other;
  const canvas = document.getElementById("chartPrio");
  const legend = document.getElementById("prioLegend");

  if (!canvas) return;

  const labels = ["P1 — Critical","P2 — Medium","P3 — Low"];
  const values = [dist.P1, dist.P2, dist.P3];
  const colors = ["#ef4444","#f59e0b","#10b981"];

  // Tambahkan "Other" hanya kalau ada
  if (dist.Other > 0){
    labels.push("Lainnya");
    values.push(dist.Other);
    colors.push("#a8b4cf");
  }

  if (chartPrio){

    chartPrio.data.labels           = labels;
    chartPrio.data.datasets[0].data = values;
    chartPrio.update();

  } else {

    chartPrio = new Chart(canvas, {

      type: "doughnut",

      data: {

        labels,

        datasets: [{

          data:            values,
          backgroundColor: colors,
          borderWidth:     3,
          borderColor:     "#111c34",
          hoverOffset:     12

        }]

      },

      options: {

        maintainAspectRatio: false,

        cutout: "68%",

        plugins: {

          legend: { display: false },

          tooltip: {
            callbacks: {
              label: ctx => {
                const pct = total
                  ? ((ctx.parsed / total) * 100).toFixed(1)
                  : 0;
                return ` ${ctx.parsed} inspeksi (${pct}%)`;
              }
            }
          }

        }

      }

    });

  }

  // Custom legend
  if (legend){

    legend.innerHTML = labels.map((l,i) => {

      const pct = total
        ? ((values[i] / total) * 100).toFixed(1)
        : 0;

      return `
        <div class="prio-legend-item">
          <span class="prio-dot" style="background:${colors[i]}"></span>
          <span class="prio-label">${l}</span>
          <span class="prio-val">${values[i]} <em>(${pct}%)</em></span>
        </div>
      `;

    }).join("");

  }

}

// ============================
// ANALYSIS — LOAD & WIRE
// ============================

async function loadAnalysisCharts(){

  if (!rawInspeksiData.length){
    rawInspeksiData = await fetchInspeksiData();
  }

  const compDays = document.getElementById("topCompFilter")?.value || "all";
  const prioDays = document.getElementById("prioFilter")?.value    || "all";

  renderTopComp(filterByDays(rawInspeksiData, compDays));
  renderPrioDist(filterByDays(rawInspeksiData, prioDays));

}

// ============================
// EVENT
// ============================

document
.getElementById("tw-refresh")
?.addEventListener(
  "click",
  loadAll
);

document
.getElementById("topCompFilter")
?.addEventListener("change", () => {
  renderTopComp(
    filterByDays(
      rawInspeksiData,
      document.getElementById("topCompFilter").value
    )
  );
});

document
.getElementById("prioFilter")
?.addEventListener("change", () => {
  renderPrioDist(
    filterByDays(
      rawInspeksiData,
      document.getElementById("prioFilter").value
    )
  );
});

// ============================
// START
// ============================

window.addEventListener("DOMContentLoaded", () => {

  loadAll();

  loadAnalytics();

  loadAnalysisCharts();

  setInterval(() => {

    loadAll();

    loadAnalytics();

    rawInspeksiData = []; // reset cache agar refresh ambil data terbaru

    loadAnalysisCharts();

  }, AUTO_REFRESH_MS);

});

window.postWorker = postWorker;

})();
