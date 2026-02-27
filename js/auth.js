// Authentication JavaScript

// Helper to format date YYYY-MM-DD to DDMMYYYY
function formatDobToPassword(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}${parts[1]}${parts[0]}`;
}

// Login form handling
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        let password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        const btn = document.getElementById('loginBtn');
        const alertBox = document.getElementById('authAlert');

        // For students, convert the date input value to DDMMYYYY
        if (userType === 'student') {
            password = formatDobToPassword(password);
        }

        // Reset errors
        clearErrors();

        // Validate
        let valid = true;
        if (!username) { showError('username', 'Username is required'); valid = false; }
        if (!password) { showError('password', 'Password is required'); valid = false; }

        if (!valid) return;

        // Show loading
        btn.disabled = true;
        if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Signing in...';
        if (btn.querySelector('.spinner')) btn.querySelector('.spinner').style.display = 'block';

        if (alertBox) alertBox.style.display = 'none';

        try {
            // CALL BACKEND API
            const user = await window.DB.authenticate(username, password, userType);

            if (user) {
                // Normalize and clean user object
                const { password: _, ...safeUser } = user;
                if (!safeUser.name && safeUser.fullName) safeUser.name = safeUser.fullName;
                safeUser.type = userType; // Ensure type is present

                // Store session
                if (rememberMe) {
                    localStorage.setItem('user', JSON.stringify(safeUser));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(safeUser));
                }

                // Show success
                if (alertBox) {
                    alertBox.className = 'auth-alert success';
                    alertBox.style.display = 'block';
                    alertBox.textContent = 'Login successful! Redirecting...';
                }

                // Redirect
                setTimeout(() => {
                    const target = safeUser.type === 'student' ? 'student-dashboard.html' : 'staff-dashboard.html';
                    window.location.replace(target);
                }, 1000);
            } else {
                throw new Error('Invalid username or password');
            }
        } catch (error) {
            console.error(error);
            if (alertBox) {
                alertBox.className = 'auth-alert error';
                alertBox.style.display = 'block';
                alertBox.textContent = error.message || 'Login failed. Please try again.';
            }
            btn.disabled = false;
            if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Sign In';
            if (btn.querySelector('.spinner')) btn.querySelector('.spinner').style.display = 'none';
        }
    });
}

// Register form handling
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const userType = document.getElementById('userType').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const btn = document.getElementById('registerBtn');
        const alertBox = document.getElementById('authAlert');

        // Reset errors
        clearErrors();

        let valid = true;
        // Common fields
        if (!fullName) { showError('fullName', 'Full name is required'); valid = false; }
        if (!email) { showError('email', 'Email is required'); valid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('email', 'Invalid email format'); valid = false; }
        if (!agreeTerms) {
            if (alertBox) {
                alertBox.className = 'auth-alert error';
                alertBox.style.display = 'block';
                alertBox.textContent = 'You must agree to the terms';
            }
            valid = false;
        }

        let username = '';
        let password = '';
        let details = {};

        if (userType === 'student') {
            const registerNumber = document.getElementById('registerNumber')?.value.trim() || '';
            const department = document.getElementById('department')?.value || '';
            const year = document.getElementById('year')?.value || '';
            const section = document.getElementById('section')?.value || '';
            const gender = document.getElementById('gender')?.value || '';
            const batch = document.getElementById('batch')?.value || '';
            const streamType = document.getElementById('streamType')?.value || '';
            const dob = document.getElementById('dob')?.value || '';

            if (!registerNumber) { showError('registerNumber', 'Register number is required'); valid = false; }
            if (!department) { showError('department', 'Department is required'); valid = false; }
            if (!year) { showError('year', 'Year is required'); valid = false; }
            if (!section) { showError('section', 'Section is required'); valid = false; }
            if (!gender) { showError('gender', 'Gender is required'); valid = false; }
            if (!batch) { showError('batch', 'Batch is required'); valid = false; }
            if (!streamType) { showError('streamType', 'Stream type is required'); valid = false; }
            if (!dob) { showError('dob', 'Date of birth is required'); valid = false; }

            username = registerNumber;
            password = formatDobToPassword(dob); // Use converted DOB as password

            details = { registerNumber, department, year, section, gender, batch, streamType, dob };
        } else {
            // Staff
            const staffCode = document.getElementById('staffCode')?.value.trim() || '';
            const pwd = document.getElementById('staffPassword')?.value;

            if (!staffCode) { showError('staffCode', 'Staff Code is required'); valid = false; }
            if (!pwd) { showError('staffPassword', 'Password is required'); valid = false; }
            else if (pwd.length < 6) { showError('staffPassword', 'Password must be at least 6 characters'); valid = false; }

            username = staffCode;
            password = pwd;

            const staffDept = document.getElementById('staffDepartment')?.value;
            const designation = document.getElementById('designation')?.value;
            details = { staffCode, department: staffDept, designation };
        }

        if (!valid) return;

        // Show loading
        btn.disabled = true;
        if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Creating account...';
        if (btn.querySelector('.spinner')) btn.querySelector('.spinner').style.display = 'block';

        try {
            // CALL BACKEND API
            const result = await window.DB.addUser({
                username,
                password,
                name: fullName,
                type: userType,
                details: details // Send as object
            });

            if (result.success) {
                // Show success
                if (alertBox) {
                    alertBox.className = 'auth-alert success';
                    alertBox.style.display = 'block';
                    alertBox.textContent = 'Account created successfully! Redirecting to login...';
                }

                // Redirect to login
                setTimeout(() => {
                    window.location.href = `login.html?type=${userType}`;
                }, 1500);
            } else {
                throw new Error(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
            if (alertBox) {
                alertBox.className = 'auth-alert error';
                alertBox.style.display = 'block';
                alertBox.textContent = error.message || 'Registration failed. Please try again.';
            }
            btn.disabled = false;
            if (btn.querySelector('span')) btn.querySelector('span').textContent = 'Sign Up';
            if (btn.querySelector('.spinner')) btn.querySelector('.spinner').style.display = 'none';
        }
    });
}

// Tab switching
function initAuthTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const userTypeInput = document.getElementById('userType');

    // Login form specific elements
    const usernameLabel = document.querySelector('label[for="username"]');
    const usernameInput = document.getElementById('username');
    const passwordLabel = document.querySelector('label[for="password"]');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');

    // Registration form specific sections
    const studentFields = document.getElementById('studentFields');
    const staffFields = document.getElementById('staffFields');
    const passwordSection = document.getElementById('passwordSection');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const typeValue = tab.dataset.type;
            if (userTypeInput) userTypeInput.value = typeValue;

            // Update Login UI if elements exist
            if (usernameLabel && usernameInput) {
                if (typeValue === 'student') {
                    usernameLabel.textContent = 'Register Number';
                    usernameInput.placeholder = 'Enter Register Number';
                    if (passwordLabel) passwordLabel.textContent = 'Date of Birth';
                    if (passwordInput) {
                        passwordInput.type = 'date';
                        passwordInput.placeholder = 'Select Date of Birth';
                        passwordInput.style.paddingRight = '1rem';
                        if (togglePasswordBtn) togglePasswordBtn.style.display = 'none';
                    }
                } else {
                    usernameLabel.textContent = 'Staff Code';
                    usernameInput.placeholder = 'Enter Staff Code';
                    if (passwordLabel) passwordLabel.textContent = 'Password';
                    if (passwordInput) {
                        passwordInput.type = 'password';
                        passwordInput.placeholder = 'Enter Password';
                        passwordInput.style.paddingRight = '3rem';
                        if (togglePasswordBtn) togglePasswordBtn.style.display = 'block';
                    }
                }
            }

            // Update Registration UI if sections exist
            if (studentFields && staffFields) {
                if (typeValue === 'student') {
                    studentFields.style.display = 'block';
                    staffFields.style.display = 'none';
                    if (passwordSection) passwordSection.style.display = 'none';
                    studentFields.querySelectorAll('input, select').forEach(i => i.setAttribute('required', ''));
                    staffFields.querySelectorAll('input, select').forEach(i => i.removeAttribute('required'));
                } else {
                    studentFields.style.display = 'none';
                    staffFields.style.display = 'block';
                    if (passwordSection) passwordSection.style.display = 'block';
                    studentFields.querySelectorAll('input, select').forEach(i => i.removeAttribute('required'));
                    staffFields.querySelectorAll('input, select').forEach(i => i.setAttribute('required', ''));
                }
            }
        });
    });

    // Handle initial state
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) activeTab.click();
}

function initPasswordToggle() {
    document.querySelectorAll('.toggle-password, #toggleStaffPassword').forEach(btn => {
        btn.onclick = () => {
            const wrapper = btn.closest('.input-wrapper');
            const input = wrapper.querySelector('input');
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');

            if (input.type === 'password') {
                input.type = 'text';
                if (eyeOpen) eyeOpen.style.display = 'none';
                if (eyeClosed) eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                if (eyeOpen) eyeOpen.style.display = 'block';
                if (eyeClosed) eyeClosed.style.display = 'none';
            }
        };
    });
}

// Helper functions for errors
function showError(field, message) {
    const errorEl = document.getElementById(field + 'Error');
    const inputEl = document.getElementById(field);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('error');
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    const alert = document.getElementById('authAlert');
    if (alert) { alert.className = 'auth-alert'; alert.textContent = ''; }
}

// Global Exports
window.initLoginForm = initLoginForm;
window.initRegisterForm = initRegisterForm;
window.initAuthTabs = initAuthTabs;
window.initPasswordToggle = initPasswordToggle;

