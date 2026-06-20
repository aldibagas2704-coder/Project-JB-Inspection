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
// TODAY WARNING
// ============================

async function loadTodayWarning(){

  if(!twTbody) return;

  twShowMsg('Memuat data...');

  twTbody.innerHTML = "";

  try{

    const res =
    await postWorker({
      action:'getTodayWarning'
    });

    const rows =
    Array.isArray(res.data)
    ? res.data
    : [];

    const today =
    res.today || todayYMD();

    if(twDateEl){

      twDateEl.textContent =
      dispFromYMD(today);

    }

    if(!rows.length){

      twTbody.innerHTML = `
        <tr>
          <td colspan="5"
              class="muted">
            Tidak ada unit yang jatuh tempo hari ini
          </td>
        </tr>
      `;

      twShowMsg(
      "Tidak ada data jatuh tempo.");

      return;

    }

    twHideMsg();

    twTbody.innerHTML =
    rows.map(r=>`

      <tr>

        <td>${r.Unit || '-'}</td>

        <td>${r.Component || '-'}</td>

        <td>${r.HM || '-'}</td>

        <td>${r.NextPM || '-'}</td>

        <td>

          <span class="badge badge-warning">

            Due Today

          </span>

        </td>

      </tr>

    `).join('');

  }catch(err){

    console.error(err);

    twShowMsg(
      'Gagal memuat data.'
    );

  }

}

// ============================
// MONTHLY PM
// ============================

async function loadMonthlyPM(){

  if(!monthPicker) return;

  const ym = monthPicker.value;

  if(!ym) return;

  const [year,month] =
  ym.split("-").map(Number);

  try{

    const res =
    await postWorker({

      action:'getMonthlyPM',

      year,

      month

    });

    const rows =
    Array.isArray(res.data)
    ? res.data
    : [];

    if(monthSummary){

      monthSummary.innerHTML = `
        Total Schedule:
        <b>${rows.length}</b>
        unit
      `;

    }

    renderMonthlyChart(rows);

  }catch(err){

    console.error(err);

  }

}

// ============================
// CHART MONTHLY
// ============================

function renderMonthlyChart(rows){

  const canvas =
  document.getElementById(
    'monthlyChart'
  );

  if(!canvas) return;

  const ym =
  monthPicker.value;

  const [year,month] =
  ym.split('-').map(Number);

  const days =
  daysInMonth(year,month);

  const labels =
  Array.from(
    {length:days},
    (_,i)=>String(i+1)
  );

  const counts =
  Array(days).fill(0);

  rows.forEach(r=>{

    const ymd =
    anyToYMD(
      r.Date ||
      r.Tanggal ||
      r.date
    );

    if(!ymd) return;

    const d =
    Number(
      ymd.split('-')[2]
    );

    if(d>=1 && d<=days){

      counts[d-1]++;

    }

  });

  if(chartMonthly){

    chartMonthly.destroy();

  }

  chartMonthly =
  new Chart(canvas, {

    type:'bar',

    data:{

      labels,

      datasets:[{

        label:'Jumlah PM',

        data:counts

      }]

    },

    options:{

      responsive:true,

      maintainAspectRatio:false,

      plugins:{

        legend:{

          display:false

        }

      },

      scales:{

        y:{

          beginAtZero:true,

          ticks:{

            precision:0

          }

        }

      }

    }

  });

}

// ============================
// STATUS CHART
// ============================

function renderStatusChart(data){

  const canvas =
  document.getElementById(
    'statusChart'
  );

  if(!canvas) return;

  const labels = [
    'Open',
    'Progress',
    'Closed'
  ];

  const values = [

    data.open || 0,

    data.progress || 0,

    data.closed || 0

  ];

  if(chartStatus){

    chartStatus.destroy();

  }

  chartStatus =
  new Chart(canvas, {

    type:'doughnut',

    data:{

      labels,

      datasets:[{

        data:values

      }]

    },

    options:{

      responsive:true,

      maintainAspectRatio:false

    }

  });

}

// ============================
// ANALYTICS
// ============================

async function loadAnalytics(){

  try{

    const res =
    await getWorker(
      'dashboardAnalytics'
    );

    if(!res.success) return;

    const data = res.data || {};

    const totalInspection =
    document.getElementById(
      "totalInspection"
    );

    const totalOpen =
    document.getElementById(
      "totalOpen"
    );

    const totalClosed =
    document.getElementById(
      "totalClosed"
    );

    const totalProgress =
    document.getElementById(
      "totalProgress"
    );

    if(totalInspection){

      totalInspection.innerText =
      data.totalInspection || 0;

    }

    if(totalOpen){

      totalOpen.innerText =
      data.open || 0;

    }

    if(totalClosed){

      totalClosed.innerText =
      data.closed || 0;

    }

    if(totalProgress){

      totalProgress.innerText =
      data.progress || 0;

    }

    renderStatusChart(data);

    renderKPI(data);

  }catch(err){

    console.error(err);

  }

}

// ============================
// KPI
// ============================

function renderKPI(data){

  const compliance =
  document.getElementById(
    "complianceRate"
  );

  const complianceDesc =
  document.getElementById(
    "complianceDesc"
  );

  const decisionBox =
  document.getElementById(
    "decisionBox"
  );

  if(compliance){

    compliance.innerText =
    (data.compliance || 0)
    + "%";

  }

  const rate =
  Number(
    data.compliance || 0
  );

  if(complianceDesc){

    if(rate >= 95){

      complianceDesc.innerHTML =
      "Sangat baik, tingkat kepatuhan inspeksi berada pada kategori optimal.";

    }else if(rate >= 80){

      complianceDesc.innerHTML =
      "Baik, namun masih terdapat peluang peningkatan.";

    }else{

      complianceDesc.innerHTML =
      "Perlu perhatian karena tingkat kepatuhan masih rendah.";

    }

  }

  if(!decisionBox) return;

  let html = "";

  if(rate >= 95){

    html += `
      <div class="decision-good">
        Sistem inspeksi berjalan optimal dan konsisten.
      </div>
    `;

  }else if(rate >= 80){

    html += `
      <div class="decision-warning">
        Perlu peningkatan konsistensi inspeksi untuk mencapai target maksimal.
      </div>
    `;

  }else{

    html += `
      <div class="decision-danger">
        Dibutuhkan evaluasi terhadap pelaksanaan inspeksi dan tindak lanjut.
      </div>
    `;

  }

  if(data.topComponent){

    html += `
      <div class="decision-item">
        Komponen dengan temuan tertinggi:
        <b>${data.topComponent}</b>
      </div>
    `;

  }

  if(data.priority1 > 0){

    html += `
      <div class="decision-item">
        Terdapat
        <b>${data.priority1}</b>
        temuan Priority 1 yang memerlukan tindakan segera.
      </div>
    `;

  }

  decisionBox.innerHTML = html;

}

 // ============================
// INIT MONTH PICKER
// ============================

function initMonthPicker(){

  if(!monthPicker) return;

  const now = new Date();

  monthPicker.value =
  `${now.getFullYear()}-${pad2(now.getMonth()+1)}`;

}

// ============================
// AUTO REFRESH
// ============================

function startAutoRefresh(){

  setInterval(() => {

    loadTodayWarning();

    loadMonthlyPM();

    loadAnalytics();

  }, AUTO_REFRESH_MS);

}

// ============================
// EVENT
// ============================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    initMonthPicker();

    loadTodayWarning();

    loadMonthlyPM();

    loadAnalytics();

    startAutoRefresh();

    if(monthPicker){

      monthPicker.addEventListener(
        "change",
        loadMonthlyPM
      );

    }

  }
);

})();
