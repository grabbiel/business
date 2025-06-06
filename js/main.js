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

  initSmoothScrolling();
});

function initSmoothScrolling() {
  // Add smooth scrolling to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function initSwiper() {
  const swiperContainer = document.querySelector(".character-slide");
  const slides = Array.from(
    swiperContainer.querySelectorAll(".character-wrapper"),
  );
  const navbarItems = document.querySelectorAll(".navbar-item");

  // If there's only one slide, no need for swiping
  if (slides.length <= 1) return;

  let currentIndex = 0;
  let startX = 0;
  let startY = 0;
  let distX = 0;
  let distY = 0;
  let startTime = 0;
  let isMouseDown = false;
  let keyboardEnabled = false;
  let intersectionObserver = null;

  // Constants
  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIMEOUT = 300;
  const TRANSITION_DURATION = 300;

  // Set initial state
  updateSlides();
  setupIntersectionObserver();
  setupKeyboardNavigation();

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
  swiperContainer.addEventListener("click", function (e) {
    // Find if a nav button or its child was clicked
    const navButton = e.target.closest(".nav-button");

    if (!navButton) return; // If not a nav button, exit

    if (navButton.classList.contains("prev-button")) {
      goToPrevSlide();
    } else if (navButton.classList.contains("next-button")) {
      goToNextSlide();
    }
  });

  // Navbar Items
  navbarItems.forEach((item) => {
    item.addEventListener("click", function () {
      const slideIndex = parseInt(this.getAttribute("data-slide"));
      goToSlide(slideIndex);
    });
  });

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

  function updateNavbar(index) {
    const navbarItems = document.querySelectorAll(".navbar-item");
    if (navbarItems.length > 0) {
      // Remove active and clicked classes from all items
      navbarItems.forEach((item) => {
        item.classList.remove("active");
        item.classList.remove("clicked");
      });

      // Add active and clicked classes to current index
      const activeNavItem = document.querySelector(
        `.navbar-item[data-slide="${index}"]`,
      );
      if (activeNavItem) {
        activeNavItem.classList.add("active");
        activeNavItem.classList.add("clicked");
      }
    }
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
    currentSlide.style.pointerEvents = "none";
    nextSlide.style.pointerEvents = "auto";

    updateNavbar(index);

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
          slide.classList.remove("transitioning");
        }
      });
    }, TRANSITION_DURATION);
  }
  function setupIntersectionObserver() {
    const options = {
      root: null, // Use viewport as root
      rootMargin: '0px',
      threshold: 0.1 // Trigger when at least 10% is visible
    };

    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === swiperContainer) {
          keyboardEnabled = entry.isIntersecting;
        }
      });
    }, options);

    intersectionObserver.observe(swiperContainer);
  }

  function setupKeyboardNavigation() {
    function handleKeyPress(e) {
      // Only handle keys when character slide is in view
      if (!keyboardEnabled) return;

      // Only handle left and right arrow keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); // Prevent page scrolling

        if (e.key === 'ArrowLeft') {
          goToPrevSlide();
        } else if (e.key === 'ArrowRight') {
          goToNextSlide();
        }
      }
    }

    // Add keyboard event listener to document
    document.addEventListener('keydown', handleKeyPress);
  }
}
window.portfolioUtils = {
  // Scroll to specific section
  scrollToSection: function (sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  },

  // Get current project slide
  getCurrentProject: function () {
    const activeSlide = document.querySelector('.character-wrapper.active');
    if (activeSlide) {
      const slideClass = Array.from(activeSlide.classList).find(cls => cls.startsWith('character-'));
      return slideClass ? slideClass.replace('character-', '') : null;
    }
    return null;
  },

  // Navigate to specific project
  goToProject: function (projectIndex) {
    const navItem = document.querySelector(`.navbar-item[data-slide="${projectIndex}"]`);
    if (navItem) {
      navItem.click();
    }
  }
};
