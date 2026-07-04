(() => {

const WORKER_URL = "https://jb-inspection-27a4.aldibagas2704.workers.dev/";

// ============================
// HELPERS
// ============================

const pad2 = n => String(n).padStart(2, "0");

function parseDateFromRow(row) {
  const raw = row.Tanggal || row.tanggal || row.date || row.Date || "";
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return new Date(raw.slice(0, 10));
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(raw).trim());
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function filterByDays(rows, days) {
  if (!days || days === "all") return rows;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));
  return rows.filter(r => {
    const d = parseDateFromRow(r);
    return d && d >= cutoff;
  });
}

// ============================
// FETCH
// ============================

async function fetchInspeksi() {
  const r = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getInspeksi" })
  });
  const res = await r.json();
  if (!res.success || !Array.isArray(res.data)) return [];
  return res.data;
}

// ============================
// PARETO KALKULASI
// ============================

function buildParetoData(rows) {

  const count = {};

  rows.forEach(row => {
    const comp = (
      row["Bab"]                   ||
      row["Bab (Component Group)"] ||
      row.bab                      ||
      row.componentGroup           ||
      ""
    ).toString().trim();

    if (!comp) return;
    count[comp] = (count[comp] || 0) + 1;
  });

  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const total  = sorted.reduce((s, [, v]) => s + v, 0);

  let cumulative = 0;

  return sorted.map(([comp, freq]) => {

    const pct = total ? (freq / total) * 100 : 0;
    cumulative += pct;

    let kategori;
    if (cumulative <= 80) kategori = "A";
    else if (cumulative <= 95) kategori = "B";
    else kategori = "C";

    return {
      komponen: comp,
      frekuensi: freq,
      persen: pct,
      kumulatif: cumulative,
      kategori
    };
  });
}

// ============================
// INSIGHT CARDS
// ============================

function renderInsightCards(data) {

  const total = data.length;
  const katA  = data.filter(d => d.kategori === "A");

  const pctA = katA.length
    ? katA[katA.length - 1].kumulatif.toFixed(1)
    : "0";

  const dominant = data.length
    ? data[0].komponen
    : "—";

  document.getElementById("icTotal").textContent = total;
  document.getElementById("icKatA").textContent  = katA.length + " komp.";
  document.getElementById("icPctA").textContent  = pctA + "%";

  document.getElementById("icDominant").textContent =
    dominant.length > 12
      ? dominant.slice(0, 11) + "…"
      : dominant;
}

// ============================
// INSIGHT BOX
// ============================

function renderInsightBox(data, filterDays) {

  const el = document.getElementById("insightText");
  if (!el || !data.length) return;

  const katA = data.filter(d => d.kategori === "A");
  const katB = data.filter(d => d.kategori === "B");

  const total = data.reduce(
    (s, d) => s + d.frekuensi,
    0
  );

  const pctA = katA.length
    ? katA[katA.length - 1].kumulatif.toFixed(1)
    : "0";

  const dominant = data[0].komponen;
  const domPct   = data[0].persen.toFixed(1);

  const periodeLabel =
    filterDays === "all" ? "all time" :
    filterDays === "7" ? "last 7 days" :
    filterDays === "30" ? "last 30 days" :
    "last 90 days";

  el.innerHTML = `
    Out of <b>${total} total findings</b> over <b>${periodeLabel}</b>,
    the <b>${dominant}</b> component dominates with a contribution of
    <b>${domPct}%</b>.

    A total of <b>${katA.length} components</b>
    fall into Priority A (Critical) and account for
    <b>${pctA}%</b> of all findings.

    ${katB.length
      ? `There are <b>${katB.length} components</b>
         in Priority B that require regular monitoring.`
      : ""}
  `;
}

// ============================
// CHART PARETO
// ============================

let chartPareto = null;

function renderChart(data) {

  const canvas = document.getElementById("chartPareto");
  if (!canvas || !data.length) return;

  const labels  = data.map(d => d.komponen);
  const freqs   = data.map(d => d.frekuensi);
  const cumPcts = data.map(d => parseFloat(d.kumulatif.toFixed(2)));

  const barColors = data.map(d =>
    d.kategori === "A"
      ? "#ef4444"
      : d.kategori === "B"
      ? "#f59e0b"
      : "#10b981"
  );

  const line80Plugin = {
    id: "line80",
    afterDraw(chart) {

      const { ctx, scales:{ yRight } } = chart;
      if (!yRight) return;

      const y = yRight.getPixelForValue(80);

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6,4]);
      ctx.strokeStyle = "rgba(56,189,248,0.6)";
      ctx.lineWidth = 1.5;
      ctx.moveTo(chart.chartArea.left, y);
      ctx.lineTo(chart.chartArea.right, y);
      ctx.stroke();
      ctx.restore();
    }
  };

  if (chartPareto) {

    chartPareto.data.labels = labels;
    chartPareto.data.datasets[0].data = freqs;
    chartPareto.data.datasets[0].backgroundColor = barColors;
    chartPareto.data.datasets[1].data = cumPcts;

    chartPareto.update();
    return;
  }

  chartPareto = new Chart(canvas, {

    plugins:[line80Plugin],

    data:{
      labels,
      datasets:[
        {
          type:"bar",
          label:"Fault Frequency",
          data:freqs,
          backgroundColor:barColors,
          borderRadius:5,
          yAxisID:"yLeft",
          order:2
        },
        {
          type:"line",
          label:"Cumulative %",
          data:cumPcts,
          borderColor:"#38bdf8",
          borderWidth:2.5,
          pointRadius:5,
          pointBackgroundColor:"#38bdf8",
          pointBorderColor:"#111c34",
          pointBorderWidth:2,
          tension:0.3,
          yAxisID:"yRight",
          order:1
        }
      ]
    },

    options:{
      responsive:true,
      maintainAspectRatio:false,

      plugins:{
        legend:{
          labels:{
            color:"#a8b4cf",
            font:{
              family:"Poppins",
              size:12
            }
          }
        },

        tooltip:{
          callbacks:{
            afterBody(ctx){

              const idx = ctx[0].dataIndex;
              const d   = data[idx];

              return [
                `Cumulative : ${d.kumulatif.toFixed(1)}%`,
                `Priority   : ${d.kategori}`
              ];
            }
          }
        }
      },

      scales:{

        yLeft:{
          type:"linear",
          position:"left",
          beginAtZero:true,
          title:{
            display:true,
            text:"Fault Frequency"
          }
        },

        yRight:{
          type:"linear",
          position:"right",
          min:0,
          max:100,
          title:{
            display:true,
            text:"Cumulative (%)"
          },
          ticks:{
            callback:v => v + "%"
          },
          grid:{
            drawOnChartArea:false
          }
        }
      }
    }
  });
}

// ============================
// TABLE
// ============================

function renderTable(data) {

  const tbody = document.getElementById("paretoTbody");
  const msgEl = document.getElementById("paretoMsg");

  if (!tbody) return;

  if (!data.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            style="text-align:center;padding:24px">
          No data available for analysis.
        </td>
      </tr>
    `;

    if(msgEl) msgEl.textContent = "No data.";
    return;
  }

  const totalFreq = data.reduce(
    (s,d)=>s+d.frekuensi,
    0
  );

  const katA = data.filter(
    d=>d.kategori==="A"
  );

  if(msgEl){
    msgEl.textContent =
      `${data.length} components analyzed •
      ${katA.length} Priority A`;
  }

  tbody.innerHTML = data.map((d,i)=>{

    const cumWidth = Math.min(
      d.kumulatif,
      100
    ).toFixed(1);

    const badgeClass =
      d.kategori==="A"
        ? "badge-a"
        : d.kategori==="B"
        ? "badge-b"
        : "badge-c";

    const badgeLabel =
      d.kategori==="A"
        ? "🔴 A — Critical"
        : d.kategori==="B"
        ? "🟡 B — Monitor"
        : "🟢 C — Low Risk";

    return `
      <tr class="${d.kategori==="A" ? "row-a" : ""}">
        <td>${i+1}</td>
        <td>${d.komponen}</td>
        <td>${d.frekuensi}</td>
        <td>${d.persen.toFixed(1)}%</td>
        <td>${d.kumulatif.toFixed(1)}%</td>

        <td>
          <div class="cum-bar-wrap">
            <div
              class="cum-bar-fill fill-${d.kategori.toLowerCase()}"
              style="width:${cumWidth}%">
            </div>
          </div>
        </td>

        <td>
          <span class="badge ${badgeClass}">
            ${badgeLabel}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

// ============================
// LOAD DATA
// ============================

let rawData = [];

async function loadAll() {

  const filterEl =
    document.getElementById("paretoFilter");

  const days =
    filterEl
      ? filterEl.value
      : "all";

  if (!rawData.length) {

    const msgEl =
      document.getElementById("paretoMsg");

    if(msgEl)
      msgEl.textContent =
      "Loading data from server...";

    rawData = await fetchInspeksi();
  }

  const filtered =
    filterByDays(rawData, days);

  const paretoData =
    buildParetoData(filtered);

  renderInsightCards(paretoData);
  renderInsightBox(paretoData, days);
  renderChart(paretoData);
  renderTable(paretoData);
}

// ============================
// EVENTS
// ============================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    loadAll();

    document
      .getElementById("paretoFilter")
      ?.addEventListener(
        "change",
        loadAll
      );

    document
      .getElementById("btnRefresh")
      ?.addEventListener(
        "click",
        () => {
          rawData = [];
          loadAll();
        }
      );
  }
);

})();
