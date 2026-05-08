// hm-checker.js

const WORKER_URL =
"https://jb-inspection-27a4.aldibagas2704.workers.dev/";

async function postWorker(payload) {

    const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    return await r.json();
}

async function checkHMReminder() {

    try {

        const result = await postWorker({
            action: "getInspeksi"
        });

        // VALIDASI
        if (!result.success) {
            console.error("API Error:", result.message);
            return;
        }

        const data = result.data;

        // UNIT MASTER TEST
        const unitMaster = {

            "DZK20 027": {
                interval: 500,
                offset: 300
            },

            "HG200": {
                interval: 250,
                offset: 150
            }

        };

        console.log("=== HM CHECK START ===");

        const checkedUnits = new Set();
        
        data.forEach(row => {

            const unit =
                row["Code Unit"];

            // SKIP JIKA UNIT SUDAH DICEK
            if (checkedUnits.has(unit)) {
            return;
            }

            // TANDAI SUDAH DICEK
            checkedUnits.add(unit);

            const currentHM =
                Number(row["Hour Meter"]);

            // SKIP DATA KOSONG
            if (!unit || !currentHM) return;

            console.log("Checking unit:", unit);
            console.log("Current HM:", currentHM);

            // SKIP JIKA TIDAK ADA DI MASTER
            if (!unitMaster[unit]) {

                console.log(
                    "Unit tidak ada di master:",
                    unit
                );

                return;
            }

            const interval =
                unitMaster[unit].interval;

            const offset =
                unitMaster[unit].offset;

            // HITUNG DUE HM
            const dueHM =
                Math.ceil(currentHM / interval)
                * interval;

            console.log("Due HM:", dueHM);
            console.log("Threshold:", dueHM - offset);

            // CEK REMINDER
            if (currentHM >= (dueHM - offset)) {

                console.log(`
========================
REMINDER DETECTED
Unit      : ${unit}
CurrentHM : ${currentHM}
Due HM    : ${dueHM}
========================
                `);

            } else {

                console.log(
                    "Belum masuk reminder"
                );

            }

        });

        console.log("=== HM CHECK END ===");

    } catch(error) {

        console.error(
            "HM Checker Error:",
            error
        );

    }

}

checkHMReminder();
