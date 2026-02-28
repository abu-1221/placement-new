// Dashboard JavaScript
// Shared logic for both Student and Staff dashboards

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initSidebar();
  initNavigation();
  initLogout();
  initUserInfo();

  // Feature-specific initializations
  // We strictly check user type to prevent errors on the wrong dashboard
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  if (user.type === "student") {
    initAvailabilityToggle();
    initSalaryRange();
    initCharts();
    loadAvailableTests();  // Initial load of tests
    loadCompletedTests();
    // Initialize analytics before loading tests
    if (typeof initEnhancedAnalytics === "function") {
      setTimeout(initEnhancedAnalytics, 100);
    }
    initRealtimeUpdates(); // Start listening for new tests
  }
  // Staff logic is handled in staff-dashboard.js,
  // but dashboard.js provides the shared shell (sidebar, auth, etc)
});

// Check if user is authenticated — blocks access after logout
function checkAuth() {
  const user = sessionStorage.getItem("user") || localStorage.getItem("user");
  const isStudentPage = window.location.pathname.includes("student-dashboard");
  const isStaffPage = window.location.pathname.includes("staff-dashboard");

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  try {
    const userData = JSON.parse(user);
    if (isStudentPage && userData.type !== "student") {
      window.location.replace("staff-dashboard.html");
    } else if (isStaffPage && userData.type !== "staff") {
      window.location.replace("student-dashboard.html");
    }
  } catch (e) {
    console.error("Session parse error:", e);
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    window.location.replace("login.html");
  }

  // Prevent back-button re-entry after logout
  window.addEventListener("popstate", () => {
    const stillLoggedIn = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (!stillLoggedIn) {
      window.location.replace("login.html");
    }
  });
}

// Initialize sidebar toggle for mobile and desktop collapse
function initSidebar() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");

  // Mobile Toggle
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      const isActive = sidebar.classList.toggle("active");
      menuToggle.classList.toggle("active", isActive);
      if (overlay) overlay.classList.toggle("active", isActive);
    });

    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        menuToggle.classList.remove("active");
        overlay.classList.remove("active");
      });
    }
  }

  // Desktop Collapse Toggle
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isCollapsed = sidebar.classList.toggle("collapsed");
      document.body.classList.toggle("sidebar-minimized");

      // Save preference
      localStorage.setItem("sidebarCollapsed", isCollapsed);
    });

    // Restore state from localStorage
    if (localStorage.getItem("sidebarCollapsed") === "true") {
      sidebar.classList.add("collapsed");
      document.body.classList.add("sidebar-minimized");
    }
  }
}

// Initialize navigation between sections
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sectionTitle = document.getElementById("sectionTitle");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Update active nav item
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      // Show corresponding section
      const sectionId = item.dataset.section + "-section";
      document.querySelectorAll(".content-section").forEach((section) => {
        section.classList.remove("active");
      });
      document.getElementById(sectionId)?.classList.add("active");

      // Update title
      if (sectionTitle) {
        sectionTitle.textContent = item.querySelector("span").textContent;
      }

      // Close mobile sidebar
      document.getElementById("sidebar")?.classList.remove("active");
      document.getElementById("menuToggle")?.classList.remove("active");
      document.getElementById("sidebarOverlay")?.classList.remove("active");

      // Reinitialize charts for analytics section (Student only)
      if (item.dataset.section === "analytics") {
        setTimeout(() => {
          if (window.AnalyticsEngine) {
            window.AnalyticsEngine.init();
          }
        }, 100);
      }

      // Reload tests for availability section
      if (item.dataset.section === "availability") {
        loadAvailableTests();
      }

      // Reload completed tests for tests section
      if (item.dataset.section === "tests") {
        loadCompletedTests();
      }

      // Staff: Reload manage tests
      if (item.dataset.section === "manage-tests" && typeof loadTests === 'function') {
        loadTests();
      }


    });
  });
}

// ===== PROFESSIONAL LOGOUT SYSTEM =====
function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  // Inject logout modal into DOM (once)
  if (!document.getElementById("logoutModal")) {
    const modalEl = document.createElement("div");
    modalEl.id = "logoutModal";
    modalEl.className = "logout-modal-overlay";
    modalEl.innerHTML = `
      <div class="logout-modal">
        <div class="logout-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h3 class="logout-modal-title">Sign Out</h3>
        <p class="logout-modal-text">Are you sure you want to log out of the JMC-TEST Portal? Your current session will be ended.</p>
        <div class="logout-modal-actions">
          <button type="button" class="logout-modal-btn cancel" id="logoutCancelBtn">Cancel</button>
          <button type="button" class="logout-modal-btn confirm" id="logoutConfirmBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  const modal = document.getElementById("logoutModal");
  const cancelBtn = document.getElementById("logoutCancelBtn");
  const confirmBtn = document.getElementById("logoutConfirmBtn");

  // Open modal
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.classList.add("active");
  });

  // Cancel
  cancelBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  // Click overlay to cancel
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });

  // Confirm logout
  confirmBtn.addEventListener("click", () => {
    performLogout();
  });
}

function performLogout() {
  const confirmBtn = document.getElementById("logoutConfirmBtn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Signing out...";
  }

  setTimeout(() => {
    // 1. Clear ALL session data
    sessionStorage.clear();
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // 2. Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // 3. Replace history to prevent back-button re-entry
    window.history.replaceState(null, "", "login.html");

    // 4. Set flag for login page toast
    sessionStorage.setItem("loggedOut", "true");

    // 5. Redirect (no history entry)
    window.location.replace("login.html");
  }, 300);
}

// Real-time Event Listener for Students
function initRealtimeUpdates() {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  if (user.type !== 'student') return;

  console.log("[Realtime] Fetching current tests and subscribing to updates...");

  // Initial load
  if (typeof loadAvailableTests === 'function') {
    loadAvailableTests();
  }

  // SSE connection to the backend
  const eventSource = new EventSource('/api/realtime/updates');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[Realtime] Received event:", data);

      if (data.type === 'test_published') {
        // Automatically refresh available tests list
        if (typeof loadAvailableTests === 'function') {
          loadAvailableTests();

          // Show a subtle notification if the user is on the availability tab
          const activeSection = document.querySelector('.content-section.active');
          if (activeSection && activeSection.id === 'availability-section') {
            showRealtimeNotification(data);
          }
        }
      }
    } catch (err) {
      console.error("[Realtime] Error processing event:", err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn("[Realtime] EventSource connection issue. Standard browser reconnect will follow.");
  };
}

function showRealtimeNotification(data) {
  // Check for existing notification
  if (document.querySelector('.realtime-notification')) return;

  const notification = document.createElement("div");
  notification.className = "realtime-notification bounce-in";
  notification.innerHTML = `
    <div class="notif-content">
      <div class="notif-icon">${data.icon || '🔥'}</div>
      <div class="notif-info">
        <span class="notif-title">${data.title || 'New Test Published!'}</span>
        <span class="notif-desc">${data.message || `${data.testName} (${data.company})`}</span>
      </div>
    </div>
    <button class="notif-close">&times;</button>
  `;

  document.body.appendChild(notification);

  // Auto remove
  const timer = setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 6000);

  notification.querySelector(".notif-close").onclick = () => {
    clearTimeout(timer);
    notification.remove();
  };
}

// Display user info
function initUserInfo() {
  const userStr = sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = JSON.parse(userStr || "{}");
  const userAvatar = document.getElementById("userAvatar");
  const userNameEl = document.getElementById("userName");

  if (user) {
    // Header Info (Username Only as requested)
    if (userNameEl) userNameEl.textContent = user.username || "User";

    const initials = (user.name || user.username || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    if (userAvatar) userAvatar.textContent = initials.substring(0, 2);

    // Profile Section Info
    const profAvatar = document.getElementById("profileAvatarLarge");
    const profUsername = document.getElementById("profileUsername");
    const profRegNo = document.getElementById("profileRegNo");
    const profStaffRole = document.getElementById("profileStaffRole");
    const profStaffDeptFull = document.getElementById("profileStaffDeptFull");
    const profDept = document.getElementById("profileDept");
    const profEmail = document.getElementById("profileEmail");
    const profJoined = document.getElementById("profileJoined");

    // Student Specific Fields
    const profYear = document.getElementById("profileYear");
    const profSection = document.getElementById("profileSection");
    const profBatch = document.getElementById("profileBatch");
    const profStream = document.getElementById("profileStream");
    const profGender = document.getElementById("profileGender");
    const profDob = document.getElementById("profileDob");

    if (profAvatar) profAvatar.textContent = initials.substring(0, 2);
    if (profUsername) profUsername.textContent = user.name || user.username;
    if (profEmail) profEmail.textContent = user.email || (user.type === 'student' ? 'student@jmc.edu' : 'staff@jmc.edu');

    // Register Date (Joined)
    if (profJoined) {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        profJoined.textContent = `Joined: ${date.toLocaleDateString('en-US', options)}`;
      } else {
        profJoined.textContent = "Joined: Jan 2024";
      }
    }

    if (profRegNo) {
      const regNo = user.username || user.details?.registerNumber || user.details?.staffCode || "N/A";
      profRegNo.textContent = regNo;
    }

    // Populate Fields based on User Type
    if (user.type === 'student' && user.details) {
      if (profYear) profYear.textContent = user.details.year ? `${user.details.year}${getOrdinal(user.details.year)} Year` : "N/A";
      if (profSection) profSection.textContent = `Section ${user.details.section || 'N/A'}`;
      if (profBatch) profBatch.textContent = user.details.batch || "N/A";
      if (profStream) profStream.textContent = user.details.streamType || "N/A";
      if (profGender) profGender.textContent = user.details.gender || "N/A";
      if (profDob) profDob.textContent = formatDate(user.details.dob) || "N/A";
    } else if (user.type === 'staff' && user.details) {
      if (profStaffRole) profStaffRole.textContent = user.details.designation || "Staff Member";
      if (profStaffDeptFull) profStaffDeptFull.textContent = user.details.department ? `Department of ${user.details.department}` : "N/A";
    }

    if (profDept) profDept.textContent = user.details?.department ? `Department of ${user.details.department}` : "";
  }
}

// Helper: Get ordinal suffix
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Helper: Format date
function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/\//g, '-');
}

// Availability toggle (Student Only)
function initAvailabilityToggle() {
  const toggle = document.getElementById("availabilityToggle");
  const statusText = document.getElementById("statusText");
  const statusIndicator = document.querySelector(".status-indicator");

  if (toggle && statusText) {
    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        statusText.textContent = "Available for Placement";
        statusIndicator?.classList.add("available");
        statusIndicator?.classList.remove("unavailable");
      } else {
        statusText.textContent = "Not Available";
        statusIndicator?.classList.remove("available");
        statusIndicator?.classList.add("unavailable");
      }
    });
  }
}

// Salary range slider (Student Only)
function initSalaryRange() {
  const range = document.getElementById("salaryRange");
  const value = document.getElementById("salaryValue");

  if (range && value) {
    range.addEventListener("input", () => {
      value.textContent = range.value;
    });
  }
}

// Initialize charts - now handled by js/analytics.js
function initCharts() {
  // Stub: chart initialization is handled by analytics.js
  // This prevents errors when called from the shared dashboard init
}

// ==========================================
// UPDATED TEST TAKING LOGIC (SPA Integration)
// ==========================================

// Load available tests for students
async function loadAvailableTests() {
  const container = document.getElementById("availableTestsList");
  if (!container) return;

  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    // PRECISE FILTER: Only show the "Availability" test as requested
    const availableTests = (await window.DB.getTests(user.username)).filter(t =>
      t.name.toLowerCase().includes('availability') ||
      t.company.toLowerCase().includes('jmc')
    );

    if (!availableTests || availableTests.length === 0) {
      container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--gray-500); border: 1px dashed rgba(255,255,255,0.05); border-radius: 16px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.3;">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p style="font-size: 1.1rem; font-weight: 500; color: rgba(255,255,255,0.7);">All Caught Up!</p>
                    <p style="font-size: 0.9rem; opacity: 0.5;">No pending assessments in your queue at the moment.</p>
                </div>
            `;
      return;
    }

    container.innerHTML = availableTests
      .map((test) => {
        const formattedDate = test.createdAt
          ? new Date(test.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          : "Recently";

        const staffName = test.createdBy || "Staff";
        const qCount = Array.isArray(test.questions) ? test.questions.length :
          (typeof test.questions === 'string' ? JSON.parse(test.questions || '[]').length : 0);

        return `
                <div class="drive-item" style="animation: fadeInUp 0.4s ease-out both;">
                    <div class="drive-logo" style="background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.25rem;">
                         ${test.company ? test.company.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div class="drive-info">
                        <h4 style="margin: 0 0 4px 0; font-size: 1.1rem;">${test.name}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--gray-400);">
                            <span style="color: var(--blue-400); font-weight: 500;">${test.company}</span> • 
                            ${staffName} • 
                            ${formattedDate} • 
                            ${test.duration}m • 
                            ${qCount} questions
                        </p>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window.confirmStartTest(${test.id})" style="border-radius: 8px; padding: 0.6rem 1.75rem; font-weight: 600;">
                        Take Test
                    </button>
                </div>
            `;
      })
      .join("");
  } catch (e) {
    console.error("Error loading tests:", e);
    container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--ef4444);">Failed to synchronize assesssments. Please refresh.</p>`;
  }
}

// 1. Professional Confirmation Dialog
function confirmStartTest(testId) {
  // Remove any previous confirm dialogs
  document.querySelectorAll('.test-confirm-overlay').forEach(el => el.remove());

  const confirmOverlay = document.createElement('div');
  confirmOverlay.className = 'modal-overlay test-confirm-overlay';
  confirmOverlay.style.cssText = 'display:flex; align-items:center; justify-content:center; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:9999;';
  confirmOverlay.innerHTML = `
        <div class="modal-content glass-panel bounce-in" style="max-width: 480px; text-align: center; padding: 3rem; background: #1a1b2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">🚀</div>
            <h2 style="margin-bottom: 0.75rem; color: #fff; font-size: 1.5rem;">Ready to Begin?</h2>
            <p style="color: rgba(255,255,255,0.5); margin-bottom: 1rem; font-size: 0.85rem; line-height: 1.6;">
                This is a <strong style="color:#f59e0b;">one-time attempt</strong>. Once you start, the timer begins and you cannot pause or re-enter this test.
            </p>
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 2rem; font-size: 0.8rem; color: #fca5a5;">
                ⚠ You will NOT be able to retake this test after starting.
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-ghost" id="confirmCancelBtn" style="flex:1; border: 1px solid rgba(255,255,255,0.1); padding: 0.85rem;">Cancel</button>
                <button class="btn btn-primary" id="finalProceedBtn" style="flex:1; padding: 0.85rem; font-weight: 700;">Yes, Start Test</button>
            </div>
        </div>
    `;
  document.body.appendChild(confirmOverlay);

  // Cancel button
  confirmOverlay.querySelector('#confirmCancelBtn').onclick = function () {
    confirmOverlay.remove();
  };

  // Start button
  confirmOverlay.querySelector('#finalProceedBtn').onclick = async function () {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation: spin 0.8s linear infinite; margin-right: 8px;"></span> Starting...';

    try {
      await startProfessionalTest(testId);
      // Only remove confirm dialog AFTER test overlay is successfully shown
      confirmOverlay.remove();
    } catch (err) {
      console.error('[TEST-START] Error:', err);
      btn.disabled = false;
      btn.innerHTML = 'Retry';
      // Show error in the dialog itself
      const errorDiv = confirmOverlay.querySelector('.test-start-error');
      if (errorDiv) {
        errorDiv.textContent = err.message || 'Failed to start test. Please try again.';
      } else {
        const errEl = document.createElement('p');
        errEl.className = 'test-start-error';
        errEl.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 1rem; padding: 0.75rem; background: rgba(239,68,68,0.1); border-radius: 8px;';
        errEl.textContent = err.message || 'Failed to start. Please try again.';
        btn.parentElement.after(errEl);
      }
    }
  };
}

// 2. Professional Test Logic
let activeTestInterval = null;
let activeTestAnswers = {};
let activeTestStartTime = null;
let questionTimes = {};
window.currentActiveTest = null;
let currentQuestionIndex = 0;

async function startProfessionalTest(testId) {
  const overlay = document.getElementById('test-taking-overlay');
  if (!overlay) {
    throw new Error('Test interface element not found. Please refresh the page.');
  }

  // Step 1: Fetch test data directly by ID
  console.log('[TEST-START] Fetching test data for ID:', testId);
  const test = await window.DB.getTestById(testId);
  if (!test) {
    throw new Error('Could not load test data. The test may have been removed.');
  }
  console.log('[TEST-START] Test loaded:', test.name, '| Questions type:', typeof test.questions);

  // Step 2: Parse questions safely
  try {
    if (typeof test.questions === 'string') {
      test.questions = JSON.parse(test.questions);
    }
    if (!Array.isArray(test.questions)) {
      throw new Error('Questions data is not in the expected format.');
    }
    test.questions = test.questions.filter(q => q && q.question && q.question.trim());
  } catch (e) {
    console.error("[TEST-START] Question parsing failed:", e);
    throw new Error('Test questions could not be loaded. Please contact staff.');
  }

  if (test.questions.length === 0) {
    throw new Error('This test has no questions configured. Please contact staff.');
  }
  console.log('[TEST-START] Parsed', test.questions.length, 'questions successfully.');

  // Step 3: Lock the attempt on the backend
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  if (!user.username) {
    throw new Error('Session expired. Please log in again.');
  }

  console.log('[TEST-START] Locking attempt for user:', user.username);
  const lockRes = await window.DB.startAttempt(testId, user.username);

  if (lockRes.error) {
    console.error('[TEST-START] Lock rejected:', lockRes.error);
    throw new Error(lockRes.error);
  }
  console.log('[TEST-START] Attempt locked successfully.');

  // Step 4: Initialize state
  window.currentActiveTest = test;
  activeTestAnswers = {};
  questionTimes = {};
  currentQuestionIndex = 0;
  activeTestStartTime = Date.now();

  // Step 5: Build test interface UI
  overlay.innerHTML = `
    <div class="test-header">
      <div class="test-title-info">
        <h2>${test.name}</h2>
        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">${test.company} • ${test.questions.length} Questions • ${test.duration} min</div>
      </div>
      <div class="test-timer" id="testTimeDisplay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span id="professionalTime">${test.duration}:00</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="quitTest()" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">Quit</button>
    </div>
    <div class="test-main">
      <div class="test-content">
        <div class="test-progress-strip">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="testMainProgressBar" style="width: 0%"></div>
          </div>
        </div>
        <div id="questionDisplayArea"></div>
      </div>
      <div class="test-sidebar">
        <div class="sidebar-card">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; margin-right:8px;"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
            Navigation
          </h3>
          <div class="progress-grid" id="testProgressGrid"></div>
        </div>
        <div class="sidebar-card">
          <h3>Summary</h3>
          <div class="stats-summary">
            <div class="stat-row">
              <span><span class="stat-pill" style="background: #10b981;"></span>Answered</span>
              <span class="stat-count" id="countAnswered">0</span>
            </div>
            <div class="stat-row">
              <span><span class="stat-pill" style="background: #f59e0b;"></span>Remaining</span>
              <span class="stat-count" id="countRemaining">${test.questions.length}</span>
            </div>
            <div class="stat-row">
              <span><span class="stat-pill" style="background: #ef4444;"></span>Skipped</span>
              <span class="stat-count" id="countSkipped">0</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: auto; background: #10b981; border: none; padding: 1rem; font-weight: 700; border-radius: 10px;" onclick="finishProfessionalTest()">Submit Test</button>
      </div>
    </div>
  `;

  // Step 6: Show the overlay
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  console.log('[TEST-START] Test overlay is now VISIBLE.');

  // Step 7: Start countdown timer
  const durationSecs = test.duration * 60;
  if (activeTestInterval) clearInterval(activeTestInterval);
  activeTestInterval = setInterval(() => {
    const elapsed = Date.now() - activeTestStartTime;
    const remaining = Math.max(0, (durationSecs * 1000) - elapsed);
    if (remaining <= 0) {
      clearInterval(activeTestInterval);
      processSTLESubmission(true);
      return;
    }
    const totalSec = Math.floor(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toString().padStart(2, '0');
    const timerEl = document.getElementById('professionalTime');
    if (timerEl) timerEl.textContent = `${m}:${sec}`;

    const timerDisplay = document.getElementById('testTimeDisplay');
    if (timerDisplay && m < 5) timerDisplay.style.color = '#ef4444';
  }, 1000);

  // Step 8: Render first question
  renderProfessionalQuestion(0);

  // Step 9: Refresh dashboard lists in background (removes test from availability)
  loadAvailableTests();
  loadCompletedTests();

  console.log('[TEST-START] Full test interface initialized successfully.');
}


function renderProfessionalQuestion(index) {
  const test = window.currentActiveTest;
  const q = test.questions[index];
  currentQuestionIndex = index;
  const container = document.getElementById('questionDisplayArea');
  if (!container) return;

  // Track time start for this question if not exists
  if (!questionTimes[index]) questionTimes[index] = { start: Date.now(), total: 0 };
  else questionTimes[index].start = Date.now();

  const letters = ['A', 'B', 'C', 'D'];
  container.innerHTML = `
        <div class="test-question-container bounce-in">
            <div class="question-header">
                <span class="question-number-badge">Question ${index + 1} of ${test.questions.length}</span>
            </div>
            <div class="question-text">${q.question}</div>
            <div class="options-grid">
                ${(q.options || []).map((opt, i) => `
                    <div class="option-item ${activeTestAnswers[index] === letters[i] ? 'selected' : ''}" 
                         onclick="selectProfessionalAnswer(${index}, '${letters[i]}')">
                         <div class="option-label">${letters[i]}</div>
                         <div class="option-text">${opt}</div>
                    </div>
                `).join('')}
                ${!(q.options && q.options.length) ? '<p style="color: #ef4444; font-size: 0.9rem;">No options defined for this question.</p>' : ''}
            </div>
        </div>
        <div class="test-actions">
            <button class="btn btn-ghost" ${index === 0 ? 'disabled' : ''} onclick="prevQuestion()" style="border: 1px solid rgba(255,255,255,0.1);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Previous
            </button>
            <div style="display: flex; gap: 1rem;">
                ${index < test.questions.length - 1 ? `
                    <button class="btn btn-primary" onclick="nextQuestion()" style="padding: 0.75rem 2rem;">
                        Next
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                ` : `
                    <button class="btn btn-primary" style="background: #10b981; border: none; padding: 0.75rem 2rem;" onclick="finishProfessionalTest()">Submit Assessment</button>
                `}
            </div>
        </div>
    `;

  updateProgressUI();
}

function selectProfessionalAnswer(index, answer) {
  activeTestAnswers[index] = answer;
  // Track time spent
  if (questionTimes[index]) {
    questionTimes[index].total += (Date.now() - questionTimes[index].start);
    questionTimes[index].start = Date.now();
  }
  renderProfessionalQuestion(index);
}

function prevQuestion() { if (currentQuestionIndex > 0) renderProfessionalQuestion(currentQuestionIndex - 1); }
function nextQuestion() { if (currentQuestionIndex < window.currentActiveTest.questions.length - 1) renderProfessionalQuestion(currentQuestionIndex + 1); }

function updateProgressUI() {
  const test = window.currentActiveTest;
  const grid = document.getElementById('testProgressGrid');
  if (!grid) return;

  let answeredCount = 0;
  let skippedCount = 0;

  grid.innerHTML = test.questions.map((_, i) => {
    let status = '';
    if (i === currentQuestionIndex) {
      status = 'active';
    } else if (activeTestAnswers[i]) {
      status = 'answered';
      answeredCount++;
    } else if (i < currentQuestionIndex) {
      status = 'skipped';
      skippedCount++;
    }

    return `<div class="progress-dot ${status}" onclick="renderProfessionalQuestion(${i})">${i + 1}</div>`;
  }).join('');

  // Update Stats
  const countAnswered = document.getElementById('countAnswered');
  const countRemaining = document.getElementById('countRemaining');
  const countSkipped = document.getElementById('countSkipped');
  const progressBar = document.getElementById('testMainProgressBar');

  const total = test.questions.length;
  const currentAnswered = Object.keys(activeTestAnswers).length;

  if (countAnswered) countAnswered.textContent = currentAnswered;
  if (countRemaining) countRemaining.textContent = total - currentAnswered;
  if (countSkipped) countSkipped.textContent = skippedCount;

  if (progressBar) {
    const progressPercent = (currentAnswered / total) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }
}

function quitTest() {
  const answered = Object.keys(activeTestAnswers).length;
  const total = window.currentActiveTest ? window.currentActiveTest.questions.length : 0;

  if (confirm(`Are you sure you want to quit? This will be marked as your final attempt and you will NOT be able to re-enter. You have answered ${answered} of ${total} questions. Proceed?`)) {
    // If they quit, we process it as a final submission
    processSTLESubmission();
  }
}

// STLE Step 3: Professional Submission Modal
function finishProfessionalTest() {
  const test = window.currentActiveTest;
  if (!test) return;

  // Prevent multiple modals
  if (document.getElementById('stleConfirmModal')) return;

  const answeredCount = Object.keys(activeTestAnswers).length;
  const totalCount = test.questions.length;

  const modal = document.createElement('div');
  modal.id = 'stleConfirmModal';
  modal.className = 'modal-overlay active';
  modal.style.cssText = 'display: flex; align-items: center; justify-content: center; z-index: 10000; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);';
  modal.innerHTML = `
    <div class="glass-panel bounce-in" style="max-width: 440px; width: 90%; padding: 2.5rem; text-align: center; border: 1px solid rgba(255,255,255,0.1); background: #1a1b2e;">
      <div style="width: 64px; height: 64px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: #fff;">Confirm Submission?</h3>
      <p style="color: var(--gray-400); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
        You have answered <strong>${answeredCount}</strong> of ${totalCount} questions. Once submitted, you cannot change your answers.
      </p>
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-ghost" style="flex: 1; border: 1px solid rgba(255,255,255,0.1);" onclick="document.getElementById('stleConfirmModal').remove()">Review Answers</button>
        <button class="btn btn-primary" style="flex: 1; background: #10b981; border: none; font-weight: 600;" id="stleSubmitBtn" onclick="processSTLESubmission()">
          Yes, Submit
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// STLE Step 4: Submission Processing
async function processSTLESubmission(isAuto = false) {
  const test = window.currentActiveTest;
  if (!test) return;

  if (isAuto) {
    alert("Time's up! Your test is being automatically submitted.");
  }

  const submitBtn = document.getElementById('stleSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-sm" style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation: spin 0.8s linear infinite;"></span> Processing...';
  }

  // Clear timer
  if (activeTestInterval) clearInterval(activeTestInterval);

  // Final time tracking
  if (questionTimes[currentQuestionIndex]) {
    questionTimes[currentQuestionIndex].total += (Date.now() - questionTimes[currentQuestionIndex].start);
  }

  // Calculate scores
  let correct = 0;
  test.questions.forEach((q, i) => {
    if (activeTestAnswers[i] === q.answer) correct++;
  });

  const percentage = Math.round((correct / test.questions.length) * 100);
  const status = percentage >= 50 ? "passed" : "failed";
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const result = {
    username: user.username,
    testId: test.id,
    testName: test.name,
    company: test.company,
    score: percentage,
    status: status,
    answers: activeTestAnswers,
    questionTimes: questionTimes,
    questions: test.questions,
    date: new Date().toISOString()
  };

  try {
    // Save to Backend
    await window.DB.submitTest(result);

    // Close Modals & Overlay with smooth transition
    document.getElementById('stleConfirmModal')?.remove();
    const overlay = document.getElementById('test-taking-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fade-out');
        document.body.style.overflow = 'auto';
        showProfessionalResult(result);
      }, 400);
    } else {
      document.body.style.overflow = 'auto';
      showProfessionalResult(result);
    }

    // Reload Dashboard Data
    await loadAvailableTests();
    await loadCompletedTests();

  } catch (err) {
    console.error('[STLE] Submission Error:', err);
    alert('Submission failed. Please check your connection and try again.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Retry Submission';
    }
  }
}


function showProfessionalResult(result) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay test-result-overlay';
  overlay.style.cssText = 'display:flex; align-items:center; justify-content:center; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:9999;';

  const statusLabel = result.status === 'passed' ? 'QUALIFIED' : 'NOT QUALIFIED';
  const statusIcon = result.status === 'passed' ? '🏆' : '📈';
  const statusColor = result.status === 'passed' ? '#10b981' : '#ef4444';

  overlay.innerHTML = `
        <div class="glass-panel bounce-in" style="max-width: 500px; width: 90%; text-align: center; padding: 3rem; background: #1a1b2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 24px;">
            <div style="font-size: 5rem; margin-bottom: 1.5rem;">${statusIcon}</div>
            <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; color: #fff;">Assessment Complete!</h2>
            <div style="display: inline-block; padding: 0.4rem 1.5rem; border-radius: 50px; background: ${statusColor}22; color: ${statusColor}; font-weight: 700; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid ${statusColor}44;">
              ${statusLabel}
            </div>
            <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem;">
              <div style="text-align: center;">
                <div style="font-size: 2.5rem; font-weight: 800; color: ${statusColor};">${result.score}%</div>
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Score</div>
              </div>
            </div>
            <p style="color: rgba(255,255,255,0.5); margin-bottom: 2rem; font-size: 0.9rem; line-height: 1.5;">
              Your results for <strong style="color:#fff;">${result.testName}</strong> have been recorded and synchronized.
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button class="btn btn-primary" onclick="this.closest('.test-result-overlay').remove(); viewTestDetails(${JSON.stringify(result).replace(/"/g, '&quot;')})" style="width: 100%; padding: 0.85rem; border-radius: 10px;">Analyze Performance</button>
                <button class="btn btn-ghost" id="goToAttendedBtn" style="width: 100%; padding: 0.85rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;">View Attended Tests</button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay);

  // Navigate to "Tests Attended" section when clicking "View Attended Tests"
  overlay.querySelector('#goToAttendedBtn').onclick = function () {
    overlay.remove();
    // Click the "Tests Attended" nav item to switch sections
    const testsNavItem = document.querySelector('.nav-item[data-section="tests"]');
    if (testsNavItem) testsNavItem.click();
  };
}

// Load completed tests for students
async function loadCompletedTests() {
  const tbody = document.querySelector("#tests-section tbody");
  if (!tbody) return;

  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    // Fetch fresh data from DB
    const results = await window.DB.getStudentResults(user.username);

    // Update session storage for other components
    user.testsCompleted = results;
    sessionStorage.setItem("user", JSON.stringify(user));

    // Sort by date newest first
    results.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    // Store in global for modal access
    window.currentStudentResults = results;

    // Initialize searches
    initStudentTestFilters();

    renderCompletedTests(results);
  } catch (e) {
    console.error("Error loading completed tests:", e);
  }
}

function initStudentTestFilters() {
  const searchInput = document.getElementById('studentTestSearch');
  const statusFilter = document.getElementById('studentStatusFilter');

  if (searchInput && !searchInput.dataset.initialized) {
    searchInput.addEventListener('input', () => filterStudentTests());
    searchInput.dataset.initialized = 'true';
  }
  if (statusFilter && !statusFilter.dataset.initialized) {
    statusFilter.addEventListener('change', () => filterStudentTests());
    statusFilter.dataset.initialized = 'true';
  }
}

function filterStudentTests() {
  const search = document.getElementById('studentTestSearch')?.value.toLowerCase() || '';
  const status = document.getElementById('studentStatusFilter')?.value || '';
  const results = window.currentStudentResults || [];

  const filtered = results.filter(test => {
    const matchesSearch = test.testName.toLowerCase().includes(search) ||
      test.company.toLowerCase().includes(search);
    const matchesStatus = !status || test.status === status;
    return matchesSearch && matchesStatus;
  });

  renderCompletedTests(filtered);
}

function renderCompletedTests(results) {
  const tbody = document.querySelector("#tests-section tbody");
  if (!tbody) return;

  if (results.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <p style="font-size: 1.1rem; font-weight: 500;">No Tests Found</p>
                    </div>
                </td>
            </tr>
        `;
    return;
  }

  // Update Stats cards from server results (not filtered ones)
  const allResults = window.currentStudentResults || [];
  if (allResults.length > 0) {
    const totalTests = allResults.length;
    const passedTests = allResults.filter((t) => t.status === "passed").length;
    const failedTests = allResults.filter((t) => t.status === "failed").length;
    const avgScore = Math.round(allResults.reduce((sum, t) => sum + t.score, 0) / totalTests);

    const statTotal = document.getElementById("statTotalTests");
    const statPassed = document.getElementById("statPassed");
    const statFailed = document.getElementById("statFailed");
    const statAvg = document.getElementById("statAvgScore");

    if (statTotal) statTotal.textContent = totalTests;
    if (statPassed) statPassed.textContent = passedTests;
    if (statFailed) statFailed.textContent = failedTests;
    if (statAvg) statAvg.textContent = avgScore + "%";
  }

  tbody.innerHTML = results
    .map((test) => {
      const formattedDate = new Date(test.createdAt || test.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const statusClass = test.status || "pending";
      const isRecordViewable = !test.isIncomplete && test.status !== 'incomplete';

      return `
            <tr>
                <td>${test.testName}</td>
                <td>${test.company}</td>
                <td>${formattedDate}</td>
                <td>${test.isIncomplete ? 'N/A' : test.score + '%'}</td>
                <td><span class="status-badge ${statusClass}">${statusClass.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-sm ${isRecordViewable ? 'btn-ghost' : 'btn-disabled'}" 
                            onclick="${isRecordViewable ? `openTestDetailsRecord('${test.id}')` : 'void(0)'}"
                            ${!isRecordViewable ? 'title="Analysis unavailable for incomplete tests"' : ''}>
                        ${isRecordViewable ? 'View Details' : 'No Analysis'}
                    </button>
                </td>
            </tr>
        `;
    })
    .join("");
}

// 3. View Test Details Logic
async function openTestDetailsRecord(resultId) {
  const result = window.currentStudentResults.find(r => String(r.id) === String(resultId));
  if (!result) return;

  if (result.isIncomplete || result.status === 'incomplete') {
    alert('This test was abandoned or ended abruptly. Question-wise analysis is not available for incomplete attempts.');
    return;
  }

  await viewTestDetails(result);
}

async function viewTestDetails(result) {
  const overlay = document.getElementById('performance-overlay');
  if (!overlay) return;

  overlay.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto; background: var(--bg-card); border-radius: 20px; padding: 2.5rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                <button class="btn btn-ghost" onclick="closePerformanceReview()" style="color: var(--gray-400);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px; margin-right:8px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> 
                  Dashboard
                </button>
                <div style="text-align: center;">
                    <h1 style="margin:0; font-size: 1.25rem; letter-spacing: 2px; font-weight: 800; color: #fff;">ASSESSMENT REPORT</h1>
                    <div style="height: 2px; width: 40px; background: var(--blue-500); margin: 8px auto 0;"></div>
                </div>
                <div style="width: 100px;"></div>
            </div>

            <div class="score-hero" style="background: rgba(255,255,255,0.02); border-radius: 16px; padding: 2rem; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 2rem; justify-content: center;">
                  <div class="score-circle" style="margin: 0;">
                      <span class="score-value">${result.score}</span>
                      <span class="score-total">%</span>
                  </div>
                  <div style="text-align: left;">
                      <h2 style="font-size: 1.75rem; margin: 0 0 0.25rem 0; color: #fff;">${result.testName}</h2>
                      <p style="color: var(--gray-400); margin: 0 0 1rem 0; font-size: 0.95rem;">${result.company} • Applied Drive</p>
                      <span class="badge" style="background: ${result.status === 'passed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${result.status === 'passed' ? '#10b981' : '#ef4444'}; border: 1px solid currentColor; padding: 0.4rem 1rem; border-radius: 50px; font-weight: 700; font-size: 0.75rem; letter-spacing: 1px;">
                          ${result.status === 'passed' ? 'QUALIFIED' : 'NOT QUALIFIED'}
                      </span>
                  </div>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
               <h3 style="font-size: 1rem; color: #fff; margin: 0;">Question Analysis</h3>
               <span style="font-size: 0.85rem; color: var(--gray-500);">Total Questions: ${result.questions.length}</span>
            </div>

            <div class="review-grid" style="display: flex; flex-direction: column; gap: 1rem;">
                ${result.questions.map((q, i) => {
    const userAns = result.answers[i];
    const isCorrect = userAns === q.answer;
    const timeSpent = result.questionTimes && result.questionTimes[i] ? Math.round(result.questionTimes[i].total / 1000) : 0;

    return `
                    <div class="review-item" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: var(--gray-500); text-transform: uppercase;">Question ${i + 1}</span>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                              <span style="font-size: 0.75rem; color: var(--gray-500);">⏱️ ${timeSpent}s</span>
                              <div class="review-status ${isCorrect ? 'status-correct' : 'status-incorrect'}" style="margin: 0; padding: 4px 12px; font-size: 0.7rem;">
                                  ${isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            </div>
                        </div>
                        <div class="review-question" style="font-size: 1rem; margin-bottom: 1.25rem; line-height: 1.5; color: rgba(255,255,255,0.9);">${q.question}</div>
                        <div class="review-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                            ${q.options.map((opt, optIdx) => {
      const letter = String.fromCharCode(65 + optIdx);
      let type = '';
      if (letter === q.answer) type = 'correct';
      else if (letter === userAns && !isCorrect) type = 'user-incorrect';

      return `
                                <div class="review-option ${type}" style="padding: 10px 14px; font-size: 0.85rem; border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.7rem;">${letter}</div>
                                        <span>${opt}</span>
                                    </div>
                                    ${letter === userAns ? `<span style="font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: ${isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isCorrect ? '#10b981' : '#ef4444'}; font-weight: 700;">YOU</span>` : ''}
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                    `;
  }).join('')}
            </div>

            <div class="review-footer" style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05);">
                <button class="btn btn-primary" onclick="closePerformanceReview()" style="width: 100%; border-radius: 12px; padding: 1rem;">Complete Review</button>
            </div>
        </div>
    `;

  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closePerformanceReview() {
  document.getElementById('performance-overlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function closeTestDetails() {
  const modal = document.getElementById('test-details-modal');
  if (modal) modal.style.display = 'none';
}

// Global Exports
window.confirmStartTest = confirmStartTest;
window.renderProfessionalQuestion = renderProfessionalQuestion;
window.selectProfessionalAnswer = selectProfessionalAnswer;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.quitTest = quitTest;
window.finishProfessionalTest = finishProfessionalTest;
window.viewTestDetails = viewTestDetails;
window.closePerformanceReview = closePerformanceReview;
window.closeTestDetails = closeTestDetails;
window.initCharts = initCharts;
