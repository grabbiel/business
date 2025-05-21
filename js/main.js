// Updated main.js with swiper functionality
document.addEventListener("DOMContentLoaded", function () {
  // Add click event to download the PDF
  const resumeDownload = document.getElementById("resume-download");

  resumeDownload.addEventListener("click", function () {
    const pdfSrc = document
      .querySelector("#resume object")
      .getAttribute("data");
    const link = document.createElement("a");
    link.href = pdfSrc;
    link.download = "resume.pdf"; // Set the download filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Initialize the swiper
  initSwiper();
});

function initSwiper() {
  const swiperContainer = document.querySelector(".character-slide");
  const slides = Array.from(
    swiperContainer.querySelectorAll(".character-wrapper"),
  );

  // If there's only one slide, no need for swiping
  if (slides.length <= 1) return;

  let currentIndex = 0;
  let startX = 0;
  let startY = 0;
  let distX = 0;
  let distY = 0;
  let startTime = 0;
  let isMouseDown = false;

  // Constants
  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIMEOUT = 300;
  const TRANSITION_DURATION = 300;

  // Set initial state
  updateSlides();

  // Add event listeners for touch devices
  swiperContainer.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  swiperContainer.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  swiperContainer.addEventListener("touchend", handleTouchEnd);

  // Add event listeners for desktop devices
  swiperContainer.addEventListener("mousedown", handleMouseStart);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseEnd);
  document.addEventListener("mouseleave", handleMouseEnd);

  // Add navigation buttons functionality

  const prevButtonSlides = Array.from(
    swiperContainer.querySelectorAll(".nav-button.prev-button"),
  );
  const nextButtonSlides = Array.from(
    swiperContainer.querySelectorAll(".nav-button.next-button"),
  );
  for (let i = 0; i < prevButtonSlides.length; i++) {
    const prevButton = prevButtonSlides[i];
    const nextButton = nextButtonSlides[i];

    prevButton.addEventListener("click", goToPrevSlide);
    nextButton.addEventListener("click", goToNextSlide);
  }

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

        // Hide inactive slides after transition completes
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

  function updateProgressiveFade(distX) {
    const containerWidth = swiperContainer.offsetWidth;
    const swipePercentage = Math.min(
      Math.abs(distX) / (containerWidth * 0.5),
      1,
    );

    let nextSlideIndex;

    // Determine which slide to show based on swipe direction
    if (distX > 0) {
      // Right swipe - show previous slide
      nextSlideIndex = (currentIndex - 1 + slides.length) % slides.length;
    } else {
      // Left swipe - show next slide
      nextSlideIndex = (currentIndex + 1) % slides.length;
    }

    // Get current and target slides
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[nextSlideIndex];

    // Mark slides as transitioning
    currentSlide.classList.add("transitioning");
    nextSlide.classList.add("transitioning");

    // Ensure next slide is visible
    nextSlide.style.display = "block";
    nextSlide.style.zIndex = 3;

    // Set opacity based on swipe percentage
    currentSlide.style.opacity = 1 - swipePercentage;
    nextSlide.style.opacity = swipePercentage;
  }

  function resetProgressiveFade() {
    slides.forEach((slide, index) => {
      slide.classList.remove("transitioning");

      if (index === currentIndex) {
        slide.style.opacity = 1;
      } else {
        slide.style.opacity = 0;

        // Hide non-active slides after transition
        setTimeout(() => {
          if (!slide.classList.contains("active")) {
            slide.style.display = "none";
          }
        }, TRANSITION_DURATION);
      }
    });
  }

  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = new Date().getTime();
  }

  function handleTouchMove(e) {
    if (!startX || !startY) return;

    distX = e.touches[0].clientX - startX;
    distY = e.touches[0].clientY - startY;

    // If horizontal swipe is more significant than vertical, prevent scrolling
    if (Math.abs(distX) > Math.abs(distY)) {
      e.preventDefault();
      updateProgressiveFade(distX);
    }
  }

  function handleTouchEnd() {
    if (!startX || !startY) return;

    const elapsedTime = new Date().getTime() - startTime;

    // Check if the swipe is more horizontal than vertical
    if (Math.abs(distX) > Math.abs(distY)) {
      // Check if the swipe is long enough or fast enough
      if (
        Math.abs(distX) > SWIPE_THRESHOLD ||
        (Math.abs(distX) > 0.25 * swiperContainer.offsetWidth &&
          elapsedTime < SWIPE_TIMEOUT)
      ) {
        if (distX > 0) {
          goToPrevSlide(); // Right swipe
        } else {
          goToNextSlide(); // Left swipe
        }
      } else {
        // Swipe didn't meet threshold - reset to original state
        resetProgressiveFade();
      }
    }

    // Reset tracking variables
    startX = 0;
    startY = 0;
    distX = 0;
    distY = 0;
  }

  function handleMouseStart(e) {
    e.preventDefault(); // Prevent text selection during swipe
    isMouseDown = true;
    startX = e.clientX;
    startY = e.clientY;
    startTime = new Date().getTime();

    swiperContainer.style.cursor = "grabbing";
  }

  function handleMouseMove(e) {
    if (!isMouseDown) return;

    distX = e.clientX - startX;
    distY = e.clientY - startY;

    // If horizontal swipe is more significant than vertical, prevent default
    if (Math.abs(distX) > Math.abs(distY)) {
      e.preventDefault();
      updateProgressiveFade(distX);
    }
  }

  function handleMouseEnd() {
    if (!isMouseDown) return;

    const elapsedTime = new Date().getTime() - startTime;

    // Check if the swipe is more horizontal than vertical
    if (Math.abs(distX) > Math.abs(distY)) {
      // Check if the swipe is long enough or fast enough
      if (
        Math.abs(distX) > SWIPE_THRESHOLD ||
        (Math.abs(distX) > 0.25 * swiperContainer.offsetWidth &&
          elapsedTime < SWIPE_TIMEOUT)
      ) {
        if (distX > 0) {
          goToPrevSlide(); // Right swipe
        } else {
          goToNextSlide(); // Left swipe
        }
      } else {
        // Swipe didn't meet threshold - reset to original state
        resetProgressiveFade();
      }
    }

    // Reset tracking variables
    isMouseDown = false;
    swiperContainer.style.cursor = "";
    startX = 0;
    startY = 0;
    distX = 0;
    distY = 0;
  }

  function goToPrevSlide() {
    const newIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(newIndex);
  }

  function goToNextSlide() {
    const newIndex = (currentIndex + 1) % slides.length;
    goToSlide(newIndex);
  }

  function goToSlide(index) {
    if (index === currentIndex) return;

    // Get current and target slides
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[index];

    // Prepare target slide for transition
    nextSlide.style.display = "block";
    nextSlide.style.opacity = 0;
    nextSlide.style.zIndex = 3; // Put it on top during transition

    // Force browser reflow to ensure the display change is processed
    void nextSlide.offsetWidth;

    // Start fade transition
    currentSlide.style.opacity = 0;
    nextSlide.style.opacity = 1;
    nextSlide.classList.add("active");

    // Update current index
    currentIndex = index;

    // After transition completes, update z-index and cleanup
    setTimeout(() => {
      currentSlide.classList.remove("active");
      currentSlide.style.zIndex = 1;
      nextSlide.style.zIndex = 2;

      // Hide slides that are not active
      slides.forEach((slide, i) => {
        if (i !== currentIndex) {
          slide.style.display = "none";
        }
      });
    }, TRANSITION_DURATION);
  }
}
