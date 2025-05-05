/**
 * Contact Us Page JavaScript
 * Handles form submission, accordion interactions, and map interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all interactive components
  initContactForm();
  initAccordion();
  initMapInteraction();
  initContactMethodAnimations();
  initSocialIconsEffects();
});

/**
 * Initialize contact form functionality
 */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('name').value;
      const studentNo = document.getElementById('studentNo').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      const service = document.getElementById('service').value;
      
      // Validate form (simple validation for demo)
      if (!name || !studentNo || !email || !subject || !message) {
        showFormError('Please fill in all required fields');
        return;
      }
      
      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      
      // Simulate form submission (would be an AJAX call to server in production)
      setTimeout(() => {
        // Show success message
        contactForm.style.display = 'none';
        if (formSuccess) {
          formSuccess.classList.remove('hidden');
          formSuccess.classList.add('animate__animated', 'animate__fadeInUp');
        }
        
        // Reset button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        // Reset form
        contactForm.reset();
      }, 1500);
    });
    
    // Add real-time validation
    const inputFields = contactForm.querySelectorAll('input, textarea, select');
    inputFields.forEach(field => {
      field.addEventListener('blur', () => {
        validateField(field);
      });
      
      field.addEventListener('input', () => {
        // Clear error state when user starts typing
        field.classList.remove('invalid');
      });
    });
  }
  
  /**
   * Show form error message
   * @param {string} message - The error message to display
   */
  function showFormError(message) {
    let errorElement = document.querySelector('.form-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      contactForm.insertBefore(errorElement, contactForm.firstChild);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Shake the form to indicate error
    contactForm.classList.add('shake');
    setTimeout(() => {
      contactForm.classList.remove('shake');
    }, 500);
    
    // Auto remove after a few seconds
    setTimeout(() => {
      errorElement.style.opacity = '0';
      setTimeout(() => {
        errorElement.style.display = 'none';
        errorElement.style.opacity = '1';
      }, 300);
    }, 5000);
  }
  
  /**
   * Validate a form field
   * @param {HTMLElement} field - The form field to validate
   * @returns {boolean} - Whether the field is valid
   */
  function validateField(field) {
    if (field.hasAttribute('required') && !field.value.trim()) {
      field.classList.add('invalid');
      return false;
    }
    
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        field.classList.add('invalid');
        return false;
      }
    }
    
    field.classList.add('valid');
    return true;
  }
}

/**
 * Initialize accordion functionality for FAQs
 */
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      // Toggle this accordion item
      const isActive = header.classList.contains('active');
      const content = header.nextElementSibling;
      const icon = header.querySelector('.accordion-icon i');
      
      // Close all accordions first
      document.querySelectorAll('.accordion-header').forEach(otherHeader => {
        if (otherHeader !== header) {
          otherHeader.classList.remove('active');
          otherHeader.nextElementSibling.style.maxHeight = null;
          
          const otherIcon = otherHeader.querySelector('.accordion-icon i');
          if (otherIcon) {
            otherIcon.className = 'fas fa-chevron-down';
          }
        }
      });
      
      // Toggle current accordion item
      if (!isActive) {
        header.classList.add('active');
        // Calculate proper height and set it (the issue was here)
        content.style.maxHeight = content.scrollHeight + 'px';
        
        if (icon) {
          icon.className = 'fas fa-chevron-up';
        }
      } else {
        header.classList.remove('active');
        content.style.maxHeight = null;
        
        if (icon) {
          icon.className = 'fas fa-chevron-down';
        }
      }
    });
  });
  
  // Fix: Pre-calculate content heights to ensure proper display
  document.querySelectorAll('.accordion-content').forEach(content => {
    // Store the actual height for later use
    const height = content.scrollHeight;
    content.dataset.height = height;
  });
}

/**
 * Initialize map interaction features
 */
function initMapInteraction() {
  // Handle direction buttons
  const directionButtons = document.querySelectorAll('.directions-btn');
  
  directionButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get map location from parent map card
      const mapCard = button.closest('.campus-map');
      if (!mapCard) return;
      
      const campus = mapCard.querySelector('h3').textContent.trim();
      
      // Use the actual Google Maps links provided
      let mapsUrl;
      if (campus.includes('North')) {
        mapsUrl = 'https://maps.app.goo.gl/tGzhu2e1DaP5QRHx8';
      } else {
        mapsUrl = 'https://maps.app.goo.gl/zdwS6oDwwTUdPoms8';
      }
      
      window.open(mapsUrl, '_blank');
      
      // Add click animation
      button.classList.add('clicked');
      setTimeout(() => {
        button.classList.remove('clicked');
      }, 300);
    });
  });
  
  // NEW CODE: Make entire map area clickable
  const clickableMaps = document.querySelectorAll('.clickable-map');
  
  clickableMaps.forEach(map => {
    // Add cursor pointer style
    map.style.cursor = 'pointer';
    
    // Add hover effect
    map.addEventListener('mouseenter', () => {
      map.style.transform = 'scale(1.02)';
      map.style.transition = 'transform 0.3s ease';
      
      // Add subtle highlight
      const overlay = document.createElement('div');
      overlay.className = 'map-highlight';
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(82, 113, 255, 0.1)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1';
      map.appendChild(overlay);
    });
    
    map.addEventListener('mouseleave', () => {
      map.style.transform = '';
      
      // Remove highlight
      const highlight = map.querySelector('.map-highlight');
      if (highlight) {
        highlight.remove();
      }
    });
    
    // Make the map clickable to open Google Maps
    map.addEventListener('click', () => {
      if (map.dataset.url) {
        window.open(map.dataset.url, '_blank');
      }
    });
  });
  
  // Add styling for clickable maps
  const mapStyle = document.createElement('style');
  mapStyle.innerHTML = `
    .clickable-map {
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .clickable-map:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    .clickable-map:active {
      transform: scale(0.98) !important;
    }
  `;
  document.head.appendChild(mapStyle);
}

/**
 * Add hover and click animations to contact method cards
 */
function initContactMethodAnimations() {
  const contactMethods = document.querySelectorAll('.contact-method');
  
  contactMethods.forEach(method => {
    // Add extra animation effects on hover
    method.addEventListener('mouseenter', () => {
      const icon = method.querySelector('.contact-icon');
      if (icon) {
        icon.style.transform = 'scale(1.1) rotate(10deg)';
      }
    });
    
    method.addEventListener('mouseleave', () => {
      const icon = method.querySelector('.contact-icon');
      if (icon) {
        icon.style.transform = '';
      }
    });
    
    // Add click effect for contact methods
    method.addEventListener('click', () => {
      // Different actions based on contact method
      const type = method.querySelector('h3').textContent.trim();
      
      if (type === 'Email') {
        const emailLink = method.querySelector('a');
        if (emailLink) emailLink.click();
      } else if (type === 'Phone') {
        const phoneLink = method.querySelector('a');
        if (phoneLink) phoneLink.click();
      } else if (type === 'Visit Us') {
        // Scroll to map section
        const mapSection = document.querySelector('.map-section');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      // Add ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      method.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 800);
    });
  });
  
  // Add style for ripple effect
  const style = document.createElement('style');
  style.innerHTML = `
    .contact-method { position: relative; overflow: hidden; cursor: pointer; }
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(82, 113, 255, 0.2);
      transform: scale(0);
      animation: ripple 0.8s linear;
      pointer-events: none;
    }
    @keyframes ripple {
      to { transform: scale(4); opacity: 0; }
    }
    .clicked {
      animation: button-click 0.3s ease;
    }
    @keyframes button-click {
      0% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
      100% { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Social icons hover effects
 */
function initSocialIconsEffects() {
  const socialIcons = document.querySelectorAll('.social-icon');
  
  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'translateY(-5px)';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.transform = '';
    });
    
    // Add tooltip functionality
    const socialName = getSocialMediaName(icon);
    if (socialName) {
      const tooltip = document.createElement('span');
      tooltip.className = 'social-tooltip';
      tooltip.textContent = `Follow on ${socialName}`;
      icon.appendChild(tooltip);
    }
  });
  
  // Add tooltip styles
  const tooltipStyle = document.createElement('style');
  tooltipStyle.innerHTML = `
    .social-icon {
      position: relative;
    }
    .social-tooltip {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    .social-icon:hover .social-tooltip {
      opacity: 1;
      visibility: visible;
      bottom: -35px;
    }
  `;
  document.head.appendChild(tooltipStyle);
  
  /**
   * Get social media name from icon class
   * @param {HTMLElement} icon - The social icon element
   * @returns {string|null} - The social media name
   */
  function getSocialMediaName(icon) {
    const i = icon.querySelector('i');
    if (!i) return null;
    
    if (i.classList.contains('fa-facebook') || i.classList.contains('fa-facebook-f')) {
      return 'Facebook';
    } else if (i.classList.contains('fa-twitter')) {
      return 'Twitter';
    } else if (i.classList.contains('fa-instagram')) {
      return 'Instagram';
    } else if (i.classList.contains('fa-linkedin') || i.classList.contains('fa-linkedin-in')) {
      return 'LinkedIn';
    }
    
    return null;
  }
}