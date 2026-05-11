// ==========================
// HM CHECKER AUTOMATION
// ==========================

async function checkHMReminder() {

    try {

        console.log("=== HM CHECK START ===");

        // ==========================
        // FETCH DATA INSPEKSI
        // ==========================

        const inspeksiResponse = await fetch(
            "https://jb-inspection-27a4.aldibagas2704.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "getInspeksi"
                })
            }
        );

        const inspeksiResult = await inspeksiResponse.json();

        if (!inspeksiResult.success) {

            console.error("Gagal ambil data inspeksi");

            return;

        }

        const inspeksiData = inspeksiResult.data;

        console.log("DATA INSPEKSI:", inspeksiData);

        // ==========================
        // FETCH UNIT MASTER
        // ==========================

        const masterResponse = await fetch(
            "https://jb-inspection-27a4.aldibagas2704.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: "getUnitMaster"
                })
            }
        );

        const masterResult = await masterResponse.json();

        if (!masterResult.success) {

            console.error("Gagal ambil UNIT_MASTER");

            return;

        }

        const unitMasterData = masterResult.data;

        console.log("UNIT MASTER:", unitMasterData);

        // ==========================
        // CONVERT MASTER TO OBJECT
        // ==========================

        const unitMaster = {};

        unitMasterData.forEach(unit => {

            unitMaster[unit["Code Unit"]] = {

                interval: Number(unit["Interval"]),

                offset: Number(unit["Offset"]),

                email: unit["PIC Email"],

                site: unit["Site"],

                type: unit["Type Unit"]

            };

        });

        console.log("MASTER OBJECT:", unitMaster);

        // ==========================
        // UNIQUE UNIT CHECKER
        // ==========================

        const checkedUnits = new Set();

        // ==========================
        // LOOP INSPEKSI
        // ==========================

        inspeksiData.forEach(row => {

            const unit = row["Code Unit"];

            const currentHM = Number(row["Hour Meter"]);

            // SKIP kalau kosong
            if (!unit || !currentHM) return;

            // SKIP duplicate unit
            if (checkedUnits.has(unit)) return;

            checkedUnits.add(unit);

            console.log("Checking unit:", unit);

            console.log("Current HM:", currentHM);

            // CEK ADA DI MASTER?
            if (!unitMaster[unit]) {

                console.log("Unit tidak ada di master:", unit);

                return;

            }

            const interval = unitMaster[unit].interval;

            const offset = unitMaster[unit].offset;

            const email = unitMaster[unit].email;

            // ==========================
            // HITUNG DUE HM
            // ==========================

            const dueHM =
                Math.ceil(currentHM / interval) * interval;

            const threshold = dueHM - offset;

            console.log("Interval:", interval);

            console.log("Offset:", offset);

            console.log("Due HM:", dueHM);

            console.log("Threshold:", threshold);

            // ==========================
            // REMINDER CHECK
            // ==========================

            if (currentHM >= threshold) {

                console.log(`
========================
REMINDER DETECTED
Unit      : ${unit}
CurrentHM : ${currentHM}
Due HM    : ${dueHM}
Send To   : ${email}
========================
                `);

fetch("https://jb-inspection-27a4.aldibagas2704.workers.dev/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    action: "sendReminderEmail",
    unit: unit,
    currentHM: currentHM,
    dueHM: dueHM,
    email: email
  })
})
.then(res => res.json())
.then(result => {
  console.log("EMAIL RESPONSE:", result);
})
.catch(err => {
  console.error("EMAIL ERROR:", err);
});

fetch("https://jb-inspection-27a4.aldibagas2704.workers.dev/", {

  method: "POST",

  headers: {
    "Content-Type": "application/json"
  },

  body: JSON.stringify({

    action: "createAutoSchedule",

    kode: unit,

    lokasi: unitMaster[unit].site,

    dueHM: dueHM,

    tanggal: new Date().toISOString().split("T")[0]

  })

})
.then(res => res.json())
.then(result => {

  console.log("AUTO SCHEDULE RESPONSE:", result);

})
.catch(err => {

  console.error("AUTO SCHEDULE ERROR:", err);

});
                
            }

        });

        console.log("=== HM CHECK END ===");

    } catch (error) {

        console.error("HM Checker Error:", error);

    }

}

// RUN
checkHMReminder();
