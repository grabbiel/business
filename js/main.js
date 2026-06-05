// ── Global state ───────────────────────────────────────────────────────────
// Tracks which slider container owns keyboard navigation at any moment.
let activeKeyboardContainer = null;

// ── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  // PDF download
  const resumeDownload = document.getElementById("resume-download");
  resumeDownload.addEventListener("click", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    const pdfSrc = document.querySelector("#resume object").getAttribute("data");
    const link = document.createElement("a");
    link.href = pdfSrc;
    link.download = "resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  initAllSliders();
  initSmoothScrolling();
});

// ── Global colour driver ────────────────────────────────────────────────────
// Sets data-active-color on .main; CSS reads this to update --news-primary-color
// and #project-title colour across the whole page.
function updateGlobalColor(colorIndex) {
  const main = document.querySelector(".main");
  if (main) main.dataset.activeColor = colorIndex;
}

// ── Multi-slider initialisation ─────────────────────────────────────────────
function initAllSliders() {
  // Each entry maps a DOM section to the global colour indices of its slides.
  // colorIndices[localSlideIndex] → global character colour number (0-6)
  const configs = [
    { section: "web",      colorIndices: [0, 1, 2] },
    { section: "graphics", colorIndices: [3, 4]    },
    { section: "os",       colorIndices: [5, 6]    },
  ];

  configs.forEach((config, idx) => {
    const section = document.querySelector(
      `.slider-section[data-section="${config.section}"]`
    );
    if (!section) return;

    const swiperContainer = section.querySelector(".character-slide");
    const navbarContainer = section.querySelector(".character-navbar");
    if (!swiperContainer) return;

    initSwiper(swiperContainer, navbarContainer, config.colorIndices, idx === 0);
  });

  // Ensure the page opens with the first slider's colour active
  updateGlobalColor(0);
}

// ── Smooth scrolling for in-page anchors ────────────────────────────────────
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ── Per-slider swiper ───────────────────────────────────────────────────────
// swiperContainer : .character-slide element
// navbarContainer : .character-navbar element (sibling in the same slider-section)
// colorIndices    : array mapping local slide index → global colour index
// isFirst         : true only for the very first slider (owns keyboard on load)
function initSwiper(swiperContainer, navbarContainer, colorIndices, isFirst) {
  const slides = Array.from(
    swiperContainer.querySelectorAll(".character-wrapper")
  );
  const navbarItems = navbarContainer
    ? Array.from(navbarContainer.querySelectorAll(".navbar-item"))
    : [];

  if (slides.length === 0) return;
  if (isFirst) activeKeyboardContainer = swiperContainer;

  let currentIndex = 0;
  let startX = 0, startY = 0, distX = 0, distY = 0, startTime = 0;
  let isMouseDown = false;

  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIMEOUT = 300;
  const TRANSITION_DURATION = 300;

  // Apply initial state
  updateSlides();
  setupKeyboardNavigation();

  // ── Touch ────────────────────────────────────────────────────────────────
  swiperContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
  swiperContainer.addEventListener("touchmove",  handleTouchMove,  { passive: false });
  swiperContainer.addEventListener("touchend",   handleTouchEnd);

  // ── Mouse ────────────────────────────────────────────────────────────────
  swiperContainer.addEventListener("mousedown", handleMouseStart);
  document.addEventListener("mousemove",  handleMouseMove);
  document.addEventListener("mouseup",    handleMouseEnd);
  document.addEventListener("mouseleave", handleMouseEnd);

  // ── Nav arrow buttons (inside the slide) ─────────────────────────────────
  swiperContainer.addEventListener("click", function (e) {
    const navButton = e.target.closest(".nav-button");
    if (!navButton) return;
    activeKeyboardContainer = swiperContainer;
    if (navButton.classList.contains("prev-button")) goToPrevSlide();
    else if (navButton.classList.contains("next-button")) goToNextSlide();
  });

  // ── Navbar thumbnail clicks ───────────────────────────────────────────────
  navbarItems.forEach((item, idx) => {
    item.addEventListener("click", function () {
      activeKeyboardContainer = swiperContainer;
      goToSlide(idx);
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function updateSlides() {
    slides.forEach((slide, index) => {
      if (index === currentIndex) {
        slide.classList.add("active");
        slide.style.opacity = 1;
        slide.style.zIndex = 2;
        slide.style.display = "block";
        slide.style.pointerEvents = "auto";
      } else {
        slide.classList.remove("active");
        slide.style.opacity = 0;
        slide.style.zIndex = 1;
        slide.style.pointerEvents = "none";
        setTimeout(() => {
          if (
            !slide.classList.contains("active") &&
            !slide.classList.contains("transitioning")
          ) {
            slide.style.display = "none";
          }
        }, TRANSITION_DURATION);
      }
    });
  }

  function updateProgressiveFade(dX) {
    const containerWidth = swiperContainer.offsetWidth;
    const pct = Math.min(Math.abs(dX) / (containerWidth * 0.5), 1);
    const nextIdx =
      dX > 0
        ? (currentIndex - 1 + slides.length) % slides.length
        : (currentIndex + 1) % slides.length;

    const cur  = slides[currentIndex];
    const next = slides[nextIdx];

    cur.classList.add("transitioning");
    next.classList.add("transitioning");
    next.style.display = "block";
    next.style.zIndex = 3;
    cur.style.opacity  = 1 - pct;
    next.style.opacity = pct;
  }

  function resetProgressiveFade() {
    slides.forEach((slide, index) => {
      slide.classList.remove("transitioning");
      if (index === currentIndex) {
        slide.style.opacity = 1;
      } else {
        slide.style.opacity = 0;
        setTimeout(() => {
          if (!slide.classList.contains("active")) slide.style.display = "none";
        }, TRANSITION_DURATION);
      }
    });
  }

  // ── Touch handlers ────────────────────────────────────────────────────────
  function handleTouchStart(e) {
    activeKeyboardContainer = swiperContainer;
    startX    = e.touches[0].clientX;
    startY    = e.touches[0].clientY;
    startTime = Date.now();
  }

  function handleTouchMove(e) {
    if (!startX || !startY) return;
    distX = e.touches[0].clientX - startX;
    distY = e.touches[0].clientY - startY;
    if (Math.abs(distX) > Math.abs(distY)) {
      e.preventDefault();
      updateProgressiveFade(distX);
    }
  }

  function handleTouchEnd() {
    if (!startX || !startY) return;
    const elapsed = Date.now() - startTime;
    if (Math.abs(distX) > Math.abs(distY)) {
      if (
        Math.abs(distX) > SWIPE_THRESHOLD ||
        (Math.abs(distX) > 0.25 * swiperContainer.offsetWidth &&
          elapsed < SWIPE_TIMEOUT)
      ) {
        distX > 0 ? goToPrevSlide() : goToNextSlide();
      } else {
        resetProgressiveFade();
      }
    }
    startX = 0; startY = 0; distX = 0; distY = 0;
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────
  function handleMouseStart(e) {
    activeKeyboardContainer = swiperContainer;
    e.preventDefault();
    isMouseDown = true;
    startX    = e.clientX;
    startY    = e.clientY;
    startTime = Date.now();
    swiperContainer.style.cursor = "grabbing";
  }

  function handleMouseMove(e) {
    if (!isMouseDown) return;
    distX = e.clientX - startX;
    distY = e.clientY - startY;
    if (Math.abs(distX) > Math.abs(distY)) {
      e.preventDefault();
      updateProgressiveFade(distX);
    }
  }

  function handleMouseEnd() {
    if (!isMouseDown) return;
    const elapsed = Date.now() - startTime;
    if (Math.abs(distX) > Math.abs(distY)) {
      if (
        Math.abs(distX) > SWIPE_THRESHOLD ||
        (Math.abs(distX) > 0.25 * swiperContainer.offsetWidth &&
          elapsed < SWIPE_TIMEOUT)
      ) {
        distX > 0 ? goToPrevSlide() : goToNextSlide();
      } else {
        resetProgressiveFade();
      }
    }
    isMouseDown = false;
    swiperContainer.style.cursor = "";
    startX = 0; startY = 0; distX = 0; distY = 0;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function goToPrevSlide() {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }

  function goToNextSlide() {
    goToSlide((currentIndex + 1) % slides.length);
  }

  function updateNavbar(index) {
    navbarItems.forEach((item) => item.classList.remove("active", "clicked"));
    if (navbarItems[index]) {
      navbarItems[index].classList.add("active", "clicked");
    }
  }

  function goToSlide(index) {
    if (index === currentIndex) return;

    const curSlide  = slides[currentIndex];
    const nextSlide = slides[index];

    // Prepare next slide
    nextSlide.style.display       = "block";
    nextSlide.style.opacity       = 0;
    nextSlide.style.zIndex        = 3;
    void nextSlide.offsetWidth; // force reflow

    // Crossfade
    curSlide.style.opacity       = 0;
    nextSlide.style.opacity      = 1;
    nextSlide.classList.add("active");
    curSlide.style.pointerEvents  = "none";
    nextSlide.style.pointerEvents = "auto";

    updateNavbar(index);
    updateGlobalColor(colorIndices[index]);

    currentIndex = index;

    setTimeout(() => {
      curSlide.classList.remove("active");
      curSlide.style.zIndex  = 1;
      nextSlide.style.zIndex = 2;
      slides.forEach((slide, i) => {
        if (i !== currentIndex) {
          slide.style.display = "none";
          slide.classList.remove("transitioning");
        }
      });
    }, TRANSITION_DURATION);
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────
  // Only the slider that owns activeKeyboardContainer responds to arrow keys.
  // Ownership is claimed on any interaction with this slider.
  function setupKeyboardNavigation() {
    document.addEventListener("keydown", function (e) {
      if (activeKeyboardContainer !== swiperContainer) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); goToPrevSlide(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goToNextSlide(); }
    });
  }
}

// ── Public utilities ─────────────────────────────────────────────────────────
window.portfolioUtils = {
  scrollToSection: function (sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  getCurrentProject: function () {
    const activeSlide = document.querySelector(".character-wrapper.active");
    if (activeSlide) {
      const cls = Array.from(activeSlide.classList).find((c) =>
        c.startsWith("character-")
      );
      return cls ? cls.replace("character-", "") : null;
    }
    return null;
  },
};
