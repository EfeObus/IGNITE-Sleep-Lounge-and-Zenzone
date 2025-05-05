document.addEventListener("DOMContentLoaded", () => {
    // Registration Form Submission
    const registrationForm = document.querySelector("#registration-form");
    if (registrationForm) {
      registrationForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const studentID = document.querySelector("#student-id").value;
        const firstName = document.querySelector("#first-name").value;
        const lastName = document.querySelector("#last-name").value;
        const email = document.querySelector("#email").value;
  
        // Save student info (for this example, use localStorage or server API)
        console.log("Registration Successful:", { studentID, firstName, lastName, email });
  
        // Simulate email confirmation
        alert(`Confirmation email sent to ${email}`);
      });
    }
  
    // Staff Login Form Submission
    const staffLoginForm = document.querySelector("#staff-login-form");
    if (staffLoginForm) {
      staffLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;
  
        console.log("Staff Logged In:", { username });
        alert("Staff logged in successfully");
      });
    }
  
    // Admin Adding Staff
    const addStaffForm = document.querySelector("#add-staff-form");
    if (addStaffForm) {
      addStaffForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const staffUsername = document.querySelector("#staff-username").value;
        const staffPassword = document.querySelector("#staff-password").value;
  
        console.log("New Staff Added:", { staffUsername });
        alert("Staff onboarded successfully");
      });
    }

    // Function to handle bed availability and student check-ins
    const manageBedAvailability = () => {
      let availableBeds = 12;
    
      const updateBedCountDisplay = () => {
        const bedCountElement = document.querySelector("#bed-count");
        if (bedCountElement) {
          bedCountElement.textContent = `Available Beds: ${availableBeds}`;
        }
      };
    
      const loungeStatusElement = document.querySelector("#lounge-status");
    
      // Staff logs in a student
      const studentCheckInForm = document.querySelector("#student-check-in-form");
      if (studentCheckInForm) {
        studentCheckInForm.addEventListener("submit", (e) => {
          e.preventDefault();
    
          const studentID = document.querySelector("#student-id-check-in").value;
          const studentName = document.querySelector("#student-name-display").textContent;
    
          if (availableBeds > 0) {
            availableBeds--;
            updateBedCountDisplay();
    
            // Log the student in
            console.log(`Student logged in: ${studentName} (ID: ${studentID})`);
            alert(`${studentName} has been successfully checked in.`);
    
            // Set a timer for one hour
            setTimeout(() => {
              alert(`Time's up for ${studentName} (ID: ${studentID}). Please check them out.`);
              availableBeds++;
              updateBedCountDisplay();
            }, 3600000); // 1 hour in milliseconds
          } else {
            alert("All beds are currently occupied. Please wait for availability.");
            if (loungeStatusElement) {
              loungeStatusElement.textContent = "Sleep lounge full. No beds available.";
            }
          }
        });
      }
    
      updateBedCountDisplay();
    };
    
    // Initialize bed management on page load
    manageBedAvailability();

    // Contact us form - Add null check before adding event listener
    const contactBtn = document.getElementById("contactBtn");
    if (contactBtn) {
      contactBtn.addEventListener("click", function () {
        const form = document.getElementById("contactForm");
        if (form) {
          form.classList.toggle("hidden");
        }
      });
    }
});