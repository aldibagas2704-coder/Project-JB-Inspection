// hm-checker.js

const WORKER_URL = "https://jb-inspection-27a4.aldibagas2704.workers.dev/";

// FORMAT REQUEST EXISTING SYSTEM
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

        // GANTI ACTION SESUAI YANG ADA DI SYSTEM EXISTING
        const result = await postWorker({
            action: "getInspeksi"
        });

        console.log("API RESULT:");
        console.log(result);

        console.log("JSON RESULT:");
        console.log(JSON.stringify(result, null, 2));

        // CEK APAKAH SUCCESS
        if (!result.success) {
            console.error("API Error:", result.message);
            return;
        }

        // AMBIL ARRAY DATA
        const data = result.data;

        // CEK APAKAH ARRAY
        if (!Array.isArray(data)) {
            console.error("Data bukan array:", data);
            return;
        }

        // SIMULASI UNIT MASTER
        const unitMaster = {
            "DZK20 027": {
                interval: 500,
                offset: 10
            },
            "HG200": {
                interval: 250,
                offset: 10
            }
        };

        data.forEach(row => {

            const unit = row["Code Unit"];
            const currentHM = Number(row["Hour Meter"]);

            // SKIP JIKA UNIT TIDAK ADA
            if (!unitMaster[unit]) return;

            const interval = unitMaster[unit].interval;
            const offset = unitMaster[unit].offset;

            // HITUNG NEXT DUE HM
            const dueHM =
                Math.ceil(currentHM / interval) * interval;

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

            }

        });

    } catch (error) {

        console.error("HM Checker Error:", error);

    }

}

// JALANKAN
checkHMReminder();
