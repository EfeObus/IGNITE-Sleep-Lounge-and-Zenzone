/**
 * Sleep Lounge JavaScript
 * Handles the functionality for the Sleep Lounge page
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize testimonial slider
  initTestimonialSlider();
  
  // Initialize campus switching
  initCampusSelection();
});

/**
 * Initialize the testimonial slider
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
  
  // Pause auto-rotation when user interacts
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

/**
 * Initialize campus selection functionality
 */
function initCampusSelection() {
  const northCampusBtn = document.querySelector('[data-campus="north"]');
  const lakeshoreCampusBtn = document.querySelector('[data-campus="lakeshore"]');
  
  if (!northCampusBtn || !lakeshoreCampusBtn) return;
  
  const campusInfo = {
    north: {
      name: "North Campus",
      location: "KX204 – Located above the Student Centre",
      hours: "Monday to Friday, 9:00am - 4:00pm",
      beds: 12,
      hasZenZone: false
    },
    lakeshore: {
      name: "Lakeshore Campus",
      location: "KB106 – Located on the lower level of the K Cottage",
      hours: "Monday to Friday, 9:00am - 4:00pm",
      beds: 12,
      hasZenZone: true
    }
  };
  
  // Function to update campus information displayed
  const updateCampusInfo = (campusKey) => {
    const campusData = campusInfo[campusKey];
    const infoContainer = document.querySelector('.campus-details');
    
    if (!infoContainer) return;
    
    document.querySelector('.active-campus-name').textContent = campusData.name;
    document.querySelector('.campus-location').textContent = campusData.location;
    document.querySelector('.campus-hours').textContent = campusData.hours;
    document.querySelector('.campus-beds').textContent = `${campusData.beds} beds available`;
    
    // Show or hide Zen Zone information
    const zenZoneInfo = document.querySelector('.zen-zone-availability');
    if (zenZoneInfo) {
      if (campusData.hasZenZone) {
        zenZoneInfo.style.display = 'block';
      } else {
        zenZoneInfo.style.display = 'none';
      }
    }
    
    // Update active button
    [northCampusBtn, lakeshoreCampusBtn].forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (campusKey === 'north') {
      northCampusBtn.classList.add('active');
    } else {
      lakeshoreCampusBtn.classList.add('active');
    }
  };
  
  // Set up event listeners
  northCampusBtn.addEventListener('click', () => updateCampusInfo('north'));
  lakeshoreCampusBtn.addEventListener('click', () => updateCampusInfo('lakeshore'));
  
  // Initialize with North Campus
  updateCampusInfo('north');
}

/**
 * Bed availability status check (simulated for frontend)
 * In a real implementation, this would fetch from a server
 */
function checkBedAvailability() {
  // Simulated bed availability (for demo)
  const availabilityData = {
    north: Math.floor(Math.random() * 13), // 0-12 beds available
    lakeshore: Math.floor(Math.random() * 13)
  };
  
  const northAvailability = document.querySelector('.north-availability');
  const lakeshoreAvailability = document.querySelector('.lakeshore-availability');
  
  if (northAvailability) {
    updateAvailabilityDisplay(northAvailability, availabilityData.north, 12);
  }
  
  if (lakeshoreAvailability) {
    updateAvailabilityDisplay(lakeshoreAvailability, availabilityData.lakeshore, 12);
  }
}

/**
 * Update the availability display element
 * @param {Element} element - The element to update
 * @param {number} available - Number of available beds
 * @param {number} total - Total number of beds
 */
function updateAvailabilityDisplay(element, available, total) {
  const percentage = (available / total) * 100;
  
  // Update text
  element.querySelector('.count').textContent = available;
  
  // Update status text and color
  const statusElement = element.querySelector('.status-text');
  if (statusElement) {
    if (available === 0) {
      statusElement.textContent = 'Full';
      statusElement.className = 'status-text status-full';
    } else if (available <= 2) {
      statusElement.textContent = 'Limited';
      statusElement.className = 'status-text status-limited';
    } else {
      statusElement.textContent = 'Available';
      statusElement.className = 'status-text status-available';
    }
  }
  
  // Update progress bar if exists
  const progressBar = element.querySelector('.availability-bar-fill');
  if (progressBar) {
    progressBar.style.width = `${(available / total) * 100}%`;
    
    if (available === 0) {
      progressBar.className = 'availability-bar-fill full';
    } else if (available <= 2) {
      progressBar.className = 'availability-bar-fill limited';
    } else {
      progressBar.className = 'availability-bar-fill available';
    }
  }
}

// Check bed availability on page load and periodically
if (document.querySelector('.availability-display')) {
  checkBedAvailability();
  setInterval(checkBedAvailability, 60000); // Check every minute
}