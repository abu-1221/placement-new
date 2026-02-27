import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/css/style.css';
import '../styles/css/auth-professional.css';

const LoginPage = () => {
  const [userType, setUserType] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameters for user type
    const urlParams = new URLSearchParams(location.search);
    const type = urlParams.get('type');
    if (type && (type === 'student' || type === 'staff')) {
      setUserType(type);
    }

    // Auto-redirect if already logged in
    const existingSession = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (existingSession) {
      try {
        const user = JSON.parse(existingSession);
        if (user && user.type) {
          navigate(user.type === 'student' ? '/student-dashboard' : '/staff-dashboard');
        }
      } catch (e) {
        sessionStorage.clear();
        localStorage.removeItem('user');
      }
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert({ show: false, message: '', type: '' });

    try {
      const data = await authService.login({ username, password });
      if (data.success) {
        const { password: _, ...safeUser } = data.user;
        
        // Normalize name if missing
        if (!safeUser.name && safeUser.fullName) safeUser.name = safeUser.fullName;

        setAlert({ show: true, message: 'Authentication successful. Redirecting...', type: 'success' });
        
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(safeUser));
        } else {
          sessionStorage.setItem('user', JSON.stringify(safeUser));
        }

        setTimeout(() => {
          navigate(safeUser.type === 'student' ? '/student-dashboard' : '/staff-dashboard');
        }, 800);
      }
    } catch (err) {
      setAlert({ 
        show: true, 
        message: err.response?.data?.error || 'Invalid credentials. Please check your username and password.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <img src="/logo.png" className="brand-logo" alt="JMC-TEST Logo" />
          </Link>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
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

        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {userType === 'student' ? 'Username / ID' : 'Staff Code'}
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder={userType === 'student' ? 'Enter your ID (e.g., 2024CSE001)' : 'Enter Staff Code'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="eye-closed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="eye-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <label className="checkbox-wrapper">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span>Remember me</span>
            </label>
            <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem' }}>Forgot password?</a>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Sign In'}
          </button>

          {alert.show && (
            <div className={`alert ${alert.type}`} style={{ display: 'block' }}>
              {alert.message}
            </div>
          )}
        </form>

        <div className="divider"><span>New here?</span></div>
        <Link to="/register" className="btn-secondary">Create Account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
