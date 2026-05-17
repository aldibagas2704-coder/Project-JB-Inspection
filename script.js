// ======================================
// JB INSPECTION SYSTEM - FIXED SCRIPT
// ======================================

// ===========================
// MASTER COMPONENT DATA
// ===========================

const componentData = {
  Engine: [
    "Radiator",
    "Turbo",
    "Injector",
    "Fuel Pump",
    "Cylinder Head"
  ],

  Hydraulic: [
    "Main Pump",
    "Hydraulic Hose",
    "Boom Cylinder",
    "Arm Cylinder",
    "Bucket Cylinder"
  ],

  Undercarriage: [
    "Track Link",
    "Carrier Roller",
    "Track Roller",
    "Sprocket",
    "Idler"
  ],

  Electrical: [
    "Battery",
    "Alternator",
    "Starter",
    "Lamp",
    "Harness"
  ],

  Cabin: [
    "Seat",
    "Joystick",
    "Monitor",
    "AC System"
  ]
};

// ===========================
// ELEMENT
// ===========================

const tableBody = document.querySelector("#itemsTable tbody");

const addRowBtn = document.getElementById("addRowBtn");

const addSubRowBtn = document.getElementById("addSubRowBtn");

const form = document.getElementById("myForm");

// ===========================
// CREATE COMPONENT OPTIONS
// ===========================

function createComponentOptions() {

  let options = `<option value="">Pilih Component</option>`;

  Object.keys(componentData).forEach(component => {

    options += `
      <option value="${component}">
        ${component}
      </option>
    `;

  });

  return options;
}

// ===========================
// CREATE ROW
// ===========================

function createRow(type = "inspection") {

  const row = document.createElement("tr");

  // ===================================
  // INSPECTION ROW
  // ===================================

  if (type === "inspection") {

    row.innerHTML = `

      <td>
        <input type="text" class="form-control description">
      </td>

      <td>
        <select class="form-select condition">

          <option value="">Pilih</option>

          <option value="GOOD">GOOD</option>

          <option value="MONITOR">MONITOR</option>

          <option value="REPAIR">REPAIR</option>

          <option value="REPLACE">REPLACE</option>

        </select>
      </td>

      <td>
        <input type="file" class="form-control image" accept="image/*">
      </td>

      <td>
        <input type="text" class="form-control partNumber">
      </td>

      <td>
        <input type="text" class="form-control namaBarang">
      </td>

      <td>
        <input type="number" class="form-control qty">
      </td>

      <td>
        <input type="text" class="form-control satuan">
      </td>

      <td>

        <select class="form-select componentGroup">

          ${createComponentOptions()}

        </select>

      </td>

      <td>

        <select class="form-select subComponent">

          <option value="">Pilih Sub Component</option>

        </select>

      </td>

      <td class="text-center">
        <input type="checkbox" class="form-check-input masukFPB">
      </td>

      <td>
        <button type="button" class="btn btn-danger btn-sm deleteBtn">
          Hapus
        </button>
      </td>

    `;

  }

  // ===================================
  // FPB ROW
  // ===================================

  else {

    row.innerHTML = `

      <td>
        <input type="text" class="form-control bg-warning-subtle">
      </td>

      <td colspan="8">

        <input
          type="text"
          class="form-control bg-warning-subtle"
          placeholder="Catatan FPB"
        >

      </td>

      <td class="text-center">
        <input type="checkbox" checked>
      </td>

      <td>
        <button type="button" class="btn btn-danger btn-sm deleteBtn">
          Hapus
        </button>
      </td>

    `;
  }

  // ===================================
  // APPEND ROW
  // ===================================

  tableBody.appendChild(row);

  // ===================================
  // DROPDOWN RELATION
  // ===================================

  const componentSelect = row.querySelector(".componentGroup");

  const subComponentSelect = row.querySelector(".subComponent");

  if (componentSelect && subComponentSelect) {

    componentSelect.addEventListener("change", function () {

      const selectedComponent = this.value;

      subComponentSelect.innerHTML =
        `<option value="">Pilih Sub Component</option>`;

      if (componentData[selectedComponent]) {

        componentData[selectedComponent].forEach(sub => {

          subComponentSelect.innerHTML += `
            <option value="${sub}">
              ${sub}
            </option>
          `;

        });

      }

    });

  }

}

// ===========================
// DEFAULT ROW
// ===========================

createRow();

// ===========================
// ADD ROW BUTTON
// ===========================

if (addRowBtn) {

  addRowBtn.addEventListener("click", function () {

    createRow("inspection");

  });

}

// ===========================
// ADD FPB BUTTON
// ===========================

if (addSubRowBtn) {

  addSubRowBtn.addEventListener("click", function () {

    createRow("fpb");

  });

}

// ===========================
// DELETE ROW
// ===========================

document.addEventListener("click", function (e) {

  if (e.target.classList.contains("deleteBtn")) {

    e.target.closest("tr").remove();

  }

});

// ===========================
// IMAGE TO BASE64
// ===========================

function convertFileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => resolve(reader.result);

    reader.onerror = error => reject(error);

  });

}

// ===========================
// SUBMIT FORM
// ===========================

if (form) {

  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    try {

      const rows = document.querySelectorAll("#itemsTable tbody tr");

      const items = [];

      for (const row of rows) {

        const description =
          row.querySelector(".description")?.value || "";

        const condition =
          row.querySelector(".condition")?.value || "";

        const partNumber =
          row.querySelector(".partNumber")?.value || "";

        const namaBarang =
          row.querySelector(".namaBarang")?.value || "";

        const qty =
          row.querySelector(".qty")?.value || "";

        const satuan =
          row.querySelector(".satuan")?.value || "";

        const componentGroup =
          row.querySelector(".componentGroup")?.value || "";

        const subComponent =
          row.querySelector(".subComponent")?.value || "";

        const masukFPB =
          row.querySelector(".masukFPB")?.checked || false;

        // ======================
        // IMAGE
        // ======================

        let imageBase64 = "";

        const imageInput = row.querySelector(".image");

        if (
          imageInput &&
          imageInput.files &&
          imageInput.files[0]
        ) {

          imageBase64 =
            await convertFileToBase64(imageInput.files[0]);

        }

        items.push({

          description,
          condition,
          image: imageBase64,
          partNumber,
          namaBarang,
          qty,
          satuan,
          componentGroup,
          subComponent,
          masukFPB

        });

      }

      // ======================
      // RESULT
      // ======================

      console.log("FORM DATA :", items);

      alert("Data inspection berhasil disubmit");

    }

    catch (error) {

      console.error(error);

      alert("Terjadi error saat submit");

    }

  });

}
