// Authentication JavaScript

// Demo users database
const users = {
    students: [
        { username: 'student', password: 'student123', name: 'John Doe', email: 'john@example.com' }
    ],
    staff: [
        { username: 'staff', password: 'staff123', name: 'Admin User', email: 'admin@example.com' }
    ]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initPasswordToggle();
    initPasswordStrength();
    initLoginForm();
    initRegisterForm();
});

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const userTypeInput = document.getElementById('userType');
    
    // Login form elements
    const usernameLabel = document.querySelector('label[for="username"]');
    const usernameInput = document.getElementById('username');
    const passwordLabel = document.querySelector('label[for="password"]');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (userTypeInput) userTypeInput.value = tab.dataset.type;
            
            // Update Login UI if on login page
            if (usernameLabel && usernameInput) {
                if (tab.dataset.type === 'student') {
                    usernameLabel.textContent = 'Register Number';
                    usernameInput.placeholder = 'Enter Register Number';
                    
                    if (passwordLabel) passwordLabel.textContent = 'Date of Birth';
                    if (passwordInput) {
                         passwordInput.type = 'date';
                         passwordInput.placeholder = 'Select Date of Birth';
                         // Remove valid password styling for date input if any
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
                         passwordInput.style.paddingRight = '3rem'; // Restore for eye icon
                         if (togglePasswordBtn) togglePasswordBtn.style.display = 'block';
                    }
                }
            }
        });
    });
    
    // Trigger click on active tab to set initial state
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        // Dispatch click to ensure UI sync
        activeTab.click();
    }
}

// Password visibility toggle
function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
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
        });
    });
}

// Password strength meter
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthFill) return;
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculateStrength(password);
        
        strengthFill.className = 'strength-fill';
        if (password.length === 0) {
            strengthFill.style.width = '0';
            strengthText.textContent = 'Password strength';
        } else if (strength < 2) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Weak password';
        } else if (strength < 3) {
            strengthFill.classList.add('fair');
            strengthText.textContent = 'Fair password';
        } else if (strength < 4) {
            strengthFill.classList.add('good');
            strengthText.textContent = 'Good password';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Strong password';
        }
    });
}

function calculateStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
}

// Login form handling
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const userType = document.getElementById('userType').value;
        const btn = document.getElementById('loginBtn');
        const alert = document.getElementById('authAlert');
        
        // Reset errors
        clearErrors();
        
        // Validate
        let valid = true;
        if (!username) { showError('username', 'Username is required'); valid = false; }
        if (!password) { showError('password', 'Password is required'); valid = false; }
        
        if (!valid) return;
        
        // Show loading
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Signing in...';
        btn.querySelector('.spinner').style.display = 'block';
        
        // Simulate API call
        await sleep(1500);
        
        // Check credentials
        // Check credentials
        const storedUsers = JSON.parse(localStorage.getItem('placeme_users') || '{"students":[],"staff":[]}');
        const userDb = userType === 'student' ? storedUsers.students : storedUsers.staff;
        
        // Also allow demo users from constant
        const demoDb = userType === 'student' ? users.students : users.staff;
        
        const user = userDb.find(u => u.username === username && u.password === password) || 
                     demoDb.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Store session
            sessionStorage.setItem('user', JSON.stringify({ ...user, type: userType }));
            
            // Show success
            alert.className = 'auth-alert success';
            alert.textContent = 'Login successful! Redirecting...';
            
            // Redirect
            setTimeout(() => {
                window.location.href = userType === 'student' ? 'student-dashboard.html' : 'staff-dashboard.html';
            }, 1000);
        } else {
            alert.className = 'auth-alert error';
            alert.textContent = 'Invalid username or password. Please try again.';
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Sign In';
            btn.querySelector('.spinner').style.display = 'none';
        }
    });
}

// Register form handling
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    
    // Show/hide fields based on user type
    const userTypeInput = document.getElementById('userType');
    const studentFields = document.getElementById('studentFields');
    const staffFields = document.getElementById('staffFields');
    const passwordSection = document.getElementById('passwordSection');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const isStudent = tab.dataset.type === 'student';
            if (studentFields) studentFields.style.display = isStudent ? 'block' : 'none';
            if (staffFields) staffFields.style.display = !isStudent ? 'block' : 'none';
            if (passwordSection) passwordSection.style.display = !isStudent ? 'block' : 'none';
        });
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const userType = document.getElementById('userType').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const btn = document.getElementById('registerBtn');
        const alert = document.getElementById('authAlert');
        
        // Reset errors
        clearErrors();
        
        let valid = true;
        // Common fields
        if (!fullName) { showError('fullName', 'Full name is required'); valid = false; }
        if (!email) { showError('email', 'Email is required'); valid = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('email', 'Invalid email format'); valid = false; }
        if (!agreeTerms) { alert.className = 'auth-alert error'; alert.textContent = 'You must agree to the terms'; valid = false; }
        
        let username = '';
        let password = '';
        let extraData = {};

        if (userType === 'student') {
            const registerNumber = document.getElementById('registerNumber')?.value.trim() || '';
            const phoneNumber = document.getElementById('phoneNumber')?.value.trim() || '';
            const department = document.getElementById('department')?.value || '';
            const year = document.getElementById('year')?.value || '';
            const className = document.getElementById('className')?.value.trim() || '';
            const batch = document.getElementById('batch')?.value || '';
            const dob = document.getElementById('dob')?.value || '';
            
            if (!registerNumber) { showError('registerNumber', 'Register number is required'); valid = false; }
            if (!department) { showError('department', 'Department is required'); valid = false; }
            if (!year) { showError('year', 'Year of study is required'); valid = false; }
            if (!className) { showError('className', 'Class/Section is required'); valid = false; }
            if (!batch) { showError('batch', 'Batch year is required'); valid = false; }
            if (!dob) { showError('dob', 'Date of birth is required'); valid = false; }
            
            username = registerNumber;
            password = dob; // DOB is password for students
            
            extraData = { 
                registerNumber, phoneNumber, department, year, className, batch, 
                testsTaken: [], testsCompleted: [] 
            };
        } else {
            // Staff
            const staffCode = document.getElementById('staffCode')?.value.trim() || '';
            const pwd = document.getElementById('password')?.value;
            const confirmPwd = document.getElementById('confirmPassword')?.value;
            
            if (!staffCode) { showError('staffCode', 'Staff Code is required'); valid = false; }
            if (!pwd) { showError('password', 'Password is required'); valid = false; }
            else if (pwd.length < 6) { showError('password', 'Password must be at least 6 characters'); valid = false; }
            if (pwd !== confirmPwd) { showError('confirmPassword', 'Passwords do not match'); valid = false; }
            
            username = staffCode;
            password = pwd;
        }
        
        if (!valid) return;
        
        // Show loading
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Creating account...';
        btn.querySelector('.spinner').style.display = 'block';
        
        // Simulate API call
        await sleep(1500);
        
        // Create user object
        const newUser = { 
            username, 
            password, 
            name: fullName, 
            email,
            ...extraData
        };
        
        // Save to localStorage
        const storedUsers = JSON.parse(localStorage.getItem('placeme_users') || '{"students":[],"staff":[]}');
        if (userType === 'student') {
            storedUsers.students.push(newUser);
        } else {
            storedUsers.staff.push(newUser);
        }
        localStorage.setItem('placeme_users', JSON.stringify(storedUsers));
        
        // Also add to in-memory users
        if (userType === 'student') users.students.push(newUser);
        else users.staff.push(newUser);
        
        // Show success
        alert.className = 'auth-alert success';
        alert.textContent = 'Account created successfully! Redirecting to login...';
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
}

// Helper functions
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
