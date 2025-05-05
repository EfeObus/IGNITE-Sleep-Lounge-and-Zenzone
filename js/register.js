/**
 * Registration Page JavaScript
 * Handles multi-step form navigation and submission
 */

document.addEventListener('DOMContentLoaded', () => {
  initMultiStepForm();
  initFormValidation();
});

/**
 * Initialize multi-step form navigation
 */
function initMultiStepForm() {
  const form = document.getElementById('registration-form');
  const steps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const nextButton = document.querySelector('.next-button');
  const backButton = document.querySelector('.back-button');
  const submitButton = document.querySelector('.submit-button');
  const confirmationStep = document.getElementById('registration-confirmation');
  
  let currentStep = 1;
  
  // Next button handler
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  }
  
  // Back button handler
  if (backButton) {
    backButton.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  }
  
  // Form submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (validateStep(currentStep)) {
        // Show loading state on button
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Get all form data
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;
        const studentId = document.getElementById('student-id').value;
        const campus = document.getElementById('campus').value;
        const agreedToWaiver = document.getElementById('waiver-agree').checked;
        const signature = document.getElementById('signature').value;
        const waiverDate = document.getElementById('date').value;
        
        // Create request payload
        const studentData = {
          firstName,
          lastName,
          email,
          studentId,
          campus,
          agreedToWaiver,
          program: '', // Optional
          phone: ''    // Optional
        };
        
        // Send data to server
        fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(studentData)
        })
        .then(response => {
          console.log('Registration response status:', response.status);
          if (!response.ok) {
            return response.json().then(err => {
              console.error('Registration error details:', err);
              throw new Error(err.error || 'Registration failed. Please try again.');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Registration successful:', data);
          
          // Show confirmation step
          steps.forEach(step => step.classList.remove('active'));
          confirmationStep.classList.add('active');
          
          // Update progress steps
          updateProgressSteps(3);
          
          // Reset button
          submitButton.disabled = false;
          submitButton.innerHTML = 'Submit Registration';
          
          // Create confetti effect for successful registration
          if (window.createConfetti) {
            window.createConfetti();
          }
        })
        .catch(error => {
          console.error('Registration error:', error);
          
          // Show error message
          showError(error.message || 'Registration failed. Please try again.');
          
          // Reset button
          submitButton.disabled = false;
          submitButton.innerHTML = 'Submit Registration';
        });
      }
    });
  }
  
  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  function showError(message) {
    const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    showStepError(currentStepEl, message);
    
    // Scroll to error
    setTimeout(() => {
      currentStepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  /**
   * Navigate to a specific step in the form
   * @param {number} stepNumber - The step number to navigate to
   */
  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > steps.length) return;
    
    // Update current step
    currentStep = stepNumber;
    
    // Hide all steps and show the current one
    steps.forEach(step => step.classList.remove('active'));
    steps[currentStep - 1].classList.add('active');
    
    // Update progress indicators
    updateProgressSteps(currentStep);
    
    // Scroll to top of form
    const formContainer = document.querySelector('.registration-container');
    if (formContainer) {
      formContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  /**
   * Update the progress step indicators
   * @param {number} activeStep - The current active step number
   */
  function updateProgressSteps(activeStep) {
    progressSteps.forEach((step, index) => {
      const stepNum = index + 1;
      
      if (stepNum < activeStep) {
        // Completed step
        step.classList.add('complete');
        step.classList.remove('active');
      } else if (stepNum === activeStep) {
        // Current step
        step.classList.add('active');
        step.classList.remove('complete');
      } else {
        // Future step
        step.classList.remove('active', 'complete');
      }
    });
  }
}

/**
 * Initialize form validation for each step
 */
function initFormValidation() {
  const form = document.getElementById('registration-form');
  
  /**
   * Validate a specific step in the form
   * @param {number} stepNumber - The step number to validate
   * @returns {boolean} - Whether the step is valid
   */
  window.validateStep = function(stepNumber) {
    const currentStepEl = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (!currentStepEl) return true;
    
    const requiredFields = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        markFieldAsInvalid(field, 'This field is required');
        isValid = false;
      } else if (field.type === 'email' && !validateEmail(field.value)) {
        markFieldAsInvalid(field, 'Please enter a valid email address');
        isValid = false;
      } else if (field.id === 'student-id' && !validateStudentId(field.value)) {
        markFieldAsInvalid(field, 'Please enter a valid student ID (alphanumeric, max 10 characters)');
        isValid = false;
      } else if (field.type === 'checkbox' && !field.checked) {
        markFieldAsInvalid(field, 'You must agree to the terms to proceed');
        isValid = false;
      } else {
        clearFieldError(field);
      }
    });
    
    if (!isValid) {
      showStepError(currentStepEl, 'Please complete all required fields');
    } else {
      clearStepError(currentStepEl);
    }
    
    return isValid;
  };
  
  // Add input event listeners to clear errors when user types
  if (form) {
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => {
        clearFieldError(field);
      });
    });
  }
  
  /**
   * Mark a form field as invalid with an error message
   * @param {HTMLElement} field - The form field element
   * @param {string} message - The error message
   */
  function markFieldAsInvalid(field, message) {
    field.classList.add('invalid');
    
    // Create or update error message
    let errorEl = field.parentElement.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      field.parentElement.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
  }
  
  /**
   * Clear error styling and message from a form field
   * @param {HTMLElement} field - The form field element
   */
  function clearFieldError(field) {
    field.classList.remove('invalid');
    
    const errorEl = field.parentElement.querySelector('.field-error');
    if (errorEl) {
      errorEl.remove();
    }
  }
  
  /**
   * Show an error message for the entire step
   * @param {HTMLElement} stepEl - The step element
   * @param {string} message - The error message
   */
  function showStepError(stepEl, message) {
    let errorEl = stepEl.querySelector('.step-error');
    
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'step-error';
      stepEl.insertBefore(errorEl, stepEl.firstChild);
    }
    
    errorEl.textContent = message;
    
    // Scroll to error
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  /**
   * Clear the error message for a step
   * @param {HTMLElement} stepEl - The step element
   */
  function clearStepError(stepEl) {
    const errorEl = stepEl.querySelector('.step-error');
    if (errorEl) {
      errorEl.remove();
    }
  }
  
  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  /**
   * Validate student ID format (alphanumeric, max 10 characters)
   * @param {string} studentId - The student ID to validate
   * @returns {boolean} - Whether the student ID is valid
   */
  function validateStudentId(studentId) {
    // Updated regex to allow alphanumeric characters with max length 10
    const re = /^[a-zA-Z0-9]{1,10}$/;
    return re.test(studentId);
  }
}

// Registration Form Interactive Features
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const form = document.getElementById('registration-form');
  const nextBtn = document.querySelector('.next-button');
  const backBtn = document.querySelector('.back-button');
  const submitBtn = document.querySelector('.submit-button');
  const formSteps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const confirmationStep = document.getElementById('registration-confirmation');
  
  // Set current date as default for date input
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Form navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      // Validate first step
      const studentId = document.getElementById('student-id').value;
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const campus = document.getElementById('campus').value;
      
      if (!studentId || !firstName || !lastName || !email || !campus) {
        showValidationMessage('Please fill in all fields');
        shakeInvalidFields();
        return;
      }
      
      // Proceed to next step
      formSteps[0].classList.remove('active');
      formSteps[1].classList.add('active');
      
      // Update progress bar
      progressSteps[0].classList.add('completed');
      progressSteps[1].classList.add('active');
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      formSteps[1].classList.remove('active');
      formSteps[0].classList.add('active');
      
      // Update progress bar
      progressSteps[0].classList.remove('completed');
      progressSteps[1].classList.remove('active');
    });
  }
  
  // Add direct click handler for submit button
  if (submitBtn) {
    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Validate second step (waiver)
      const waiverAgree = document.getElementById('waiver-agree').checked;
      const signature = document.getElementById('signature').value;
      const date = document.getElementById('date').value;
      
      if (!waiverAgree || !signature || !date) {
        showValidationMessage('Please complete all required fields');
        shakeInvalidFields();
        return;
      }
      
      // Process form submission
      console.log('Submit button clicked, processing form...');
      
      // Show loading state on button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      
      // Get all form data
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const studentId = document.getElementById('student-id').value;
      const campus = document.getElementById('campus').value;
      
      // Create request payload
      const studentData = {
        firstName,
        lastName,
        email,
        studentId,
        campus,
        agreedToWaiver: waiverAgree,
        program: '', // Optional
        phone: ''    // Optional
      };
      
      // Send data to server
      fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      })
      .then(response => {
        console.log('Registration response status:', response.status);
        if (!response.ok) {
          return response.json().then(err => {
            console.error('Registration error details:', err);
            throw new Error(err.error || 'Registration failed. Please try again.');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Registration successful:', data);
        
        // Show confirmation step
        formSteps.forEach(step => step.classList.remove('active'));
        confirmationStep.classList.add('active');
        
        // Update progress steps
        progressSteps.forEach((step, index) => {
          if (index === 2) {
            step.classList.add('active');
          } else if (index < 2) {
            step.classList.add('completed');
            step.classList.remove('active');
          }
        });
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Registration';
        
        // Create confetti effect for successful registration
        if (window.createConfetti) {
          window.createConfetti();
        }
      })
      .catch(error => {
        console.error('Registration error:', error);
        
        // Show error message
        showValidationMessage(error.message || 'Registration failed. Please try again.');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Registration';
      });
    });
  }
  
  // Interactive validation for form fields
  const inputFields = document.querySelectorAll('input, select');
  inputFields.forEach(field => {
    field.addEventListener('blur', function() {
      validateField(this);
    });
    
    field.addEventListener('input', function() {
      this.classList.remove('invalid');
      this.classList.remove('valid');
      
      // Remove any validation message when user starts typing
      const validationMessage = this.parentElement.querySelector('.validation-message');
      if (validationMessage) {
        validationMessage.remove();
      }
    });
  });
  
  // Waiver checkbox animation
  const waiverCheckbox = document.getElementById('waiver-agree');
  if (waiverCheckbox) {
    waiverCheckbox.addEventListener('change', function() {
      const label = document.querySelector('label[for="waiver-agree"]');
      if (this.checked) {
        label.classList.add('highlight-text');
      } else {
        label.classList.remove('highlight-text');
      }
    });
  }
  
  // Interactive hover effect for waiver sections
  const waiverColumns = document.querySelectorAll('.waiver-column');
  waiverColumns.forEach(column => {
    column.addEventListener('mouseenter', function() {
      this.classList.add('active-column');
    });
    
    column.addEventListener('mouseleave', function() {
      this.classList.remove('active-column');
    });
  });
  
  // Animate entrance of registration form
  const registrationIntro = document.querySelector('.registration-intro');
  const registrationProgress = document.querySelector('.registration-progress');
  
  if (registrationIntro && registrationProgress) {
    setTimeout(() => {
      registrationIntro.classList.add('fade-in');
      
      setTimeout(() => {
        registrationProgress.classList.add('fade-in');
        
        // Staggered entrance for progress steps
        progressSteps.forEach((step, index) => {
          setTimeout(() => {
            step.classList.add('bounce-in');
          }, index * 200);
        });
      }, 300);
    }, 300);
  }
  
  // Helper functions
  
  // Validate individual field
  function validateField(field) {
    if (field.hasAttribute('required') && !field.value) {
      field.classList.add('invalid');
      addValidationMessage(field, 'This field is required');
      return false;
    }
    
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        field.classList.add('invalid');
        addValidationMessage(field, 'Please enter a valid email address');
        return false;
      }
    }
    
    field.classList.add('valid');
    return true;
  }
  
  // Show validation message
  function showValidationMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'form-validation-message';
    messageEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Add to form
    const activeStep = document.querySelector('.form-step.active');
    if (activeStep) {
      // Remove any existing messages
      const existingMessage = activeStep.querySelector('.form-validation-message');
      if (existingMessage) {
        existingMessage.remove();
      }
      
      activeStep.insertBefore(messageEl, activeStep.firstChild);
      
      // Auto remove after a few seconds
      setTimeout(() => {
        messageEl.classList.add('fade-out');
        setTimeout(() => {
          messageEl.remove();
        }, 500);
      }, 5000);
    }
  }
  
  // Add validation message to specific field
  function addValidationMessage(field, message) {
    // Remove any existing message
    const existingMessage = field.parentElement.querySelector('.validation-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = 'validation-message';
    messageEl.textContent = message;
    
    field.parentElement.appendChild(messageEl);
  }
  
  // Shake animation for invalid fields
  function shakeInvalidFields() {
    const activeStep = document.querySelector('.form-step.active');
    const invalidFields = activeStep.querySelectorAll('input:invalid, select:invalid');
    
    invalidFields.forEach(field => {
      field.classList.add('shake');
      
      setTimeout(() => {
        field.classList.remove('shake');
      }, 500);
    });
  }
  
  // Create confetti effect for confirmation
  window.createConfetti = function() {
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // Random properties
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = (Math.random() * 2) + 's';
      
      // Random color
      const colors = ['#5271ff', '#4CAF50', '#FFC107', '#FF5722', '#9C27B0'];
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      document.body.appendChild(confetti);
      
      // Remove after animation completes
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  };
});

// Add these styles directly to make sure they're applied
document.addEventListener('DOMContentLoaded', function() {
  const styles = `
    /* Additional interactive styles for registration page */
    .registration-intro, .registration-progress {
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .registration-intro.fade-in, .registration-progress.fade-in {
      opacity: 1;
    }
    
    .progress-step {
      transition: transform 0.3s ease;
    }
    
    .progress-step.bounce-in {
      animation: bounceIn 0.5s ease forwards;
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0.8); opacity: 0; }
      70% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .validation-message {
      color: #d32f2f;
      font-size: 0.85rem;
      margin-top: 5px;
      margin-left: 5px;
    }
    
    .form-validation-message {
      background-color: rgba(211, 47, 47, 0.1);
      color: #d32f2f;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      animation: fadeIn 0.3s ease;
    }
    
    .form-validation-message i {
      margin-right: 8px;
    }
    
    .form-validation-message.fade-out {
      animation: fadeOut 0.5s ease forwards;
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    .shake {
      animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      transform: translate3d(0, 0, 0);
    }
    
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
      40%, 60% { transform: translate3d(3px, 0, 0); }
    }
    
    .invalid {
      border-color: #d32f2f !important;
      background-color: rgba(211, 47, 47, 0.05);
    }
    
    .valid {
      border-color: #4CAF50 !important;
      background-color: rgba(76, 175, 80, 0.05);
    }
    
    .highlight-text {
      color: #5271ff;
      font-weight: 700;
    }
    
    .waiver-column {
      transition: all 0.3s ease;
      border-radius: 10px;
    }
    
    .waiver-column.active-column {
      background: rgba(82, 113, 255, 0.05);
      transform: scale(1.02);
    }
    
    /* Confetti animation */
    .confetti {
      position: fixed;
      top: -10px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      z-index: 999;
      animation: confettiRain linear forwards;
    }
    
    @keyframes confettiRain {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
});