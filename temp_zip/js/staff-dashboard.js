// Staff Dashboard JavaScript - Additional functionality

document.addEventListener('DOMContentLoaded', () => {
    initCreateTestForm();
    initAddQuestion();
    initTestsTable();
    initStudentsManagement();
    initAnalytics();
});

// Create Test Form
function initCreateTestForm() {
    const form = document.getElementById('createTestForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const testName = document.getElementById('testName').value;
        const company = document.getElementById('testCompany').value;
        const date = document.getElementById('testDate').value;
        const duration = document.getElementById('testDuration').value;
        const description = document.getElementById('testDescription').value;
        
        // Collect questions with type support
        const questions = [];
        document.querySelectorAll('.question-item').forEach((item) => {
            const typeSelect = item.querySelector('.question-type-select');
            const questionText = item.querySelector('.question-text');
            const type = typeSelect ? typeSelect.value : 'mcq';
            
            const questionData = {
                type: type,
                question: questionText ? questionText.value : '',
            };
            
            if (type === 'mcq') {
                const optionInputs = item.querySelectorAll('.mcq-options .options-grid input');
                const answerSelect = item.querySelector('.mcq-options .answer-select');
                questionData.options = Array.from(optionInputs).map(input => input.value);
                questionData.answer = answerSelect ? answerSelect.value : 'A';
            } else if (type === 'truefalse') {
                const answerSelect = item.querySelector('.truefalse-options .answer-select');
                questionData.options = ['True', 'False'];
                questionData.answer = answerSelect ? answerSelect.value : 'True';
            } else if (type === 'fillblank') {
                const answerInput = item.querySelector('.fillblank-options .correct-answer');
                questionData.answer = answerInput ? answerInput.value : '';
            }
            
            questions.push(questionData);
        });
        
        // Get current staff user
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        // Create test object
        const test = {
            id: Date.now(),
            name: testName,
            company: company,
            date: date,
            duration: parseInt(duration),
            description: description,
            questions: questions,
            status: 'active',
            participants: 0,
            createdBy: user.username,
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage
        const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
        tests.push(test);
        localStorage.setItem('placeme_tests', JSON.stringify(tests));
        
        // Send notification
        showNotification('Test Created Successfully!', `${testName} is now available for students.`, 'success');
        
        // Show success message
        alert('Test created successfully! It will now appear in student availability.');
        
        // Reset form
        form.reset();
        
        // Navigate to manage tests
        document.querySelector('[data-section="manage-tests"]')?.click();
        
        // Refresh table
        loadTests();
    });
}

// Add Question functionality
function initAddQuestion() {
    const addBtn = document.getElementById('addQuestionBtn');
    const container = document.getElementById('questionsContainer');
    
    if (!addBtn || !container) return;
    
    let questionCount = 1;
    
    addBtn.addEventListener('click', () => {
        questionCount++;
        const questionHTML = `
            <div class="question-item" data-question="${questionCount}">
                <div class="question-header">
                    <span class="question-number">Question ${questionCount}</span>
                    <button type="button" class="remove-question-btn">×</button>
                </div>
                <div class="form-group">
                    <input type="text" class="form-input" placeholder="Enter question" required>
                </div>
                <div class="options-grid">
                    <input type="text" class="form-input" placeholder="Option A" required>
                    <input type="text" class="form-input" placeholder="Option B" required>
                    <input type="text" class="form-input" placeholder="Option C" required>
                    <input type="text" class="form-input" placeholder="Option D" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <select class="form-input">
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                    </select>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', questionHTML);
        
        // Add remove functionality
        const removeBtn = container.querySelector(`[data-question="${questionCount}"] .remove-question-btn`);
        removeBtn.addEventListener('click', function() {
            this.closest('.question-item').remove();
            updateQuestionNumbers();
        });
    });
    
    // Initial remove button handlers
    document.querySelectorAll('.remove-question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.querySelectorAll('.question-item').length > 1) {
                this.closest('.question-item').remove();
                updateQuestionNumbers();
            } else {
                alert('You need at least one question.');
            }
        });
    });
}

function updateQuestionNumbers() {
    document.querySelectorAll('.question-item').forEach((item, index) => {
        item.querySelector('.question-number').textContent = `Question ${index + 1}`;
    });
}

// Tests Table functionality
function initTestsTable() {
    loadTests();
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTests(e.target.value, document.querySelector('.filter-select')?.value);
        });
    }
    
    // Filter functionality
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            filterTests(document.querySelector('.search-input')?.value || '', e.target.value);
        });
    }
}

function loadTests() {
    const tbody = document.getElementById('testsTableBody');
    if (!tbody) return;
    
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
    
    // Filter tests created by current user
    const userTests = tests.filter(t => t.createdBy === user.username);
    
    tbody.innerHTML = '';
    
    if (userTests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">No tests created yet. Create a test to get started.</td></tr>';
        return;
    }
    
    userTests.forEach(test => {
        const formattedDate = test.date ? new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
        const row = `
            <tr data-id="${test.id}">
                <td>${test.name}</td>
                <td>${test.company}</td>
                <td>${formattedDate}</td>
                <td>${test.participants || 0}</td>
                <td><span class="status-badge ${test.status}">${test.status.charAt(0).toUpperCase() + test.status.slice(1)}</span></td>
                <td class="actions-cell">
                    <button class="action-btn edit" onclick="editTest(${test.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="action-btn view" onclick="viewTestAnalytics(${test.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                    <button class="action-btn delete" onclick="deleteTest(${test.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterTests(search, status) {
    const rows = document.querySelectorAll('#testsTableBody tr');
    rows.forEach(row => {
        const name = row.cells[0]?.textContent.toLowerCase() || '';
        const company = row.cells[1]?.textContent.toLowerCase() || '';
        const rowStatus = row.querySelector('.status-badge')?.textContent.toLowerCase() || '';
        
        const matchesSearch = name.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
        const matchesStatus = !status || rowStatus === status.toLowerCase();
        
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function deleteTest(id) {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
    const filtered = tests.filter(t => t.id !== id);
    localStorage.setItem('placeme_tests', JSON.stringify(filtered));
    
    // Remove row from table
    document.querySelector(`tr[data-id="${id}"]`)?.remove();
}

// Students Management
function initStudentsManagement() {
    loadStudents();
    
    // Search functionality
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => filterStudents());
    }
    
    // Filter functionality
    const departmentFilter = document.getElementById('departmentFilter');
    const classFilter = document.getElementById('classFilter');
    const yearFilter = document.getElementById('yearFilter');
    const batchFilter = document.getElementById('batchFilter');
    
    if (departmentFilter) departmentFilter.addEventListener('change', () => filterStudents());
    if (classFilter) classFilter.addEventListener('change', () => filterStudents());
    if (yearFilter) yearFilter.addEventListener('change', () => filterStudents());
    if (batchFilter) batchFilter.addEventListener('change', () => filterStudents());
}

function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    // Load students from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('placeme_users') || '{"students":[],"staff":[]}');
    const students = storedUsers.students || [];
    
    // Update stats
    document.getElementById('totalStudents').textContent = students.length;
    const departments = new Set(students.map(s => s.department).filter(Boolean));
    document.getElementById('totalDepartments').textContent = departments.size;
    document.getElementById('activeStudents').textContent = students.length;
    document.getElementById('placedStudents').textContent = 0;
    
    // Populate class filter
    const classFilter = document.getElementById('classFilter');
    const classes = new Set(students.map(s => s.className).filter(Boolean));
    classes.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classFilter?.appendChild(option);
    });
    
    // Clear table and populate
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--gray-500);">No students registered yet</td></tr>';
        return;
    }
    
    students.forEach(student => {
        const row = `
            <tr data-student-id="${student.username}">
                <td>${student.registerNumber || '-'}</td>
                <td>${student.name || '-'}</td>
                <td>${student.department || '-'}</td>
                <td>${student.year ? student.year + getSuffix(student.year) + ' Year' : '-'}</td>
                <td>${student.className || '-'}</td>
                <td>${student.batch || '-'}</td>
                <td>${student.email || '-'}</td>
                <td>${student.phoneNumber || '-'}</td>
                <td>${(student.testsCompleted || []).length}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function filterStudents() {
    const searchValue = document.getElementById('studentSearch')?.value.toLowerCase() || '';
    const departmentValue = document.getElementById('departmentFilter')?.value || '';
    const classValue = document.getElementById('classFilter')?.value || '';
    const yearValue = document.getElementById('yearFilter')?.value || '';
    const batchValue = document.getElementById('batchFilter')?.value || '';
    
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const registerNo = row.cells[0]?.textContent.toLowerCase() || '';
        const name = row.cells[1]?.textContent.toLowerCase() || '';
        const department = row.cells[2]?.textContent || '';
        const year = row.cells[3]?.textContent || '';
        const className = row.cells[4]?.textContent || '';
        const batch = row.cells[5]?.textContent || '';
        
        const matchesSearch = registerNo.includes(searchValue) || name.includes(searchValue);
        const matchesDepartment = !departmentValue || department === departmentValue;
        const matchesClass = !classValue || className === classValue;
        const matchesYear = !yearValue || year.startsWith(yearValue);
        const matchesBatch = !batchValue || batch === batchValue;
        
        row.style.display = matchesSearch && matchesDepartment && matchesClass && matchesYear && matchesBatch ? '' : 'none';
    });
}

function getSuffix(num) {
    const suffixes = { '1': 'st', '2': 'nd', '3': 'rd', '4': 'th' };
    return suffixes[num] || 'th';
}

// Update question fields based on type
function updateQuestionFields(selectElement) {
    const questionItem = selectElement.closest('.question-item');
    const container = questionItem.querySelector('.question-options-container');
    const type = selectElement.value;
    
    let html = '';
    
    if (type === 'mcq') {
        html = `
            <div class="mcq-options">
                <div class="options-grid">
                    <input type="text" class="form-input" placeholder="Option A" required>
                    <input type="text" class="form-input" placeholder="Option B" required>
                    <input type="text" class="form-input" placeholder="Option C" required>
                    <input type="text" class="form-input" placeholder="Option D" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <select class="form-input answer-select">
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                    </select>
                </div>
            </div>
        `;
    } else if (type === 'truefalse') {
        html = `
            <div class="truefalse-options">
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <select class="form-input answer-select">
                        <option value="True">True</option>
                        <option value="False">False</option>
                    </select>
                </div>
            </div>
        `;
    } else if (type === 'fillblank') {
        html = `
            <div class="fillblank-options">
                <div class="form-group">
                    <label class="form-label">Correct Answer</label>
                    <input type="text" class="form-input correct-answer" placeholder="Enter the correct answer" required>
                    <small style="color: var(--gray-400); margin-top: 0.5rem; display: block;">Student will type the answer. Use underscores (_____) in question for blank space.</small>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Show notification (simulated email)
function showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 
                     type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                     'linear-gradient(135deg, #667eea, #764ba2)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        max-width: 350px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <div style="font-size: 1.5rem;">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : '📧'}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.875rem; opacity: 0.9;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.25rem; padding: 0; opacity: 0.7;">×</button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Log as simulated email
    const emailLog = {
        timestamp: new Date().toISOString(),
        type: type,
        title: title,
        message: message,
        status: 'sent'
    };
    
    const emails = JSON.parse(localStorage.getItem('placeme_emails') || '[]');
    emails.push(emailLog);
    localStorage.setItem('placeme_emails', JSON.stringify(emails));
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation styles
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Make functions available globally
window.deleteTest = deleteTest;
window.updateQuestionFields = updateQuestionFields;
window.showNotification = showNotification;

// Analytics Functionality
function initAnalytics() {
    const select = document.getElementById('analyticsTestSelect');
    if (!select) return;
    
    // Get current staff user
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    // Get tests created by this staff
    const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
    const userTests = tests.filter(t => t.createdBy === user.username);
    
    // Populate dropdown
    select.innerHTML = '<option value="">Select a test to view analytics</option>';
    userTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.name;
        select.appendChild(option);
    });
    
    // Handle selection change
    select.addEventListener('change', (e) => {
        if (e.target.value) {
            loadTestAnalytics(e.target.value);
        } else {
            document.getElementById('analyticsContent').style.display = 'none';
            document.getElementById('noAnalyticsMsg').style.display = 'block';
        }
    });
}

function loadTestAnalytics(testId) {
    const content = document.getElementById('analyticsContent');
    const noMsg = document.getElementById('noAnalyticsMsg');
    
    if (!content || !noMsg) return;
    
    content.style.display = 'block';
    noMsg.style.display = 'none';
    
    // Get test data
    const tests = JSON.parse(localStorage.getItem('placeme_tests') || '[]');
    const test = tests.find(t => t.id == testId);
    
    if (!test) return;
    
    // Get students who took this test
    const allUsers = JSON.parse(localStorage.getItem('placeme_users') || '{"students":[]}');
    const students = allUsers.students || [];
    
    // Find results for this test
    const results = [];
    students.forEach(student => {
        const studentTest = (student.testsCompleted || []).find(t => t.testId == testId || t.testName === test.name); // Match by ID or Name
        if (studentTest) {
            results.push({
                student: student.name,
                score: studentTest.score,
                status: studentTest.status,
                date: studentTest.date
            });
        }
    });

    // Update Insights
    if (results.length > 0) {
        const scores = results.map(r => r.score);
        document.getElementById('highestScoreVal').textContent = Math.max(...scores) + '%';
        document.getElementById('lowestScoreVal').textContent = Math.min(...scores) + '%';
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        document.getElementById('averageScoreVal').textContent = Math.round(avg) + '%';
    } else {
        document.getElementById('highestScoreVal').textContent = '-';
        document.getElementById('lowestScoreVal').textContent = '-';
        document.getElementById('averageScoreVal').textContent = '-';
    }
    
    // 1. Score Distribution Chart
    const distCanvas = document.getElementById('scoreDistributionChart');
    if (distCanvas) {
        // Destroy existing if any
        const existingChart = Chart.getChart(distCanvas);
        if (existingChart) existingChart.destroy();
        
        const ranges = { '90-100': 0, '75-89': 0, '60-74': 0, 'Below 60': 0 };
        results.forEach(r => {
            if (r.score >= 90) ranges['90-100']++;
            else if (r.score >= 75) ranges['75-89']++;
            else if (r.score >= 60) ranges['60-74']++;
            else ranges['Below 60']++;
        });
        
        new Chart(distCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(ranges),
                datasets: [{
                    label: 'Number of Students',
                    data: Object.values(ranges),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
    
    // 2. Attendance Chart (Attended vs Not Attended - approximation based on total students)
    const attendanceCanvas = document.getElementById('attendanceChart');
    if (attendanceCanvas) {
        const existingChart = Chart.getChart(attendanceCanvas);
        if (existingChart) existingChart.destroy();
        
        const totalStudents = students.length || 1; // Avoid divide by zero
        const attended = results.length;
        const notAttended = totalStudents - attended;
        
        new Chart(attendanceCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Attended', 'Not Attended'],
                datasets: [{
                    data: [attended, notAttended],
                    backgroundColor: ['#667eea', '#e5e7eb']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    // 3. Pass vs Fail
    const pfCanvas = document.getElementById('passFailChart');
    if (pfCanvas) {
        const existingChart = Chart.getChart(pfCanvas);
        if (existingChart) existingChart.destroy();
        
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.length - passed;
        
        new Chart(pfCanvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [passed, failed],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 4. Monthly Average Performance (Simulated for this test context)
    // Since a test usually happens on one date, this chart might show "Test Average vs Global Average" or "Score Trend" if multiple attempts allowed.
    // User asked for "month-wise average like the difference" per test.
    // If a test is taken over time (e.g. practice test), we can show monthly avg.
    const monthlyCanvas = document.getElementById('monthlyAverageChart');
    if (monthlyCanvas) {
        const existingChart = Chart.getChart(monthlyCanvas);
        if (existingChart) existingChart.destroy();
        
        // Group results by month
        const monthlyData = {};
        results.forEach(r => {
            const date = r.date ? new Date(r.date) : new Date();
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(r.score);
        });
        
        const labels = Object.keys(monthlyData);
        // If only one month or no dates, show meaningful dummy trend or just the point
        if (labels.length === 0) {
             // Fallback if no dates
        }

        const avgScores = labels.map(m => {
            const scores = monthlyData[m];
            return scores.reduce((a, b) => a + b, 0) / scores.length;
        });
        
        new Chart(monthlyCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Current'],
                datasets: [{
                    label: 'Average Score',
                    data: avgScores.length ? avgScores : [0],
                    borderColor: '#8b5cf6',
                    fill: true,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Populate Results Table
    const resultsTable = document.getElementById('testResultsTableBody');
    if (resultsTable) {
        resultsTable.innerHTML = '';
        if (results.length === 0) {
            resultsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1rem;">No students have taken this test yet</td></tr>';
        } else {
            results.forEach(r => {
                const dateStr = r.date ? new Date(r.date).toLocaleDateString() : '-';
                resultsTable.innerHTML += `
                    <tr>
                        <td>${r.student}</td>
                        <td>${dateStr}</td>
                        <td style="font-weight: bold; color: ${r.score >= 50 ? '#10b981' : '#ef4444'}">${r.score}%</td>
                        <td><span class="status-badge ${r.status === 'passed' ? 'active' : 'inactive'}">${r.status ? r.status.toUpperCase() : '-'}</span></td>
                    </tr>
                `;
            });
        }
    }
}

function viewTestAnalytics(testId) {
    // Switch to analytics tab
    const analyticsTab = document.querySelector('[data-section="analytics-section"]');
    if (analyticsTab) analyticsTab.click();
    
    // Select the test
    const select = document.getElementById('analyticsTestSelect');
    if (select) {
        select.value = testId;
        // Trigger change event manually
        select.dispatchEvent(new Event('change'));
    }
}

function editTest(testId) {
    // Placeholder for edit functionality
    alert('Edit functionality coming soon for test ID: ' + testId);
}

// Ensure global access
window.viewTestAnalytics = viewTestAnalytics;
window.editTest = editTest;
