// ==========================
// KONFIGURASI GLOBAL
// ==========================
const WORKER_URL =
  "https://jb-inspection-27a4.aldibagas2704.workers.dev/";

// ==========================
// CACHE DATA KOMPONEN
// ==========================
let KOM_DATA = {
  groups: [],
  byGroup: {}
};

// ==========================
// FETCH DATA KOMPONEN
// ==========================
async function fetchKomponen() {

  try {

    console.log("Mengambil data komponen...");

    const res = await fetch(WORKER_URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        action: "getKomponen"
      })

    });

    const j = await res.json();

    console.log("HASIL FETCH:", j);

    if (!j.success || !Array.isArray(j.data)) {

      throw new Error(
        j.message || "Data komponen gagal dimuat"
      );

    }

    const byGroup = {};

    j.data.forEach(item => {

      const group =
(
  item["COMPONENT GROUP"] ||
  item["Component Group"] ||
  item.componentGroup ||
  ""
).toString().trim();

const sub =
(
  item["SUB COMPONENT"] ||
  item["Sub Component"] ||
  item.subComponent ||
  ""
).toString().trim();

const code =
(
  item["CODE"] ||
  item["Code"] ||
  item.code ||
  ""
).toString().trim();

      if (!group || !sub) return;

      if (!byGroup[group]) {

        byGroup[group] = [];

      }

      byGroup[group].push({
        name: sub,
        code: code
      });

    });

    KOM_DATA.groups =
      Object.keys(byGroup).sort();

    KOM_DATA.byGroup = byGroup;

    console.log("KOM_DATA:", KOM_DATA);

  }

  catch (err) {

    console.error(
      "ERROR FETCH KOMPONEN:",
      err
    );

    KOM_DATA = {
      groups: [],
      byGroup: {}
    };

  }

}

// ==========================
// DOM READY
// ==========================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

  // ==========================
  // ELEMENT
  // ==========================
  const form =
    document.getElementById("myForm");

  const itemsTableBody =
    document.querySelector(
      "#itemsTable tbody"
    );

  const output =
    document.getElementById("output");

  const overlay =
    document.getElementById("overlay");

  const addRowBtn =
    document.getElementById("addRowBtn");

  const addSubRowBtn =
    document.getElementById("addSubRowBtn");

  if (!form || !itemsTableBody) {

    console.error(
      "Form atau table body tidak ditemukan"
    );

    return;

  }

  // ==========================
  // SET TANGGAL HARI INI
  // ==========================
  function setToday() {

    const dateInput =
      document.getElementById("Date");

    if (!dateInput) return;

    const d = new Date();

    const yyyy =
      d.getFullYear();

    const mm =
      String(d.getMonth() + 1)
      .padStart(2, "0");

    const dd =
      String(d.getDate())
      .padStart(2, "0");

    dateInput.value =
      `${yyyy}-${mm}-${dd}`;

  }

  setToday();


  // ==========================
  // FILL COMPONENT GROUP
  // ==========================
  function fillBabOptions(selectEl) {

    if (!selectEl) return;

    selectEl.innerHTML = `
      <option value="">
        Pilih Component...
      </option>
    `;

    KOM_DATA.groups.forEach(group => {

      const opt =
        document.createElement("option");

      opt.value = group;

      opt.textContent = group;

      selectEl.appendChild(opt);

    });

    selectEl.disabled = false;

  }

  // ==========================
  // FILL SUB COMPONENT
  // ==========================
  function fillSubOptions(
    selectEl,
    group
  ) {

    if (!selectEl) return;

    selectEl.innerHTML = `
      <option value="">
        Pilih Sub Component...
      </option>
    `;

    const subs =
      KOM_DATA.byGroup[group] || [];

    subs.forEach(sub => {

      const opt =
        document.createElement("option");

      opt.value = sub.name;

      opt.textContent = sub.name;

      opt.dataset.code =
        sub.code;

      selectEl.appendChild(opt);

    });

    selectEl.disabled = false;

  }

  // ==========================
  // WIRING COMPONENT - SUB
  // ==========================
  function wireBabSub(row) {

    const babSelect =
      row.querySelector(".babSelect");

    const subSelect =
      row.querySelector(".subSelect");

    if (!babSelect || !subSelect) return;

    fillBabOptions(babSelect);

    subSelect.innerHTML = `
      <option value="">
        Pilih Sub Component...
      </option>
    `;

    subSelect.disabled = true;

    babSelect.addEventListener(
      "change",
      () => {

      fillSubOptions(
        subSelect,
        babSelect.value
      );

    });

  }

  // ==========================
  // SETUP ROW
  // ==========================
  function setupRow(row) {

    // ==========================
    // REMOVE ROW
    // ==========================
    row.querySelector(
      ".removeRowBtn"
    )?.addEventListener(
      "click",
      () => {

      row.remove();

      if (
        itemsTableBody.children.length === 0
      ) {

        addRow();

      }

    });

    // ==========================
    // IMAGE PREVIEW
    // ==========================
    const fileInput =
      row.querySelector(".fileInput");

    const preview =
      row.querySelector(".img-preview");

    if (fileInput && preview) {

      fileInput.addEventListener(
        "change",
        e => {

        const file =
          e.target.files[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload = ev => {

          preview.src =
            ev.target.result;

          preview.style.display =
            "block";

        };

        reader.readAsDataURL(file);

      });

    }

    // ==========================
    // COMPONENT RELATION
    // ==========================
    wireBabSub(row);

  }

  // ==========================
  // ADD MAIN ROW
  // ==========================
  function addRow() {

    const row =
      document.createElement("tr");

    row.className = "main-row";

    row.innerHTML = `

      <td>
        <input
          type="text"
          name="description[]"
          class="form-control"
          required
        >
      </td>

      <td>
        <input
          type="text"
          name="condition[]"
          class="form-control"
          required
        >
      </td>

      <td>

        <input
          type="file"
          name="file[]"
          accept="image/*"
          class="form-control fileInput"
        >

        <img
          class="img-preview"
          style="
            display:none;
            width:50px;
            margin-top:5px;
          "
        >

      </td>

      <td>
        <input
          type="text"
          name="partNumber[]"
          class="form-control"
        >
      </td>

      <td>
        <input
          type="text"
          name="namaBarang[]"
          class="form-control"
        >
      </td>

      <td>
        <input
          type="number"
          name="qty[]"
          class="form-control"
        >
      </td>

      <td>
        <input
          type="text"
          name="satuan[]"
          class="form-control"
        >
      </td>

      <td>

        <select
          name="bab[]"
          class="form-control babSelect"
        ></select>

      </td>

      <td>

        <select
          name="subBab[]"
          class="form-control subSelect"
        ></select>

      </td>

      <td class="text-center">

        <input
          type="checkbox"
          name="masukFPB[]"
        >

      </td>

      <td class="text-center">

        <button
          type="button"
          class="
            btn
            btn-danger
            btn-sm
            removeRowBtn
          "
        >
          Hapus
        </button>

      </td>

    `;

    itemsTableBody.appendChild(row);

    setupRow(row);

  }

  // ==========================
  // ADD FPB ROW
  // ==========================
  function addFPBRow() {

    const row =
      document.createElement("tr");

    row.className = "fpb-row";

    row.innerHTML = `

  <td></td>

  <td></td>

  <td></td>

  <td>
    <input
      type="text"
      name="partNumberFPB[]"
      class="form-control"
    >
  </td>

  <td>
    <input
      type="text"
      name="namaBarangFPB[]"
      class="form-control"
    >
  </td>

  <td>
    <input
      type="number"
      name="qtyFPB[]"
      class="form-control"
    >
  </td>

  <td>
    <input
      type="text"
      name="satuanFPB[]"
      class="form-control"
    >
  </td>

  <td></td>

  <td></td>

  <td class="text-center">

    <input
      type="checkbox"
      checked
      name="masukFPBRow[]"
    >

  </td>

  <td class="text-center">

    <button
      type="button"
      class="
        btn
        btn-danger
        btn-sm
        removeRowBtn
      "
    >
      Hapus
    </button>

  </td>

`;
    itemsTableBody.appendChild(row);

    row.querySelector(
      ".removeRowBtn"
    )?.addEventListener(
      "click",
      () => row.remove()
    );

  }

    
 // ==========================
// DEFAULT ROW
// ==========================
addRow();

// ==========================
// LOAD KOMPONEN
// ==========================
fetchKomponen()
.then(() => {

  document
    .querySelectorAll(".babSelect")
    .forEach(fillBabOptions);

})
.catch(console.error);

  // ==========================
  // BUTTON TAMBAH ROW
  // ==========================
  addRowBtn?.addEventListener(
    "click",
    addRow
  );

  // ==========================
  // BUTTON FPB
  // ==========================
  addSubRowBtn?.addEventListener(
    "click",
    addFPBRow
  );

  // ==========================
  // FILE TO BASE64
  // ==========================
  async function fileToBase64(file) {

    return await new Promise(
      resolve => {

      const reader =
        new FileReader();

      reader.onload = e => {

        resolve(e.target.result);

      };

      reader.readAsDataURL(file);

    });

  }

  // ==========================
  // POST TO SHEET
  // ==========================
  async function postToSheet(payload) {

    try {

      const response =
        await fetch(WORKER_URL, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(payload)

      });

      return await response.json();

    }

    catch (err) {

      console.error(err);

      return {

        success: false,

        message:
          "Gagal kirim data"

      };

    }

  }

  // ==========================
  // SUBMIT FORM
  // ==========================
  form.addEventListener(
    "submit",
    async e => {

    e.preventDefault();

    overlay?.classList.remove(
      "d-none"
    );

    try {

      const rows =
        Array.from(
          itemsTableBody
          .querySelectorAll(".main-row, .fpb-row")
        );

      const items = [];

      for (const row of rows) {

  // =========================
  // MAIN ROW
  // =========================
  if (row.classList.contains("main-row")) {

    const babSel =
      row.querySelector(
        'select[name="bab[]"]'
      );

    const subSel =
      row.querySelector(
        'select[name="subBab[]"]'
      );

    items.push({

      description:
        row.querySelector(
          'input[name="description[]"]'
        )?.value || "",

      condition:
        row.querySelector(
          'input[name="condition[]"]'
        )?.value || "",

      file:
        row.querySelector(".img-preview")
        ?.src || "",

      fileName:
        row.querySelector(".fileInput")
        ?.files?.[0]?.name || "image.jpg",

      partNumber:
        row.querySelector(
          'input[name="partNumber[]"]'
        )?.value || "",

      namaBarang:
        row.querySelector(
          'input[name="namaBarang[]"]'
        )?.value || "",

      qty:
        row.querySelector(
          'input[name="qty[]"]'
        )?.value || "",

      satuan:
        row.querySelector(
          'input[name="satuan[]"]'
        )?.value || "",

      bab:
        babSel?.value || "",

      subBab:
        subSel?.value || "",

      subCode:
        subSel?.selectedOptions?.[0]
        ?.dataset?.code || "",

      masukFPB:
        row.querySelector(
          'input[name="masukFPB[]"]'
        )?.checked || false

    });

  }

  // =========================
  // FPB ROW
  // =========================
  else if (
    row.classList.contains("fpb-row")
  ) {

    items.push({

      description: "",
      condition: "",
      file: "",
      fileName: "",

      partNumber:
        row.querySelector(
          'input[name="partNumberFPB[]"]'
        )?.value || "",

      namaBarang:
        row.querySelector(
          'input[name="namaBarangFPB[]"]'
        )?.value || "",

      qty:
        row.querySelector(
          'input[name="qtyFPB[]"]'
        )?.value || "",

      satuan:
        row.querySelector(
          'input[name="satuanFPB[]"]'
        )?.value || "",

      bab: "",
      subBab: "",
      subCode: "",

      masukFPB:
        row.querySelector(
          'input[name="masukFPBRow[]"]'
        )?.checked || false

    });

  }

}
      const payload = {

        action: "submitForm",

        date:
          document
          .getElementById("Date")
          ?.value || "",

        site:
          document
          .querySelector(
            'input[name="site"]'
          )?.value || "",

        codeUnit:
          document
          .querySelector(
            'input[name="codeUnit"]'
          )?.value || "",

        hourMeter:
          document
          .querySelector(
            'input[name="hourMeter"]'
          )?.value || "",

        inspectedBy:
          document
          .querySelector(
            'input[name="inspectedBy"]'
          )?.value || "",

        priority:
          document
          .querySelector(
            'input[name="priority"]'
          )?.value || "",

        items

      };

      console.log(
        "PAYLOAD:",
        payload
      );

      const result =
        await postToSheet(payload);

      overlay?.classList.add(
        "d-none"
      );

      output.innerHTML = `
  <div style="padding:10px;">

    <div>
      ${result.message || "Submit selesai"}
    </div>

    ${
      result.pdfUrl
      ? `
        <br><br>

        <a
          href="${result.pdfUrl}"
          target="_blank"
          class="btn btn-success"
        >
          📄 Buka PDF
        </a>
      `
      : ''
    }

  </div>
`;

      output.classList.remove(
        "d-none"
      );

      if (result.success) {

        form.reset();

        itemsTableBody.innerHTML = "";

        addRow();

      }

    }

    catch (err) {

      console.error(err);

      overlay?.classList.add(
        "d-none"
      );

      alert(
        "Terjadi error saat submit"
      );

    }

   });

});
