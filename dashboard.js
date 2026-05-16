document.addEventListener("DOMContentLoaded", () => {

  const buttons =
    document.querySelectorAll(".sidebar button");

  const iframe =
    document.getElementById("iframe-content");

  // =========================
  // SIDEBAR CLICK
  // =========================

  buttons.forEach(btn => {

    btn.addEventListener("click", () => {

      const page =
        btn.dataset.page;

      if(page){

        iframe.src = page;

      }

    });

  });

});
