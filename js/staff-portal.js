/**
 * IGNITE Sleep Lounge and Zen Zone - Staff Portal
 * Modern Interactive Design
 */

// Global variables
let currentUser = null;
let authToken = null;
let currentCampus = null;
let currentService = null;
let totalBeds = 12;
let availableBeds = 12;
let activeVisits = [];
let zenActiveVisits = [];
let totalZenStations = 6;
let availableZenStations = 6;
let recentActivities = [];
let zenRecentActivities = [];
let dailyStats = {
  todaysVisits: 0,
  avgDuration: 0
};
let zenDailyStats = {
  todaysVisits: 0,
  avgDuration: 0
};
let sessionTimers = {};

// Flag to determine if we're using sample data (development) or API (production)
// Setting this to false to always use real data from PostgreSQL
const useSampleData = false; 

// Flag to track if we've shown the fallback notification to the user
let fallbackNotificationShown = false;

// Set fallback mechanism to false to ensure we always try to use the real API
let useApiFallback = false;

// DOM Elements - Sleep Lounge
const staffAvatar = document.getElementById('staff-avatar');
const staffName = document.getElementById('staff-name');
const staffRole = document.getElementById('staff-role');
const logoutBtn = document.getElementById('logout-btn');
const sleepLoungePortal = document.getElementById('sleep-lounge-portal');
const zenZonePortal = document.getElementById('zen-zone-portal');
const studentSearch = document.getElementById('student-search');
const searchBtn = document.getElementById('search-btn');
const studentList = document.getElementById('student-list');
const bedsGrid = document.getElementById('beds-grid');
const refreshBedsBtn = document.getElementById('refresh-beds');
const activeVisitsCount = document.getElementById('active-visits-count');
const availableBedsCount = document.getElementById('available-beds-count');
const todaysVisitsCount = document.getElementById('todays-visits-count');
const avgDuration = document.getElementById('avg-duration');
const activityFeed = document.getElementById('activity-feed');

// DOM Elements - Zen Zone
const zenStudentSearch = document.getElementById('zen-student-search');
const zenSearchBtn = document.getElementById('zen-search-btn');
const zenStudentList = document.getElementById('zen-student-list');
const zenStationsGrid = document.getElementById('zen-stations-grid');
const refreshStationsBtn = document.getElementById('refresh-stations');
const zenActiveVisitsCount = document.getElementById('zen-active-visits-count');
const zenAvailableStationsCount = document.getElementById('zen-available-stations-count');
const zenTodaysVisitsCount = document.getElementById('zen-todays-visits-count');
const zenAvgDuration = document.getElementById('zen-avg-duration');
const zenActivityFeed = document.getElementById('zen-activity-feed');
const zenTasksList = document.getElementById('zen-tasks-list');

// DOM Elements - Modal
const checkoutModal = document.getElementById('checkout-modal');
const closeModalBtn = document.getElementById('close-modal');
const checkoutStudentName = document.getElementById('checkout-student-name');
const checkoutStudentId = document.getElementById('checkout-student-id');
const checkoutCheckinTime = document.getElementById('checkout-checkin-time');
const checkoutDuration = document.getElementById('checkout-duration');
const checkoutNotes = document.getElementById('checkout-notes');
const cancelCheckoutBtn = document.getElementById('cancel-checkout');
const confirmCheckoutBtn = document.getElementById('confirm-checkout');

// DOM Elements - Utilities
const loadingSpinner = document.getElementById('loading-spinner');
const toast = document.getElementById('toast');

// Sample data for development testing
const sampleStudents = [
  { id: 1, firstName: 'John', lastName: 'Doe', studentId: 'N12345678', email: 'john.doe@student.com' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', studentId: 'N87654321', email: 'jane.smith@student.com' },
  { id: 3, firstName: 'Alex', lastName: 'Johnson', studentId: 'N13579246', email: 'alex.johnson@student.com' }
];

const sampleVisits = [
  { 
    id: 1, 
    student: sampleStudents[0], 
    bedNumber: 3, 
    checkinTime: new Date(Date.now() - 45 * 60000), 
    timeLimit: 60,
    service: 'sleep-lounge' 
  },
  { 
    id: 2, 
    student: sampleStudents[1], 
    stationId: 'meditation-1', 
    stationName: 'Meditation 1', 
    checkinTime: new Date(Date.now() - 20 * 60000),
    service: 'zen-zone' 
  }
];

const sampleActivities = [
  { 
    type: 'check-in', 
    student: sampleStudents[0], 
    bedNumber: 3, 
    timestamp: new Date(Date.now() - 45 * 60000) 
  },
  { 
    type: 'check-out', 
    student: sampleStudents[2], 
    bedNumber: 5, 
    timestamp: new Date(Date.now() - 15 * 60000) 
  }
];

const sampleZenActivities = [
  { 
    type: 'check-in', 
    student: sampleStudents[1], 
    stationId: 'meditation-1', 
    stationName: 'Meditation 1', 
    timestamp: new Date(Date.now() - 20 * 60000) 
  },
  { 
    type: 'check-out', 
    student: sampleStudents[2], 
    stationId: 'relaxation-2', 
    stationName: 'Relaxation 2', 
    timestamp: new Date(Date.now() - 10 * 60000) 
  }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  // Get auth data from localStorage
  initializePortal();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Initialize the portal with user data from localStorage
 */
function initializePortal() {
  authToken = localStorage.getItem('staffAuthToken');
  const userDataStr = localStorage.getItem('staffUser');
  currentCampus = localStorage.getItem('campus') || 'north';
  currentService = localStorage.getItem('service') || 'sleep-lounge';
  
  if (!authToken || !userDataStr) {
    // For development, create a fake user
    if (useSampleData) {
      currentUser = {
        id: 1,
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@ignitestudentlife.com',
        role: 'STAFF'
      };
      
      authToken = 'fake-token-for-development';
    } else {
      // Redirect to login if no auth token
      window.location.href = 'staff-login.html';
      return;
    }
  } else {
    try {
      // Parse user data
      currentUser = JSON.parse(userDataStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      
      if (!useSampleData) {
        window.location.href = 'staff-login.html';
        return;
      }
    }
  }
  
  // Apply campus and service restrictions
  if (currentCampus === 'north' && currentService === 'zen-zone') {
    // North campus staff cannot access Zen Zone service
    showToast('Zen Zone is not available at North Campus. Redirecting to Sleep Lounge...', 'warning');
    currentService = 'sleep-lounge';
    localStorage.setItem('service', 'sleep-lounge');
  }
  
  // Set user information
  if (staffAvatar) {
    staffAvatar.textContent = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`;
  }
  
  if (staffName) {
    staffName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  }
  
  if (staffRole) {
    staffRole.textContent = currentService === 'sleep-lounge' ? 
      `Sleep Lounge Staff - ${currentCampus.charAt(0).toUpperCase() + currentCampus.slice(1)} Campus` : 
      'Zen Zone Staff - Lakeshore Campus';
  }
  
  // Set campus toggle button states
  const northToggle = document.getElementById('north-toggle');
  const lakeshoreToggle = document.getElementById('lakeshore-toggle');
  
  if (northToggle && lakeshoreToggle) {
    if (currentCampus === 'north') {
      northToggle.classList.add('toggle-active');
      lakeshoreToggle.classList.remove('toggle-active');
    } else {
      lakeshoreToggle.classList.add('toggle-active');
      northToggle.classList.remove('toggle-active');
    }
  }
  
  // Set service toggle button states
  const sleepToggle = document.getElementById('sleep-toggle');
  const zenToggle = document.getElementById('zen-toggle');
  
  if (sleepToggle && zenToggle) {
    if (currentService === 'sleep-lounge') {
      sleepToggle.classList.add('toggle-active');
      zenToggle.classList.remove('toggle-active');
    } else {
      zenToggle.classList.add('toggle-active');
      sleepToggle.classList.remove('toggle-active');
    }
    
    // Disable Zen Zone toggle for North campus
    if (currentCampus === 'north') {
      zenToggle.disabled = true;
      zenToggle.classList.add('toggle-disabled');
      zenToggle.title = 'Zen Zone is only available at Lakeshore Campus';
    } else {
      zenToggle.disabled = false;
      zenToggle.classList.remove('toggle-disabled');
      zenToggle.title = '';
    }
  }
  
  // Show the appropriate portal
  if (currentService === 'sleep-lounge') {
    sleepLoungePortal.style.display = 'block';
    zenZonePortal.style.display = 'none';
    
    // Initialize Sleep Lounge
    initializeSleepLounge();
  } else {
    sleepLoungePortal.style.display = 'none';
    zenZonePortal.style.display = 'block';
    
    // Initialize Zen Zone
    initializeZenZone();
  }
}

/**
 * Initialize the Sleep Lounge portal
 */
function initializeSleepLounge() {
  // Show loading spinner
  showLoading();
  
  // Load initial data
  loadSleepLoungeData()
    .then(() => {
      // Hide loading spinner
      hideLoading();
      
      // Refresh data every minute
      setInterval(loadSleepLoungeData, 60000);
    })
    .catch(error => {
      console.error('Error loading Sleep Lounge data:', error);
      hideLoading();
      showToast('Error loading data. Please refresh the page.', 'error');
    });
}

/**
 * Initialize the Zen Zone portal
 */
function initializeZenZone() {
  // Show loading spinner
  showLoading();
  
  // Load initial data
  loadZenZoneData()
    .then(() => {
      // Hide loading spinner
      hideLoading();
      
      // Refresh data every minute
      setInterval(loadZenZoneData, 60000);
      
      // Set up task checkboxes
      setupTaskCheckboxes();
    })
    .catch(error => {
      console.error('Error loading Zen Zone data:', error);
      hideLoading();
      showToast('Error loading data. Please refresh the page.', 'error');
    });
}

/**
 * Load all Sleep Lounge data
 */
async function loadSleepLoungeData() {
  try {
    if (useSampleData) {
      // Use sample data for development
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      activeVisits = sampleVisits.filter(v => v.service === 'sleep-lounge');
      totalBeds = 12;
      availableBeds = totalBeds - activeVisits.length;
      dailyStats = {
        todaysVisits: 15,
        avgDuration: 45
      };
      recentActivities = sampleActivities;
      
      if (useApiFallback && !fallbackNotificationShown) {
        showToast('Using sample data due to API connectivity issues', 'warning');
        fallbackNotificationShown = true;
      }
    } else {
      try {
        // Load active visits, bed status, and stats from API
        await Promise.all([
          loadActiveVisits(),
          loadBedStatus(),
          loadSleepLoungeStats(),
          loadSleepLoungeActivity()
        ]);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Switch to sample data if API calls fail
        if (useApiFallback) {
          console.log('Switching to sample data as fallback');
          
          // Use sample data
          activeVisits = sampleVisits.filter(v => v.service === 'sleep-lounge');
          totalBeds = 12;
          availableBeds = totalBeds - activeVisits.length;
          dailyStats = {
            todaysVisits: 15,
            avgDuration: 45
          };
          recentActivities = sampleActivities;
          
          // Notify user only once
          if (!fallbackNotificationShown) {
            showToast('Using sample data due to API connectivity issues', 'warning');
            fallbackNotificationShown = true;
          }
        } else {
          throw apiError; // Re-throw if not using fallback
        }
      }
    }
    
    // Update the UI
    updateSleepLoungeUI();
    
    // Start timers for active visits
    startVisitTimers();
    
    return true;
  } catch (error) {
    console.error('Error in loadSleepLoungeData:', error);
    throw error;
  }
}

/**
 * Load all Zen Zone data
 */
async function loadZenZoneData() {
  try {
    if (useSampleData) {
      // Use sample data for development
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      zenActiveVisits = sampleVisits.filter(v => v.service === 'zen-zone');
      totalZenStations = 6;
      availableZenStations = totalZenStations - zenActiveVisits.length;
      zenDailyStats = {
        todaysVisits: 24,
        avgDuration: 35
      };
      zenRecentActivities = sampleZenActivities;
      
      if (useApiFallback && !fallbackNotificationShown) {
        showToast('Using sample data due to API connectivity issues', 'warning');
        fallbackNotificationShown = true;
      }
    } else {
      try {
        // Load active visits, station status, and stats from API
        await Promise.all([
          loadZenActiveVisits(),
          loadZenStationStatus(),
          loadZenZoneStats(),
          loadZenZoneActivity()
        ]);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Switch to sample data if API calls fail
        if (useApiFallback) {
          console.log('Switching to sample data as fallback');
          
          // Use sample data
          zenActiveVisits = sampleVisits.filter(v => v.service === 'zen-zone');
          totalZenStations = 6;
          availableZenStations = totalZenStations - zenActiveVisits.length;
          zenDailyStats = {
            todaysVisits: 24,
            avgDuration: 35
          };
          zenRecentActivities = sampleZenActivities;
          
          // Notify user only once
          if (!fallbackNotificationShown) {
            showToast('Using sample data due to API connectivity issues', 'warning');
            fallbackNotificationShown = true;
          }
        } else {
          throw apiError; // Re-throw if not using fallback
        }
      }
    }
    
    // Update the UI
    updateZenZoneUI();
    
    // Start timers for active visits
    startZenVisitTimers();
    
    return true;
  } catch (error) {
    console.error('Error in loadZenZoneData:', error);
    throw error;
  }
}

/**
 * Start timers for all active Sleep Lounge visits
 */
function startVisitTimers() {
  // Clear existing timers
  Object.keys(sessionTimers).forEach(key => {
    if (key.startsWith('sleep-')) {
      clearInterval(sessionTimers[key]);
      delete sessionTimers[key];
    }
  });
  
  // Start new timers for each active visit
  activeVisits.forEach(visit => {
    const timerId = `sleep-${visit.id}`;
    sessionTimers[timerId] = setInterval(() => {
      // Update the UI for this visit (e.g., remaining time)
      updateBedGrid();
    }, 60000); // Update every minute
  });
}

/**
 * Start timers for all active Zen Zone visits
 */
function startZenVisitTimers() {
  // Clear existing timers
  Object.keys(sessionTimers).forEach(key => {
    if (key.startsWith('zen-')) {
      clearInterval(sessionTimers[key]);
      delete sessionTimers[key];
    }
  });
  
  // Start new timers for each active visit
  zenActiveVisits.forEach(visit => {
    const timerId = `zen-${visit.id}`;
    sessionTimers[timerId] = setInterval(() => {
      // Update the UI for this visit
      updateZenStationGrid();
    }, 60000); // Update every minute
  });
}

/**
 * Load active visits for Sleep Lounge
 */
async function loadActiveVisits() {
  try {
    const response = await fetch(`/api/visits/active/${encodeURIComponent('sleep-lounge')}/${encodeURIComponent(currentCampus)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Auth error
        localStorage.removeItem('staffAuthToken');
        window.location.href = 'staff-login.html';
        return;
      }
      throw new Error('Failed to load active visits');
    }
    
    const data = await response.json();
    if (data.success) {
      activeVisits = data.data;
    }
  } catch (error) {
    console.error('Error loading active visits:', error);
    throw error;
  }
}

/**
 * Load bed status
 */
async function loadBedStatus() {
  try {
    const response = await fetch(`/api/visits/beds/${encodeURIComponent(currentCampus)}/${encodeURIComponent('sleep-lounge')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load bed status');
    }
    
    const data = await response.json();
    if (data.success) {
      totalBeds = data.data.totalBeds;
      availableBeds = data.data.availableBeds;
    }
  } catch (error) {
    console.error('Error loading bed status:', error);
    throw error;
  }
}

/**
 * Load Sleep Lounge statistics
 */
async function loadSleepLoungeStats() {
  try {
    const response = await fetch(`/api/visits/dailystats?campus=${currentCampus}&service=sleep-lounge`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }
    
    const data = await response.json();
    if (data.success) {
      dailyStats = data.data;
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    throw error;
  }
}

/**
 * Load Sleep Lounge activity feed
 */
async function loadSleepLoungeActivity() {
  try {
    const response = await fetch(`/api/visits/activity?campus=${currentCampus}&service=sleep-lounge&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load activity feed');
    }
    
    const data = await response.json();
    if (data.success) {
      recentActivities = data.data;
    }
  } catch (error) {
    console.error('Error loading activity feed:', error);
    throw error;
  }
}

/**
 * Load active visits for Zen Zone
 */
async function loadZenActiveVisits() {
  try {
    const response = await fetch(`/api/visits/active/${encodeURIComponent('zen-zone')}/${encodeURIComponent(currentCampus)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Auth error
        localStorage.removeItem('staffAuthToken');
        window.location.href = 'staff-login.html';
        return;
      }
      throw new Error('Failed to load active Zen Zone visits');
    }
    
    const data = await response.json();
    if (data.success) {
      zenActiveVisits = data.data;
    }
  } catch (error) {
    console.error('Error loading active Zen Zone visits:', error);
    throw error;
  }
}

/**
 * Load Zen Zone station status
 */
async function loadZenStationStatus() {
  try {
    const response = await fetch(`/api/visits/stations?campus=${currentCampus}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load station status');
    }
    
    const data = await response.json();
    if (data.success) {
      totalZenStations = data.data.totalStations;
      availableZenStations = data.data.availableStations;
    }
  } catch (error) {
    console.error('Error loading station status:', error);
    throw error;
  }
}

/**
 * Load Zen Zone statistics
 */
async function loadZenZoneStats() {
  try {
    const response = await fetch(`/api/visits/stats?campus=${currentCampus}&service=zen-zone`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load Zen Zone statistics');
    }
    
    const data = await response.json();
    if (data.success) {
      zenDailyStats = data.data;
    }
  } catch (error) {
    console.error('Error loading Zen Zone statistics:', error);
    throw error;
  }
}

/**
 * Load Zen Zone activity feed
 */
async function loadZenZoneActivity() {
  try {
    const response = await fetch(`/api/visits/activity?campus=${currentCampus}&service=zen-zone&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load Zen Zone activity feed');
    }
    
    const data = await response.json();
    if (data.success) {
      zenRecentActivities = data.data;
    }
  } catch (error) {
    console.error('Error loading Zen Zone activity feed:', error);
    throw error;
  }
}

/**
 * Search for students in Sleep Lounge
 */
async function searchStudents() {
  const searchTerm = studentSearch.value.trim();
  
  if (!searchTerm) {
    showToast('Please enter a search term', 'warning');
    return;
  }
  
  // Show loading spinner
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter sample students
      const filtered = sampleStudents.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      showStudentResults(filtered);
    } else {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search students');
      }
      
      const data = await response.json();
      if (data.success) {
        showStudentResults(data.data);
      } else {
        showToast(data.message || 'Error searching students', 'error');
      }
    }
  } catch (error) {
    console.error('Error searching students:', error);
    showToast('Error searching students', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Search for students in Zen Zone
 */
async function searchZenStudents() {
  const searchTerm = zenStudentSearch.value.trim();
  
  if (!searchTerm) {
    showToast('Please enter a search term', 'warning');
    return;
  }
  
  // Show loading spinner
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter sample students
      const filtered = sampleStudents.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      showZenStudentResults(filtered);
    } else {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search students');
      }
      
      const data = await response.json();
      if (data.success) {
        showZenStudentResults(data.data);
      } else {
        showToast(data.message || 'Error searching students', 'error');
      }
    }
  } catch (error) {
    console.error('Error searching students:', error);
    showToast('Error searching students', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Display search results for Sleep Lounge students
 */
function showStudentResults(students) {
  if (!studentList) return;
  
  // Clear existing list
  studentList.innerHTML = '';
  
  if (students.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No students found';
    studentList.appendChild(emptyMessage);
    return;
  }
  
  // Create list of students
  students.forEach(student => {
    const studentItem = document.createElement('div');
    studentItem.className = 'student-item';
    
    const studentInfo = document.createElement('div');
    studentInfo.className = 'student-info';
    
    const studentName = document.createElement('div');
    studentName.className = 'student-name';
    studentName.textContent = `${student.firstName} ${student.lastName}`;
    
    const studentDetails = document.createElement('div');
    studentDetails.className = 'student-details';
    studentDetails.textContent = `${student.studentId || 'No ID'} | ${student.email || 'No Email'}`;
    
    const checkInBtn = document.createElement('button');
    checkInBtn.className = 'btn btn-checkin';
    checkInBtn.textContent = 'Check-in';
    checkInBtn.addEventListener('click', () => {
      checkInStudent(student);
    });
    
    studentInfo.append(studentName, studentDetails);
    studentItem.append(studentInfo, checkInBtn);
    studentList.appendChild(studentItem);
  });
}

/**
 * Display search results for Zen Zone students
 */
function showZenStudentResults(students) {
  if (!zenStudentList) return;
  
  // Clear existing list
  zenStudentList.innerHTML = '';
  
  if (students.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No students found';
    zenStudentList.appendChild(emptyMessage);
    return;
  }
  
  // Create list of students
  students.forEach(student => {
    const studentItem = document.createElement('div');
    studentItem.className = 'student-item';
    
    const studentInfo = document.createElement('div');
    studentInfo.className = 'student-info';
    
    const studentName = document.createElement('div');
    studentName.className = 'student-name';
    studentName.textContent = `${student.firstName} ${student.lastName}`;
    
    const studentDetails = document.createElement('div');
    studentDetails.className = 'student-details';
    studentDetails.textContent = `${student.studentId || 'No ID'} | ${student.email || 'No Email'}`;
    
    const checkInBtn = document.createElement('button');
    checkInBtn.className = 'btn btn-checkin';
    checkInBtn.textContent = 'Check-in';
    checkInBtn.addEventListener('click', () => {
      checkInZenStudent(student);
    });
    
    studentInfo.append(studentName, studentDetails);
    studentItem.append(studentInfo, checkInBtn);
    zenStudentList.appendChild(studentItem);
  });
}

/**
 * Check in a student to Sleep Lounge
 */
async function checkInStudent(student) {
  if (availableBeds <= 0) {
    showToast('No beds available', 'error');
    return;
  }
  
  // Find an available bed
  let availableBed = 0;
  for (let i = 1; i <= totalBeds; i++) {
    if (!activeVisits.some(visit => visit.bedNumber === i)) {
      availableBed = i;
      break;
    }
  }
  
  if (availableBed === 0) {
    showToast('No beds available', 'error');
    return;
  }
  
  // Show loading spinner
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new visit
      const newVisit = {
        id: Math.floor(Math.random() * 10000),
        student: student,
        bedNumber: availableBed,
        checkinTime: new Date(),
        timeLimit: 60,
        service: 'sleep-lounge'
      };
      
      // Add to active visits
      activeVisits.push(newVisit);
      
      // Update available beds
      availableBeds--;
      
      // Add to recent activities
      recentActivities.unshift({
        type: 'check-in',
        student: student,
        bedNumber: availableBed,
        timestamp: new Date()
      });
      
      // Update stats
      dailyStats.todaysVisits++;
      
      // Success message
      showToast(`${student.firstName} ${student.lastName} checked in to Bed ${availableBed}`, 'success');
      
      // Update UI
      updateSleepLoungeUI();
      
      // Clear search
      studentSearch.value = '';
      studentList.innerHTML = '';
      
      // Start timer for this visit
      startVisitTimers();
    } else {
      const response = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: student.id,           // Database ID (UUID)
          studentId: student.studentId, // The actual student ID (e.g., N12345678)
          campus: currentCampus,
          service: 'sleep-lounge',
          bedNumber: availableBed
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in student');
      }
      
      const data = await response.json();
      if (data.success) {
        showToast(`${student.firstName} ${student.lastName} checked in to Bed ${availableBed}`, 'success');
        
        // Refresh data
        await loadSleepLoungeData();
        
        // Clear search
        studentSearch.value = '';
        studentList.innerHTML = '';
      } else {
        showToast(data.message || 'Error checking in student', 'error');
      }
    }
  } catch (error) {
    console.error('Error checking in student:', error);
    showToast('Error checking in student', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Check in a student to Zen Zone
 */
async function checkInZenStudent(student) {
  if (availableZenStations <= 0) {
    showToast('No stations available', 'error');
    return;
  }
  
  // Station types
  const stationTypes = [
    { id: 'meditation-1', name: 'Meditation 1' },
    { id: 'meditation-2', name: 'Meditation 2' },
    { id: 'relaxation-1', name: 'Relaxation 1' },
    { id: 'relaxation-2', name: 'Relaxation 2' },
    { id: 'quiet-1', name: 'Quiet Space 1' },
    { id: 'quiet-2', name: 'Quiet Space 2' }
  ];
  
  // Find available stations
  const availableStations = stationTypes.filter(station => 
    !zenActiveVisits.some(visit => visit.stationId === station.id)
  );
  
  if (availableStations.length === 0) {
    showToast('No stations available', 'error');
    return;
  }
  
  // Use the first available station for simplicity
  // In a real implementation, you would show a dialog to select a station
  const selectedStation = availableStations[0];
  
  // Show loading spinner
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new visit
      const newVisit = {
        id: Math.floor(Math.random() * 10000),
        student: student,
        stationId: selectedStation.id,
        stationName: selectedStation.name,
        checkinTime: new Date(),
        service: 'zen-zone'
      };
      
      // Add to active visits
      zenActiveVisits.push(newVisit);
      
      // Update available stations
      availableZenStations--;
      
      // Add to recent activities
      zenRecentActivities.unshift({
        type: 'check-in',
        student: student,
        stationId: selectedStation.id,
        stationName: selectedStation.name,
        timestamp: new Date()
      });
      
      // Update stats
      zenDailyStats.todaysVisits++;
      
      // Success message
      showToast(`${student.firstName} ${student.lastName} checked in to ${selectedStation.name}`, 'success');
      
      // Update UI
      updateZenZoneUI();
      
      // Clear search
      zenStudentSearch.value = '';
      zenStudentList.innerHTML = '';
      
      // Start timer for this visit
      startZenVisitTimers();
    } else {
      const response = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: student.id,           // Database ID (UUID)
          studentId: student.studentId, // The actual student ID (e.g., N12345678)
          campus: currentCampus,
          service: 'zen-zone',
          stationId: selectedStation.id,
          stationName: selectedStation.name
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in student');
      }
      
      const data = await response.json();
      if (data.success) {
        showToast(`${student.firstName} ${student.lastName} checked in to ${selectedStation.name}`, 'success');
        
        // Refresh data
        await loadZenZoneData();
        
        // Clear search
        zenStudentSearch.value = '';
        zenStudentList.innerHTML = '';
      } else {
        showToast(data.message || 'Error checking in student', 'error');
      }
    }
  } catch (error) {
    console.error('Error checking in student:', error);
    showToast('Error checking in student', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Check out a student
 */
async function checkoutStudent() {
  const visitId = confirmCheckoutBtn.getAttribute('data-visit-id');
  const service = confirmCheckoutBtn.getAttribute('data-service');
  const notes = checkoutNotes.value.trim();
  
  if (!visitId) {
    showToast('Invalid visit', 'error');
    return;
  }
  
  // Close modal
  closeCheckoutModal();
  
  // Show loading spinner
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (service === 'sleep-lounge') {
        // Find the visit
        const visitIndex = activeVisits.findIndex(v => v.id.toString() === visitId);
        
        if (visitIndex >= 0) {
          const visit = activeVisits[visitIndex];
          
          // Remove from active visits
          activeVisits.splice(visitIndex, 1);
          
          // Update available beds
          availableBeds++;
          
          // Add to recent activities
          recentActivities.unshift({
            type: 'check-out',
            student: visit.student,
            bedNumber: visit.bedNumber,
            timestamp: new Date(),
            notes: notes
          });
          
          // Clear timer
          const timerId = `sleep-${visit.id}`;
          if (sessionTimers[timerId]) {
            clearInterval(sessionTimers[timerId]);
            delete sessionTimers[timerId];
          }
        }
        
        // Update UI
        updateSleepLoungeUI();
      } else {
        // Find the visit
        const visitIndex = zenActiveVisits.findIndex(v => v.id.toString() === visitId);
        
        if (visitIndex >= 0) {
          const visit = zenActiveVisits[visitIndex];
          
          // Remove from active visits
          zenActiveVisits.splice(visitIndex, 1);
          
          // Update available stations
          availableZenStations++;
          
          // Add to recent activities
          zenRecentActivities.unshift({
            type: 'check-out',
            student: visit.student,
            stationId: visit.stationId,
            stationName: visit.stationName,
            timestamp: new Date(),
            notes: notes
          });
          
          // Clear timer
          const timerId = `zen-${visit.id}`;
          if (sessionTimers[timerId]) {
            clearInterval(sessionTimers[timerId]);
            delete sessionTimers[timerId];
          }
        }
        
        // Update UI
        updateZenZoneUI();
      }
      
      showToast('Student checked out successfully', 'success');
    } else {
      const response = await fetch(`/api/visits/checkout/${visitId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: notes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out student');
      }
      
      const data = await response.json();
      if (data.success) {
        showToast('Student checked out successfully', 'success');
        
        // Refresh data based on service
        if (service === 'sleep-lounge' || currentService === 'sleep-lounge') {
          await loadSleepLoungeData();
        } else {
          await loadZenZoneData();
        }
      } else {
        showToast(data.message || 'Error checking out student', 'error');
      }
    }
  } catch (error) {
    console.error('Error checking out student:', error);
    showToast('Error checking out student', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Toggle between Sleep Lounge and Zen Zone portals
 */
function togglePortal(service) {
  if (service === currentService) return;
  
  currentService = service;
  localStorage.setItem('service', service);
  
  if (staffRole) {
    staffRole.textContent = service === 'sleep-lounge' ? 
      'Sleep Lounge Staff' : 'Zen Zone Staff';
  }
  
  if (service === 'sleep-lounge') {
    sleepLoungePortal.style.display = 'block';
    zenZonePortal.style.display = 'none';
    
    // Initialize Sleep Lounge
    initializeSleepLounge();
  } else {
    sleepLoungePortal.style.display = 'none';
    zenZonePortal.style.display = 'block';
    
    // Initialize Zen Zone
    initializeZenZone();
  }
}

/**
 * Toggle campus
 */
function toggleCampus(campus) {
  if (campus === currentCampus) return;
  
  currentCampus = campus;
  localStorage.setItem('campus', campus);
  
  // Reload data for current service
  if (currentService === 'sleep-lounge') {
    initializeSleepLounge();
  } else {
    initializeZenZone();
  }
}

/**
 * Update the Sleep Lounge UI with current data
 */
function updateSleepLoungeUI() {
  // Update statistics
  if (activeVisitsCount) activeVisitsCount.textContent = activeVisits.length;
  if (availableBedsCount) availableBedsCount.textContent = availableBeds;
  if (todaysVisitsCount) todaysVisitsCount.textContent = dailyStats.todaysVisits;
  if (avgDuration) avgDuration.textContent = Math.round(dailyStats.avgDuration);
  
  // Update bed grid
  updateBedGrid();
  
  // Update activity feed
  updateActivityFeed();
}

/**
 * Update the Zen Zone UI with current data
 */
function updateZenZoneUI() {
  // Update statistics
  if (zenActiveVisitsCount) zenActiveVisitsCount.textContent = zenActiveVisits.length;
  if (zenAvailableStationsCount) zenAvailableStationsCount.textContent = availableZenStations;
  if (zenTodaysVisitsCount) zenTodaysVisitsCount.textContent = zenDailyStats.todaysVisits;
  if (zenAvgDuration) zenAvgDuration.textContent = Math.round(zenDailyStats.avgDuration);
  
  // Update station grid
  updateZenStationGrid();
  
  // Update activity feed
  updateZenActivityFeed();
}

/**
 * Update bed grid with current status
 */
function updateBedGrid() {
  if (!bedsGrid) return;
  
  // Clear existing grid
  bedsGrid.innerHTML = '';
  
  // Create bed items
  for (let i = 1; i <= totalBeds; i++) {
    // Find if this bed is occupied
    const occupyingVisit = activeVisits.find(visit => visit.bedNumber === i);
    const bedAvailable = !occupyingVisit;
    
    // Create bed element
    const bedElement = document.createElement('div');
    bedElement.className = `bed-item ${bedAvailable ? 'bed-available' : 'bed-occupied'}`;
    if (occupyingVisit) {
      // Check if this visit is close to time limit
      const checkinTime = new Date(occupyingVisit.checkinTime);
      const currentTime = new Date();
      const durationMinutes = Math.floor((currentTime - checkinTime) / 60000);
      const timeLimit = occupyingVisit.timeLimit || 60;
      const remainingMinutes = timeLimit - durationMinutes;
      
      if (remainingMinutes <= 5 && remainingMinutes > 0) {
        bedElement.className = 'bed-item bed-warning';
      } else if (remainingMinutes <= 0) {
        bedElement.className = 'bed-item bed-alert';
      }
    }
    
    // Add bed number
    const bedName = document.createElement('div');
    bedName.className = 'bed-name';
    bedName.textContent = `Bed ${i}`;
    bedElement.appendChild(bedName);
    
    // Add tooltip for occupied beds
    if (occupyingVisit) {
      const tooltip = document.createElement('div');
      tooltip.className = 'bed-tooltip';
      
      const studentName = document.createElement('div');
      studentName.textContent = `${occupyingVisit.student.firstName} ${occupyingVisit.student.lastName}`;
      studentName.style.fontWeight = 'bold';
      
      const studentId = document.createElement('div');
      studentId.textContent = occupyingVisit.student.studentId;
      
      const checkinTime = new Date(occupyingVisit.checkinTime);
      const timeDisplay = document.createElement('div');
      timeDisplay.textContent = `Check-in: ${formatTime(checkinTime)}`;
      
      const currentTime = new Date();
      const durationMinutes = Math.floor((currentTime - checkinTime) / 60000);
      const timeLimit = occupyingVisit.timeLimit || 60;
      const remainingMinutes = timeLimit - durationMinutes;
      
      const remainingDisplay = document.createElement('div');
      remainingDisplay.textContent = `Time remaining: ${remainingMinutes} min`;
      
      const checkoutBtn = document.createElement('button');
      checkoutBtn.className = 'btn btn-checkout';
      checkoutBtn.textContent = 'Check-out';
      checkoutBtn.onclick = (e) => {
        e.stopPropagation();
        openCheckoutModal(occupyingVisit);
      };
      
      tooltip.append(studentName, studentId, timeDisplay, remainingDisplay, checkoutBtn);
      bedElement.appendChild(tooltip);
      
      // Add click event to show checkout modal
      bedElement.addEventListener('click', () => {
        openCheckoutModal(occupyingVisit);
      });
    }
    
    bedsGrid.appendChild(bedElement);
  }
}

/**
 * Update Zen station grid with current status
 */
function updateZenStationGrid() {
  if (!zenStationsGrid) return;
  
  // Clear existing grid
  zenStationsGrid.innerHTML = '';
  
  // Zen station types
  const stationTypes = [
    { id: 'meditation-1', name: 'Meditation 1' },
    { id: 'meditation-2', name: 'Meditation 2' },
    { id: 'relaxation-1', name: 'Relaxation 1' },
    { id: 'relaxation-2', name: 'Relaxation 2' },
    { id: 'quiet-1', name: 'Quiet Space 1' },
    { id: 'quiet-2', name: 'Quiet Space 2' }
  ];
  
  // Create station items
  stationTypes.forEach(station => {
    // Find if this station is occupied
    const occupyingVisit = zenActiveVisits.find(visit => visit.stationId === station.id);
    const stationAvailable = !occupyingVisit;
    
    // Create station element
    const stationElement = document.createElement('div');
    stationElement.className = `zen-station ${stationAvailable ? 'zen-available' : 'zen-occupied'}`;
    
    // Add station name
    const stationName = document.createElement('div');
    stationName.className = 'bed-name'; // Reuse bed-name class
    stationName.textContent = station.name;
    stationElement.appendChild(stationName);
    
    // Add tooltip for occupied stations
    if (occupyingVisit) {
      const tooltip = document.createElement('div');
      tooltip.className = 'bed-tooltip'; // Reuse bed-tooltip class
      
      const studentName = document.createElement('div');
      studentName.textContent = `${occupyingVisit.student.firstName} ${occupyingVisit.student.lastName}`;
      studentName.style.fontWeight = 'bold';
      
      const studentId = document.createElement('div');
      studentId.textContent = occupyingVisit.student.studentId;
      
      const checkinTime = new Date(occupyingVisit.checkinTime);
      const timeDisplay = document.createElement('div');
      timeDisplay.textContent = `Check-in: ${formatTime(checkinTime)}`;
      
      const checkoutBtn = document.createElement('button');
      checkoutBtn.className = 'btn btn-checkout';
      checkoutBtn.textContent = 'Check-out';
      checkoutBtn.onclick = (e) => {
        e.stopPropagation();
        openCheckoutModal(occupyingVisit);
      };
      
      tooltip.append(studentName, studentId, timeDisplay, checkoutBtn);
      stationElement.appendChild(tooltip);
      
      // Add click event to show checkout modal
      stationElement.addEventListener('click', () => {
        openCheckoutModal(occupyingVisit);
      });
    }
    
    zenStationsGrid.appendChild(stationElement);
  });
}

/**
 * Update activity feed for Sleep Lounge
 */
function updateActivityFeed() {
  if (!activityFeed) return;
  
  // Clear existing feed
  activityFeed.innerHTML = '';
  
  if (recentActivities.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No recent activity';
    activityFeed.appendChild(emptyMessage);
    return;
  }
  
  // Create activity items
  recentActivities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const activityIcon = document.createElement('div');
    activityIcon.className = `activity-icon ${activity.type === 'check-in' ? 'check-in' : 'check-out'}`;
    
    const icon = document.createElement('i');
    icon.className = activity.type === 'check-in' ? 'fas fa-sign-in-alt' : 'fas fa-sign-out-alt';
    activityIcon.appendChild(icon);
    
    const activityContent = document.createElement('div');
    activityContent.className = 'activity-content';
    
    const activityText = document.createElement('p');
    activityText.className = 'activity-text';
    
    const studentName = `${activity.student.firstName} ${activity.student.lastName}`;
    activityText.textContent = activity.type === 'check-in' ? 
      `${studentName} checked in to Bed ${activity.bedNumber}` : 
      `${studentName} checked out from Bed ${activity.bedNumber}`;
    
    const activityTime = document.createElement('p');
    activityTime.className = 'activity-time';
    const activityDate = new Date(activity.timestamp);
    activityTime.textContent = formatTime(activityDate);
    
    activityContent.append(activityText, activityTime);
    activityItem.append(activityIcon, activityContent);
    activityFeed.appendChild(activityItem);
  });
}

/**
 * Update activity feed for Zen Zone
 */
function updateZenActivityFeed() {
  if (!zenActivityFeed) return;
  
  // Clear existing feed
  zenActivityFeed.innerHTML = '';
  
  if (zenRecentActivities.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No recent activity';
    zenActivityFeed.appendChild(emptyMessage);
    return;
  }
  
  // Create activity items
  zenRecentActivities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const activityIcon = document.createElement('div');
    activityIcon.className = `activity-icon ${activity.type === 'check-in' ? 'check-in' : 'check-out'}`;
    
    const icon = document.createElement('i');
    icon.className = activity.type === 'check-in' ? 'fas fa-sign-in-alt' : 'fas fa-sign-out-alt';
    activityIcon.appendChild(icon);
    
    const activityContent = document.createElement('div');
    activityContent.className = 'activity-content';
    
    const activityText = document.createElement('p');
    activityText.className = 'activity-text';
    
    const studentName = `${activity.student.firstName} ${activity.student.lastName}`;
    const stationName = activity.stationName || activity.stationId;
    
    activityText.textContent = activity.type === 'check-in' ? 
      `${studentName} checked in to ${stationName}` : 
      `${studentName} checked out from ${stationName}`;
    
    const activityTime = document.createElement('p');
    activityTime.className = 'activity-time';
    const activityDate = new Date(activity.timestamp);
    activityTime.textContent = formatTime(activityDate);
    
    activityContent.append(activityText, activityTime);
    activityItem.append(activityIcon, activityContent);
    zenActivityFeed.appendChild(activityItem);
  });
}

/**
 * Open the checkout modal
 */
function openCheckoutModal(visit) {
  if (!checkoutModal) return;
  
  // Set checkout information
  checkoutStudentName.textContent = `${visit.student.firstName} ${visit.student.lastName}`;
  checkoutStudentId.textContent = visit.student.studentId;
  
  const checkinTime = new Date(visit.checkinTime);
  checkoutCheckinTime.textContent = formatTime(checkinTime);
  
  const currentTime = new Date();
  const durationMinutes = Math.floor((currentTime - checkinTime) / 60000);
  checkoutDuration.textContent = `${durationMinutes} minutes`;
  
  // Clear notes
  checkoutNotes.value = '';
  
  // Store visit ID for checkout
  confirmCheckoutBtn.setAttribute('data-visit-id', visit.id);
  confirmCheckoutBtn.setAttribute('data-service', visit.service);
  
  // Show modal
  checkoutModal.classList.add('show');
}

/**
 * Close the checkout modal
 */
function closeCheckoutModal() {
  if (!checkoutModal) return;
  
  // Hide modal
  checkoutModal.classList.remove('show');
}

/**
 * Set up task checkboxes for Zen Zone
 */
function setupTaskCheckboxes() {
  if (!zenTasksList) return;
  
  // Get all checkboxes
  const checkboxes = zenTasksList.querySelectorAll('.task-checkbox');
  
  // Add click event to each checkbox
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('click', function() {
      this.classList.toggle('checked');
      
      // Save task state to localStorage
      const taskId = this.getAttribute('data-task');
      const isChecked = this.classList.contains('checked');
      
      // Get saved tasks from localStorage
      const savedTasks = JSON.parse(localStorage.getItem('zenTasks') || '{}');
      savedTasks[taskId] = isChecked;
      
      // Save back to localStorage
      localStorage.setItem('zenTasks', JSON.stringify(savedTasks));
    });
    
    // Set initial state from localStorage
    const taskId = checkbox.getAttribute('data-task');
    const savedTasks = JSON.parse(localStorage.getItem('zenTasks') || '{}');
    
    if (savedTasks[taskId]) {
      checkbox.classList.add('checked');
    }
  });
}

/**
 * Open the activity management modal
 */
function manageActivities() {
  const activityModal = document.getElementById('activity-modal');
  const closeActivityModalBtn = document.getElementById('close-activity-modal');
  const closeActivityBtn = document.getElementById('close-activity-btn');
  const saveActivitiesBtn = document.getElementById('save-activities-btn');
  const addActivityBtn = document.getElementById('add-activity-btn');
  const activityList = document.getElementById('activity-list');
  
  // Get activities from localStorage or use default
  let currentActivities = JSON.parse(localStorage.getItem('zenActivities') || '[]');
  
  if (currentActivities.length === 0) {
    // Default activities
    currentActivities = [
      { id: 1, name: 'Tea Service', icon: 'mug-hot', startTime: '10:00', endTime: '14:00' },
      { id: 2, name: 'Paint Session', icon: 'paint-brush', startTime: '13:00', endTime: '15:00' },
      { id: 3, name: 'Reading Corner', icon: 'book', startTime: '09:00', endTime: '16:00' },
      { id: 4, name: 'Meditation', icon: 'spa', startTime: '11:00', endTime: '13:00' }
    ];
    
    // Save the default activities to localStorage
    localStorage.setItem('zenActivities', JSON.stringify(currentActivities));
  }
  
  // Display current activities
  function displayActivities() {
    activityList.innerHTML = '';
    
    currentActivities.forEach(activity => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.dataset.id = activity.id;
      
      activityItem.innerHTML = `
        <div class="activity-info">
          <div class="activity-icon">
            <i class="fas fa-${activity.icon}"></i>
          </div>
          <div class="activity-details">
            <div class="activity-name">${activity.name}</div>
            <div class="activity-time">${activity.startTime} - ${activity.endTime}</div>
          </div>
        </div>
        <div class="activity-actions">
          <button class="btn btn-edit-activity">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-delete-activity">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      // Edit activity event
      activityItem.querySelector('.btn-edit-activity').addEventListener('click', () => {
        editActivity(activity);
      });
      
      // Delete activity event
      activityItem.querySelector('.btn-delete-activity').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${activity.name}"?`)) {
          currentActivities = currentActivities.filter(a => a.id !== activity.id);
          displayActivities();
        }
      });
      
      activityList.appendChild(activityItem);
    });
  }
  
  // Add a new activity
  function addActivity() {
    const activityName = document.getElementById('activity-name').value;
    const activityIcon = document.getElementById('activity-icon').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (!activityName || !startTime || !endTime) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Format times to HH:MM format
    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    };
    
    const newActivity = {
      id: Date.now(), // Use timestamp as unique ID
      name: activityName,
      icon: activityIcon,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime)
    };
    
    currentActivities.push(newActivity);
    
    // Reset form
    document.getElementById('activity-name').value = '';
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    
    // Update display
    displayActivities();
  }
  
  // Edit activity
  function editActivity(activity) {
    document.getElementById('activity-name').value = activity.name;
    document.getElementById('activity-icon').value = activity.icon;
    document.getElementById('start-time').value = activity.startTime;
    document.getElementById('end-time').value = activity.endTime;
    
    // Remove the activity from array
    currentActivities = currentActivities.filter(a => a.id !== activity.id);
    
    // Show form
    document.getElementById('activity-name').focus();
  }
  
  // Initialize the modal
  function initActivityModal() {
    // Display current activities
    displayActivities();
    
    // Set up event listeners
    addActivityBtn.addEventListener('click', addActivity);
    
    saveActivitiesBtn.addEventListener('click', () => {
      // Save to localStorage
      localStorage.setItem('zenActivities', JSON.stringify(currentActivities));
      
      // Update the UI
      updateActivitiesGrid();
      
      // Close modal
      activityModal.classList.remove('show');
      
      showToast('Activities saved successfully', 'success');
    });
    
    closeActivityModalBtn.addEventListener('click', () => {
      activityModal.classList.remove('show');
    });
    
    closeActivityBtn.addEventListener('click', () => {
      activityModal.classList.remove('show');
    });
    
    // Show modal
    activityModal.classList.add('show');
  }
  
  initActivityModal();
}

/**
 * Update activities grid on Zen Zone page
 */
function updateActivitiesGrid() {
  const activitiesGrid = document.getElementById('activities-grid');
  
  if (!activitiesGrid) return;
  
  // Get activities from localStorage - use admin settings if available
  const activities = JSON.parse(localStorage.getItem('zenActivities') || '[]');
  
  // Clear grid
  activitiesGrid.innerHTML = '';
  
  if (activities.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No activities scheduled';
    activitiesGrid.appendChild(emptyMessage);
    return;
  }
  
  // Add activity cards
  activities.forEach(activity => {
    const card = document.createElement('div');
    card.className = 'activity-card';
    
    const icon = document.createElement('i');
    icon.className = `fas fa-${activity.icon} activity-icon-large`;
    
    const title = document.createElement('div');
    title.className = 'activity-title';
    title.textContent = activity.name;
    
    const timeSlot = document.createElement('div');
    timeSlot.className = 'activity-time-slot';
    timeSlot.textContent = `${activity.startTime} - ${activity.endTime}`;
    
    card.append(icon, title, timeSlot);
    activitiesGrid.appendChild(card);
  });
}

/**
 * Report an issue for Sleep Lounge
 */
function reportIssue() {
  openIssueModal('sleep-lounge');
}

/**
 * Report an issue for Zen Zone
 */
function reportZenIssue() {
  openIssueModal('zen-zone');
}

/**
 * Open issue report modal
 */
function openIssueModal(service) {
  const issueModal = document.getElementById('issue-modal');
  const closeIssueModalBtn = document.getElementById('close-issue-modal');
  const cancelIssueBtn = document.getElementById('cancel-issue');
  const submitIssueBtn = document.getElementById('submit-issue');
  
  // Set service for later
  submitIssueBtn.setAttribute('data-service', service);
  
  // Reset form
  document.getElementById('issue-type').value = 'technical';
  document.getElementById('issue-priority').value = 'medium';
  document.getElementById('issue-description').value = '';
  
  // Set up event listeners
  closeIssueModalBtn.addEventListener('click', () => {
    issueModal.classList.remove('show');
  });
  
  cancelIssueBtn.addEventListener('click', () => {
    issueModal.classList.remove('show');
  });
  
  submitIssueBtn.addEventListener('click', () => {
    submitIssue();
  });
  
  // Show modal
  issueModal.classList.add('show');
}

/**
 * Submit an issue
 */
async function submitIssue() {
  const issueModal = document.getElementById('issue-modal');
  const submitIssueBtn = document.getElementById('submit-issue');
  const service = submitIssueBtn.getAttribute('data-service');
  
  const issueType = document.getElementById('issue-type').value;
  const issuePriority = document.getElementById('issue-priority').value;
  const issueDescription = document.getElementById('issue-description').value.trim();
  
  if (!issueDescription) {
    showToast('Please provide a description', 'warning');
    return;
  }
  
  showLoading();
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal
      issueModal.classList.remove('show');
      
      showToast('Issue reported successfully', 'success');
    } else {
      const response = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: issueType,
          priority: issuePriority,
          description: issueDescription,
          service: service,
          campus: currentCampus,
          reportedBy: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit issue');
      }
      
      const data = await response.json();
      if (data.success) {
        // Close modal
        issueModal.classList.remove('show');
        
        showToast('Issue reported successfully', 'success');
      } else {
        showToast(data.message || 'Error submitting issue', 'error');
      }
    }
  } catch (error) {
    console.error('Error submitting issue:', error);
    showToast('Error submitting issue', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Export visit data for Sleep Lounge
 */
function exportVisitData() {
  exportData('sleep-lounge');
}

/**
 * Export visit data for Zen Zone
 */
function exportZenVisitData() {
  exportData('zen-zone');
}

/**
 * Export data common function
 */
async function exportData(service) {
  showLoading();
  
  const today = new Date().toISOString().split('T')[0];
  const filename = `${service}-visits-${today}.csv`;
  
  try {
    if (useSampleData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sampleCsv = 'Student ID,First Name,Last Name,Check-in Time,Check-out Time,Duration (min)\n' +
        'N12345678,John,Doe,2025-04-16 10:15,2025-04-16 11:00,45\n' +
        'N87654321,Jane,Smith,2025-04-16 11:30,2025-04-16 12:15,45\n' +
        'N13579246,Alex,Johnson,2025-04-16 12:45,2025-04-16 13:30,45\n';
      
      // Create and download CSV
      downloadCsv(sampleCsv, filename);
      
      showToast('Export completed successfully', 'success');
    } else {
      const response = await fetch(`/api/visits/export?campus=${currentCampus}&service=${service}&date=${today}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const csvData = await response.text();
      
      // Create and download CSV
      downloadCsv(csvData, filename);
      
      showToast('Export completed successfully', 'success');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast('Error exporting data', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Download CSV helper function
 */
function downloadCsv(csvData, filename) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print bed status
 */
function printBedStatus() {
  window.print();
}

/**
 * Format time helper function
 */
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format time from input field (HH:MM) to display format (HH:MM AM/PM)
 */
function formatTimeFromInput(timeStr) {
  if (!timeStr) return '';
  
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Show loading spinner
 */
function showLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.add('show');
  }
}

/**
 * Hide loading spinner
 */
function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.remove('show');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  if (!toast) return;
  
  // Set message
  toast.textContent = message;
  
  // Set type
  toast.className = 'toast';
  toast.classList.add(`toast-${type}`);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Sleep Lounge search
  if (searchBtn) {
    searchBtn.addEventListener('click', searchStudents);
  }
  
  if (studentSearch) {
    studentSearch.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        searchStudents();
      }
    });
  }
  
  // Zen Zone search
  if (zenSearchBtn) {
    zenSearchBtn.addEventListener('click', searchZenStudents);
  }
  
  if (zenStudentSearch) {
    zenStudentSearch.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        searchZenStudents();
      }
    });
  }
  
  // Refresh buttons
  if (refreshBedsBtn) {
    refreshBedsBtn.addEventListener('click', async () => {
      showLoading();
      try {
        await loadSleepLoungeData();
        updateSleepLoungeUI();
        showToast('Bed status refreshed', 'info');
      } catch (error) {
        console.error('Error refreshing bed status:', error);
        showToast('Error refreshing bed status', 'error');
      } finally {
        hideLoading();
      }
    });
  }
  
  if (refreshStationsBtn) {
    refreshStationsBtn.addEventListener('click', async () => {
      showLoading();
      try {
        await loadZenZoneData();
        updateZenZoneUI();
        showToast('Station status refreshed', 'info');
      } catch (error) {
        console.error('Error refreshing station status:', error);
        showToast('Error refreshing station status', 'error');
      } finally {
        hideLoading();
      }
    });
  }
  
  // Modal buttons
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCheckoutModal);
  }
  
  if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
  }
  
  if (confirmCheckoutBtn) {
    confirmCheckoutBtn.addEventListener('click', checkoutStudent);
  }
  
  // Close modal when clicking outside
  if (checkoutModal) {
    checkoutModal.addEventListener('click', e => {
      if (e.target === checkoutModal) {
        closeCheckoutModal();
      }
    });
  }
  
  const activityModal = document.getElementById('activity-modal');
  if (activityModal) {
    activityModal.addEventListener('click', e => {
      if (e.target === activityModal) {
        activityModal.classList.remove('show');
      }
    });
  }
  
  const issueModal = document.getElementById('issue-modal');
  if (issueModal) {
    issueModal.addEventListener('click', e => {
      if (e.target === issueModal) {
        issueModal.classList.remove('show');
      }
    });
  }
  
  // Service toggle buttons
  const sleepToggle = document.getElementById('sleep-toggle');
  const zenToggle = document.getElementById('zen-toggle');
  
  if (sleepToggle && zenToggle) {
    sleepToggle.addEventListener('click', () => {
      sleepToggle.classList.add('toggle-active');
      zenToggle.classList.remove('toggle-active');
      togglePortal('sleep-lounge');
    });
    
    zenToggle.addEventListener('click', () => {
      zenToggle.classList.add('toggle-active');
      sleepToggle.classList.remove('toggle-active');
      togglePortal('zen-zone');
    });
  }
  
  // Campus toggle buttons
  const northToggle = document.getElementById('north-toggle');
  const lakeshoreToggle = document.getElementById('lakeshore-toggle');
  
  if (northToggle && lakeshoreToggle) {
    northToggle.addEventListener('click', () => {
      northToggle.classList.add('toggle-active');
      lakeshoreToggle.classList.remove('toggle-active');
      toggleCampus('north');
    });
    
    lakeshoreToggle.addEventListener('click', () => {
      lakeshoreToggle.classList.add('toggle-active');
      northToggle.classList.remove('toggle-active');
      toggleCampus('lakeshore');
    });
  }
}

/**
 * Log out the user
 */
function logout() {
  localStorage.removeItem('staffAuthToken');
  localStorage.removeItem('staffUser');
  localStorage.removeItem('campus');
  localStorage.removeItem('service');
  
  window.location.href = 'staff-login.html?logout=true';
}