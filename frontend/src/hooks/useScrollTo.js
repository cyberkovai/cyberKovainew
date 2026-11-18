import { useCallback } from 'react';

/**
 * useScrollTo hook
 * Provides helper functions for smooth animated scrolling to any target
 */
export function useScrollTo() {
  /**
   * Scroll smoothly to top of the page
   */
  const scrollToTop = useCallback((options = {}) => {
    const { duration = 1.0 } = options;
    if (window.lenis) {
      window.lenis.scrollTo(0, {
        duration,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    }
  }, []);

  /**
   * Scroll smoothly to a specific DOM element or selector with header offset
   */
  const scrollToElement = useCallback((target, options = {}) => {
    const { offset = -90, duration = 1.0 } = options;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    if (window.lenis) {
      window.lenis.scrollTo(el, { offset, duration });
    } else {
      const top = el.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    }
  }, []);

  /**
   * Scroll smoothly to a specific section by its HTML id
   */
  const scrollToSection = useCallback((sectionId, options = {}) => {
    const cleanId = sectionId.replace(/^#/, '');
    const el = document.getElementById(cleanId);
    if (el) {
      scrollToElement(el, options);
    }
  }, [scrollToElement]);

  return {
    scrollToTop,
    scrollToElement,
    scrollToSection,
  };
}

export default useScrollTo;
