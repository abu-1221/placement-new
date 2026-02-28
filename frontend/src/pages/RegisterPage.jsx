import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/css/style.css';
import '../styles/css/auth-professional.css';

const RegisterPage = () => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    registerNumber: '',
    department: '',
    year: '',
    batch: '',
    dob: '',
    section: '',
    gender: '',
    staffCode: '',
    staffDepartment: '',
    designation: '',
    staffPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    // Clear alerts when user starts typing again
    if (alert.show) setAlert({ show: false, message: '', type: '' });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Basic Validation
    if (!agreeTerms) {
      setAlert({ show: true, message: 'Please accept the terms and conditions', type: 'error' });
      return;
    }

    if (userType === 'student') {
      if (!formData.registerNumber.match(/^[0-9A-Z]+$/i)) {
        setAlert({ show: true, message: 'Invalid Register Number format', type: 'error' });
        return;
      }
      if (!formData.department) {
        setAlert({ show: true, message: 'Please select your department', type: 'error' });
        return;
      }
    } else {
      if (!formData.staffPassword || formData.staffPassword.length < 6) {
        setAlert({ show: true, message: 'Password must be at least 6 characters', type: 'error' });
        return;
      }
    }

    setIsLoading(true);
    setAlert({ show: false, message: '', type: '' });

    let newUser = {
      type: userType,
      name: formData.fullName,
      username: '',
      password: '',
      details: {}
    };

    if (userType === 'student') {
      newUser.username = formData.registerNumber;

      // DOB to password conversion (DDMMYYYY)
      if (formData.dob) {
        const parts = formData.dob.split("-");
        // parts = [YYYY, MM, DD] -> password = DDMMYYYY
        newUser.password = parts.length === 3 ? `${parts[2]}${parts[1]}${parts[0]}` : "12345678";
      } else {
        newUser.password = "12345678";
      }

      newUser.details = {
        registerNumber: formData.registerNumber,
        department: formData.department,
        year: formData.year,
        batch: formData.batch,
        dob: formData.dob,
        section: formData.section,
        gender: formData.gender,
        email: formData.email
      };
    } else {
      newUser.username = formData.staffCode;
      newUser.password = formData.staffPassword;
      newUser.details = {
        staffCode: formData.staffCode,
        department: formData.staffDepartment,
        designation: formData.designation,
        email: formData.email
      };
    }

    try {
      const data = await authService.register(newUser);
      if (data.success) {
        setAlert({
          show: true,
          message: `Account created successfully! Redirecting to login...`,
          type: 'success'
        });

        setTimeout(() => {
          navigate(`/login?type=${userType}&registered=true`);
        }, 2000);
      }
    } catch (err) {
      setAlert({
        show: true,
        message: err.response?.data?.error || 'Registration failed. This account may already exist.',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <img src="/logo.png" className="brand-logo" alt="JMC-TEST Logo" />
          </Link>
          <h1>Create Account</h1>
          <p>Join JMC-TEST and start your journey</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab-btn ${userType === 'student' ? 'active' : ''}`}
            onClick={() => setUserType('student')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span>Student</span>
          </button>
          <button
            className={`tab-btn ${userType === 'staff' ? 'active' : ''}`}
            onClick={() => setUserType('staff')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Staff</span>
          </button>
        </div>

        <form onSubmit={handleRegister} autoComplete="off">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name *</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="fullName"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {userType === 'student' ? (
            <div id="studentFields">
              <div className="section-title"><span>Academic Details</span></div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="registerNumber">Register Number *</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="9" y1="9" x2="15" y2="9" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                    </svg>
                    <input
                      type="text"
                      id="registerNumber"
                      className="form-input"
                      placeholder="e.g., 2024CSE001"
                      value={formData.registerNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="department">Department *</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                    </svg>
                    <select id="department" className="form-input" value={formData.department} onChange={handleInputChange} required>
                      <option value="">Select Department</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Bio Technology">Bio Technology</option>
                      <option value="Botany">Botany</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Economics">Economics</option>
                      <option value="English">English</option>
                      <option value="Fashion Technology">Fashion Technology</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                      <option value="History">History</option>
                      <option value="Hotel Management">Hotel Management</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Nutrition & Dietetics">Nutrition & Dietetics</option>
                      <option value="Physics">Physics</option>
                      <option value="Social Work">Social Work</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Zoology">Zoology</option>
                      <option value="Physical Education">Physical Education</option>
                      <option value="Visual Communication">Visual Communication</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="year">Year *</label>
                  <div className="input-wrapper">
                    <select id="year" className="form-input" value={formData.year} onChange={handleInputChange} required>
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="batch">Batch *</label>
                  <div className="input-wrapper">
                    <select id="batch" className="form-input" value={formData.batch} onChange={handleInputChange} required>
                      <option value="">Select Batch</option>
                      <option value="2022-2026">2022-2026</option>
                      <option value="2023-2027">2023-2027</option>
                      <option value="2024-2028">2024-2028</option>
                      <option value="2025-2029">2025-2029</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="section">Section *</label>
                  <div className="input-wrapper">
                    <select id="section" className="form-input" value={formData.section} onChange={handleInputChange} required>
                      <option value="">Select Section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gender">Gender *</label>
                  <div className="input-wrapper">
                    <select id="gender" className="form-input" value={formData.gender} onChange={handleInputChange} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dob">Date of Birth *</label>
                <div className="input-wrapper">
                  <input type="date" id="dob" className="form-input" value={formData.dob} onChange={handleInputChange} required />
                </div>
                <div className="form-hint" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  This will be used as your password (DDMMYYYY format)
                </div>
              </div>
            </div>
          ) : (
            <div id="staffFields">
              <div className="section-title"><span>Staff Details</span></div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="staffCode">Staff Code *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="staffCode"
                      className="form-input"
                      placeholder="e.g., STF001"
                      value={formData.staffCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="staffDepartment">Department *</label>
                  <div className="input-wrapper">
                    <select id="staffDepartment" className="form-input" value={formData.staffDepartment} onChange={handleInputChange} required>
                      <option value="">Select Department</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Bio Technology">Bio Technology</option>
                      <option value="Botany">Botany</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Economics">Economics</option>
                      <option value="English">English</option>
                      <option value="Fashion Technology">Fashion Technology</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                      <option value="History">History</option>
                      <option value="Hotel Management">Hotel Management</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Nutrition & Dietetics">Nutrition & Dietetics</option>
                      <option value="Physics">Physics</option>
                      <option value="Social Work">Social Work</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Zoology">Zoology</option>
                      <option value="Physical Education">Physical Education</option>
                      <option value="Visual Communication">Visual Communication</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="designation">Designation *</label>
                <div className="input-wrapper">
                  <select id="designation" className="form-input" value={formData.designation} onChange={handleInputChange} required>
                    <option value="">Select Designation</option>
                    <option value="HOD">Head of Department</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Placement Officer">Placement Officer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="staffPassword">Password *</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="staffPassword"
                    className="form-input"
                    placeholder="Create a password"
                    value={formData.staffPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ margin: '1.5rem 0' }}>
            <label className="checkbox-wrapper">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
              <span>I agree to the <a href="#" className="auth-link">Terms</a> and <a href="#" className="auth-link">Privacy Policy</a></span>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Create Account'}
          </button>

          {alert.show && (
            <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
              {alert.message}
            </div>
          )}
        </form>

        <div className="divider"><span>Already registered?</span></div>
        <Link to="/login" className="btn-secondary">Sign In</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
