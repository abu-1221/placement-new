// Staff Dashboard JavaScript - Additional functionality

function toggleQuestionType(select) {
    // MCQ only now
    const item = select.closest('.question-item');
    item.querySelector('.mcq-options').style.display = 'block';
}
window.toggleQuestionType = toggleQuestionType;

function updateQuestionNumbers() {
    document.querySelectorAll('.question-item').forEach((item, index) => {
        const count = index + 1;
        item.dataset.question = count;
        const numberSpan = item.querySelector('.question-number');
        if (numberSpan) numberSpan.textContent = `Question ${count}`;
    });
}
window.updateQuestionNumbers = updateQuestionNumbers;

document.addEventListener('DOMContentLoaded', () => {
    initCreateTestForm();
    initAddQuestion();
    initTestsTable();
    initStudentsManagement();
    initStudentLookup();
    initAiGenerator();
});

// Create Test Form with Confirmation Workflow
function initCreateTestForm() {
    const form = document.getElementById('createTestForm');
    if (!form) return;

    let pendingTest = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const testName = document.getElementById('testName').value;
        const company = document.getElementById('testCompany').value;
        const date = document.getElementById('testDate').value;
        const duration = document.getElementById('testDuration').value;
        const description = document.getElementById('testDescription').value;

        // Collect Audience Targeting from grid checkboxes
        const targetDepartments = Array.from(document.querySelectorAll('#targetDepartmentsGrid input:checked')).map(cb => cb.value);
        const targetYears = Array.from(document.querySelectorAll('#targetYearsGrid input:checked')).map(cb => cb.value);
        const targetSections = Array.from(document.querySelectorAll('#targetSectionsGrid input:checked')).map(cb => cb.value);
        const targetGenders = Array.from(document.querySelectorAll('#targetGendersGrid input:checked')).map(cb => cb.value);

        // Collect questions
        const questions = [];
        document.querySelectorAll('.question-item').forEach((item) => {
            const typeSelect = item.querySelector('.type-selector');
            const type = typeSelect?.value || 'mcq';

            const questionElement = item.querySelector('textarea, input[type="text"]');
            const questionText = questionElement?.value || '';

            const questionObj = {
                type: type,
                question: questionText
            };

            if (type === 'mcq') {
                const options = [];
                item.querySelectorAll('.mcq-options .options-grid input').forEach(opt => options.push(opt.value));
                const answerSelect = item.querySelector('.mcq-answer');
                questionObj.options = options;
                questionObj.answer = answerSelect?.value || 'A';
            } else if (type === 'fill-blanks' || type === 'qa') {
                const answerInput = item.querySelector('.plain-answer');
                questionObj.answer = answerInput?.value || '';
            } else if (type === 'code') {
                const outputArea = item.querySelector('.expected-output');
                const langSelect = item.querySelector('.code-language');
                questionObj.expectedOutput = outputArea?.value || '';
                questionObj.language = langSelect?.value || 'javascript';
            }

            questions.push(questionObj);
        });

        if (questions.length === 0) {
            showNotification('Validation Error', 'Please add at least one question.', 'error');
            return;
        }

        // Check for empty questions or options
        let isValid = true;
        questions.forEach((q, idx) => {
            if (!q.question.trim()) {
                showNotification('Validation Error', `Question ${idx + 1} is missing text.`, 'error');
                isValid = false;
            }

            if (q.type === 'mcq') {
                if (!q.options || q.options.some(opt => !opt.trim())) {
                    showNotification('Validation Error', `Question ${idx + 1} has empty options.`, 'error');
                    isValid = false;
                }
            } else if (q.type === 'code') {
                if (!q.expectedOutput || !q.expectedOutput.trim()) {
                    showNotification('Validation Error', `Question ${idx + 1} (Code) is missing expected output.`, 'error');
                    isValid = false;
                }
            } else {
                // fill-blanks or qa
                if (!q.answer || !q.answer.trim()) {
                    showNotification('Validation Error', `Question ${idx + 1} is missing the correct answer.`, 'error');
                    isValid = false;
                }
            }
        });

        if (!isValid) return;

        // Get current staff user
        const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
        const user = JSON.parse(userData || '{}');

        // Create test object
        pendingTest = {
            name: testName,
            company: company,
            date: date,
            duration: parseInt(duration),
            description: description,
            questions: questions,
            status: 'active',
            createdBy: user.username,
            targetAudience: {
                departments: targetDepartments,
                years: targetYears,
                sections: targetSections,
                genders: targetGenders
            }
        };

        // Show full-page publish review
        showTestConfirmation(pendingTest);
    });

    // Handle final confirmation (delegated)
    document.addEventListener('click', async (e) => {
        const confirmBtn = e.target.closest('#confirmPublishBtn');
        if (!confirmBtn || !pendingTest) return;

        try {
            confirmBtn.disabled = true;
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<span class="spinner-sm"></span> Publishing...';

            const res = await window.DB.createTest(pendingTest);
            if (res.error) {
                showNotification('Assignment Error', res.error, 'error');
                return; // Stop flow
            }

            const assignedCount = res.assignedCount || 0;
            showNotification('Test Published!', `${pendingTest.name} is now live for ${assignedCount} targeted students.`, 'success');

            // Show Demo Workflow Modal
            showPublishSuccessDemo(pendingTest.name, assignedCount);

            form.reset();

            // Reset all audience checkboxes
            document.querySelectorAll('.shortlist-grid input[type="checkbox"]').forEach(cb => cb.checked = false);

            // Reset questions container to single clean question
            const qContainer = document.getElementById('questionsContainer');
            if (qContainer) {
                qContainer.innerHTML = `
                    <div class="question-item bounce-in" data-question="1">
                      <div class="question-header">
                        <span class="question-number">Question 1</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                          <select class="form-input type-selector" style="display: none;">
                            <option value="mcq">MCQ</option>
                          </select>
                          <button type="button" class="remove-question-btn" title="Remove Question">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>
                      <div class="question-body">
                        <div class="form-group">
                          <label class="form-label">Question Text *</label>
                          <textarea class="form-input" rows="2" placeholder="Enter your question or problem statement..." required></textarea>
                        </div>
                        
                        <!-- MCQ Options -->
                        <div class="mcq-options">
                          <div class="options-grid">
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option A"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option B"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option C"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option D"></div>
                          </div>
                          <div class="form-group">
                            <label class="form-label">Correct Option</label>
                            <select class="form-input mcq-answer">
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                        </div>

                      </div>
                    </div>`;
            }

            // Navigate to Manage Tests section
            const manageLink = document.querySelector('[data-section="manage-tests"]');
            if (manageLink) manageLink.click();
            loadTests();

            pendingTest = null;
        } catch (err) {
            console.error(err);
            showNotification('Error', 'Failed to create test: ' + err.message, 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px; margin-right: 8px;">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Confirm & Publish`;
        }
    });

    // Back to editing handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('#publishBackBtn')) {
            navigateBackToCreate();
        }
    });

    // Cleanup Demo Modal
    document.addEventListener('click', (e) => {
        if (e.target.matches('#closePublishDemoBtn')) {
            document.getElementById('publishDemoModal')?.remove();
        }
    });
}

function showPublishSuccessDemo(testName, assignedCount) {
    const modal = document.createElement('div');
    modal.id = 'publishDemoModal';
    modal.className = 'logout-modal-overlay active'; // Reusing modal classes for consistency
    modal.innerHTML = `
        <div class="logout-modal" style="max-width: 450px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: #10b981; margin: 0 auto 1rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 class="logout-modal-title" style="text-align: center;">Test Published Successfully</h3>
            <p class="logout-modal-text" style="text-align: center; margin-bottom: 1.5rem;">
                <strong>${testName}</strong> is now live.<br>
                Assigned to: <span style="color: #fff; font-weight: bold;">${assignedCount} students</span>
            </p>
            
            <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="color: #93c5fd; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem;">Demo Student Access</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: monospace; font-size: 0.9rem; color: #e2e8f0;">
                    <div style="display: flex; justify-content: space-between;"><span>Username:</span> <span style="color: #fff;">student_demo_01</span></div>
                    <div style="display: flex; justify-content: space-between;"><span>Password:</span> <span style="color: #fff;">123456</span></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);"><span>Assigned Test:</span> <span style="color: #10b981;">${testName}</span></div>
                </div>
            </div>
            
            <button type="button" class="logout-modal-btn cancel" id="closePublishDemoBtn" style="width: 100%;">Close & View Manage Tests</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Navigate to full-page publish review
function showTestConfirmation(test) {
    const body = document.getElementById('publishReviewBody');
    if (!body) return;

    const audience = test.targetAudience;
    const deptText = audience.departments.length > 0 ? audience.departments.join(', ') : 'All Departments';
    const yearText = audience.years.length > 0 ? audience.years.map(y => y + (y == 1 ? 'st' : y == 2 ? 'nd' : y == 3 ? 'rd' : 'th') + ' Year').join(', ') : 'All Years';
    const sectionText = audience.sections.length > 0 ? 'Sections ' + audience.sections.join(', ') : 'All Sections';
    const genderText = audience.genders.length > 0 ? audience.genders.join(', ') : 'All Genders';

    body.innerHTML = `
        <div class="publish-review-content">
            <!-- Test Overview Cards -->
            <div class="publish-info-grid">
                <div class="publish-info-card">
                    <div class="publish-info-label">Test Name</div>
                    <div class="publish-info-value">${test.name}</div>
                </div>
                <div class="publish-info-card">
                    <div class="publish-info-label">Company</div>
                    <div class="publish-info-value">${test.company}</div>
                </div>
                <div class="publish-info-card">
                    <div class="publish-info-label">Questions</div>
                    <div class="publish-info-value">${test.questions.length} Items</div>
                </div>
                <div class="publish-info-card">
                    <div class="publish-info-label">Duration</div>
                    <div class="publish-info-value">${test.duration} Minutes</div>
                </div>
            </div>

            ${test.description ? `
            <div class="publish-section-card">
                <h4 class="publish-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/>
                    </svg>
                    Description
                </h4>
                <p style="color: var(--gray-400); line-height: 1.6; margin: 0;">${test.description}</p>
            </div>` : ''}

            <!-- Audience Section -->
            <div class="publish-section-card">
                <h4 class="publish-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    Target Audience
                </h4>
                <div class="publish-audience-grid">
                    <div class="publish-audience-item"><span class="publish-audience-label">Departments</span><span class="publish-audience-value">${deptText}</span></div>
                    <div class="publish-audience-item"><span class="publish-audience-label">Years</span><span class="publish-audience-value">${yearText}</span></div>
                    <div class="publish-audience-item"><span class="publish-audience-label">Sections</span><span class="publish-audience-value">${sectionText}</span></div>
                    <div class="publish-audience-item"><span class="publish-audience-label">Gender</span><span class="publish-audience-value">${genderText}</span></div>
                </div>
            </div>

            <!-- Questions Preview -->
            <div class="publish-section-card">
                <h4 class="publish-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Questions Preview (${test.questions.length})
                </h4>
                <div class="publish-questions-list">
                    ${test.questions.map((q, i) => `
                        <div class="publish-question-item">
                            <span class="publish-q-number">Q${i + 1}</span>
                            <div class="publish-q-content">
                                <div class="publish-q-text">${q.question}</div>
                                <div class="publish-q-type" style="font-size: 0.7rem; color: var(--primary-400); text-transform: uppercase;">${q.type || 'MCQ'}</div>
                                ${q.type === 'mcq' ? `
                                    <div class="publish-q-options">${q.options.map((opt, j) => `<span class="publish-q-opt ${String.fromCharCode(65 + j) === q.answer ? 'correct' : ''}">${String.fromCharCode(65 + j)}. ${opt}</span>`).join('')}</div>
                                ` : q.type === 'coding' ? `
                                    <div class="publish-q-answer" style="margin-top: 0.5rem; font-family: monospace; color: var(--green-400);">Expected Output: ${q.expectedOutput}</div>
                                ` : `
                                    <div class="publish-q-answer" style="margin-top: 0.5rem; color: var(--green-400);">Correct Answer: ${q.answer}</div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Warning Banner -->
            <div class="publish-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; flex-shrink: 0;">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                    <strong>Publication Notice:</strong> Once published, this test will be immediately available to all targeted students. They will see it upon login without any additional navigation.
                </div>
            </div>
        </div>
    `;

    // Switch to publish review section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('publish-review-section').classList.add('active');

    // Update title
    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = 'Publish Test';

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Scroll to top of main content
    document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateBackToCreate() {
    const createLink = document.querySelector('[data-section="create-test"]');
    if (createLink) createLink.click();
}

// Legacy alias
function closeConfirmationModal() {
    navigateBackToCreate();
}
window.closeConfirmationModal = closeConfirmationModal;

// Add Question functionality
function initAddQuestion() {
    const addBtn = document.getElementById('addQuestionBtn');
    const container = document.getElementById('questionsContainer');

    if (!addBtn || !container) return;

    addBtn.addEventListener('click', () => {
        const questionCount = document.querySelectorAll('.question-item').length + 1;
        const questionHTML = `
            <div class="question-item bounce-in" data-question="${questionCount}">
                <div class="question-header">
                    <span class="question-number">Question ${questionCount}</span>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <select class="form-input type-selector" style="display: none;">
                            <option value="mcq">MCQ</option>
                        </select>
                        <button type="button" class="remove-question-btn" title="Remove Question">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </div>
                <div class="question-body">
                    <div class="form-group">
                        <label class="form-label">Question Text *</label>
                        <textarea class="form-input" rows="2" placeholder="Enter your question..."></textarea>
                    </div>
                    
                    <div class="mcq-options">
                        <div class="options-grid">
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option A"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option B"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option C"></div>
                            <div class="option-group"><input type="text" class="form-input" placeholder="Option D"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Correct Option</label>
                            <select class="form-input mcq-answer">
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>
                    </div>

                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', questionHTML);

        const newQuestion = container.lastElementChild;
        newQuestion.querySelector('.remove-question-btn').addEventListener('click', function () {
            if (document.querySelectorAll('.question-item').length > 1) {
                newQuestion.remove();
                updateQuestionNumbers();
            } else {
                showNotification('Warning', 'You need at least one question.', 'error');
            }
        });
    });

    // Initial remove button handlers
    document.querySelectorAll('.remove-question-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            if (document.querySelectorAll('.question-item').length > 1) {
                this.closest('.question-item').remove();
                updateQuestionNumbers();
            } else {
                showNotification('Warning', 'You need at least one question.', 'error');
            }
        });
    });
}

function updateQuestionNumbers() {
    document.querySelectorAll('.question-item').forEach((item, index) => {
        const num = index + 1;
        item.setAttribute('data-question', num);
        item.querySelector('.question-number').textContent = `Question ${num}`;
    });
}

// ========== MANAGE TESTS ==========
function initTestsTable() {
    loadTests();

    const searchInput = document.getElementById('stmai-test-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTests(e.target.value, '');
        });
    }
}

async function loadTests() {
    const tbody = document.getElementById('testsTableBody');
    if (!tbody) return;

    const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
    const user = JSON.parse(userData || '{}');

    // CRITICAL FIX: Use getAllTests() for staff — returns ALL tests, not just active
    const tests = window.DB ? await window.DB.getAllTests() : [];
    const allResults = window.DB ? await window.DB.getAllResults() : [];

    // Filter tests created by current user
    const userTests = tests.filter(t => t.createdBy === user.username);

    // Calculate real participant counts from Results table
    const participantMap = {};
    userTests.forEach(test => {
        const testResults = allResults.filter(r => String(r.testId) === String(test.id));
        participantMap[test.id] = testResults.length;
    });

    // Update Stats
    const totalTests = userTests.length;
    const activeTests = userTests.filter(t => t.status === 'active').length;
    const totalParticipants = Object.values(participantMap).reduce((sum, c) => sum + c, 0);

    // Calculate global pass rate
    let totalAttempts = 0;
    let totalPassed = 0;
    userTests.forEach(test => {
        const testResults = allResults.filter(r => String(r.testId) === String(test.id));
        testResults.forEach(result => {
            totalAttempts++;
            if (result.status === 'passed' || result.score >= 50) totalPassed++;
        });
    });
    const passRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

    const totalEl = document.getElementById('staffTotalTests');
    const activeEl = document.getElementById('staffActiveTests');
    const partEl = document.getElementById('staffParticipants');
    const passEl = document.getElementById('staffPassRate');

    if (totalEl) totalEl.textContent = totalTests;
    if (activeEl) activeEl.textContent = activeTests;
    if (partEl) partEl.textContent = totalParticipants;
    if (passEl) passEl.textContent = passRate + '%';

    tbody.innerHTML = '';

    if (userTests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        <p style="font-size: 1.1rem; font-weight: 500;">No Tests Created</p>
                        <p style="font-size: 0.9rem; opacity: 0.8;">Create a new test to get started.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    userTests.forEach(test => {
        const formattedDate = test.date ? new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
        const participants = participantMap[test.id] || 0;
        const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : (test.questions || []);
        const row = `
            <tr data-id="${test.id}">
                <td>
                    <div style="font-weight: 600; color: #fff;">${test.name}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px;">${questions.length} Questions · ${test.duration || '-'} min</div>
                </td>
                <td>${test.company}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge ${test.status}">${test.status.toUpperCase()}</span></td>
                <td class="actions-cell">
                    <button class="action-btn view" onclick="viewTestAnalytics(${test.id})" title="View Analytics Dashboard" style="color: #60a5fa; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 8px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;">
                            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                    </button>
                    <button class="action-btn delete" onclick="triggerSTMAIDelete(${test.id}, '${test.name.replace(/'/g, "\\'")}')" title="Delete Test">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function deleteTest(id, name) {
    const modalId = 'global-delete-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'logout-modal-overlay active';
    modal.innerHTML = `
        <div class="logout-modal" style="border-top: 4px solid #ef4444;">
            <div class="logout-modal-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;">
                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6"/>
                </svg>
            </div>
            <h3 class="logout-modal-title">Delete Assessment?</h3>
            <p class="logout-modal-text">Are you sure you want to delete this test? This action will permanently remove all associated data and results.</p>
            <div class="logout-modal-actions">
                <button type="button" class="logout-modal-btn cancel" onclick="this.closest('.logout-modal-overlay').remove()">Cancel</button>
                <button type="button" class="logout-modal-btn confirm" style="background: #ef4444;" id="global-confirm-delete-btn">
                    Confirm Delete
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('global-confirm-delete-btn').onclick = async () => {
        const btn = document.getElementById('global-confirm-delete-btn');
        btn.disabled = true;
        btn.textContent = 'Deleting...';

        try {
            await window.DB.deleteTest(id);
            modal.remove();
            showNotification('Deleted', 'Achievement/Assessment purged successfully.', 'success');
            loadTests();
        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.textContent = 'Confirm Delete';
            showNotification('Error', 'Deletion failed: ' + err.message, 'error');
        }
    };
}


// ========== STUDENTS MANAGEMENT ==========
function initStudentsManagement() {
    loadStudents();

    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => filterStudents());
    }

    const departmentFilter = document.getElementById('departmentFilter');
    const classFilter = document.getElementById('classFilter');
    const yearFilter = document.getElementById('yearFilter');
    const batchFilter = document.getElementById('batchFilter');

    if (departmentFilter) departmentFilter.addEventListener('change', () => filterStudents());
    if (classFilter) classFilter.addEventListener('change', () => filterStudents());
    if (yearFilter) yearFilter.addEventListener('change', () => filterStudents());
    if (batchFilter) batchFilter.addEventListener('change', () => filterStudents());
}

async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    const students = window.DB ? await window.DB.getStudents() : [];

    document.getElementById('totalStudents').textContent = students.length;
    const depts = new Set(students.map(s => {
        const details = typeof s.details === 'string' ? JSON.parse(s.details) : (s.details || {});
        return s.department || details.department;
    }).filter(Boolean));

    document.getElementById('totalDepartments').textContent = depts.size;
    document.getElementById('activeStudents').textContent = students.length;

    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87" />
                            <path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                        <p style="font-size: 1.1rem; font-weight: 500;">No Students Found</p>
                        <p style="font-size: 0.9rem; opacity: 0.8;">No students have registered yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const allResults = window.DB ? await window.DB.getAllResults() : [];

    students.forEach(student => {
        const details = typeof student.details === 'string' ? JSON.parse(student.details) : (student.details || {});
        const studentResults = allResults.filter(r => r.username === student.username);

        const row = `
            <tr data-student-id="${student.username}">
                <td>${details.registerNumber || student.username}</td>
                <td>${student.name || '-'}</td>
                <td>${student.department || details.department || '-'}</td>
                <td>${details.year || '-'}</td>
                <td>${details.section || '-'}</td>
                <td>${details.batch || '-'}</td>
                <td>${details.streamType || '-'}</td>
                <td><span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 500; color: ${studentResults.length > 0 ? '#10b981' : 'var(--gray-500)'};">${studentResults.length}</span></td>
                <td class="actions-cell">
                    <button class="action-btn view" onclick="lookupStudent('${student.username}')" title="View Details" style="color: var(--blue-400); background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 6px; padding: 6px; cursor: pointer;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="action-btn delete" onclick="deleteStudent('${student.username}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function filterStudents() {
    const searchValue = document.getElementById('studentSearch')?.value.toLowerCase() || '';
    const departmentValue = document.getElementById('departmentFilter')?.value || '';
    const yearValue = document.getElementById('yearFilter')?.value || '';
    const batchValue = document.getElementById('batchFilter')?.value || '';

    const rows = document.querySelectorAll('#studentsTableBody tr');

    rows.forEach(row => {
        const registerNo = row.cells[0]?.textContent.toLowerCase() || '';
        const name = row.cells[1]?.textContent.toLowerCase() || '';
        const department = row.cells[2]?.textContent || '';
        const year = row.cells[3]?.textContent || '';
        const batch = row.cells[5]?.textContent || '';

        const matchesSearch = registerNo.includes(searchValue) || name.includes(searchValue);
        const matchesDepartment = !departmentValue || department === departmentValue;
        const matchesYear = !yearValue || year === yearValue;
        const matchesBatch = !batchValue || batch === batchValue;

        row.style.display = matchesSearch && matchesDepartment && matchesYear && matchesBatch ? '' : 'none';
    });
}

// ========== STUDENT LOOKUP (Point 8) ==========
function initStudentLookup() {
    const searchBtn = document.getElementById('studentLookupBtn');
    const searchInput = document.getElementById('studentLookupInput');
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', () => {
        const regNo = searchInput.value.trim();
        if (regNo) lookupStudent(regNo);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const regNo = searchInput.value.trim();
            if (regNo) lookupStudent(regNo);
        }
    });
}

async function lookupStudent(usernameOrRegNo) {
    // Navigate to Student Lookup section
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('student-lookup-section')?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const lookupNav = document.querySelector('[data-section="student-lookup"]');
    if (lookupNav) lookupNav.classList.add('active');

    const sectionTitle = document.getElementById('sectionTitle');
    if (sectionTitle) sectionTitle.textContent = 'Student Profile';

    // Populate search field
    const searchInput = document.getElementById('studentLookupInput');
    if (searchInput) searchInput.value = usernameOrRegNo;

    const container = document.getElementById('studentLookupResult');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400);"><div class="spinner" style="margin:0 auto 1rem;"></div>Looking up student...</div>';

    try {
        const students = window.DB ? await window.DB.getStudents() : [];
        const allResults = window.DB ? await window.DB.getAllResults() : [];
        const tests = window.DB ? await window.DB.getAllTests() : [];

        // Find matching student
        const student = students.find(s => {
            const d = typeof s.details === 'string' ? JSON.parse(s.details) : (s.details || {});
            return s.username === usernameOrRegNo || d.registerNumber === usernameOrRegNo || (s.name && s.name.toLowerCase() === usernameOrRegNo.toLowerCase());
        });

        if (!student) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;color:var(--gray-500);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.5;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <p style="font-size:1.1rem;font-weight:500;">No Student Found</p>
                    <p style="font-size:0.9rem;opacity:0.8;">No student matches "${usernameOrRegNo}". Please check the register number.</p>
                </div>`;
            return;
        }

        const details = typeof student.details === 'string' ? JSON.parse(student.details) : (student.details || {});
        const studentResults = allResults.filter(r => r.username === student.username);

        // Calculate stats
        const totalTests = studentResults.length;
        const passedTests = studentResults.filter(r => r.status === 'passed' || r.score >= 50).length;
        const failedTests = totalTests - passedTests;
        const avgScore = totalTests > 0 ? Math.round(studentResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalTests) : 0;
        const highestScore = totalTests > 0 ? Math.max(...studentResults.map(r => r.score || 0)) : 0;

        container.innerHTML = `
            <div class="lookup-profile-card" style="animation: fadeInUp 0.4s ease;">
                <!-- Student Info Header -->
                <div style="display:flex;align-items:center;gap:1.5rem;padding:1.5rem;background:rgba(255,255,255,0.03);border-radius:1rem;border:1px solid rgba(255,255,255,0.08);margin-bottom:1.5rem;">
                    <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:white;flex-shrink:0;">
                        ${(student.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div style="flex:1;">
                        <h3 style="margin:0;font-size:1.25rem;font-weight:600;">${student.name || 'N/A'}</h3>
                        <p style="margin:0.25rem 0 0;color:var(--gray-400);font-size:0.9rem;">${details.registerNumber || student.username}</p>
                    </div>
                    <div style="text-align:right;color:var(--gray-400);font-size:0.85rem;">
                        <div>${details.department || '-'}</div>
                        <div>Year ${details.year || '-'} · Section ${details.section || '-'}</div>
                        <div>Batch ${details.batch || '-'}</div>
                    </div>
                </div>

                <!-- Stats -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;">
                    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:0.75rem;padding:1rem;text-align:center;">
                        <div style="font-size:1.75rem;font-weight:700;color:#3b82f6;">${totalTests}</div>
                        <div style="font-size:0.8rem;color:var(--gray-400);margin-top:4px;">Tests Taken</div>
                    </div>
                    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:0.75rem;padding:1rem;text-align:center;">
                        <div style="font-size:1.75rem;font-weight:700;color:#10b981;">${passedTests}</div>
                        <div style="font-size:0.8rem;color:var(--gray-400);margin-top:4px;">Passed</div>
                    </div>
                    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:0.75rem;padding:1rem;text-align:center;">
                        <div style="font-size:1.75rem;font-weight:700;color:#ef4444;">${failedTests}</div>
                        <div style="font-size:0.8rem;color:var(--gray-400);margin-top:4px;">Failed</div>
                    </div>
                    <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:0.75rem;padding:1rem;text-align:center;">
                        <div style="font-size:1.75rem;font-weight:700;color:#8b5cf6;">${avgScore}%</div>
                        <div style="font-size:0.8rem;color:var(--gray-400);margin-top:4px;">Avg Score</div>
                    </div>
                    <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:0.75rem;padding:1rem;text-align:center;">
                        <div style="font-size:1.75rem;font-weight:700;color:#f59e0b;">${highestScore}%</div>
                        <div style="font-size:0.8rem;color:var(--gray-400);margin-top:4px;">Highest Score</div>
                    </div>
                </div>

                <!-- Test Results Table -->
                <div style="background:rgba(255,255,255,0.03);border-radius:0.75rem;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
                    <div style="padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.08);font-weight:600;display:flex;align-items:center;gap:0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;opacity:0.7;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                        Test History
                    </div>
                    ${totalTests === 0 ? `
                        <div style="text-align:center;padding:2rem;color:var(--gray-500);">
                            <p>This student has not taken any tests yet.</p>
                        </div>
                    ` : `
                        <table class="data-table" style="margin:0;">
                            <thead>
                                <tr>
                                    <th>Test Name</th>
                                    <th>Company</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${studentResults.map(r => {
            const testInfo = tests.find(t => String(t.id) === String(r.testId));
            return `
                                        <tr>
                                            <td>${r.testName || (testInfo ? testInfo.name : '-')}</td>
                                            <td>${r.company || (testInfo ? testInfo.company : '-')}</td>
                                            <td style="font-weight:600;color:${r.score >= 50 ? '#10b981' : '#ef4444'};">${r.score}%</td>
                                            <td><span class="status-badge ${r.status === 'passed' ? 'active' : 'inactive'}">${r.status ? r.status.toUpperCase() : '-'}</span></td>
                                            <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                                        </tr>`;
        }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>`;
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading student data: ${err.message}</div>`;
    }
}



// ========== STMAI ENGINE (SmartFlow Test Management & Analytics Interface) ==========

let currentSTMAITestId = null;

async function viewTestAnalytics(testId) {
    currentSTMAITestId = testId;
    const listView = document.getElementById('stmai-list-view');
    const detailView = document.getElementById('stmai-detail-view');

    if (!listView || !detailView) return;

    // Transition: Hide list, show detail
    listView.style.display = 'none';
    detailView.style.display = 'block';
    detailView.classList.add('fade-in');

    // Reset Tabs
    switchSTMAITab('overview');

    try {
        const tests = await window.DB.getAllTests();
        const test = tests.find(t => String(t.id) === String(testId));
        if (!test) throw new Error('Test not found');

        // Populate Header
        document.getElementById('stmai-test-name').textContent = test.name;
        document.getElementById('stmai-test-company').textContent = test.company || 'Internal Assessment';

        const badge = document.getElementById('stmai-test-status-badge');
        badge.innerHTML = `<span class="status-badge ${test.status}">${test.status.toUpperCase()}</span>`;

        // Populate Overview Tab (Basic info)
        const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : (test.questions || []);
        document.getElementById('stmai-ov-questions').textContent = questions.length + ' Questions';
        document.getElementById('stmai-ov-duration').textContent = (test.duration || '0') + ' Minutes';
        document.getElementById('stmai-ov-date').textContent = new Date(test.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // Fetch Participation Data (Triggering Sync)
        loadSTMAIParticipation(testId);

    } catch (err) {
        console.error('[STMAI] Participation Sync Error:', err);
        const tbody = document.getElementById('stmai-analytics-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:#ef4444;">Unable to load student data. Please try again.</td></tr>';
    }
}

async function loadSTMAIParticipation(testId) {
    const tableBody = document.getElementById('stmai-analytics-tbody');
    const overviewStats = document.getElementById('stmai-overview-stats');
    const attBadge = document.getElementById('stmai-attendance-badge');

    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;"><div class="spinner-sm" style="margin: 0 auto 1rem;"></div> Synchronizing Results...</td></tr>';

    try {
        const report = await window.DB.getTestParticipation(testId);

        const total = report.length;
        const attendedReport = report.filter(s => s.attended);
        const attended = attendedReport.length;
        const notAttended = total - attended;

        // Render Stats in Overview Tab (Cleaner & Professional)
        if (overviewStats) {
            overviewStats.innerHTML = `
                <div class="stat-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); text-align: center;">
                    <div class="stat-value" style="color: #60a5fa; font-size: 2rem;">${total}</div>
                    <div class="stat-label">Total Assigned</div>
                </div>
                <div class="stat-card" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.1); text-align: center;">
                    <div class="stat-value" style="color: #10b981; font-size: 2rem;">${attended}</div>
                    <div class="stat-label">Students Attempted</div>
                </div>
                <div class="stat-card" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); text-align: center;">
                    <div class="stat-value" style="color: #ef4444; font-size: 2rem;">${notAttended}</div>
                    <div class="stat-label">Not Attempted</div>
                </div>
            `;
        }

        if (attBadge) attBadge.textContent = `${attended} / ${total} Completed`;

        // Render Participation Table
        if (report.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:3rem;color:var(--gray-500);"><div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>No students assigned to this assessment pipeline.</td></tr>';
            return;
        }

        if (attended === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:4rem;color:var(--gray-500);"><div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>No students have attended this test yet.<br><span style="font-size: 0.8rem; margin-top: 10px; display: block;">Participation data will appear here once the first submission is received.</span></td></tr>';
            // We should still show the list if requested, but as per prompt "it should display 'No students have attended yet'"
            // I'll stick to the specific message for now as a primary view.
            return;
        }

        tableBody.innerHTML = report.map(s => {
            const isFinished = s.assignmentStatus === 'submitted' || s.status === 'PASSED' || s.status === 'FAILED' || s.status === 'QUALIFIED' || s.status === 'NOT QUALIFIED';

            return `
            <tr>
                <td>
                    <div style="font-weight:700; color: #f1f5f9;">${s.name}</div>
                    <div style="font-size:0.75rem; color:var(--blue-400); font-weight: 500;">Reg No: ${s.registerNumber}</div>
                </td>
                <td>
                    <span class="badge" style="background: ${s.attended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${s.attended ? '#10b981' : '#ef4444'}; font-weight: 800; font-size: 0.7rem; border-radius: 4px; padding: 4px 8px; letter-spacing: 0.05em;">
                        ${s.status}
                    </span>
                    <div style="font-size: 0.65rem; color: var(--gray-500); margin-top: 4px; padding-left: 2px;">${s.department} • ${s.section}</div>
                </td>
                <td style="font-weight:800; font-size: 1.1rem; color: ${s.attended ? (s.score >= 50 ? '#10b981' : '#ef4444') : 'var(--gray-600)'};">
                    ${s.attended ? `
                        <div style="display:flex; flex-direction:column; align-items:flex-start;">
                            <span>${s.score !== null ? s.score + '%' : '--'}</span>
                            <span style="font-size: 0.65rem; color: ${s.score >= 50 ? '#10b981' : '#ef4444'}; opacity: 0.8; font-weight: 700;">
                                ${s.assignmentStatus.toUpperCase()}
                            </span>
                        </div>
                    ` : '<span style="font-size: 0.8rem; color: var(--gray-600); font-weight: 400;">NOT STARTED</span>'}
                </td>
                <td>
                    ${s.assignmentStatus === 'submitted' || !!s.score || s.score === 0 ? `
                        <button class="btn btn-sm btn-ghost" onclick="inspectSTMAIStudent('${s.username}')" style="border: 1px solid rgba(255,255,255,0.1); font-weight: 600;">
                            View Details
                        </button>
                    ` : '<span style="color:var(--gray-600); font-size:0.8rem;">Waiting...</span>'}
                </td>
            </tr>
        `;
        }).join('');

    } catch (err) {
        console.error('[STMAI] Sync Failure:', err);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;padding:3.5rem;">
                        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🛰️</div>
                        <div style="color:#ef4444; font-weight:700; font-size: 1.1rem; margin-bottom: 0.5rem;">Sync Engine Interrupted</div>
                        <div style="color:var(--gray-400); font-size: 0.85rem; max-width: 300px; margin: 0 auto;">Unable to synchronize real-time student participation data. Please check your network or server status.</div>
                        <button class="btn btn-sm btn-primary" style="margin-top: 1.5rem;" onclick="loadSTMAIParticipation('${testId}')">Retry Sync</button>
                    </td>
                </tr>
            `;
        }
    }
}

function switchSTMAITab(tabName) {
    // Buttons
    document.querySelectorAll('.stmai-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-stmai-tab') === tabName);
    });

    // Content
    document.querySelectorAll('.stmai-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `stmai-tab-${tabName}`);
    });
}

function closeSTMAIDetails() {
    currentSTMAITestId = null;
    document.getElementById('stmai-list-view').style.display = 'block';
    document.getElementById('stmai-detail-view').style.display = 'none';
    loadTests();
}

async function inspectSTMAIStudent(username) {
    // Switch to results tab
    switchSTMAITab('results');

    const placeholder = document.getElementById('stmai-results-placeholder');
    const reportView = document.getElementById('stmai-detailed-report-view');

    placeholder.style.display = 'none';
    reportView.style.display = 'block';
    reportView.innerHTML = '<div style="text-align:center;padding:3rem;"><div class="spinner-sm" style="margin: 0 auto;"></div> Loading Report...</div>';

    try {
        const results = await window.DB.getAllResults();
        const studentResult = results.find(r => r.username === username && String(r.testId) === String(currentSTMAITestId));

        if (!studentResult) throw new Error('Result details not found');

        const answers = typeof studentResult.answers === 'string' ? JSON.parse(studentResult.answers) : (studentResult.answers || {});
        const questions = typeof studentResult.questions === 'string' ? JSON.parse(studentResult.questions) : (studentResult.questions || []);

        reportView.innerHTML = `
            <div class="form-card" style="background: rgba(255,255,255,0.02); margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <div>
                        <h4 style="margin:0;">Performance Breakdown: ${studentResult.name || username}</h4>
                        <div style="font-size:0.85rem; color:var(--gray-500); margin-top:4px;">Recorded on ${new Date(studentResult.date).toLocaleString()}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.5rem; font-weight:800; color: ${studentResult.score >= 50 ? '#10b981' : '#ef4444'};">${studentResult.score}%</div>
                        <div style="font-size:0.75rem; color:var(--gray-500); font-weight:600;">QUALIFIED</div>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap: 1rem;">
                    ${questions.map((q, idx) => {
            const studentChoice = answers[idx];
            const isCorrect = studentChoice === q.answer;
            return `
                        <div style="padding: 1.25rem; background: rgba(0,0,0,0.2); border-radius: 10px; border-left: 4px solid ${isCorrect ? '#10b981' : '#ef4444'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div style="font-weight:500;">Q${idx + 1}: ${q.question}</div>
                                <div style="font-weight: 800; font-size: 0.75rem; color: ${isCorrect ? '#10b981' : '#ef4444'}; text-transform: uppercase;">
                                    ${isCorrect ? '✅ Correct' : '❌ Wrong'}
                                </div>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                                <div><span style="color:var(--gray-500);">Student Answer:</span> <strong style="color: ${isCorrect ? '#10b981' : '#ef4444'}">${studentChoice || 'None'}</strong></div>
                                <div><span style="color:var(--gray-500);">Correct Answer:</span> <strong style="color: #10b981;">${q.answer}</strong></div>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="window.PDFEngine.downloadSingleReport('${username}', '${currentSTMAITestId}')">
                Download PDF Report
            </button>
        `;

    } catch (err) {
        reportView.innerHTML = `<div style="padding:2rem; color:#ef4444; text-align:center;">Failed to load report: ${err.message}</div>`;
    }
}

// ========== SECURE DELETE SYSTEM (SASTME) ==========
async function triggerSTMAIDelete(testId, testName) {
    if (!testId) return;

    // Use the professional logout-style modal pattern for consistency
    const modalId = 'stmai-delete-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'logout-modal-overlay active';
    modal.innerHTML = `
        <div class="logout-modal" style="border-top: 4px solid #ef4444;">
            <div class="logout-modal-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;">
                    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6"/>
                </svg>
            </div>
            <h3 class="logout-modal-title">Confirm Deletion</h3>
            <p class="logout-modal-text">Are you sure you want to delete this test? All student participation data for "${testName}" will be permanently removed.</p>
            <div class="logout-modal-actions">
                <button type="button" class="logout-modal-btn cancel" onclick="this.closest('.logout-modal-overlay').remove()">Cancel</button>
                <button type="button" class="logout-modal-btn confirm" style="background: #ef4444;" id="stmai-confirm-delete-btn">
                    Confirm Deletion
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('stmai-confirm-delete-btn').onclick = async () => {
        const btn = document.getElementById('stmai-confirm-delete-btn');
        btn.disabled = true;
        btn.textContent = 'Purging...';

        try {
            await window.DB.deleteTest(testId);
            modal.remove();
            showNotification('Test Purged', 'Assessment removed from SmartFlow systems.', 'success');
            closeSTMAIDetails(); // Return to list view
        } catch (err) {
            console.error('Delete failed:', err);
            btn.disabled = false;
            btn.textContent = 'Confirm Deletion';
            showNotification('Error', 'Purge failed: ' + err.message, 'error');
        }
    };
}

// Initialized via onclick in HTML
document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('#stmai-delete-test-trigger');
    if (!trigger) return;

    const testName = document.getElementById('stmai-test-name').textContent;
    triggerSTMAIDelete(currentSTMAITestId, testName);
});

window.inspectSTMAIStudent = inspectSTMAIStudent;
window.switchSTMAITab = switchSTMAITab;
window.closeSTMAIDetails = closeSTMAIDetails;
window.viewTestAnalytics = viewTestAnalytics;
window.loadSTMAIParticipation = loadSTMAIParticipation;



// ========== NOTIFICATION SYSTEM ==========
function showNotification(title, message, type = 'info') {
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
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
                <div style="font-size: 0.875rem; opacity: 0.9;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.25rem; padding: 0; opacity: 0.7;">×</button>
        </div>
    `;

    document.body.appendChild(notification);

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
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

async function deleteStudent(username) {
    if (!confirm('Are you sure you want to delete this student? This will also remove their test results.')) return;

    try {
        if (window.DB) {
            await window.DB.deleteStudent(username);
            document.querySelector(`tr[data-student-id="${username}"]`)?.remove();
            showNotification('Deleted', 'Student removed successfully.', 'success');
            loadStudents();
        }
    } catch (err) {
        console.error(err);
        showNotification('Error', 'Failed to delete student: ' + err.message, 'error');
    }
}

// ========== GLOBAL ACCESS ==========
window.deleteStudent = deleteStudent;
window.deleteTest = deleteTest;
window.viewTestAnalytics = viewTestAnalytics;
window.showNotification = showNotification;
window.lookupStudent = lookupStudent;

// ========== AI QUESTION GENERATOR ==========
function initAiGenerator() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('aiFileInput');
    const extractionProgress = document.getElementById('extractionProgress');
    const processingState = document.getElementById('processingState');
    const processingTitle = document.getElementById('processingTitle');
    const processingSubtitle = document.getElementById('processingSubtitle');
    const extractionResults = document.getElementById('extractionResults');
    const resultsList = document.getElementById('extractedQuestionsList');
    const finalizeBtn = document.getElementById('finalizeExtractionBtn');
    const reUploadBtn = document.getElementById('reUploadBtn');
    const extractionSummary = document.getElementById('extractionSummary');

    if (!uploadZone || !fileInput) return;

    // Click handler (skip if clicking the button or input inside)
    uploadZone.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        fileInput.click();
    });

    // Drag and Drop handlers
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Re-upload button
    if (reUploadBtn) {
        reUploadBtn.addEventListener('click', () => {
            resetToUpload();
            fileInput.value = '';
            fileInput.click();
        });
    }

    function resetToUpload() {
        uploadZone.style.display = 'block';
        processingState.style.display = 'none';
        extractionResults.style.display = 'none';
        resultsList.innerHTML = '';
    }

    // ============================================================
    //  FILE UPLOAD HANDLER
    // ============================================================
    async function handleFileUpload(file) {
        // Validate file type
        if (!file.name.match(/\.docx$/i)) {
            showNotification('Invalid File', 'Please upload a Word document (.docx) file.', 'error');
            return;
        }

        // Validate file size (10 MB max)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File Too Large', 'Maximum file size is 10MB.', 'error');
            return;
        }

        // Switch to processing state
        uploadZone.style.display = 'none';
        processingState.style.display = 'block';
        extractionProgress.style.width = '0%';
        processingTitle.textContent = 'Reading Document...';
        processingSubtitle.textContent = 'Extracting text content from your Word file.';

        try {
            // Step 1: Read file as ArrayBuffer
            extractionProgress.style.width = '15%';
            const arrayBuffer = await readFileAsArrayBuffer(file);

            // Step 2: Convert DOCX to raw text via mammoth
            extractionProgress.style.width = '40%';
            processingTitle.textContent = 'Parsing Document...';
            processingSubtitle.textContent = 'Converting Word content to text.';

            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const rawText = result.value;

            if (!rawText || rawText.trim().length === 0) {
                throw new Error('The document appears to be empty or could not be read.');
            }

            // Step 3: Parse MCQ questions from text
            extractionProgress.style.width = '70%';
            processingTitle.textContent = 'Extracting Questions...';
            processingSubtitle.textContent = 'Scanning for MCQ patterns in the document.';

            // Small delay so user sees the transition
            await delay(300);

            const questions = parseMCQsFromText(rawText);

            // Step 4: Show results
            extractionProgress.style.width = '100%';
            processingTitle.textContent = 'Extraction Complete!';

            await delay(400);

            if (questions.length === 0) {
                processingState.style.display = 'none';
                uploadZone.style.display = 'block';
                showNotification('No Questions Found',
                    'Could not find MCQ-style questions in this document. Ensure questions are numbered (1. / Q1.) with options labeled A–D.',
                    'error');
                return;
            }

            processingState.style.display = 'none';
            extractionResults.style.display = 'block';
            renderExtractedQuestions(questions);

            const summary = `Extracted from "${file.name}" • Review and edit below before creating quiz`;
            if (extractionSummary) extractionSummary.textContent = summary;

            showNotification('Extraction Complete',
                `Found exactly ${questions.length} question${questions.length > 1 ? 's' : ''} in ${file.name}`,
                'success');

        } catch (err) {
            console.error('[AI Generator] Extraction error:', err);
            processingState.style.display = 'none';
            uploadZone.style.display = 'block';
            showNotification('Extraction Failed', err.message || 'An error occurred while processing the file.', 'error');
        }
    }

    // ============================================================
    //  DOCX → MCQ PARSER  (handles many common formats)
    // ============================================================
    function parseMCQsFromText(text) {
        const questions = [];

        // Normalize line breaks and whitespace
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
            .map(l => l.trim()).filter(l => l.length > 0);

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Try to detect a question line:
            // Patterns: "1. Question?" / "1) Question?" / "Q1. Question?" / "Q.1 Question?"
            //           "Question 1:" / just numbered like "1 Question"
            const qMatch = line.match(/^(?:Q\.?\s*)?(\d+)[.):\s]+\s*(.+)/i) ||
                line.match(/^Question\s+(\d+)[.:)]\s*(.+)/i);

            if (qMatch) {
                let questionText = qMatch[2].trim();
                i++;

                // Collect continuation lines (question text may span multiple lines)
                while (i < lines.length && !isOptionLine(lines[i]) && !isQuestionLine(lines[i]) && !isAnswerLine(lines[i])) {
                    questionText += ' ' + lines[i];
                    i++;
                }

                // Collect options A–D (or more)
                const options = [];
                const optionLetters = [];
                while (i < lines.length && isOptionLine(lines[i])) {
                    const optMatch = parseOptionLine(lines[i]);
                    if (optMatch) {
                        optionLetters.push(optMatch.letter.toUpperCase());
                        let optText = optMatch.text;
                        i++;
                        // Option text may span multiple lines
                        while (i < lines.length && !isOptionLine(lines[i]) && !isQuestionLine(lines[i]) && !isAnswerLine(lines[i])) {
                            optText += ' ' + lines[i];
                            i++;
                        }
                        options.push(optText.trim());
                    } else {
                        break;
                    }
                }

                // Try to find answer line
                let answer = '';
                if (i < lines.length && isAnswerLine(lines[i])) {
                    answer = parseAnswerLine(lines[i], optionLetters);
                    i++;
                }

                // Only add if we have enough data (at least question + 2 options)
                if (questionText.length > 0 && options.length >= 2) {
                    // Pad to 4 options if fewer
                    while (options.length < 4) {
                        options.push('');
                    }
                    // Default answer to A if not found
                    if (!answer) answer = 'A';

                    questions.push({
                        question: questionText.trim(),
                        options: options.slice(0, 4),  // cap at 4
                        answer: answer
                    });
                }
            } else {
                i++;
            }
        }

        return questions;
    }

    function isQuestionLine(line) {
        return /^(?:Q\.?\s*)?(\d+)[.):\s]+\s*.+/i.test(line) ||
            /^Question\s+\d+/i.test(line);
    }

    function isOptionLine(line) {
        return /^\s*[A-Da-d][.):\s]/i.test(line) ||
            /^\(?[A-Da-d]\)\s/i.test(line);
    }

    function parseOptionLine(line) {
        // Matches: "A. text" / "a) text" / "(A) text" / "A: text" / "A text"
        const m = line.match(/^\(?([A-Da-d])[.):\s]\)?\s*(.+)/i);
        if (m) {
            return { letter: m[1], text: m[2] };
        }
        return null;
    }

    function isAnswerLine(line) {
        return /^\s*(Answer|Ans|Correct\s*(Answer|Option)?|Key)\s*[.:)\-]\s*/i.test(line);
    }

    function parseAnswerLine(line, validLetters) {
        // Try to extract a letter: "Answer: B" / "Ans: (C)" / "Correct Answer: Option A"
        const m = line.match(/[.:)\-]\s*\(?([A-Da-d])\)?/i);
        if (m) {
            return m[1].toUpperCase();
        }
        // Try to match option text
        const textMatch = line.match(/[.:)\-]\s*(.+)/i);
        if (textMatch) {
            const ansText = textMatch[1].trim().toLowerCase();
            // Check if it mentions a letter
            for (const letter of ['a', 'b', 'c', 'd']) {
                if (ansText === letter || ansText === `option ${letter}`) {
                    return letter.toUpperCase();
                }
            }
        }
        return validLetters.length > 0 ? validLetters[0] : 'A';
    }

    // ============================================================
    //  RENDER EXTRACTED QUESTIONS (with delete per item)
    // ============================================================
    function renderExtractedQuestions(questions) {
        updateExtractedCount();
        resultsList.innerHTML = '';

        questions.forEach((q, i) => {
            const item = document.createElement('div');
            item.className = 'extracted-item bounce-in';
            // Escape HTML in question/option values
            const escQ = escapeHtml(q.question);
            const escOpts = q.options.map(o => escapeHtml(o));

            item.innerHTML = `
                <div class="extracted-q-header">
                    <span class="q-number">${i + 1}</span>
                    <input type="text" class="q-input" value="${escQ}" placeholder="Question text">
                    <button class="btn-icon delete-extracted-btn" title="Remove this question">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
                <div class="options-grid">
                    ${['A', 'B', 'C', 'D'].map((letter, idx) => `
                        <div class="option-edit-group">
                            <span class="option-letter">${letter}</span>
                            <input type="text" class="q-input" value="${escOpts[idx] || ''}" placeholder="Option ${letter}">
                        </div>
                    `).join('')}
                </div>
                <div class="answer-select-container">
                    <span style="color: var(--gray-400); font-size: 0.9rem;">Correct Answer:</span>
                    <select class="q-answer-select">
                        <option value="A" ${q.answer === 'A' ? 'selected' : ''}>Option A</option>
                        <option value="B" ${q.answer === 'B' ? 'selected' : ''}>Option B</option>
                        <option value="C" ${q.answer === 'C' ? 'selected' : ''}>Option C</option>
                        <option value="D" ${q.answer === 'D' ? 'selected' : ''}>Option D</option>
                    </select>
                </div>
            `;
            resultsList.appendChild(item);
        });

        // Bind delete buttons
        resultsList.querySelectorAll('.delete-extracted-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const item = this.closest('.extracted-item');
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'translateX(40px)';
                setTimeout(() => {
                    item.remove();
                    renumberExtracted();
                    updateExtractedCount();
                }, 300);
            });
        });

        updateExtractedCount();
    }

    function renumberExtracted() {
        resultsList.querySelectorAll('.extracted-item').forEach((item, idx) => {
            const numSpan = item.querySelector('.q-number');
            if (numSpan) numSpan.textContent = idx + 1;
        });
    }

    function updateExtractedCount() {
        const count = resultsList.querySelectorAll('.extracted-item').length;
        document.getElementById('extractedCount').textContent = count;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML.replace(/"/g, '&quot;');
    }

    // ============================================================
    //  FINALIZE → IMPORT INTO QUIZ BUILDER
    // ============================================================
    finalizeBtn.addEventListener('click', () => {
        const items = resultsList.querySelectorAll('.extracted-item');
        const finalQuestions = [];

        items.forEach(item => {
            const questionText = item.querySelector('.q-input').value.trim();
            const options = Array.from(item.querySelectorAll('.options-grid .q-input')).map(input => input.value.trim());
            const answer = item.querySelector('.q-answer-select').value;

            // Skip if question text is empty
            if (!questionText) return;

            finalQuestions.push({
                type: 'mcq',
                question: questionText,
                options: options,
                answer: answer
            });
        });

        if (finalQuestions.length === 0) {
            showNotification('No Questions', 'There are no valid questions to import.', 'error');
            return;
        }

        switchToCreateTestWithQuestions(finalQuestions);
    });

    function switchToCreateTestWithQuestions(questions) {
        // 1. Activate Create Test UI
        const createLink = document.querySelector('[data-section="create-test"]');
        if (createLink) createLink.click();

        // 2. Clear then Populate Questions Container
        const container = document.getElementById('questionsContainer');
        if (container) {
            container.innerHTML = '';
            questions.forEach((q, i) => {
                const count = i + 1;
                const html = `
                    <div class="question-item bounce-in" data-question="${count}">
                        <div class="question-header">
                            <span class="question-number">Question ${count}</span>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <select class="form-input type-selector" style="display: none;">
                                    <option value="mcq">MCQ</option>
                                </select>
                                <button type="button" class="remove-question-btn" title="Remove Question">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </div>
                        <div class="question-body">
                            <div class="form-group">
                                <label class="form-label">Question Text *</label>
                                <textarea class="form-input" rows="2" placeholder="Enter your question...">${escapeHtml(q.question)}</textarea>
                            </div>
                            <div class="mcq-options">
                                <div class="options-grid">
                                    ${q.options.map((opt, j) => `
                                        <div class="option-group"><input type="text" class="form-input" placeholder="Option ${String.fromCharCode(65 + j)}" value="${escapeHtml(opt)}"></div>
                                    `).join('')}
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Correct Option</label>
                                    <select class="form-input mcq-answer">
                                        <option value="A" ${q.answer === 'A' ? 'selected' : ''}>Option A</option>
                                        <option value="B" ${q.answer === 'B' ? 'selected' : ''}>Option B</option>
                                        <option value="C" ${q.answer === 'C' ? 'selected' : ''}>Option C</option>
                                        <option value="D" ${q.answer === 'D' ? 'selected' : ''}>Option D</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', html);
            });

            // Re-bind remove buttons
            container.querySelectorAll('.remove-question-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    if (container.children.length > 1) {
                        this.closest('.question-item').remove();
                        updateQuestionNumbers();
                    }
                });
            });
        }

        showNotification('Questions Imported',
            `Successfully imported ${questions.length} question${questions.length > 1 ? 's' : ''} into the quiz builder.`,
            'info');

        // Reset AI Gen Section for next time
        resetToUpload();
    }

    // ============================================================
    //  UTILITIES
    // ============================================================
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsArrayBuffer(file);
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
