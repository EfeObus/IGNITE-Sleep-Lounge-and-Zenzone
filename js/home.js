/**
 * Home Page JavaScript
 * Handles the testimonial slider and animations for the home page
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize testimonial slider
  initTestimonialSlider();
});

/**
 * Initialize the testimonial slider functionality
 */
function initTestimonialSlider() {
  const testimonialSlider = document.getElementById('testimonialSlider');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!testimonialSlider || !prevBtn || !nextBtn) return;
  
  const testimonials = testimonialSlider.querySelectorAll('.testimonial');
  if (testimonials.length <= 1) return;
  
  let currentIndex = 0;
  
  // Hide all testimonials except the first one
  testimonials.forEach((testimonial, index) => {
    if (index !== 0) {
      testimonial.style.display = 'none';
    }
  });
  
  // Show a specific testimonial
  const showTestimonial = (index) => {
    // Hide all testimonials
    testimonials.forEach(testimonial => {
      testimonial.style.display = 'none';
    });
    
    // Show the selected testimonial
    testimonials[index].style.display = 'block';
    
    // Add fade-in animation
    testimonials[index].classList.add('fade-in');
    
    // Remove animation class after animation completes to allow re-adding it
    setTimeout(() => {
      testimonials[index].classList.remove('fade-in');
    }, 1000);
  };
  
  // Previous button handler
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    showTestimonial(currentIndex);
  });
  
  // Next button handler
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    showTestimonial(currentIndex);
  });
  
  // Auto-rotate testimonials
  let intervalId = setInterval(() => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    showTestimonial(currentIndex);
  }, 5000);
  
  // Pause auto-rotation when user interacts with slider
  [prevBtn, nextBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(intervalId);
      
      // Resume after inactivity
      intervalId = setTimeout(() => {
        intervalId = setInterval(() => {
          currentIndex = (currentIndex + 1) % testimonials.length;
          showTestimonial(currentIndex);
        }, 5000);
      }, 10000);
    });
  });
}