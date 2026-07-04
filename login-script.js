const SCRIPT_URL = "https://jb-inspection-27a4.aldibagas2704.workers.dev/"; // Cloudflare Worker

// Hilangkan notifikasi & highlight error begitu user mulai mengetik lagi
document.addEventListener("DOMContentLoaded", () => {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");

  [usernameEl, passwordEl].forEach((el) => {
    el.addEventListener("input", () => {
      el.classList.remove("input-error");
      clearAlert();
    });
  });
});

function showLoader(show) {
  document.getElementById("loader").style.display = show ? "flex" : "none";
}

function showAlert(message, type = "error") {
  const box = document.getElementById("alertBox");
  box.textContent = message;
  box.className = "alert-message show " + type;
}

function clearAlert() {
  const box = document.getElementById("alertBox");
  box.className = "alert-message";
  box.textContent = "";
}

function markFieldError(el, isError) {
  el.classList.toggle("input-error", isError);
}

function clearFieldErrors() {
  markFieldError(document.getElementById("username"), false);
  markFieldError(document.getElementById("password"), false);
}

// Validasi input kosong, mengembalikan true jika valid (tidak kosong)
function validateFields(username, password) {
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  clearFieldErrors();

  if (!username && !password) {
    markFieldError(usernameEl, true);
    markFieldError(passwordEl, true);
    showAlert("⚠️ Username dan Password belum diisi!", "warning");
    return false;
  }
  if (!username) {
    markFieldError(usernameEl, true);
    showAlert("⚠️ Username belum diisi!", "warning");
    return false;
  }
  if (!password) {
    markFieldError(passwordEl, true);
    showAlert("⚠️ Password belum diisi!", "warning");
    return false;
  }
  return true;
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  clearAlert();
  if (!validateFields(username, password)) {
    return;
  }

  showLoader(true);

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "login",
        username,
        password
      })
    });

    const data = await res.json();
    showLoader(false);

    if (data.success) {
      localStorage.setItem("loggedIn", "true");
      window.location.href = "dashboard.html"; // langsung redirect tanpa alert
    } else {
      markFieldError(document.getElementById("username"), true);
      markFieldError(document.getElementById("password"), true);
      showAlert("❌ " + (data.message || "Username atau Password salah!"), "error");
    }
  } catch (err) {
    showLoader(false);
    showAlert("❌ Gagal terhubung ke server!", "error");
    console.error(err);
  }
}

async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  clearAlert();
  if (!validateFields(username, password)) {
    return;
  }

  showLoader(true);

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "register",
        username,
        password
      })
    });

    const data = await res.json();
    showLoader(false);

    if (data.success) {
      localStorage.setItem("loggedIn", "true");
      window.location.href = "dashboard.html"; // langsung redirect tanpa alert
    } else {
      showAlert("❌ " + (data.message || "Registrasi gagal!"), "error");
    }
  } catch (err) {
    showLoader(false);
    showAlert("❌ Gagal terhubung ke server!", "error");
    console.error(err);
  }
}
