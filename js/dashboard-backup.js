// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initSidebar();
    initNavigation();
    initLogout();
    initUserInfo();
    initAvailabilityToggle();
    initSalaryRange();
    initCharts();
    loadAvailableTests();
    loadCompletedTests();
});

// Check if user is authenticated
function checkAuth() {
    const user = sessionStorage.getItem('user');
    const isStudentPage = window.location.pathname.includes('student-dashboard');
    const isStaffPage = window.location.pathname.includes('staff-dashboard');
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const userData = JSON.parse(user);
    
    // Redirect if wrong dashboard
    if (isStudentPage && userData.type !== 'student') {
        window.location.href = 'staff-dashboard.html';
    } else if (isStaffPage && userData.type !== 'staff') {
        window.location.href = 'student-dashboard.html';
    }
}

// Initialize sidebar toggle for mobile
// Initialize sidebar toggle for mobile and desktop collapse
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

    // Mobile Toggle
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }

    // Desktop Collapse Toggle
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-minimized');
            
            // Rotate chevron icon
            const iconSvg = sidebarToggleBtn.querySelector('svg');
            if (iconSvg) {
                iconSvg.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
            }
            
            // Save preference
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        // Restore state from localStorage
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-minimized');
            const iconSvg = sidebarToggleBtn.querySelector('svg');
            if (iconSvg) iconSvg.style.transform = 'rotate(180deg)';
        }
    }
}

// Initialize navigation between sections
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sectionTitle = document.getElementById('sectionTitle');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.dataset.section + '-section';
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId)?.classList.add('active');
            
            // Update title
            if (sectionTitle) {
                sectionTitle.textContent = item.querySelector('span').textContent;
            }
            
            // Close mobile sidebar
            document.getElementById('sidebar')?.classList.remove('active');
            document.getElementById('sidebarOverlay')?.classList.remove('active');
            
            // Reinitialize charts for analytics section
            if (item.dataset.section === 'analytics') {
                setTimeout(initCharts, 100);
            }
        });
    });
}

// Initialize logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}

// Display user info
function initUserInfo() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    if (user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        if (userAvatar) userAvatar.textContent = initials;
        if (userName) userName.textContent = user.name;
    }
}

// Availability toggle
function initAvailabilityToggle() {
    const toggle = document.getElementById('availabilityToggle');
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.querySelector('.status-indicator');
    
    if (toggle && statusText) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                statusText.textContent = 'Available for Placement';
                statusIndicator?.classList.add('available');
                statusIndicator?.classList.remove('unavailable');
            } else {
                statusText.textContent = 'Not Available';
                statusIndicator?.classList.remove('available');
                statusIndicator?.classList.add('unavailable');
            }
        });
    }
}

// Salary range slider
function initSalaryRange() {
    const range = document.getElementById('salaryRange');
    const value = document.getElementById('salaryValue');
    
    if (range && value) {
        range.addEventListener('input', () => {
            value.textContent = range.value;
        });
    }
}

// Initialize charts with student's actual scores
function initCharts() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = user.testsCompleted || [];
    
    // If no tests, show empty state
    if (tests.length === 0) {
        document.querySelectorAll('.chart-container').forEach(container => {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--gray-500);">No test data available. Take some tests to see analytics!</div>';
        });
        return;
    }
    
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' } } }
        },
        scales: {
            x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };
    
    // 1. Score Trend Over Time (Line Chart)
    const scoreTrendCanvas = document.getElementById('scoreTrendChart');
    if (scoreTrendCanvas) {
        const ctx = scoreTrendCanvas.getContext('2d');
        const labels = tests.map((_, i) => `Test ${i + 1}`);
        const scores = tests.map(t => t.score);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Your Scores (%)',
                    data: scores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: chartDefaults
        });
    }
    
    // 2. Pass vs Fail Distribution (Doughnut Chart)
    const passFailCanvas = document.getElementById('passFailChart');
    if (passFailCanvas) {
        const ctx = passFailCanvas.getContext('2d');
        const passed = tests.filter(t => t.status === 'passed').length;
        const failed = tests.length - passed;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } }
            }
        });
    }
    
    // 3. Scores by Company (Bar Chart)
    const companyScoresCanvas = document.getElementById('companyScoresChart');
    if (companyScoresCanvas) {
        const ctx = companyScoresCanvas.getContext('2d');
        
        // Group by company
        const companyData = {};
        tests.forEach(t => {
            if (!companyData[t.company]) {
                companyData[t.company] = [];
            }
            companyData[t.company].push(t.score);
        });
        
        const companies = Object.keys(companyData);
        const avgScores = companies.map(company => {
            const scores = companyData[company];
            return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: companies,
                datasets: [{
                    label: 'Average Score (%)',
                    data: avgScores,
                    backgroundColor: ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
                }]
            },
            options: chartDefaults
        });
    }
    
    // 4. Score Distribution (Horizontal Bar Chart)
    const scoreDistCanvas = document.getElementById('scoreDistributionChart');
    if (scoreDistCanvas) {
        const ctx = scoreDistCanvas.getContext('2d');
        
        // Categorize scores
        const ranges = {
            '90-100%': 0,
            '75-89%': 0,
            '60-74%': 0,
            '50-59%': 0,
            'Below 50%': 0
        };
        
        tests.forEach(t => {
            if (t.score >= 90) ranges['90-100%']++;
            else if (t.score >= 75) ranges['75-89%']++;
            else if (t.score >= 60) ranges['60-74%']++;
            else if (t.score >= 50) ranges['50-59%']++;
            else ranges['Below 50%']++;
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ranges),
                datasets: [{
                    label: 'Number of Tests',
                    data: Object.values(ranges),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']
                }]
            },
            options: chartDefaults
        });
    }
    
    // 5. Monthly Performance (Line Chart)
    const monthlyCanvas = document.getElementById('monthlyPerformanceChart');
    if (monthlyCanvas) {
        const ctx = monthlyCanvas.getContext('2d');
        
        // Group by month
        const monthlyData = {};
        tests.forEach(t => {
            const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) {
                monthlyData[month] = [];
            }
            monthlyData[month].push(t.score);
        });
        
        const months = Object.keys(monthlyData);
        const avgMonthlyScores = months.map(month => {
            const scores = monthlyData[month];
            return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Average Monthly Score (%)',
                    data: avgMonthlyScores,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: chartDefaults
        });
    }
}

// Load available tests for students
function loadAvailableTests() {
    const container = document.getElementById('availableTestsList');
    if (!container) return;

    const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    // Get already completed test IDs
    const completedTestIds = (user.testsCompleted || []).map(t => t.testId);
    
    // Filter active tests that haven't been completed
    const availableTests = tests.filter(t => t.status === 'active' && !completedTestIds.includes(t.id));
    
    if (availableTests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p>No active tests available at the moment</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Check back later for new tests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableTests.map(test => {
        const formattedDate = test.date ? new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
        const logo = test.company ? test.company.charAt(0).toUpperCase() : 'T';
        
        return `
            <div class="drive-item">
                <div class="drive-logo">${logo}</div>
                <div class="drive-info">
                    <h4>${test.name}</h4>
                    <p>${test.company} • ${formattedDate} • ${test.duration} mins • ${test.questions.length} questions</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="window.location.href='take-test.html?testId=${test.id}'">
                    Take Test
                </button>
            </div>
        `;
    }).join('');
}

// Load completed tests for students
function loadCompletedTests() {
    const tbody = document.querySelector('#tests-section tbody');
    if (!tbody) return;
    
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const completedTests = user.testsCompleted || [];
    
    if (completedTests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    No tests attended yet
                </td>
            </tr>
        `;
        
        // Update stats
        document.querySelector('#tests-section .stat-value').textContent = '0';
        return;
    }
    
    // Update stats
    const totalTests = completedTests.length;
    const passedTests = completedTests.filter(t => t.status === 'passed').length;
    const avgScore = Math.round(completedTests.reduce((sum, t) => sum + t.score, 0) / totalTests);
    
    const statValues = document.querySelectorAll('#tests-section .stat-value');
    if (statValues[0]) statValues[0].textContent = totalTests;
    if (statValues[1]) statValues[1].textContent = passedTests;
    if (statValues[2]) statValues[2].textContent = '0'; // Pending
    if (statValues[3]) statValues[3].textContent = avgScore + '%';
    
    // Populate table
    tbody.innerHTML = completedTests.map(test => {
        const formattedDate = new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusClass = test.status === 'passed' ? 'passed' : 'failed';
        const statusText = test.status.charAt(0).toUpperCase() + test.status.slice(1);
        
        return `
            <tr>
                <td>${test.testName}</td>
                <td>${test.company}</td>
                <td>${formattedDate}</td>
                <td>${test.score}%</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

