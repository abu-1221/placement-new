import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/css/style.css';
import '../styles/css/landing.css';
import '../styles/css/professional.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const animateCounters = () => {
      const counters = document.querySelectorAll('.stat-number[data-count]');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString();
          }
        };
        updateCounter();
      });
    };

    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
          if (entry.target.classList.contains('hero-stats')) {
            animateCounters();
          }
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .hero-stats').forEach(el => observer.observe(el));
    window.addEventListener('scroll', handleScroll);

    const handleMouseMove = (e) => {
      const shapes = document.querySelectorAll('.shape');
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      shapes.forEach((shape, i) => {
        const speed = (i + 1) * 0.5;
        shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Particle Background */}
      <div className="particles-container"></div>

      {/* Animated Background */}
      <div className="bg-animation">
        <div className="floating-shapes">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`shape shape-${i}`}></div>
          ))}
        </div>
        <div className="grid-overlay"></div>
        <div className="gradient-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`navbar navbar-professional ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <img src="/logo.png" className="brand-logo" alt="JMC-TEST Logo" />
            </div>
            <span className="logo-text">JMC-TEST</span>
          </Link>
          <div className="nav-links">
            <a href="#features" className="nav-link-pro">Features</a>
            <a href="#testimonials" className="nav-link-pro">Testimonials</a>
            <a href="#about" className="nav-link-pro">About</a>
            <a href="#contact" className="nav-link-pro">Contact</a>
          </div>
          <div className="nav-buttons">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary btn-premium">Get Started Free</Link>
          </div>
          <button 
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Testimonials</a>
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
          <div className="mobile-menu-buttons">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started Free</Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge reveal">
            <span className="badge-icon">🚀</span>
            <span>Trusted by 200+ Colleges Across India</span>
          </div>
          <h1 className="hero-title">
            <span className="title-line reveal reveal-delay-1">Transform Your Career with</span>
            <span className="title-gradient reveal reveal-delay-2">India's #1 Placement Portal</span>
          </h1>
          <p className="hero-description reveal reveal-delay-3">
            Connect with Fortune 500 companies, track your Placement journey, and
            land your dream job. The most trusted platform for students, colleges,
            and recruiters.
          </p>
          <div className="hero-buttons reveal reveal-delay-4">
            <Link to="/register" className="btn btn-primary btn-lg btn-premium btn-magnetic">
              <span>Start Free Today</span>
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/login" className="btn btn-glass btn-lg">
              <span>Already a Member? Sign In</span>
            </Link>
          </div>
          <div className="hero-stats reveal reveal-delay-4">
            <div className="stat-item">
              <span className="stat-number" data-count="15000">0</span><span className="stat-number">+</span>
              <span className="stat-label">Students Placed</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number" data-count="500">0</span><span className="stat-number">+</span>
              <span className="stat-label">Partner Companies</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number" data-count="98">0</span><span className="stat-number">%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1" data-parallax="0.2">
            <div className="card-icon">📊</div>
            <div className="card-text">
              <span className="card-title">Real-time Analytics</span>
              <span className="card-desc">Track your progress instantly</span>
            </div>
          </div>
          <div className="floating-card card-2" data-parallax="0.3">
            <div className="card-icon">✅</div>
            <div className="card-text">
              <span className="card-title">Smart Assessments</span>
              <span className="card-desc">AI-powered skill tests</span>
            </div>
          </div>
          <div className="floating-card card-3" data-parallax="0.25">
            <div className="card-icon">🎯</div>
            <div className="card-text">
              <span className="card-title">Job Matching</span>
              <span className="card-desc">Find perfect opportunities</span>
            </div>
          </div>
          <div className="hero-3d-element">
            <div className="cube">
              <div className="cube-face front"></div>
              <div className="cube-face back"></div>
              <div className="cube-face right"></div>
              <div className="cube-face left"></div>
              <div className="cube-face top"></div>
              <div className="cube-face bottom"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="trust-badges container reveal">
        <div className="trust-badge">
          <div className="trust-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span>100% Secure</span>
        </div>
        <div className="trust-badge">
          <div className="trust-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span>24/7 Support</span>
        </div>
        <div className="trust-badge">
          <div className="trust-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span>Verified Companies</span>
        </div>
        <div className="trust-badge">
          <div className="trust-badge-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span>4.9★ Rating</span>
        </div>
      </div>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-badge">Powerful Features</span>
            <h2 className="section-title">Everything You Need to Succeed</h2>
            <p className="section-description">
              Comprehensive tools designed to streamline your Placement journey from start to finish
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard 
              icon={<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />}
              title="Smart Dashboard"
              description="AI-powered personalized dashboards with real-time insights, progress tracking, and actionable recommendations."
              delay="1"
            />
            <FeatureCard 
              icon={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
              title="Advanced Test Engine"
              description="Create and manage skill assessments with MCQ, coding challenges, and automated proctoring features."
              delay="2"
            />
            <FeatureCard 
              icon={<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
              title="Deep Analytics"
              description="Comprehensive reports with Placement trends, performance metrics, and predictive insights."
              delay="3"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-professional" id="contact">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand-pro">
              <Link to="/" className="logo">
                <div className="logo-icon">
                  <img src="/logo.png" className="brand-logo" alt="JMC-TEST Logo" />
                </div>
                <span className="logo-text">JMC-TEST</span>
              </Link>
              <p>India's most trusted Placement management platform. Connecting talent with opportunities since 2020.</p>
            </div>
            <div className="footer-column-pro">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/login">→ Student Login</Link></li>
                <li><Link to="/login">→ Staff Login</Link></li>
                <li><Link to="/register">→ Register Now</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom-pro">
            <p>© 2026 JMC-TEST. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }) => (
  <div className={`feature-card glass-panel glass-panel-hover reveal reveal-delay-${delay}`}>
    <div className="feature-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icon}
      </svg>
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default LandingPage;
