document.addEventListener("DOMContentLoaded", function () {
  // Initialize the projects swiper
  const projectSwiper = new Swiper(".project__swiper", {
    loop: true,
    effect: "fade",
    speed: 500,
    fadeEffect: {
      crossFade: true,
    },
    on: {
      slideChange: function (ev) {
        const ind = ev.realIndex;
        document
          .querySelectorAll(".project__navList")
          .forEach((el) => el.classList.remove("is-active"));
        document
          .querySelectorAll(".project__navList")
          [ind].classList.add("is-active");
      },
    },
  });

  // Project thumbnail navigation
  document.querySelectorAll(".project__thumb").forEach((thumb) => {
    thumb.addEventListener("click", function () {
      const pid = this.getAttribute("data-pid");
      projectSwiper.slideToLoop(parseInt(pid));
    });
  });

  // Previous and Next navigation buttons
  document
    .querySelector(".js-projectPrev")
    .addEventListener("click", function () {
      projectSwiper.slidePrev();
    });

  document
    .querySelector(".js-projectNext")
    .addEventListener("click", function () {
      projectSwiper.slideNext();
    });
});
