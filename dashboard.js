document.addEventListener("DOMContentLoaded", () => {

  const buttons =
    document.querySelectorAll(".sidebar button");

  const iframe =
    document.getElementById("iframe-content");

  // =========================
  // SIDEBAR CLICK
  // =========================

  buttons.forEach(btn => {

    btn.addEventListener("click", () => {

      const page =
        btn.dataset.page;

      if(page){

        iframe.src = page;

      }

    });

  });

});



// =========================
// DETAIL ANALYTICS MODAL
// =========================

async function openAnalyticsDetail(type){

  const modalEl =
    document.getElementById(
      'analyticsModal'
    );

  const modalContent =
    document.getElementById(
      'analyticsModalContent'
    );

  const modalTitle =
    document.getElementById(
      'analyticsModalTitle'
    );

  modalContent.innerHTML = 'Loading...';

  const modal =
    new bootstrap.Modal(modalEl);

  modal.show();

  try {

    const res = await fetch(
      WORKER_URL,
      {
        method:'POST',

        headers:{
          'Content-Type':'application/json'
        },

        body: JSON.stringify({
          action:'getAnalyticsDetail',
          type
        })
      }
    );

    const result = await res.json();

   if(!result.success){

      modalContent.innerHTML =
        result.message || 'Gagal';
    
      return;

    }

    const rows = result.data || [];

    // =========================
    // TITLE
    // =========================

    if(type === 'totalInspection'){
      modalTitle.innerHTML =
        'Detail Total Inspection';
    }

    if(type === 'highPriority'){
      modalTitle.innerHTML =
        'Detail High Priority';
    }

    if(type === 'compliance'){
      modalTitle.innerHTML =
        'Detail Compliance';
    }

    // =========================
    // EMPTY
    // =========================

    if(rows.length === 0){

      modalContent.innerHTML =
        'Tidak ada data';

      return;

    }

     // =========================
    // TABLE
    // =========================

    let html = `

      <div class="table-responsive">


      <table class="table table-bordered table-hover">

        <thead class="table-dark">

          <tr>
            <th>Date</th>
            <th>Unit</th>
            <th>Site</th>
            <th>Priority</th>
          </tr>

        </thead>

        <tbody>
    `;

    rows.forEach(row => {

      html += `
        <tr>

          <td>
            ${
              row['Date'] ||
              row['Tanggal'] ||
              ''
            }
          </td>

          <td>
            ${
              row['Code Unit'] ||
              row.kode ||
              ''
            }
          </td>

          <td>
            ${
              row['Site'] ||
              row.lokasi ||
              ''
            }
          </td>

          <td>
            ${
              row['Urgency'] ||
              row['Priority'] ||
              row.status ||
              ''
            }
          </td>

        </tr>
      `;

    });

    html += `
        </tbody>
      </table>
      </div>
    `;

    modalContent.innerHTML = html;

  } catch(err){

    console.error(err);

    modalContent.innerHTML =
      'Terjadi error';

  }

}


// =========================
// CARD CLICK
// =========================

document
.getElementById('totalInspectionCard')
?.addEventListener(
  'click',
  () => openAnalyticsDetail(
    'totalInspection'
  )
);


document
.getElementById('highPriorityCard')
?.addEventListener(
  'click',
  () => openAnalyticsDetail(
    'highPriority'
  )
);


document
.getElementById('complianceCard')
?.addEventListener(
  'click',
  () => openAnalyticsDetail(
    'compliance'
  )
);
