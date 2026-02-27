import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';

// Simple Protected Route Component
const ProtectedRoute = ({ children, allowedType }) => {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" />;
  
  try {
    const user = JSON.parse(userStr);
    if (allowedType && user.type !== allowedType) {
      return <Navigate to={user.type === 'student' ? '/student-dashboard' : '/staff-dashboard'} />;
    }
    return children;
  } catch (e) {
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute allowedType="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff-dashboard" 
          element={
            <ProtectedRoute allowedType="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
