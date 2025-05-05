/**
 * Zen Zone JavaScript - Handles interactive elements for the Zen Zone page
 * Optimized for performance and maintainability
 */

document.addEventListener('DOMContentLoaded', () => {
  // Performance optimization - Cache DOM elements that we'll use multiple times
  const elements = {
    testimonialSlider: document.getElementById('testimonialSlider'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    heroSection: document.querySelector('.hero-section'),
    featureCards: document.querySelectorAll('.feature-card')
  };
  
  // Initialize the testimonial slider
  initTestimonialSlider(elements);
  
  // Initialize scroll animations
  initScrollAnimations(elements.featureCards);
  
  // Initialize parallax effect on hero section
  initParallaxEffect(elements.heroSection);
  
  // Initialize smooth scroll for anchor links
  initSmoothScroll();
});

/**
 * Initializes the testimonial slider functionality
 * @param {Object} elements - DOM elements
 */
function initTestimonialSlider(elements) {
  if (!elements.testimonialSlider) return;
  
  const testimonials = elements.testimonialSlider.querySelectorAll('.testimonial');
  if (testimonials.length <= 1) return;
  
  let currentIndex = 0;
  
  // Hide all testimonials except the first one
  testimonials.forEach((testimonial, index) => {
    if (index !== 0) {
      testimonial.style.display = 'none';
    }
  });
  
  // Function to show a specific testimonial
  const showTestimonial = (index) => {
    // Hide all testimonials
    testimonials.forEach(testimonial => {
      testimonial.style.display = 'none';
      testimonial.classList.remove('fade-in');
    });
    
    // Show the current testimonial with animation
    testimonials[index].style.display = 'block';
    // Trigger reflow to restart animation
    void testimonials[index].offsetWidth;
    testimonials[index].classList.add('fade-in');
  };
  
  // Previous button click handler
  if (elements.prevBtn) {
    elements.prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
      showTestimonial(currentIndex);
    });
  }
  
  // Next button click handler
  if (elements.nextBtn) {
    elements.nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      showTestimonial(currentIndex);
    });
  }
  
  // Auto-rotate testimonials every 5 seconds
  let intervalId = setInterval(() => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    showTestimonial(currentIndex);
  }, 5000);
  
  // Pause auto-rotation when user interacts with the slider
  const pauseAutoRotation = () => {
    clearInterval(intervalId);
    // Resume after 10 seconds of inactivity
    intervalId = setTimeout(() => {
      intervalId = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(currentIndex);
      }, 5000);
    }, 10000);
  };
  
  elements.prevBtn?.addEventListener('click', pauseAutoRotation);
  elements.nextBtn?.addEventListener('click', pauseAutoRotation);
}

/**
 * Initializes scroll animations for elements
 * @param {NodeList} elements - Elements to animate on scroll
 */
function initScrollAnimations(elements) {
  if (!elements || elements.length === 0) return;
  
  // Check if Intersection Observer is supported
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          // Unobserve after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe each feature card
    elements.forEach(element => {
      element.classList.remove('fade-in');
      observer.observe(element);
    });
  } else {
    // Fallback for browsers that don't support Intersection Observer
    elements.forEach(element => {
      element.classList.add('fade-in');
    });
  }
}

/**
 * Initializes parallax effect on hero section
 * @param {Element} heroSection - Hero section element
 */
function initParallaxEffect(heroSection) {
  if (!heroSection) return;
  
  // Performance optimization - Use requestAnimationFrame for smooth parallax
  let ticking = false;
  
  const updateParallax = () => {
    const scrollPosition = window.pageYOffset;
    if (scrollPosition <= window.innerHeight) {
      // Move background image at a slower rate than scroll (parallax effect)
      heroSection.style.backgroundPositionY = `${scrollPosition * 0.4}px`;
    }
    ticking = false;
  };
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateParallax();
      });
      ticking = true;
    }
  });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
      
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Offset for header
        behavior: 'smooth'
      });
    });
  });
}

/**
 * Check if the page has been loaded from the server or from browser cache
 * This ensures animations run properly even when navigating back
 */
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from browser cache
    // Refresh animations and dynamic elements
    document.querySelectorAll('.fade-in').forEach(element => {
      element.classList.remove('fade-in');
      // Trigger reflow
      void element.offsetWidth;
      element.classList.add('fade-in');
    });
  }
});

/**
 * Resource optimization - Lazy load images as they come into viewport
 */
document.addEventListener('DOMContentLoaded', () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    // Target images that have data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for older browsers
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }
});