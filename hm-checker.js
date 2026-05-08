// hm-checker.js

async function checkHMReminder() {
    try {

        // GANTI DENGAN URL API EXISTING KAMU
        const response = await fetch("URL_API_KAMU");

        const data = await response.json();

        console.log("Data inspection:", data);

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

            if (!unitMaster[unit]) return;

            const interval = unitMaster[unit].interval;
            const offset = unitMaster[unit].offset;

            // HITUNG NEXT DUE HM
            const dueHM = Math.ceil(currentHM / interval) * interval;

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
