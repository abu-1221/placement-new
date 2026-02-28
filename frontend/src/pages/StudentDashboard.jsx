import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { studentService } from '../services/api';
import { generatePerformanceReport, generateAnalyticsReport } from '../utils/pdfGenerator';
import '../styles/css/style.css';
import '../styles/css/dashboard.css';
import '../styles/css/modal.css';
import '../styles/css/analytics.css';

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState('availability');
  const [user, setUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, avg: 0 });
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const chartRefs = {
    bar: useRef(null),
    pie: useRef(null),
    line: useRef(null),
    scatter: useRef(null),
    dot: useRef(null)
  };
  const chartInstances = useRef({});
  const timerInterval = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
    if (!userData || userData.type !== 'student') {
      navigate('/login');
      return;
    }
    setUser(userData);

    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setIsSidebarCollapsed(collapsed);

    fetchData(userData.username);
  }, [navigate]);

  useEffect(() => {
    if (activeSection === 'analytics' && !isTakingTest) {
      setTimeout(renderCharts, 100);
    }
  }, [activeSection, completedTests, isTakingTest]);

  const fetchData = async (username) => {
    try {
      const results = await studentService.getStudentResults(username);
      setCompletedTests(results);

      const tests = await studentService.getAvailableTests();
      const completedTestIds = results.map(r => r.testId);
      setAvailableTests(tests.filter(t => !completedTestIds.includes(t.id)));

      const total = results.length;
      const passed = results.filter(r => r.status === 'passed').length;
      const avg = total > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / total) : 0;
      setStats({ total, passed, avg });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startTest = (test) => {
    if (window.confirm("Are you sure you want to start this test? Once started, the timer will begin.")) {
      setCurrentTest(test);
      setIsTakingTest(true);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestTimeRemaining(test.duration * 60);

      timerInterval.current = setInterval(() => {
        setTestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            submitTest(test, {}); // Pass empty answers if time up, will handle later
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const selectAnswer = (letter) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: letter }));
  };

  const submitTest = async (test, currentAnswers) => {
    clearInterval(timerInterval.current);
    const finalAnswers = { ...answers, ...currentAnswers };

    let correct = 0;
    const questions = typeof test.questions === 'string' ? JSON.parse(test.questions) : test.questions;
    questions.forEach((q, i) => {
      if (finalAnswers[i] === q.answer) correct++;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    const status = percentage >= 60 ? 'passed' : 'failed';

    const result = {
      username: user.username,
      testId: test.id,
      testName: test.name,
      company: test.company,
      score: percentage,
      status: status,
      answers: JSON.stringify(finalAnswers)
    };

    try {
      await studentService.submitTest(result);
      alert(`Test Submitted! You scored ${percentage}%.`);
      setIsTakingTest(false);
      setCurrentTest(null);
      fetchData(user.username);
      setActiveSection('tests');
    } catch (err) {
      alert("Error submitting test: " + err.message);
    }
  };

  const renderCharts = () => {
    // Destroy existing
    Object.values(chartInstances.current).forEach(c => c && c.destroy());

    const colors = ["#667eea", "#764ba2", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
    const hasData = completedTests.length > 0;

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "rgba(255,255,255,0.7)", font: { family: "Inter", size: 12 } } }
      },
      scales: {
        x: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: { beginAtZero: true, max: 100, ticks: { color: "rgba(255,255,255,0.5)" }, grid: { color: "rgba(255,255,255,0.05)" } }
      }
    };

    // Bar Chart
    if (chartRefs.bar.current) {
      chartInstances.current.bar = new Chart(chartRefs.bar.current, {
        type: 'bar',
        data: {
          labels: hasData ? completedTests.slice(-5).map(t => t.testName) : ["No Data"],
          datasets: [{ label: "Scores", data: hasData ? completedTests.slice(-5).map(t => t.score) : [0], backgroundColor: colors[0] }]
        },
        options: chartOptions
      });
    }

    // Pie Chart
    if (chartRefs.pie.current) {
      const passed = completedTests.filter(t => t.status === 'passed').length;
      chartInstances.current.pie = new Chart(chartRefs.pie.current, {
        type: 'pie',
        data: {
          labels: ["Passed", "Failed"],
          datasets: [{ data: hasData ? [passed, completedTests.length - passed] : [0, 0], backgroundColor: [colors[2], colors[4]] }]
        },
        options: { ...chartOptions, scales: { x: { display: false }, y: { display: false } } }
      });
    }

    // Add remaining charts ... (simplified for now to match structure)
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const viewDetails = (result) => {
    setSelectedResult(result);
    setIsModalOpen(true);
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavItem active={activeSection === 'availability'} icon="M22 11.08V12a10 10 0 11-5.93-9.14 M22,4 12,14.01 9,11.01" label="Availability" onClick={() => setActiveSection('availability')} />
          <NavItem active={activeSection === 'tests'} icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14,2 14,8 20,8 M16 13 8 13 M16 17 8 17" label="Tests Attended" onClick={() => setActiveSection('tests')} />
          <NavItem active={activeSection === 'analytics'} icon="M18 20v-10 M12 20v-16 M6 20v-6" label="Analytics" onClick={() => setActiveSection('analytics')} />
          <NavItem active={activeSection === 'reports'} icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14,2 14,8 20,8 M12 18 12 12 M9 15 15 15" label="Reports" onClick={() => setActiveSection('reports')} />
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16,17 21,12 16,7 M21,12 9,12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <button className="menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div className="header-left">
            <h1>{isTakingTest ? currentTest?.name : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'JD'}</div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'John Doe'}</span>
                <span className="user-role">Student</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {isTakingTest ? (
            <section className="content-section active">
              <div className="test-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="test-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ margin: 0 }}>{currentTest.name}</h1>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Cancel test?")) setIsTakingTest(false); }} style={{ color: '#ef4444' }}>Cancel</button>
                  </div>
                  <div className="test-info">
                    <span>⏱ {currentTest.duration} mins</span>
                    <span>📝 {JSON.parse(currentTest.questions).length} questions</span>
                  </div>
                  <div className="timer-bar" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '1rem' }}>
                    <div style={{ height: '100%', width: `${(testTimeRemaining / (currentTest.duration * 60)) * 100}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)', transition: 'width 1s linear' }}></div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', color: 'var(--gray-400)' }}>
                    <span>Time Remaining: {formatTime(testTimeRemaining)}</span>
                  </div>
                </div>

                <div className="question-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {(() => {
                    const questions = JSON.parse(currentTest.questions);
                    const q = questions[currentQuestionIndex];
                    return (
                      <>
                        <div style={{ color: '#667eea', fontWeight: 600, marginBottom: '0.5rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>{q.question}</div>
                        <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {q.options.map((opt, i) => {
                            const char = String.fromCharCode(65 + i);
                            const isSelected = answers[currentQuestionIndex] === char;
                            return (
                              <label key={i} className="option-label" style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', background: isSelected ? 'rgba(102,126,234,0.2)' : 'none', borderColor: isSelected ? '#667eea' : 'rgba(255,255,255,0.1)' }} onClick={() => selectAnswer(char)}>
                                <span style={{ width: '30px', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontWeight: 'bold' }}>{char}</span>
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                        <div className="navigation" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                          <button className="btn btn-ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)}>Previous</button>
                          {currentQuestionIndex < questions.length - 1 ? (
                            <button className="btn btn-primary" onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>Next</button>
                          ) : (
                            <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={() => submitTest(currentTest, {})}>Submit Test</button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>
          ) : (
            <>
              {activeSection === 'availability' && (
                <section className="content-section active">
                  <div className="section-intro">
                    <h2>Available Tests</h2>
                    <p>Tests published by staff - Click to take the test</p>
                  </div>
                  <div className="upcoming-drives">
                    <div className="drives-list">
                      {availableTests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                          <p>No Active Tests at this time.</p>
                        </div>
                      ) : (
                        availableTests.map(test => (
                          <div key={test.id} className="drive-item">
                            <div className="drive-logo">{test.company.charAt(0)}</div>
                            <div className="drive-info">
                              <h4>{test.name}</h4>
                              <p>{test.company} • {test.duration} mins • {JSON.parse(test.questions).length} questions</p>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => startTest(test)}>Take Test</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              )}

              {activeSection === 'tests' && (
                <section className="content-section active">
                  <div className="section-intro">
                    <h2>Tests Attended</h2>
                    <p>View all your Placement tests and scores</p>
                  </div>
                  <div className="stats-grid">
                    <StatCard label="Total Tests" value={stats.total} color="blue" />
                    <StatCard label="Passed" value={stats.passed} color="green" />
                    <StatCard label="Failed" value={stats.total - stats.passed} color="orange" />
                    <StatCard label="Avg Score" value={stats.avg + "%"} color="purple" />
                  </div>
                  <div className="tests-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Company</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedTests.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No tests completed yet.</td></tr>
                        ) : (
                          completedTests.map((res, i) => (
                            <tr key={i}>
                              <td>{res.testName}</td>
                              <td>{res.company}</td>
                              <td>{res.score}%</td>
                              <td><span className={`status-badge ${res.status}`}>{res.status.toUpperCase()}</span></td>
                              <td className="actions-cell">
                                <div className="action-icons">
                                  <button className="action-btn" onClick={() => viewDetails(res)} title="View Analytics">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {activeSection === 'analytics' && (
                <section className="content-section active">
                  <div className="analytics-grid-simple">
                    <div className="chart-card"><h3>📊 Performance Chart</h3><div className="chart-container"><canvas ref={chartRefs.bar}></canvas></div></div>
                    <div className="chart-card"><h3>🍕 Success Rate</h3><div className="chart-container"><canvas ref={chartRefs.pie}></canvas></div></div>
                  </div>
                </section>
              )}

              {activeSection === 'reports' && (
                <section className="content-section active">
                  <div className="section-intro">
                    <h2>Results & Certificates</h2>
                    <p>Access your verified academic transcripts and merit certificates</p>
                  </div>
                  <div className="reports-grid">
                    {/* 1. Performance Transcript */}
                    <div className="report-card">
                      <div className="report-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                      </div>
                      <h3>Performance Transcript</h3>
                      <p>A consolidated record of all attempted assessments, including scores and percentile rankings.</p>
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => generatePerformanceReport(user, completedTests)}>
                          Download PDF
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          Excel Report
                        </button>
                      </div>
                    </div>

                    {/* 2. Merit Certificate */}
                    <div className="report-card">
                      <div className="report-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="7" />
                          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                        </svg>
                      </div>
                      <h3>Merit Certificate</h3>
                      <p>Generate a verified certificate of completion for assessments with qualifying scores.</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>
                        Issue Certificate
                      </button>
                    </div>

                    {/* 3. Readiness Profile */}
                    <div className="report-card">
                      <div className="report-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                      <h3>Readiness Profile</h3>
                      <p>A comprehensive overview evaluating your skills for upcoming corporate interviews.</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>
                        Download Profile
                      </button>
                    </div>

                    {/* 4. Analytics Breakdown */}
                    <div className="report-card">
                      <div className="report-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                          <path d="M22 12A10 10 0 0 0 12 2v10z" />
                        </svg>
                      </div>
                      <h3>Analytics Breakdown</h3>
                      <p>An in-depth statistical analysis indicating strong and weak areas tested.</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>
                        Download Analytics
                      </button>
                    </div>
                  </div>
                </section>
              )}


            </>
          )}
        </div>
      </main>

      {isModalOpen && selectedResult && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '90%', margin: '2rem auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Test Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '0.5rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedResult.testName}</h3>
                  <p style={{ color: 'var(--gray-400)', margin: 0 }}>{selectedResult.company}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: selectedResult.score >= 60 ? '#10b981' : '#ef4444' }}>{selectedResult.score}%</div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{selectedResult.status}</div>
                </div>
              </div>
              <div className="questions-review">
                {(() => {
                  // For now, assume results might have questions or we show placeholder
                  return <p>Detailed question review is available after staff publishes official keys.</p>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }) => (
  <a href="#" className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={icon} /></svg>
    <span>{label}</span>
  </a>
);

const StatCard = ({ label, value, color }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}></div>
    <div className="stat-info"><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>
  </div>
);

export default StudentDashboard;
