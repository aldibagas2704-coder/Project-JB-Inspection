// ===============================
// DASHBOARD INSPEKSI - FIX VERSION
// ===============================

const tableBody = document.querySelector('#itemsTable tbody');
const addRowBtn = document.getElementById('addRowBtn');
const addSubRowBtn = document.getElementById('addSubRowBtn');
const form = document.getElementById('myForm');
const output = document.getElementById('output');
const overlay = document.getElementById('overlay');

// =========================================
// FUNCTION TAMBAH ROW INSPEKSI
// =========================================

function createRow(type = 'inspection') {

  const row = document.createElement('tr');

  if (type === 'inspection') {

    row.innerHTML = `
      <td>
        <input type="text" class="form-control" placeholder="Description">
      </td>

      <td>
        <select class="form-select">
          <option value="">Pilih</option>
          <option value="GOOD">GOOD</option>
          <option value="MONITOR">MONITOR</option>
          <option value="REPAIR">REPAIR</option>
          <option value="REPLACE">REPLACE</option>
        </select>
      </td>

      <td>
        <input type="file" class="form-control" accept="image/*">
      </td>

      <td>
        <input type="text" class="form-control" placeholder="Part Number">
      </td>

      <td>
        <input type="text" class="form-control" placeholder="Nama Barang">
      </td>

      <td>
        <input type="number" class="form-control" placeholder="Qty">
      </td>

      <td>
        <input type="text" class="form-control" placeholder="Satuan">
      </td>

      <td>
        <input type="text" class="form-control" placeholder="Component Group">
      </td>

      <td>
        <input type="text" class="form-control" placeholder="Sub Component">
      </td>

      <td class="text-center">
        <input type="checkbox" class="form-check-input">
      </td>

      <td>
        <button type="button" class="btn btn-danger btn-sm deleteRowBtn">
          Hapus
        </button>
      </td>
    `;

  } else {

    row.innerHTML = `
      <td>
        <input type="text" class="form-control bg-warning-subtle" placeholder="FPB Description">
      </td>

      <td colspan="8">
        <input type="text" class="form-control bg-warning-subtle" placeholder="Keterangan FPB / Catatan Tambahan">
      </td>

      <td class="text-center">
        <input type="checkbox" class="form-check-input" checked>
      </td>

      <td>
        <button type="button" class="btn btn-danger btn-sm deleteRowBtn">
          Hapus
        </button>
      </td>
    `;

  }

  tableBody.appendChild(row);
}

// =========================================
// TAMBAH ROW SAAT BUTTON DIKLIK
// =========================================

addRowBtn.addEventListener('click', () => {
  createRow('inspection');
});

addSubRowBtn.addEventListener('click', () => {
  createRow('fpb');
});

// =========================================
// DELETE ROW
// =========================================

document.addEventListener('click', function (e) {

  if (e.target.classList.contains('deleteRowBtn')) {
    e.target.closest('tr').remove();
  }

});

// =========================================
// DEFAULT ROW AWAL
// =========================================

createRow('inspection');

// =========================================
// SUBMIT FORM
// =========================================

form.addEventListener('submit', async function (e) {

  e.preventDefault();

  overlay.classList.remove('d-none');

  try {

    const rows = document.querySelectorAll('#itemsTable tbody tr');

    const items = [];

    for (const row of rows) {

      const inputs = row.querySelectorAll('input, select');

      const fileInput = row.querySelector('input[type="file"]');

      let imageBase64 = '';

      if (fileInput && fileInput.files[0]) {

        imageBase64 = await new Promise((resolve) => {

          const reader = new FileReader();

          reader.onload = function (event) {
            resolve(event.target.result);
          };

          reader.readAsDataURL(fileInput.files[0]);

        });
      }

      items.push({
        description: inputs[0]?.value || '',
        condition: inputs[1]?.value || '',
        image: imageBase64,
        partNumber: inputs[3]?.value || '',
        namaBarang: inputs[4]?.value || '',
        qty: inputs[5]?.value || '',
        satuan: inputs[6]?.value || '',
        componentGroup: inputs[7]?.value || '',
        subComponent: inputs[8]?.value || '',
        masukFPB: inputs[9]?.checked || false
      });
    }

    const payload = {
      date: document.getElementById('Date').value,
      site: document.querySelector('input[name="site"]').value,
      codeUnit: document.querySelector('input[name="codeUnit"]').value,
      hourMeter: document.querySelector('input[name="hourMeter"]').value,
      inspectedBy: document.querySelector('input[name="inspectedBy"]').value,
      priority: document.querySelector('input[name="priority"]').value,
      items: items
    };

    console.log('DATA FORM :', payload);

    output.classList.remove('d-none');
    output.innerHTML = '✅ Data inspection berhasil diproses';

    form.reset();

    tableBody.innerHTML = '';

    createRow('inspection');

  } catch (error) {

    console.error(error);

    alert('Terjadi error pada sistem');

  } finally {

    overlay.classList.add('d-none');

  }

});
