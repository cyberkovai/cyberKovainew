import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * - Smoothly animates scrolling to the top of the page on route change.
 * - If a hash (e.g. #two-factor-security, #pricing) is present, smoothly animates
 *   scroll to that element with an offset for sticky headers.
 * - Integrates with Lenis smooth scroll if active, falling back to window.scrollTo.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If a hash exists, attempt to scroll to that element
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId) || document.querySelector(hash);
        if (el) {
          if (window.lenis) {
            window.lenis.scrollTo(el, { offset: -95, duration: 1.0, immediate: false });
          } else {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 95;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    }

    // No hash: smoothly scroll to top of page
    const timer = setTimeout(() => {
      if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: false, duration: 0.85 });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}
