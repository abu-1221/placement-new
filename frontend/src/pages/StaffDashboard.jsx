import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { staffService } from '../services/api';
import '../styles/css/style.css';
import '../styles/css/dashboard.css';

const StaffDashboard = () => {
  const [activeSection, setActiveSection] = useState('create-test');
  const [user, setUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ totalTests: 0, activeTests: 0, participants: 0, passRate: 0 });
  const [questions, setQuestions] = useState([{ id: Date.now(), type: 'mcq', text: '', options: ['', '', '', ''], answer: 'A' }]);
  const [testForm, setTestForm] = useState({ name: '', company: '', date: '', duration: '', description: '' });
  const [analyticsTestId, setAnalyticsTestId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chartRefs = {
    dist: useRef(null),
    attendance: useRef(null),
    passFail: useRef(null)
  };
  const chartInstances = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
    if (!userData || userData.type !== 'staff') {
      navigate('/login');
      return;
    }
    setUser(userData);
    setIsSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    fetchData(userData.username);
  }, [navigate]);

  useEffect(() => {
    if (activeSection === 'analytics' && analyticsTestId) {
      renderAnalytics(analyticsTestId);
    }
  }, [activeSection, analyticsTestId]);

  const fetchData = async (username) => {
    try {
      const allTests = await staffService.getTests();
      const userTests = allTests.filter(t => t.createdBy === username);
      setTests(userTests);

      const allStudents = await staffService.getStudents();
      setStudents(allStudents);

      const active = userTests.filter(t => t.status === 'active').length;
      const participants = userTests.reduce((sum, t) => sum + (t.participants || 0), 0);
      setStats({ totalTests: userTests.length, activeTests: active, participants, passRate: 75 }); // Pass rate simulated for now
    } catch (err) {
      console.error('Error fetching staff data:', err);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now(), type: 'mcq', text: '', options: ['', '', '', ''], answer: 'A' }]);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleQuestionChange = (id, field, value, optIdx = null) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (optIdx !== null) {
          const newOpts = [...q.options];
          newOpts[optIdx] = value;
          return { ...q, options: newOpts };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const testData = {
      ...testForm,
      questions: questions.map(q => ({
        type: q.type,
        question: q.text,
        options: q.options,
        answer: q.answer
      })),
      targetAudience: { departments: testForm.targetDepartments || [] },
      status: 'active',
      createdBy: user.username
    };

    try {
      await staffService.createTest(testData);
      alert('Test Created Successfully!');
      setTestForm({ name: '', company: '', date: '', duration: '', description: '' });
      setQuestions([{ id: Date.now(), type: 'mcq', text: '', options: ['', '', '', ''], answer: 'A' }]);
      fetchData(user.username);
      setActiveSection('manage-tests');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAnalytics = (testId) => {
    // Destroy previous charts
    Object.values(chartInstances.current).forEach(c => c && c.destroy());

    // Simulated data for demo (matches staff-dashboard.js logic)
    const chartOptions = { responsive: true, maintainAspectRatio: false };

    if (chartRefs.dist.current) {
      chartInstances.current.dist = new Chart(chartRefs.dist.current, {
        type: 'bar',
        data: {
          labels: ['90-100', '75-89', '60-74', 'Below 60'],
          datasets: [{ label: 'Students', data: [5, 12, 8, 3], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] }]
        },
        options: chartOptions
      });
    }

    if (chartRefs.passFail.current) {
      chartInstances.current.passFail = new Chart(chartRefs.passFail.current, {
        type: 'pie',
        data: {
          labels: ['Passed', 'Failed'],
          datasets: [{ data: [25, 3], backgroundColor: ['#10b981', '#ef4444'] }]
        },
        options: chartOptions
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-minimized' : ''}`}>
      <aside className={`sidebar ${isMobileSidebarOpen ? 'active' : ''} ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <img src="/logo.png" className="brand-logo" alt="JMC-Test Logo" style={{ marginRight: '10px' }} />
            <span>JMC-Test</span>
          </Link>
          <button className="sidebar-toggle-btn" onClick={() => {
            const next = !isSidebarCollapsed;
            setIsSidebarCollapsed(next);
            localStorage.setItem('sidebarCollapsed', next);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavItem active={activeSection === 'create-test'} icon="M12 8v8 M8 12h8" label="Create Test" onClick={() => setActiveSection('create-test')} />
          <NavItem active={activeSection === 'manage-tests'} icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" label="Manage Tests" onClick={() => setActiveSection('manage-tests')} />
          <NavItem active={activeSection === 'students'} icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" label="Students" onClick={() => setActiveSection('students')} />
          <NavItem active={activeSection === 'analytics'} icon="M18 20v-10 M12 20v-4 M6 20v-6" label="Analytics" onClick={() => setActiveSection('analytics')} />
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /></svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <button className="menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /></svg>
          </button>
          <div className="header-left"><h1>{activeSection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h1></div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar staff">{user?.name ? user.name[0] : 'S'}</div>
              <div className="user-details"><span className="user-name">{user?.name || 'Staff User'}</span><span className="user-role">Staff</span></div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'create-test' && (
            <section className="content-section active">
              <form onSubmit={handleCreateTest} className="test-form">
                <div className="form-card">
                  <h3>Test Information</h3>
                  <div className="details-grid">
                    <div className="form-group">
                      <label className="form-label">Test Name *</label>
                      <input type="text" className="form-input" value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company *</label>
                      <input type="text" className="form-input" value={testForm.company} onChange={(e) => setTestForm({ ...testForm, company: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input type="date" className="form-input" value={testForm.date} onChange={(e) => setTestForm({ ...testForm, date: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration (mins) *</label>
                      <input type="number" className="form-input" value={testForm.duration} onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label className="section-title-divider">Target Audience (Departments) *</label>
                    <div className="dept-selection-pool">
                      {[
                        "Arabic", "Business Administration", "Bio Technology", "Botany", "Chemistry", "Commerce", "Computer Science", "Economics", "English", "Fashion Technology", "French", "Hindi", "History", "Hotel Management", "Information Technology", "Mathematics", "Microbiology", "Nutrition & Dietetics", "Physics", "Social Work", "Tamil", "Urdu", "Zoology", "Physical Education", "Visual Communication"
                      ].map(dept => (
                        <label key={dept} className="dept-checkbox-label">
                          <input
                            type="checkbox"
                            name="targetDepartments"
                            value={dept}
                            className="dept-checkbox"
                            onChange={(e) => {
                              const depts = testForm.targetDepartments || [];
                              if (e.target.checked) {
                                setTestForm({ ...testForm, targetDepartments: [...depts, dept] });
                              } else {
                                setTestForm({ ...testForm, targetDepartments: depts.filter(d => d !== dept) });
                              }
                            }}
                          />
                          <span className="dept-name">{dept}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <h3>Questions</h3>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="question-item">
                      <div className="question-header"><span>Q{idx + 1}</span><button type="button" onClick={() => handleRemoveQuestion(q.id)}>×</button></div>
                      <input type="text" className="form-input" placeholder="Question text" value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} required />
                      <div className="options-grid">
                        {q.options.map((opt, i) => (
                          <input key={i} type="text" className="form-input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, i)} required />
                        ))}
                      </div>
                      <select className="form-input" value={q.answer} onChange={(e) => handleQuestionChange(q.id, 'answer', e.target.value)}>
                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                      </select>
                    </div>
                  ))}
                  <button type="button" className="btn btn-glass" onClick={handleAddQuestion}>+ Add Question</button>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Test'}</button>
                </div>
              </form>
            </section>
          )}

          {activeSection === 'manage-tests' && (
            <section className="content-section active">
              <div className="stats-grid">
                <StatCard label="Total Tests" value={stats.totalTests} color="blue" />
                <StatCard label="Active" value={stats.activeTests} color="green" />
                <StatCard label="Participants" value={stats.participants} color="orange" />
                <StatCard label="Pass Rate" value={stats.passRate + '%'} color="purple" />
              </div>
              <div className="tests-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Company</th><th>Date</th><th>Participants</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {tests.map(test => (
                      <tr key={test.id}>
                        <td>{test.name}</td><td>{test.company}</td><td>{new Date(test.createdAt).toLocaleDateString()}</td><td>{test.participants || 0}</td>
                        <td><span className={`status-badge ${test.status}`}>{test.status}</span></td>
                        <td><button className="btn btn-sm btn-ghost" onClick={() => { setAnalyticsTestId(test.id); setActiveSection('analytics'); }}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'students' && (
            <section className="content-section active">
              <div className="table-header">
                <select
                  className="form-input filter-select"
                  onChange={(e) => {
                    const dept = e.target.value;
                    if (!dept) fetchData(user.username);
                    else setStudents(prev => prev.filter(s => s.department === dept));
                  }}
                >
                  <option value="">All Departments</option>
                  {[
                    "Arabic", "Business Administration", "Bio Technology", "Botany", "Chemistry", "Commerce", "Computer Science", "Economics", "English", "Fashion Technology", "French", "Hindi", "History", "Hotel Management", "Information Technology", "Mathematics", "Microbiology", "Nutrition & Dietetics", "Physics", "Social Work", "Tamil", "Urdu", "Zoology", "Physical Education", "Visual Communication"
                  ].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="tests-table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Reg No</th><th>Name</th><th>Department</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}><td>{s.username}</td><td>{s.name}</td><td>{s.department || 'N/A'}</td><td>{s.email || 'N/A'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'analytics' && (
            <section className="content-section active">
              <select className="form-input" value={analyticsTestId} onChange={(e) => setAnalyticsTestId(e.target.value)} style={{ maxWidth: '300px' }}>
                <option value="">Select Test</option>
                {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {analyticsTestId && (
                <div className="analytics-grid">
                  <div className="chart-card"><h3>Distribution</h3><div className="chart-container"><canvas ref={chartRefs.dist}></canvas></div></div>
                  <div className="chart-card"><h3>Pass/Fail</h3><div className="chart-container"><canvas ref={chartRefs.passFail}></canvas></div></div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }) => (
  <a href="#" className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon || "M12 2v20 M2 12h20"} /></svg>
    <span>{label}</span>
  </a>
);

const StatCard = ({ label, value, color }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}></div>
    <div className="stat-info"><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>
  </div>
);

export default StaffDashboard;
