// ==========================
// KONFIGURASI GLOBAL
// ==========================
const WORKER_URL = "https://jb-inspection-27a4.aldibagas2704.workers.dev/";

// ==========================
// CACHE DATA KOMPONEN
// ==========================
let KOM_DATA = {
  groups: [],
  byGroup: {}
};

// ==========================
// FETCH KOMPONEN
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

    console.log("DATA KOMPONEN:", j);

    if (!j?.success || !Array.isArray(j.data)) {

      throw new Error(j?.message || "Gagal load komponen");

    }

    const byGroup = {};

    j.data.forEach(r => {

      const group =
        (
          r["Component Group"] ??
          r["component group"] ??
          r.componentGroup ??
          r.group ??
          ""
        ).toString().trim();

      const sub =
        (
          r["Sub Component"] ??
          r["sub component"] ??
          r.subComponent ??
          r.sub ??
          ""
        ).toString().trim();

      const code =
        (
          r["Code"] ??
          r["code"] ??
          r.kode ??
          ""
        ).toString().trim();

      if (!group || !sub) return;

      if (!byGroup[group]) {

        byGroup[group] = [];

      }

      byGroup[group].push({
        name: sub,
        code
      });

    });

    KOM_DATA.groups =
      Object.keys(byGroup).sort((a,b)=>
        a.localeCompare(b)
      );

    KOM_DATA.byGroup = byGroup;

    console.log("KOM_DATA:", KOM_DATA);

  } catch(err) {

    console.error("ERROR FETCH KOMPONEN:", err);

    KOM_DATA = {
      groups: [],
      byGroup: {}
    };

  }

}

// ==========================
// FILL BAB
// ==========================
function fillBabOptions(selectEl){

  if(!selectEl) return;

  selectEl.innerHTML = `
    <option value="">
      Pilih Bab...
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
// FILL SUB BAB
// ==========================
function fillSubOptions(selectEl, group){

  if(!selectEl) return;

  selectEl.innerHTML = `
    <option value="">
      Pilih Sub...
    </option>
  `;

  const subs =
    KOM_DATA.byGroup[group] || [];

  subs.forEach(sub => {

    const opt =
      document.createElement("option");

    opt.value = sub.name;

    opt.textContent = sub.name;

    opt.dataset.code = sub.code;

    selectEl.appendChild(opt);

  });

  selectEl.disabled = false;

}

// ==========================
// FORM INSPEKSI
// ==========================
document.addEventListener(
  "DOMContentLoaded",
  async () => {

  const form =
    document.getElementById("myForm");

  if(!form) return;

  // ==========================
  // ELEMENT
  // ==========================
  const itemsTableBody =
    document.querySelector(
      "#itemsTable tbody"
    );

  const output =
    document.getElementById("output");

  const overlay =
    document.getElementById("overlay");

  let currentMainRow = null;

  // ==========================
  // SET TANGGAL
  // ==========================
  function setToday(){

    const el =
      document.getElementById("Date");

    if(!el) return;

    const d = new Date();

    const yyyy =
      d.getFullYear();

    const mm =
      String(d.getMonth()+1)
      .padStart(2,'0');

    const dd =
      String(d.getDate())
      .padStart(2,'0');

    el.value =
      `${yyyy}-${mm}-${dd}`;

  }

  setToday();

  // ==========================
  // LOAD DATA KOMPONEN DULU
  // ==========================
  await fetchKomponen();

  // ==========================
  // WIRE BAB SUB
  // ==========================
  function wireBabSubForRow(row){

    const babSel =
      row.querySelector(".babSelect");

    const subSel =
      row.querySelector(".subSelect");

    if(!babSel || !subSel) return;

    fillBabOptions(babSel);

    subSel.innerHTML = `
      <option value="">
        Pilih Sub...
      </option>
    `;

    subSel.disabled = true;

    babSel.addEventListener(
      "change",
      () => {

      const group =
        babSel.value;

      fillSubOptions(
        subSel,
        group
      );

    });

  }

  // ==========================
  // SETUP ROW
  // ==========================
  function setupRow(row){

    // remove row
    row.querySelector(
      ".removeRowBtn"
    )?.addEventListener(
      "click",
      () => {

      row.remove();

      if(
        itemsTableBody.children
        .length === 0
      ){

        addRow();

      }

    });

    // file preview
    const fileInput =
      row.querySelector(".fileInput");

    const preview =
      row.querySelector(".img-preview");

    if(fileInput && preview){

      fileInput.addEventListener(
        "change",
        e => {

        const file =
          e.target.files[0];

        if(!file) return;

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

    wireBabSubForRow(row);

  }

  // ==========================
  // ADD ROW
  // ==========================
  function addRow(){

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

    setupRow(row);

    itemsTableBody.appendChild(row);

    currentMainRow = row;

  }

  // ==========================
  // ADD ROW AWAL
  // ==========================
  addRow();

  // ==========================
  // BUTTON
  // ==========================
  document
  .getElementById("addRowBtn")
  ?.addEventListener(
    "click",
    addRow
  );

  // ==========================
  // POST TO SHEET
  // ==========================
  async function postToSheet(payload){

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

    } catch(err){

      console.error(err);

      return {

        success:false,

        message:
          "Gagal kirim data"

      };

    }

  }

  // ==========================
  // SUBMIT
  // ==========================
  form.addEventListener(
    "submit",
    async e => {

    e.preventDefault();

    overlay?.classList.remove(
      "d-none"
    );

    const rows =
      Array.from(
        itemsTableBody
        .querySelectorAll("tr")
      );

    const items = [];

    rows.forEach(row => {

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
          ?.dataset?.code || ""

      });

    });

    const payload = {

      action:"submitForm",

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

    const result =
      await postToSheet(payload);

    overlay?.classList.add(
      "d-none"
    );

    if(output){

      output.innerHTML =
        result.message || "Selesai";

      output.classList.remove(
        "d-none"
      );

    }

  });

});
