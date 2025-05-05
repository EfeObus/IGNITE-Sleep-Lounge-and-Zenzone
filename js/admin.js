/**
 * IGNITE Sleep Lounge and Zen Zone - Admin Dashboard
 * This file handles all admin functionality for the Sleep Lounge admin dashboard
 */

// Global variables
let currentUser = null;
let authToken = null;

// DOM Elements
const adminLoginForm = document.getElementById('admin-login-form');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginContainer = document.getElementById('admin-login-container');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Add global error handler
window.addEventListener('error', function(e) {
  console.error('JavaScript Error:', e.message, 'in', e.filename, 'line', e.lineno);
  showMessage('An error occurred: ' + e.message, 'error');
});

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize tabs
  initTabs();
});

/**
 * Check if the user is already authenticated
 */
function checkAuthStatus() {
  // Check for stored token
  authToken = localStorage.getItem('authToken');
  
  if (authToken) {
    // Validate token and get user info
    fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data.role === 'admin') {
        // Valid admin user
        currentUser = data.data;
        showDashboard();
        loadDashboardData();
      } else {
        // Not an admin user
        logout();
      }
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      logout();
    });
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Admin login form
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleLogin);
  }
  
  // Admin logout button
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', logout);
  }
  
  // Staff management
  const addStaffForm = document.getElementById('add-staff-form');
  if (addStaffForm) {
    addStaffForm.addEventListener('submit', handleAddStaff);
  }
  
  // Staff filters
  const staffSearch = document.getElementById('staff-search');
  const staffFilter = document.getElementById('staff-filter');
  if (staffSearch) {
    staffSearch.addEventListener('input', () => filterStaffList());
  }
  if (staffFilter) {
    staffFilter.addEventListener('change', () => filterStaffList());
  }
  
  // Student filters
  const studentSearch = document.getElementById('student-search');
  const studentFilter = document.getElementById('student-filter');
  const applyDateFilter = document.getElementById('apply-date-filter');
  if (studentSearch) {
    studentSearch.addEventListener('input', () => filterStudentList());
  }
  if (studentFilter) {
    studentFilter.addEventListener('change', () => filterStudentList());
  }
  if (applyDateFilter) {
    applyDateFilter.addEventListener('click', () => filterStudentList());
  }
  
  // Add button listeners for student actions
  document.querySelectorAll('.btn-view-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      viewStudentDetails(studentId);
    });
  });
  
  document.querySelectorAll('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      editStudent(studentId);
    });
  });
  
  document.querySelectorAll('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      deleteStudent(studentId);
    });
  });
  
  // Settings save and reset
  const saveSettingsBtn = document.getElementById('save-settings');
  const resetSettingsBtn = document.getElementById('reset-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
  }
  
  // Log type buttons
  const logTypeBtns = document.querySelectorAll('.log-type-btn');
  logTypeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const logType = this.getAttribute('data-log');
      showLogTab(logType);
    });
  });
  
  // Log filter button
  const applyLogFilter = document.getElementById('apply-log-filter');
  if (applyLogFilter) {
    applyLogFilter.addEventListener('click', filterLogs);
  }
}

/**
 * Initialize dashboard tabs
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const dashboardTabs = document.querySelectorAll('.dashboard-tab');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Show selected tab
      dashboardTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId + '-tab') {
          tab.classList.add('active');
          loadTabData(tabId);
        }
      });
    });
  });
}

/**
 * Display specific log tab content
 */
function showLogTab(logType) {
  // Get all log containers
  const logContainers = document.querySelectorAll('.log-container');
  
  // Hide all containers
  logContainers.forEach(container => {
    container.style.display = 'none';
  });
  
  // Show selected container
  const selectedContainer = document.getElementById(`${logType}-logs`);
  if (selectedContainer) {
    selectedContainer.style.display = 'block';
  }
  
  // Update active button
  const logTypeBtns = document.querySelectorAll('.log-type-btn');
  logTypeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-log') === logType) {
      btn.classList.add('active');
    }
  });
}

/**
 * Handle admin login
 */
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;
  
  // Clear any previous error messages
  const errorElement = document.querySelector('.login-error');
  if (errorElement) {
    errorElement.remove();
  }
  
  // Validate inputs
  if (!username || !password) {
    showLoginError('Please enter both username and password');
    return;
  }
  
  // Use the username as the staffId for authentication
  const staffId = username;
  
  console.log('Attempting login with staffId:', staffId); // Debug logging
  
  // Send login request
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      staffId,
      password,
      campus: 'north', // Add default campus
      service: 'sleep-lounge' // Add default service
    })
  })
  .then(response => {
    // First check if the response is ok (status in 200-299 range)
    if (!response.ok) {
      // Get more detailed error information
      return response.json().then(errorData => {
        throw new Error(`${errorData.error || `Server returned ${response.status}: ${response.statusText}`}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Store token
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      
      // Check if admin role
      if (data.data && data.data.role === 'admin') {
        currentUser = data.data;
        showDashboard();
        loadDashboardData();
      } else {
        showLoginError('You must be an administrator to access this page');
        logout();
      }
    } else {
      showLoginError(data.error || 'Login failed: Invalid credentials');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    showLoginError(`Login failed: ${error.message}`);
  });
}

/**
 * Show login error message
 */
function showLoginError(message) {
  // Create error element if it doesn't exist
  let errorElement = document.querySelector('.login-error');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'login-error';
    adminLoginForm.insertBefore(errorElement, adminLoginForm.querySelector('.form-actions'));
  }
  
  errorElement.textContent = message;
}

/**
 * Show the admin dashboard
 */
function showDashboard() {
  if (adminLoginContainer) {
    adminLoginContainer.style.display = 'none';
  }
  
  if (adminDashboard) {
    adminDashboard.classList.remove('hidden');
  }
}

/**
 * Log out the user
 */
function logout() {
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;
  
  if (adminDashboard) {
    adminDashboard.classList.add('hidden');
  }
  
  if (adminLoginContainer) {
    adminLoginContainer.style.display = 'block';
  }
  
  // Clear login form
  if (adminLoginForm) {
    adminLoginForm.reset();
  }
}

/**
 * Load initial dashboard data
 */
function loadDashboardData() {
  // Load initial tab
  loadTabData('overview');
  
  // Fetch unread notifications
  fetchNotifications();
}

/**
 * Load data for specific tab
 */
function loadTabData(tabId) {
  switch (tabId) {
    case 'overview':
      loadOverviewData();
      break;
    case 'staff-management':
      loadStaffData();
      break;
    case 'student-registrations':
      loadStudentData();
      break;
    case 'system-logs':
      loadLogData();
      break;
    case 'settings':
      loadSettingsData();
      break;
  }
}

/**
 * Load overview data
 */
function loadOverviewData() {
  // Fetch campus stats
  fetch('/api/admin/stats/campuses', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateCampusStats(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading campus stats:', error);
  });
  
  // Fetch quick stats
  fetch('/api/admin/stats/overview', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateQuickStats(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading quick stats:', error);
  });
  
  // Fetch recent activities
  loadRecentActivities();
}

/**
 * Load recent activities
 */
function loadRecentActivities() {
  // Fetch logs for activities - limit to 10 most recent
  fetch('/api/admin/logs?limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateRecentActivities(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading recent activities:', error);
  });
}

/**
 * Update recent activities in the UI
 */
function updateRecentActivities(logs) {
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;
  
  // Clear current content
  activityList.innerHTML = '';
  
  // If no logs, show a message
  if (!logs || logs.length === 0) {
    activityList.innerHTML = '<div class="empty-message">No recent activity found</div>';
    return;
  }
  
  // Process only the 5 most recent activities
  const recentLogs = logs.slice(0, 5);
  
  recentLogs.forEach(log => {
    // Create activity item
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // Determine icon based on action
    let iconClass = 'fas fa-info-circle';
    let activityTitle = 'System Event';
    
    if (log.action === 'student_checkin') {
      iconClass = 'fas fa-user-check';
      activityTitle = 'Student Check-in';
    } else if (log.action === 'student_checkout') {
      iconClass = 'fas fa-user-clock';
      activityTitle = 'Student Check-out';
    } else if (log.action === 'student_registration') {
      iconClass = 'fas fa-user-plus';
      activityTitle = 'New Registration';
    } else if (log.action === 'login') {
      iconClass = 'fas fa-sign-in-alt';
      activityTitle = 'Staff Login';
    } else if (log.action === 'logout') {
      iconClass = 'fas fa-sign-out-alt';
      activityTitle = 'Staff Logout';
    } else if (log.action.includes('staff_')) {
      iconClass = 'fas fa-user-shield';
      activityTitle = 'Staff Management';
    } else if (log.action.includes('error')) {
      iconClass = 'fas fa-exclamation-triangle';
      activityTitle = 'System Error';
    }
    
    // Format timestamp to relative time (e.g., "2 minutes ago")
    const timeAgo = getTimeAgo(new Date(log.timestamp));
    
    // Build activity content
    activityItem.innerHTML = `
      <div class="activity-icon"><i class="${iconClass}"></i></div>
      <div class="activity-content">
        <div class="activity-title">${activityTitle}</div>
        <div class="activity-details">${log.details || 'No details available'}</div>
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
    
    activityList.appendChild(activityItem);
  });
}

/**
 * Format a date to a relative time string (e.g., "2 minutes ago")
 */
function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

/**
 * Update campus stats in the UI
 */
function updateCampusStats(campusData) {
  // Fallback data if API is not ready
  if (!campusData) {
    campusData = {
      north: {
        status: 'Open',
        bedsAvailable: 12,
        totalBeds: 12,
        usageToday: 0,
        staff: []
      },
      lakeshore: {
        status: 'Open',
        bedsAvailable: 12,
        totalBeds: 12,
        usageToday: 0,
        staff: []
      }
    };
  }
  
  // Update North Campus
  const northData = campusData.north;
  if (northData) {
    document.getElementById('north-status').textContent = northData.status;
    document.getElementById('north-beds-available').innerHTML = 
      `Available Beds: <span>${northData.bedsAvailable}</span>/${northData.totalBeds}`;
    document.getElementById('north-usage-today').innerHTML = 
      `Usage Today: <span>${northData.usageToday}</span> students`;
    
    // Update staff list
    const northStaffList = document.getElementById('north-staff-list');
    northStaffList.innerHTML = '';
    
    if (northData.staff && northData.staff.length > 0) {
      northData.staff.forEach(staff => {
        const li = document.createElement('li');
        li.textContent = `${staff.firstName} ${staff.lastName}`;
        northStaffList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No staff on duty';
      northStaffList.appendChild(li);
    }
  }
  
  // Update Lakeshore Campus
  const lakeshoreData = campusData.lakeshore;
  if (lakeshoreData) {
    document.getElementById('lakeshore-status').textContent = lakeshoreData.status;
    document.getElementById('lakeshore-beds-available').innerHTML = 
      `Available Beds: <span>${lakeshoreData.bedsAvailable}</span>/${lakeshoreData.totalBeds}`;
    document.getElementById('lakeshore-usage-today').innerHTML = 
      `Usage Today: <span>${lakeshoreData.usageToday}</span> students`;
    
    // Update staff list
    const lakeshoreStaffList = document.getElementById('lakeshore-staff-list');
    lakeshoreStaffList.innerHTML = '';
    
    if (lakeshoreData.staff && lakeshoreData.staff.length > 0) {
      lakeshoreData.staff.forEach(staff => {
        const li = document.createElement('li');
        li.textContent = `${staff.firstName} ${staff.lastName}`;
        lakeshoreStaffList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No staff on duty';
      lakeshoreStaffList.appendChild(li);
    }
  }
}

/**
 * Update quick stats in the UI
 */
function updateQuickStats(data) {
  // Fallback data if API is not ready
  if (!data) {
    data = {
      systemStatus: 'All Systems Operational',
      totalRegistrations: 0,
      totalUsageToday: 0,
      totalStaff: 0
    };
  }
  
  document.getElementById('system-status').textContent = data.systemStatus;
  document.getElementById('total-registrations').textContent = data.totalRegistrations;
  document.getElementById('total-usage-today').textContent = data.totalUsageToday;
  document.getElementById('total-staff').textContent = data.totalStaff;
}

/**
 * Load staff data
 */
function loadStaffData() {
  fetch('/api/admin/staff', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayStaffList(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading staff data:', error);
  });
}

/**
 * Display staff list in the UI
 */
function displayStaffList(staffList) {
  const staffListElement = document.getElementById('staff-list');
  staffListElement.innerHTML = '';
  
  if (!staffList || staffList.length === 0) {
    // Show no staff message
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="7">No staff members found</td>`;
    staffListElement.appendChild(row);
    return;
  }
  
  // Add staff rows
  staffList.forEach(staff => {
    const row = document.createElement('tr');
    row.dataset.id = staff.id;
    
    row.innerHTML = `
      <td>${staff.firstName} ${staff.lastName}</td>
      <td>${staff.email}</td>
      <td>${staff.email}</td>
      <td>${staff.campus || 'All'}</td>
      <td>${staff.role}</td>
      <td>${staff.active ? '<span class="status-active">Active</span>' : '<span class="status-inactive">Inactive</span>'}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${staff.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-reset-password" data-id="${staff.id}"><i class="fas fa-key"></i></button>
        <button class="btn-toggle-status" data-id="${staff.id}" data-active="${staff.active}">
          ${staff.active ? '<i class="fas fa-user-slash"></i>' : '<i class="fas fa-user-check"></i>'}
        </button>
        <button class="btn-delete" data-id="${staff.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    staffListElement.appendChild(row);
  });
  
  // Add event listeners to buttons
  attachStaffActionListeners();
}

/**
 * Attach event listeners to staff action buttons
 */
function attachStaffActionListeners() {
  // Edit staff
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      editStaff(staffId);
    });
  });
  
  // Reset password
  document.querySelectorAll('.btn-reset-password').forEach(btn => {
    btn.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      resetStaffPassword(staffId);
    });
  });
  
  // Toggle status
  document.querySelectorAll('.btn-toggle-status').forEach(btn => {
    btn.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      const isActive = this.getAttribute('data-active') === 'true';
      toggleStaffStatus(staffId, !isActive);
    });
  });
  
  // Delete staff
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      deleteStaff(staffId);
    });
  });
}

/**
 * Handle adding a new staff member
 */
function handleAddStaff(e) {
  e.preventDefault();
  
  // Get form values
  const firstName = document.getElementById('staff-first-name').value;
  const lastName = document.getElementById('staff-last-name').value;
  const staffId = document.getElementById('staff-id').value;
  const email = document.getElementById('staff-email').value;
  const password = document.getElementById('staff-password').value;
  const campus = document.getElementById('staff-campus').value;
  const role = document.getElementById('staff-role').value;
  
  // Determine campusAccess based on campus selection
  let campusAccess;
  if (campus === 'north') {
    campusAccess = 'north-only';
  } else if (campus === 'lakeshore') {
    campusAccess = 'lakeshore-only';
  } else if (campus === 'both-campuses') {
    campusAccess = 'both-campuses'; // All Campuses
  } else {
    campusAccess = 'north-only'; // Default fallback
  }
  
  // Validate inputs
  if (!firstName || !lastName || !staffId || !email || !password || !campus || !role) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  // Send request to add staff
  fetch('/api/admin/staff', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName,
      lastName,
      staffId,
      email,
      password,
      campus,
      campusAccess,
      role
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      showMessage('Staff member added successfully', 'success');
      document.getElementById('add-staff-form').reset();
      loadStaffData();
    } else {
      showMessage(data.error || 'Failed to add staff', 'error');
    }
  })
  .catch(error => {
    console.error('Error adding staff:', error);
    showMessage(error.message || 'An error occurred while adding staff', 'error');
  });
}

/**
 * Edit staff member
 */
function editStaff(staffId) {
  // Fetch staff details
  fetch(`/api/admin/staff/${staffId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show edit modal with staff data
      showEditStaffModal(data.data);
    } else {
      showMessage(data.error || 'Failed to get staff details', 'error');
    }
  })
  .catch(error => {
    console.error('Error fetching staff details:', error);
    showMessage('An error occurred while fetching staff details', 'error');
  });
}

/**
 * Reset staff password
 */
function resetStaffPassword(staffId) {
  // Prompt for new password
  const newPassword = prompt('Enter new password for staff member:');
  
  if (newPassword) {
    // Send request to reset password
    fetch(`/api/admin/staff/${staffId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPassword
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showMessage('Password reset successfully', 'success');
      } else {
        showMessage(data.error || 'Failed to reset password', 'error');
      }
    })
    .catch(error => {
      console.error('Error resetting password:', error);
      showMessage('An error occurred while resetting password', 'error');
    });
  }
}

/**
 * Toggle staff active status
 */
function toggleStaffStatus(staffId, active) {
  fetch(`/api/admin/staff/${staffId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      active
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage(`Staff ${active ? 'activated' : 'deactivated'} successfully`, 'success');
      loadStaffData();
    } else {
      showMessage(data.error || 'Failed to update staff status', 'error');
    }
  })
  .catch(error => {
    console.error('Error updating staff status:', error);
    showMessage('An error occurred while updating staff status', 'error');
  });
}

/**
 * Delete staff member
 */
function deleteStaff(staffId) {
  if (confirm('Are you sure you want to delete this staff member?')) {
    fetch(`/api/admin/staff/${staffId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showMessage('Staff deleted successfully', 'success');
        loadStaffData();
      } else {
        showMessage(data.error || 'Failed to delete staff', 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting staff:', error);
      showMessage('An error occurred while deleting staff', 'error');
    });
  }
}

/**
 * Show edit staff modal
 */
function showEditStaffModal(staff) {
  // Check if modal already exists
  let modal = document.getElementById('edit-staff-modal');
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-staff-modal';
    modal.className = 'modal';
    
    document.body.appendChild(modal);
  }
  
  // Populate modal content
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Edit Staff Member</h2>
      <form id="edit-staff-form">
        <input type="hidden" id="edit-staff-id" value="${staff.id}">
        
        <div class="form-group">
          <label for="edit-first-name">First Name:</label>
          <input type="text" id="edit-first-name" value="${staff.firstName || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-last-name">Last Name:</label>
          <input type="text" id="edit-last-name" value="${staff.lastName || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-email">Email:</label>
          <input type="email" id="edit-email" value="${staff.email || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-campus">Campus:</label>
          <select id="edit-campus">
            <option value="all" ${staff.campus === 'all' ? 'selected' : ''}>All Campuses</option>
            <option value="north" ${staff.campus === 'north' ? 'selected' : ''}>North</option>
            <option value="lakeshore" ${staff.campus === 'lakeshore' ? 'selected' : ''}>Lakeshore</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="edit-role">Role:</label>
          <select id="edit-role">
            <option value="staff" ${staff.role === 'staff' ? 'selected' : ''}>Staff</option>
            <option value="admin" ${staff.role === 'admin' ? 'selected' : ''}>Administrator</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-save">Save Changes</button>
          <button type="button" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  // Show modal
  modal.style.display = 'block';
  
  // Add event listeners
  modal.querySelector('.close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  modal.querySelector('.btn-cancel').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  const editForm = modal.querySelector('#edit-staff-form');
  editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const staffId = document.getElementById('edit-staff-id').value;
    const firstName = document.getElementById('edit-first-name').value;
    const lastName = document.getElementById('edit-last-name').value;
    const email = document.getElementById('edit-email').value;
    const campus = document.getElementById('edit-campus').value;
    const role = document.getElementById('edit-role').value;
    
    // Validate inputs
    if (!firstName || !lastName || !email) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }
    
    // Send update request
    fetch(`/api/admin/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        campus,
        role
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showMessage('Staff updated successfully', 'success');
        modal.style.display = 'none';
        loadStaffData();
      } else {
        showMessage(data.error || 'Failed to update staff', 'error');
      }
    })
    .catch(error => {
      console.error('Error updating staff:', error);
      showMessage('An error occurred while updating staff', 'error');
    });
  });
  
  // Close when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Filter staff list
 */
function filterStaffList() {
  const searchTerm = document.getElementById('staff-search').value.toLowerCase();
  const filter = document.getElementById('staff-filter').value;
  
  const rows = document.querySelectorAll('#staff-list tr');
  
  rows.forEach(row => {
    const name = row.cells[0].textContent.toLowerCase();
    const email = row.cells[1].textContent.toLowerCase();
    const campus = row.cells[3].textContent.toLowerCase();
    const isActive = row.cells[5].textContent.includes('Active');
    
    let showRow = true;
    
    // Apply search filter
    if (searchTerm && !name.includes(searchTerm) && !email.includes(searchTerm)) {
      showRow = false;
    }
    
    // Apply status/campus filter
    if (filter === 'active' && !isActive) {
      showRow = false;
    } else if (filter === 'north' && !campus.includes('north')) {
      showRow = false;
    } else if (filter === 'lakeshore' && !campus.includes('lakeshore')) {
      showRow = false;
    }
    
    row.style.display = showRow ? '' : 'none';
  });
}

/**
 * Filter student list
 */
function filterStudentList() {
  const searchTerm = document.getElementById('student-search').value.toLowerCase();
  const filter = document.getElementById('student-filter').value;
  const startDate = document.getElementById('student-start-date')?.value;
  const endDate = document.getElementById('student-end-date')?.value;
  
  const rows = document.querySelectorAll('#registrations-list tr');
  
  rows.forEach(row => {
    if (!row.cells || row.cells.length < 7) return;
    
    const studentId = row.cells[0].textContent.toLowerCase();
    const name = row.cells[1].textContent.toLowerCase();
    const email = row.cells[2].textContent.toLowerCase();
    const regDate = row.cells[3].textContent;
    const campus = row.cells[4].textContent.toLowerCase();
    
    let showRow = true;
    
    // Apply search filter
    if (searchTerm && !studentId.includes(searchTerm) && !name.includes(searchTerm) && !email.includes(searchTerm)) {
      showRow = false;
    }
    
    // Apply campus filter
    if (filter === 'north' && !campus.includes('north')) {
      showRow = false;
    } else if (filter === 'lakeshore' && !campus.includes('lakeshore')) {
      showRow = false;
    }
    
    // Apply date filter
    if (startDate && endDate) {
      const regDateObj = new Date(regDate);
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (regDateObj < startDateObj || regDateObj > endDateObj) {
        showRow = false;
      }
    }
    
    row.style.display = showRow ? '' : 'none';
  });
}

/**
 * Load student registration data
 */
function loadStudentData() {
  fetch('/api/admin/students', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayStudentList(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading student data:', error);
  });
}

/**
 * Display student list in the UI
 */
function displayStudentList(students) {
  const studentListElement = document.getElementById('registrations-list');
  studentListElement.innerHTML = '';
  
  if (!students || students.length === 0) {
    // Show no students message
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="8">No student registrations found</td>`;
    studentListElement.appendChild(row);
    return;
  }
  
  // Add student rows
  students.forEach(student => {
    const row = document.createElement('tr');
    row.dataset.id = student.id;
    
    const lastVisit = student.lastVisit ? new Date(student.lastVisit).toLocaleDateString() : 'Never';
    const registrationDate = new Date(student.createdAt).toLocaleDateString();
    
    row.innerHTML = `
      <td>${student.studentId || 'N/A'}</td>
      <td>${student.firstName} ${student.lastName}</td>
      <td>${student.email}</td>
      <td>${registrationDate}</td>
      <td>${student.campus || 'Not specified'}</td>
      <td>${student.visitCount || 0}</td>
      <td>${lastVisit}</td>
      <td class="actions">
        <button class="btn-view-student" data-id="${student.id}"><i class="fas fa-eye"></i></button>
        <button class="btn-edit-student" data-id="${student.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-delete-student" data-id="${student.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    
    studentListElement.appendChild(row);
  });
  
  // Add event listeners to buttons
  attachStudentActionListeners();
}

/**
 * Attach event listeners to student action buttons
 */
function attachStudentActionListeners() {
  // View student
  document.querySelectorAll('.btn-view-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      viewStudentDetails(studentId);
    });
  });
  
  // Edit student
  document.querySelectorAll('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      editStudent(studentId);
    });
  });
  
  // Delete student
  document.querySelectorAll('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', function() {
      const studentId = this.getAttribute('data-id');
      deleteStudent(studentId);
    });
  });
}

/**
 * View student details
 */
function viewStudentDetails(studentId) {
  // Fetch student details
  // Use the correct endpoint: /api/users/student/:studentId instead of /api/admin/students/:id
  fetch(`/api/users/student/${studentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    // Check for error responses first
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Student not found');
      }
      return response.text().then(text => {
        try {
          // Try to parse as JSON first
          const data = JSON.parse(text);
          throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`);
        } catch (e) {
          // If parsing fails, use the status text
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Also fetch the student's visit history
      return fetch(`/api/visits/history/${studentId}?limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      .then(historyResponse => {
        if (!historyResponse.ok) {
          return { ...data, visits: [] }; // Still show student details even if history fetch fails
        }
        return historyResponse.json().then(historyData => {
          // Combine student data with visit history
          return { 
            ...data, 
            data: { 
              ...data.data, 
              visits: historyData.success ? historyData.data : [] 
            } 
          };
        });
      });
    } else {
      showMessage(data.error || 'Failed to get student details', 'error');
      return data;
    }
  })
  .then(data => {
    if (data.success) {
      // Show student details modal
      showStudentDetailsModal(data.data);
    }
  })
  .catch(error => {
    console.error('Error fetching student details:', error);
    showMessage(`Error fetching student details: ${error.message}`, 'error');
  });
}

/**
 * Show student details modal
 */
function showStudentDetailsModal(student) {
  // Check if modal already exists
  let modal = document.getElementById('student-details-modal');
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-details-modal';
    modal.className = 'modal';
    
    document.body.appendChild(modal);
  }
  
  // Format registration date
  const registrationDate = new Date(student.createdAt).toLocaleDateString();
  const lastVisit = student.lastVisit ? new Date(student.lastVisit).toLocaleDateString() : 'Never';
  
  // Populate modal content
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Student Details</h2>
      <div class="student-details">
        <div class="detail-row">
          <span class="detail-label">Student ID:</span>
          <span class="detail-value">${student.studentId || 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${student.firstName} ${student.lastName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${student.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration Date:</span>
          <span class="detail-value">${registrationDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Preferred Campus:</span>
          <span class="detail-value">${student.campus || 'Not specified'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Visit Count:</span>
          <span class="detail-value">${student.visitCount || 0}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Last Visit:</span>
          <span class="detail-value">${lastVisit}</span>
        </div>
      </div>
      
      <h3>Visit History</h3>
      <div class="visit-history">
        ${student.visits && student.visits.length > 0 ? 
          `<table class="visit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Campus</th>
                <th>Service</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${student.visits.map(visit => `
                <tr>
                  <td>${new Date(visit.date).toLocaleDateString()}</td>
                  <td>${visit.campus}</td>
                  <td>${visit.service}</td>
                  <td>${visit.duration || 'N/A'} mins</td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : 
          '<p>No visits recorded</p>'
        }
      </div>
      
      <div class="modal-actions">
        <button class="btn-edit-student" data-id="${student.id}">Edit</button>
        <button class="btn-close">Close</button>
      </div>
    </div>
  `;
  
  // Show modal
  modal.style.display = 'block';
  
  // Add event listeners
  modal.querySelector('.close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  modal.querySelector('.btn-close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  modal.querySelector('.btn-edit-student').addEventListener('click', function() {
    const studentId = this.getAttribute('data-id');
    modal.style.display = 'none';
    editStudent(studentId);
  });
  
  // Close when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Edit student
 */
function editStudent(studentId) {
  // Fetch student details
  // Use the correct endpoint: /api/users/student/:studentId instead of /api/admin/students/:id
  fetch(`/api/users/student/${studentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    // Check for error responses first
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Student not found');
      }
      return response.text().then(text => {
        try {
          // Try to parse as JSON first
          const data = JSON.parse(text);
          throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`);
        } catch (e) {
          // If parsing fails, use the status text
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show edit modal with student data
      showEditStudentModal(data.data);
    } else {
      showMessage(data.error || 'Failed to get student details', 'error');
    }
  })
  .catch(error => {
    console.error('Error fetching student details:', error);
    showMessage(`Error fetching student details: ${error.message}`, 'error');
  });
}

/**
 * Show edit student modal
 */
function showEditStudentModal(student) {
  // Check if modal already exists
  let modal = document.getElementById('edit-student-modal');
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-student-modal';
    modal.className = 'modal';
    
    document.body.appendChild(modal);
  }
  
  // Populate modal content
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Edit Student</h2>
      <form id="edit-student-form">
        <input type="hidden" id="edit-student-id" value="${student.id}">
        
        <div class="form-group">
          <label for="edit-student-id-num">Student ID:</label>
          <input type="text" id="edit-student-id-num" value="${student.studentId || ''}">
        </div>
        
        <div class="form-group">
          <label for="edit-first-name">First Name:</label>
          <input type="text" id="edit-first-name" value="${student.firstName || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-last-name">Last Name:</label>
          <input type="text" id="edit-last-name" value="${student.lastName || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-email">Email:</label>
          <input type="email" id="edit-email" value="${student.email || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="edit-campus">Preferred Campus:</label>
          <select id="edit-campus">
            <option value="">-- Select Campus --</option>
            <option value="north" ${student.campus === 'north' ? 'selected' : ''}>North</option>
            <option value="lakeshore" ${student.campus === 'lakeshore' ? 'selected' : ''}>Lakeshore</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-save">Save Changes</button>
          <button type="button" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  // Show modal
  modal.style.display = 'block';
  
  // Add event listeners
  modal.querySelector('.close').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  modal.querySelector('.btn-cancel').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  const editForm = modal.querySelector('#edit-student-form');
  editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('edit-student-id').value;
    const studentIdNum = document.getElementById('edit-student-id-num').value;
    const firstName = document.getElementById('edit-first-name').value;
    const lastName = document.getElementById('edit-last-name').value;
    const email = document.getElementById('edit-email').value;
    const campus = document.getElementById('edit-campus').value;
    
    // Validate inputs
    if (!firstName || !lastName || !email) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }
    
    // Send update request to the correct endpoint
    fetch(`/api/admin/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: studentIdNum,
        firstName,
        lastName,
        email,
        campus
      })
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Student not found');
        }
        return response.text().then(text => {
          try {
            // Try to parse as JSON first
            const data = JSON.parse(text);
            throw new Error(data.error || `Server returned ${response.status}: ${response.statusText}`);
          } catch (e) {
            // If parsing fails, use the status text
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        showMessage('Student updated successfully', 'success');
        modal.style.display = 'none';
        loadStudentData();
      } else {
        showMessage(data.error || 'Failed to update student', 'error');
      }
    })
    .catch(error => {
      console.error('Error updating student:', error);
      showMessage(`Error updating student: ${error.message}`, 'error');
    });
  });
  
  // Close when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Delete student
 */
function deleteStudent(studentId) {
  if (confirm('Are you sure you want to delete this student?')) {
    fetch(`/api/admin/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showMessage('Student deleted successfully', 'success');
        loadStudentData();
      } else {
        showMessage(data.error || 'Failed to delete student', 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting student:', error);
      showMessage('An error occurred while deleting student', 'error');
    });
  }
}

/**
 * Load system log data
 */
function loadLogData() {
  fetch('/api/admin/logs', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayLogs(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading log data:', error);
  });
}

/**
 * Display logs in the UI
 */
function displayLogs(logs) {
  if (!logs) return;
  
  // Get log containers
  const loginLogsContainer = document.getElementById('login-logs');
  const usageLogsContainer = document.getElementById('usage-logs');
  const adminLogsContainer = document.getElementById('admin-logs');
  const errorLogsContainer = document.getElementById('error-logs');
  
  // Clear containers
  if (loginLogsContainer) loginLogsContainer.innerHTML = '';
  if (usageLogsContainer) usageLogsContainer.innerHTML = '';
  if (adminLogsContainer) adminLogsContainer.innerHTML = '';
  if (errorLogsContainer) errorLogsContainer.innerHTML = '';
  
  // Filter logs by action instead of type
  // Login/auth related logs
  const loginLogs = logs.filter(log => 
    ['login', 'logout', 'password_update', 'password_reset'].includes(log.action)
  );
  
  // Usage related logs
  const usageLogs = logs.filter(log => 
    ['student_checkin', 'student_checkout', 'visit_extended'].includes(log.action)
  );
  
  // Admin related logs
  const adminLogs = logs.filter(log => 
    ['staff_created', 'staff_updated', 'staff_deleted', 'staff_enabled', 'staff_disabled',
     'student_updated', 'student_deleted', 'settings_updated', 'student_registration'].includes(log.action)
  );
  
  // Error related logs
  const errorLogs = logs.filter(log => 
    log.action && log.action.includes('error')
  );
  
  // Create log tables
  if (loginLogsContainer) {
    createLogTable(loginLogsContainer, loginLogs);
  }
  
  if (usageLogsContainer) {
    createLogTable(usageLogsContainer, usageLogs);
  }
  
  if (adminLogsContainer) {
    createLogTable(adminLogsContainer, adminLogs);
  }
  
  if (errorLogsContainer) {
    createLogTable(errorLogsContainer, errorLogs);
  }
  
  // Also update the staff logs section
  updateStaffLogs(logs);
}

/**
 * Update staff logs section separately
 */
function updateStaffLogs(logs) {
  const staffLogsBody = document.getElementById('staff-logs-body');
  if (!staffLogsBody) return;
  
  // Clear current contents
  staffLogsBody.innerHTML = '';
  
  // Filter for staff-related activities
  const staffLogs = logs.filter(log => 
    ['login', 'logout'].includes(log.action) || 
    (log.details && log.details.toLowerCase().includes('staff'))
  );
  
  if (staffLogs.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">No staff activity logs found</td>';
    staffLogsBody.appendChild(row);
    return;
  }
  
  // Add staff log rows
  staffLogs.forEach(log => {
    const row = document.createElement('tr');
    
    // Format date
    const date = new Date(log.timestamp).toLocaleString();
    
    // Extract staff name
    let staffName = log.user || 'Unknown';
    if (log.userData && log.userData.firstName && log.userData.lastName) {
      staffName = `${log.userData.firstName} ${log.userData.lastName}`;
    }
    
    // Determine campus
    let campus = log.campus || 'System';
    
    row.innerHTML = `
      <td>${date}</td>
      <td>${staffName}</td>
      <td>${log.action}</td>
      <td>${campus}</td>
      <td>${log.details || ''}</td>
    `;
    
    staffLogsBody.appendChild(row);
  });
}

/**
 * Create log table in container
 */
function createLogTable(container, logs) {
  if (logs.length === 0) {
    container.innerHTML = '<p>No logs found</p>';
    return;
  }
  
  // Create table
  const table = document.createElement('table');
  table.className = 'logs-table';
  
  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Date</th>
      <th>User</th>
      <th>Action</th>
      <th>Details</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  logs.forEach(log => {
    const row = document.createElement('tr');
    
    // Format date
    const date = new Date(log.timestamp).toLocaleString();
    
    row.innerHTML = `
      <td>${date}</td>
      <td>${log.user || 'System'}</td>
      <td>${log.action}</td>
      <td>${log.details || ''}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Filter logs based on search criteria
 */
function filterLogs() {
  const searchTerm = document.getElementById('log-search')?.value.toLowerCase() || '';
  const startDate = document.getElementById('log-start-date')?.value;
  const endDate = document.getElementById('log-end-date')?.value;
  
  // Get active log container
  const activeLogType = document.querySelector('.log-type-btn.active')?.getAttribute('data-log');
  if (!activeLogType) return;
  
  const logTable = document.querySelector(`#${activeLogType}-logs .logs-table`);
  if (!logTable) return;
  
  const rows = logTable.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const date = row.cells[0].textContent;
    const user = row.cells[1].textContent.toLowerCase();
    const action = row.cells[2].textContent.toLowerCase();
    const details = row.cells[3].textContent.toLowerCase();
    
    let showRow = true;
    
    // Apply search filter
    if (searchTerm && !user.includes(searchTerm) && !action.includes(searchTerm) && !details.includes(searchTerm)) {
      showRow = false;
    }
    
    // Apply date filter
    if (startDate && endDate) {
      const rowDate = new Date(date);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      // Set end date to end of day
      filterEnd.setHours(23, 59, 59);
      
      if (rowDate < filterStart || rowDate > filterEnd) {
        showRow = false;
      }
    }
    
    row.style.display = showRow ? '' : 'none';
  });
}

/**
 * Load settings data
 */
function loadSettingsData() {
  fetch('/api/admin/settings', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displaySettings(data.data);
    }
  })
  .catch(error => {
    console.error('Error loading settings data:', error);
    // Load default settings if API fails
    displaySettings();
  });
}

/**
 * Display settings in the UI
 */
function displaySettings(settings) {
  // If no settings data, use default values
  if (!settings) {
    settings = [
      {
        campus: 'north',
        service: 'sleep-lounge',
        bedCount: 12,
        openTime: '09:00',
        closeTime: '16:00',
        timeLimit: 60
      },
      {
        campus: 'lakeshore',
        service: 'sleep-lounge',
        bedCount: 12,
        openTime: '09:00',
        closeTime: '16:00',
        timeLimit: 60
      },
      {
        campus: 'north',
        service: 'zen-zone',
        timeLimit: 60
      },
      {
        campus: 'lakeshore',
        service: 'zen-zone',
        timeLimit: 60
      }
    ];
  }
  
  // Find settings for each campus and service
  const northSleepLounge = settings.find(s => s.campus === 'north' && s.service === 'sleep-lounge');
  const lakeshoreSleepLounge = settings.find(s => s.campus === 'lakeshore' && s.service === 'sleep-lounge');
  const zenZoneSettings = settings.find(s => s.service === 'zen-zone');
  
  // Format time function to ensure proper format (HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return '09:00';
    // If time is already in HH:MM format, return it
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    // If time is in H:MM format, add leading zero
    if (/^\d:\d{2}$/.test(timeStr)) return `0${timeStr}`;
    
    try {
      // Try to parse as date and format
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Error formatting time:', e);
    }
    
    // Default fallback
    return '09:00';
  };
  
  // Update North Campus settings
  if (northSleepLounge) {
    document.getElementById('north-max-beds').value = northSleepLounge.bedCount || 12;
    document.getElementById('north-open-time').value = formatTime(northSleepLounge.openTime || '09:00');
    document.getElementById('north-close-time').value = formatTime(northSleepLounge.closeTime || '16:00');
  }
  
  // Update Lakeshore Campus settings
  if (lakeshoreSleepLounge) {
    document.getElementById('lakeshore-max-beds').value = lakeshoreSleepLounge.bedCount || 12;
    document.getElementById('lakeshore-open-time').value = formatTime(lakeshoreSleepLounge.openTime || '09:00');
    document.getElementById('lakeshore-close-time').value = formatTime(lakeshoreSleepLounge.closeTime || '16:00');
  }
  
  // Update system settings
  if (zenZoneSettings) {
    document.getElementById('session-duration').value = zenZoneSettings.timeLimit || 60;
  }
}

/**
 * Validate settings before saving
 */
function validateSettings() {
  const errors = [];
  
  // Validate time limit
  const timeLimit = parseInt(document.getElementById('session-duration').value);
  if (isNaN(timeLimit) || timeLimit < 1 || timeLimit > 120) {
    errors.push('Time limit must be between 1 and 120 minutes');
  }
  
  // Validate North Campus times
  const northOpenTime = document.getElementById('north-open-time').value;
  const northCloseTime = document.getElementById('north-close-time').value;
  
  if (!northOpenTime || !(/^\d{2}:\d{2}$/.test(northOpenTime))) {
    errors.push('North Campus open time must be in HH:MM format');
  }
  
  if (!northCloseTime || !(/^\d{2}:\d{2}$/.test(northCloseTime))) {
    errors.push('North Campus close time must be in HH:MM format');
  }
  
  // Validate Lakeshore Campus times
  const lakeshoreOpenTime = document.getElementById('lakeshore-open-time').value;
  const lakeshoreCloseTime = document.getElementById('lakeshore-close-time').value;
  
  if (!lakeshoreOpenTime || !(/^\d{2}:\d{2}$/.test(lakeshoreOpenTime))) {
    errors.push('Lakeshore Campus open time must be in HH:MM format');
  }
  
  if (!lakeshoreCloseTime || !(/^\d{2}:\d{2}$/.test(lakeshoreCloseTime))) {
    errors.push('Lakeshore Campus close time must be in HH:MM format');
  }
  
  return errors;
}

/**
 * Save settings
 */
function saveSettings() {
  // Validate settings
  const errors = validateSettings();
  if (errors.length > 0) {
    showMessage('Error saving settings: ' + errors.join(', '), 'error');
    return;
  }
  
  // Format time function
  const formatTime = (timeStr) => {
    if (!timeStr) return '09:00';
    
    // If already in correct format, return it
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    try {
      // Try to parse and format
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      console.error('Error formatting time:', e);
    }
    
    return timeStr;
  };

  // Get the time limit for all services
  const timeLimit = parseInt(document.getElementById('session-duration').value) || 60;

  // North campus sleep lounge settings
  const northSettings = {
    campus: 'north',
    service: 'sleep-lounge',
    bedCount: parseInt(document.getElementById('north-max-beds').value) || 12,
    openTime: formatTime(document.getElementById('north-open-time').value),
    closeTime: formatTime(document.getElementById('north-close-time').value),
    timeLimit: timeLimit
  };
  
  // Lakeshore campus sleep lounge settings
  const lakeshoreSettings = {
    campus: 'lakeshore',
    service: 'sleep-lounge',
    bedCount: parseInt(document.getElementById('lakeshore-max-beds').value) || 12,
    openTime: formatTime(document.getElementById('lakeshore-open-time').value),
    closeTime: formatTime(document.getElementById('lakeshore-close-time').value),
    timeLimit: timeLimit
  };
  
  // Lakeshore Zen Zone settings (only available at Lakeshore campus)
  const lakeshoreZenSettings = {
    campus: 'lakeshore',
    service: 'zen-zone',
    timeLimit: timeLimit,
    openTime: formatTime(document.getElementById('lakeshore-open-time').value),
    closeTime: formatTime(document.getElementById('lakeshore-close-time').value)
  };
  
  // Save Zen Zone activities
  const zenActivities = [
    { 
      id: 1, 
      name: 'Tea Service', 
      icon: 'mug-hot', 
      startTime: formatTime(document.getElementById('tea-service-start').value), 
      endTime: formatTime(document.getElementById('tea-service-end').value) 
    },
    { 
      id: 2, 
      name: 'Paint Session', 
      icon: 'paint-brush', 
      startTime: formatTime(document.getElementById('paint-session-start').value), 
      endTime: formatTime(document.getElementById('paint-session-end').value) 
    },
    { 
      id: 3, 
      name: 'Reading Corner', 
      icon: 'book', 
      startTime: formatTime(document.getElementById('reading-corner-start').value), 
      endTime: formatTime(document.getElementById('reading-corner-end').value) 
    },
    { 
      id: 4, 
      name: 'Meditation', 
      icon: 'spa', 
      startTime: formatTime(document.getElementById('meditation-start').value), 
      endTime: formatTime(document.getElementById('meditation-end').value) 
    }
  ];
  
  // Save activities to localStorage
  localStorage.setItem('zenActivities', JSON.stringify(zenActivities));
  
  // Save all settings
  Promise.all([
    updateSettings(northSettings),
    updateSettings(lakeshoreSettings),
    updateSettings(lakeshoreZenSettings)
  ])
  .then(() => {
    showMessage('Settings saved successfully', 'success');
  })
  .catch(error => {
    console.error('Error saving settings:', error);
    showMessage(`Error saving settings: ${error.message}`, 'error');
  });
}

/**
 * Update a single setting
 */
function updateSettings(settingData) {
  return fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settingData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.success) {
      throw new Error(data.error || 'Failed to update settings');
    }
    return data;
  });
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    // Set default values
    document.getElementById('north-max-beds').value = 12;
    document.getElementById('north-open-time').value = '09:00';
    document.getElementById('north-close-time').value = '16:00';
    
    document.getElementById('lakeshore-max-beds').value = 12;
    document.getElementById('lakeshore-open-time').value = '09:00';
    document.getElementById('lakeshore-close-time').value = '16:00';
    
    document.getElementById('session-duration').value = 60;
    document.getElementById('warning-minutes').value = 5;
    
    document.getElementById('enable-warnings').checked = true;
    document.getElementById('enable-email').checked = true;
    
    // Save settings
    saveSettings();
  }
}

/**
 * Fetch notifications
 */
function fetchNotifications() {
  // This would connect to a notifications API endpoint
  // For now, this is a placeholder
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;
  
  // Add to page
  document.body.appendChild(messageElement);
  
  // Remove after timeout
  setTimeout(() => {
    messageElement.classList.add('message-hiding');
    setTimeout(() => {
      messageElement.remove();
    }, 500);
  }, 3000);
}

// Add CSS for messages
const style = document.createElement('style');
style.textContent = `
  .message {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  }
  
  .message-hiding {
    animation: slideOut 0.5s ease-in;
  }
  
  .message-success {
    background-color: #4CAF50;
  }
  
  .message-error {
    background-color: #F44336;
  }
  
  .message-info {
    background-color: #2196F3;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Add CSS for modals
const modalStyle = document.createElement('style');
modalStyle.textContent = `
  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }
  
  .modal-content {
    background-color: #fefefe;
    margin: 10% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
    border-radius: 5px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }
  
  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
  }
  
  .detail-row {
    margin-bottom: 10px;
    display: flex;
  }
  
  .detail-label {
    font-weight: bold;
    width: 150px;
  }
  
  .visit-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  .visit-table th, .visit-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  .visit-table th {
    background-color: #f2f2f2;
  }
  
  .modal-actions {
    margin-top: 20px;
    text-align: right;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .form-actions {
    margin-top: 20px;
    text-align: right;
  }
`;
document.head.appendChild(modalStyle);