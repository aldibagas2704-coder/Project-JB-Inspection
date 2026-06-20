document.addEventListener("DOMContentLoaded", () => {

  const buttons = document.querySelectorAll(".nav-btn");
  const iframe  = document.getElementById("iframe-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page) {
        iframe.src = page;
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });

});
