import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTopButton
 * Floating interactive button with:
 * - Circular SVG scroll progress indicator (0 - 100%)
 * - Smooth entrance / exit animation on scroll (> 220px)
 * - Cyberpunk neon glow and hover bounce
 * - Smooth scrollTo animation using Lenis or native smooth scroll
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollY / docHeight) * 100)) : 0;

          setProgress(currentProgress);
          setVisible(scrollY > 220);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Also listen to Lenis scroll event if available
    if (window.lenis) {
      window.lenis.on('scroll', handleScroll);
    }

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.lenis) {
        window.lenis.off('scroll', handleScroll);
      }
    };
  }, [location.pathname]);

  const scrollToTop = () => {
    if (window.lenis) {
      window.lenis.scrollTo(0, {
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  if (isAdmin) {
    return null;
  }

  // SVG circle calculations
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-fab ${visible ? 'fab-visible' : ''} ${isAdmin ? 'fab-admin' : ''}`}
      aria-label="Scroll to top of page"
      title={`Scroll to top (${Math.round(progress)}%)`}
    >
      {/* Circular Progress Ring */}
      <svg className="fab-progress-ring" width="50" height="50" viewBox="0 0 50 50">
        <circle
          className="fab-ring-bg"
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          strokeWidth="2.5"
        />
        <circle
          className="fab-ring-indicator"
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Up Arrow Icon */}
      <span className="fab-arrow-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </span>
    </button>
  );
}
