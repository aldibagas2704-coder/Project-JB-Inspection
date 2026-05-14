(() => {

const WORKER_URL =
"https://script.google.com/macros/s/AKfycbwCqgzbtQYKkPHuElmJuqur8ZtmIRzq5M1N2jRZYVdWW1fls42R3jYRSYfe3QgYo_sm/exec";

const AUTO_REFRESH_MS = 60000;

// ============================
// HELPER
// ============================

const pad2 = n => String(n).padStart(2,'0');

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
ymd ? ymd.split("-").reverse().join("/") : "-";

const daysInMonth = (y,m1_12) =>
new Date(y, m1_12, 0).getDate();

// ============================
// POST WORKER
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

// ============================
// FETCH JADWAL
// ============================

async function fetchJadwal(){

  return await postWorker({
    action:'getJadwal'
  });

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

  // =========================
  // STATUS CHART
  // =========================

  const cs =
  document.getElementById("chartStatus");

  if (!chartStatus && cs){

    chartStatus = new Chart(cs, {

      type: "doughnut",

      data: {

        labels: ["Selesai","Belum"],

        datasets: [{

          data: [0,0]

        }]

      },

      options: {

        maintainAspectRatio: false,

        plugins: {

          legend: {

            position:"bottom"

          }

        }

      }

    });

  }

  // =========================
  // MONTHLY CHART
  // =========================

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

            data:[]

          },

          {

            label:"Selesai",

            data:[]

          }

        ]

      },

      options: {

        maintainAspectRatio: false,

        scales:{

          y:{
            beginAtZero:true
          }

        }

      }

    });

  }

}

// ============================
// UPDATE STATUS CHART
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
// UPDATE MONTHLY CHART
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
    r.tanggalYMD.split('-').map(Number);

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
// NORMALIZE DATA
// ============================

function normalizeRows(raw){

  return raw.map(r => ({

    kode :

    r.kode ??
    r["kode"] ??
    r["kode unit"] ??
    r["unit"] ??
    "",

    lokasi :

    r.lokasi ??
    r["lokasi"] ??
    r["site"] ??
    r["location"] ??
    "",

    status :

    (r.status ?? r["status"] ?? "")
    .toString()
    .trim(),

    tanggalYMD :

    anyToYMD(

      r.tanggal ??
      r["tanggal"] ??
      r["date"] ??
      ""

    )

  }))

  .filter(x => !!x.tanggalYMD);

}

// ============================
// RENDER TODAY
// ============================

function renderToday(rows){

  const today = todayYMD();

  const list = rows

  .filter(r =>
    r.tanggalYMD === today
  )

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
          Tidak ada jadwal untuk hari ini.
        </td>
      </tr>

    `;

  }

  updateStatusChart(list);

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

    if (

      !res?.success ||
      !Array.isArray(res.data)

    ){

      twShowMsg(

        res?.message ||
        "Gagal memuat data."

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

  }catch(err){

    twShowMsg(
      `Gagal memuat: ${err.message}`
    );

  }

}

// ============================
// LOAD ANALYTICS
// ============================

async function loadAnalytics(){

  try {

    const res = await fetch(
      `${WORKER_URL}?action=getDashboardAnalytics`
    );

    const json = await res.json();

    console.log("Analytics:", json);

    if(!json.success) return;

    const data = json.data;

    const totalEl =
    document.getElementById("totalInspection");

    const highEl =
    document.getElementById("highPriority");

    const complianceEl =
    document.getElementById("compliance");

    if(totalEl){

      totalEl.textContent =
      data.totalInspection || 0;

    }

    if(highEl){

      highEl.textContent =
      data.highPriority || 0;

    }

    if(complianceEl){

      complianceEl.textContent =
      `${data.compliance || 0}%`;

    }

  } catch(err){

    console.error(err);

  }

}

// ============================
// REFRESH BUTTON
// ============================

document
.getElementById("tw-refresh")
?.addEventListener("click", () => {

  loadAll();

  loadAnalytics();

});

// ============================
// INIT
// ============================

loadAll();

loadAnalytics();

// ============================
// AUTO REFRESH
// ============================

setInterval(() => {

  loadAll();

  loadAnalytics();

}, AUTO_REFRESH_MS);

// ============================
// GLOBAL
// ============================

window.postWorker = postWorker;

})();
