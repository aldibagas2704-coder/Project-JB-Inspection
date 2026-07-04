// ==========================================
// AUTH GUARD
// Dipasang di setiap halaman yang butuh login
// (dashboard.html, dashboard-home.html, form.html,
//  database.html, jadwal.html, pareto.html)
// ==========================================
(function () {

  function isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true";
  }

  function guard() {
    if (!isLoggedIn()) {
      window.location.replace("index.html");
    }
  }

  // 1) Cek begitu script ini dimuat
  guard();

  // 2) Cek ulang saat halaman ditampilkan dari bfcache
  //    (skenario: user logout, lalu pencet tombol Back di browser)
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      guard();
    }
  });

  // Fungsi logout, dipanggil dari tombol di sidebar
  window.logout = function () {
    localStorage.removeItem("loggedIn");
    window.location.replace("index.html");
  };

})();
