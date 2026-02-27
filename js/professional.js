/**
 * JMC-TEST - Professional Enhancement Scripts
 * Adds premium interactions, animations, and UX improvements
 */

(function () {
  "use strict";

  // ============================================
  // LOADING SCREEN
  // ============================================
  function initLoadingScreen() {
    const loadingScreen = document.querySelector(".loading-screen");
    if (!loadingScreen) return;

    // Hide loading screen after page loads
    window.addEventListener("load", () => {
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
      }, 800);
    });

    // Fallback - hide after 3 seconds regardless
    setTimeout(() => {
      if (loadingScreen && !loadingScreen.classList.contains("hidden")) {
        loadingScreen.classList.add("hidden");
      }
    }, 3000);
  }

  // ============================================
  // PARTICLE SYSTEM
  // ============================================
  function initParticles() {
    const container = document.querySelector(".particles-container");
    if (!container) return;

    const particleCount = 30;
    const colors = [
      "rgba(102, 126, 234, 0.5)",
      "rgba(118, 75, 162, 0.5)",
      "rgba(139, 92, 246, 0.5)",
      "rgba(240, 147, 251, 0.4)",
    ];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.width = `${Math.random() * 4 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      particle.style.setProperty("--duration", `${Math.random() * 20 + 15}s`);
      particle.style.setProperty("--delay", `${Math.random() * 10}s`);
      container.appendChild(particle);
    }
  }

  // ============================================
  // SCROLL PROGRESS INDICATOR
  // ============================================
  function initScrollProgress() {
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    document.body.appendChild(progressBar);

    window.addEventListener("scroll", () => {
      const windowHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      progressBar.style.width = `${progress}%`;
    });
  }

  // ============================================
  // REVEAL ON SCROLL ANIMATIONS
  // ============================================
  function initRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length === 0) return;

    const revealOnScroll = () => {
      revealElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (elementTop < windowHeight - 100) {
          element.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Initial check
  }

  // ============================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================
  window.showToast = function (message, type = "info", duration = 4000) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
      error:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

    container.appendChild(toast);

    // Close button handler
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => removeToast(toast));

    // Auto remove
    setTimeout(() => removeToast(toast), duration);
  };

  function removeToast(toast) {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 400);
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const target = document.querySelector(targetId);
        if (target) {
          const navHeight =
            document.querySelector(".navbar")?.offsetHeight || 0;
          const targetPosition = target.offsetTop - navHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  }

  // ============================================
  // NAVBAR SCROLL EFFECT
  // ============================================
  function initNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener("scroll", () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }

      // Hide/show on scroll direction (optional)
      if (currentScroll > lastScroll && currentScroll > 200) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }
      lastScroll = currentScroll;
    });
  }

  // ============================================
  // TYPING ANIMATION
  // ============================================
  function initTypingAnimation() {
    const typingElements = document.querySelectorAll("[data-typing]");

    typingElements.forEach((element) => {
      const text = element.getAttribute("data-typing");
      const speed = parseInt(element.getAttribute("data-speed")) || 50;
      element.textContent = "";

      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(typeWriter, speed);
        }
      };

      // Start when element is in view
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          typeWriter();
          observer.disconnect();
        }
      });
      observer.observe(element);
    });
  }

  // ============================================
  // COUNTER ANIMATION
  // ============================================
  function initCounterAnimation() {
    const counters = document.querySelectorAll("[data-count]");

    counters.forEach((counter) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateCounter(counter);
            observer.disconnect();
          }
        },
        { threshold: 0.5 },
      );

      observer.observe(counter);
    });
  }

  function animateCounter(element) {
    const target = parseInt(element.getAttribute("data-count"));
    const duration = 2000;
    const step = (target / duration) * 16;
    let current = 0;

    const updateCounter = () => {
      current += step;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    updateCounter();
  }

  // ============================================
  // MAGNETIC BUTTON EFFECT
  // ============================================
  function initMagneticButtons() {
    const buttons = document.querySelectorAll(".btn-magnetic");

    buttons.forEach((button) => {
      button.addEventListener("mousemove", (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "translate(0, 0)";
      });
    });
  }

  // ============================================
  // PARALLAX EFFECT
  // ============================================
  function initParallax() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");

    window.addEventListener("scroll", () => {
      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute("data-parallax")) || 0.5;
        const yPos = -(window.scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  // ============================================
  // THEME TOGGLE (Light/Dark)
  // ============================================
  function initThemeToggle() {
    const themeToggle = document.querySelector(".theme-toggle");
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", savedTheme);

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // ============================================
  // FORM VALIDATION ENHANCEMENT
  // ============================================
  function initFormValidation() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input, select, textarea");

      inputs.forEach((input) => {
        // Real-time validation
        input.addEventListener("blur", () => validateInput(input));
        input.addEventListener("input", () => {
          if (input.classList.contains("error")) {
            validateInput(input);
          }
        });
      });
    });
  }

  function validateInput(input) {
    const errorElement =
      input.parentElement.querySelector(".form-error") ||
      input.parentElement.parentElement.querySelector(".form-error");

    if (input.validity.valid) {
      input.classList.remove("error");
      if (errorElement) errorElement.textContent = "";
      return true;
    }

    input.classList.add("error");

    if (errorElement) {
      if (input.validity.valueMissing) {
        errorElement.textContent = "This field is required";
      } else if (input.validity.typeMismatch) {
        errorElement.textContent = `Please enter a valid ${input.type}`;
      } else if (input.validity.tooShort) {
        errorElement.textContent = `Minimum ${input.minLength} characters required`;
      } else {
        errorElement.textContent = "Please check this field";
      }
    }

    return false;
  }

  // ============================================
  // CURSOR GLOW EFFECT
  // ============================================
  function initCursorGlow() {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.style.cssText = `
            position: fixed;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
            pointer-events: none;
            z-index: -1;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        `;
    document.body.appendChild(glow);

    document.addEventListener("mousemove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    });

    document.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
      glow.style.opacity = "1";
    });
  }

  // ============================================
  // INITIALIZE ALL FEATURES
  // ============================================
  function init() {
    initLoadingScreen();
    initParticles();
    initScrollProgress();
    initRevealAnimations();
    initSmoothScroll();
    initNavbarScroll();
    initTypingAnimation();
    initCounterAnimation();
    initMagneticButtons();
    initParallax();
    initThemeToggle();
    initFormValidation();
    initCursorGlow();

    // Welcome toast on first visit
    if (!sessionStorage.getItem("welcomed")) {
      setTimeout(() => {
        showToast(
          "Welcome to JMC-TEST! Your journey to success starts here.",
          "success",
        );
        sessionStorage.setItem("welcomed", "true");
      }, 1500);
    }
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
