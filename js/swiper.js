document.addEventListener("DOMContentLoaded", function () {
  // Variables to track current slide state
  let currentSlideIndex = 0;
  const slides = document.querySelectorAll(".project__swiper-slide");
  const thumbnails = document.querySelectorAll(".project__navList");
  const totalSlides = slides.length;

  // Function to show a specific slide
  function showSlide(index) {
    // Ensure index is within bounds (for loop functionality)
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;

    // Skip if already on this slide
    if (index === currentSlideIndex) return;

    // Hide all slides but keep them in the flow for proper height calculation
    slides.forEach((slide) => {
      slide.style.opacity = "0";
      slide.style.position = "absolute";
      slide.style.zIndex = "1";
      slide.style.pointerEvents = "none";
    });

    // Show new slide
    slides[index].style.opacity = "1";
    slides[index].style.position = "relative";
    slides[index].style.zIndex = "2";
    slides[index].style.pointerEvents = "auto";

    // Update active thumbnail
    thumbnails.forEach((thumb) => thumb.classList.remove("is-active"));
    thumbnails[index].classList.add("is-active");

    // Update current slide index
    currentSlideIndex = index;
  }

  // Initialize: hide all slides except the first one
  slides.forEach((slide, i) => {
    slide.style.transition = "opacity 0.5s ease"; // Add fade effect transition
    if (i !== 0) {
      slide.style.opacity = "0";
      slide.style.position = "absolute";
      slide.style.zIndex = "1";
      slide.style.pointerEvents = "none";
    } else {
      slide.style.opacity = "1";
      slide.style.position = "relative";
      slide.style.zIndex = "2";
      slide.style.pointerEvents = "auto";
    }
  });

  // Set first thumbnail as active
  thumbnails[0].classList.add("is-active");

  // Event listener for thumbnail navigation
  document.querySelectorAll(".project__thumb").forEach((thumb) => {
    thumb.addEventListener("click", function () {
      const pid = parseInt(this.getAttribute("data-pid"));
      showSlide(pid);
    });
  });

  // Event listeners for previous and next buttons
  document
    .querySelector(".js-projectPrev")
    .addEventListener("click", function () {
      showSlide(currentSlideIndex - 1);
    });

  document
    .querySelector(".js-projectNext")
    .addEventListener("click", function () {
      showSlide(currentSlideIndex + 1);
    });
});
