import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { getRecaptchaConfig } from '../api/client';

const FALLBACK_SITE_KEY = '6LfIJwYuAAAAAGqRA8w9Y_gV0Dg13VyMmKtIB36q';

const getEnvSiteKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
      import.meta.env.RECAPTCHA_SITE_KEY ||
      ''
    );
  }
  return '';
};

const RecaptchaField = forwardRef(function RecaptchaField(
  {
    siteKey: propSiteKey,
    theme = 'dark',
    size = 'normal',
    onChange,
    onExpired,
    onError,
    className = '',
    style = {},
  },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const isRenderedRef = useRef(false);

  // Store callbacks in refs so parent re-renders don't restart the effect
  const onChangeRef = useRef(onChange);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onChangeRef.current = onChange;
    onExpiredRef.current = onExpired;
    onErrorRef.current = onError;
  });

  const [resolvedSiteKey, setResolvedSiteKey] = useState(
    propSiteKey || getEnvSiteKey() || FALLBACK_SITE_KEY
  );
  const [isEnabled, setIsEnabled] = useState(true);

  // Fetch remote config if available to honor backend toggle and latest site key
  useEffect(() => {
    let cancelled = false;
    getRecaptchaConfig()
      .then((cfg) => {
        if (cancelled || !cfg) return;
        if (typeof cfg.enabled === 'boolean') {
          setIsEnabled(cfg.enabled);
        }
        if (cfg.siteKey && !propSiteKey) {
          setResolvedSiteKey(cfg.siteKey);
        }
      })
      .catch(() => {
        // Fallback remains active
      });

    return () => {
      cancelled = true;
    };
  }, [propSiteKey]);

  // Expose imperative API for form submission/reset
  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        try {
          if (
            widgetIdRef.current !== null &&
            window.grecaptcha &&
            typeof window.grecaptcha.reset === 'function'
          ) {
            window.grecaptcha.reset(widgetIdRef.current);
          } else if (
            window.grecaptcha &&
            typeof window.grecaptcha.reset === 'function'
          ) {
            window.grecaptcha.reset();
          }
        } catch {
          // ignore reset errors
        }
      },
      getResponse: () => {
        try {
          if (
            widgetIdRef.current !== null &&
            window.grecaptcha &&
            typeof window.grecaptcha.getResponse === 'function'
          ) {
            return window.grecaptcha.getResponse(widgetIdRef.current) || '';
          }
          if (
            window.grecaptcha &&
            typeof window.grecaptcha.getResponse === 'function'
          ) {
            return window.grecaptcha.getResponse() || '';
          }
        } catch {
          return '';
        }
        return '';
      },
      getWidgetId: () => widgetIdRef.current,
    }),
    []
  );

  // Ensure reCAPTCHA script is loaded and render widget
  useEffect(() => {
    if (!isEnabled || !resolvedSiteKey) return undefined;

    let cancelled = false;
    let timer = null;
    let attempts = 0;

    // Dynamically inject script if not present
    if (typeof window !== 'undefined' && !window.grecaptcha) {
      const existingScript = document.querySelector(
        'script[src*="google.com/recaptcha/api.js"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    const doRender = () => {
      if (cancelled || !containerRef.current) return;
      if (isRenderedRef.current || widgetIdRef.current !== null) return;

      // Don't re-render if Google script or previous render already populated it
      if (containerRef.current.children.length > 0) {
        isRenderedRef.current = true;
        return;
      }

      try {
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          theme,
          size,
          callback: (token) => {
            if (typeof onChangeRef.current === 'function') {
              onChangeRef.current(token);
            }
          },
          'expired-callback': () => {
            if (typeof onExpiredRef.current === 'function') {
              onExpiredRef.current();
            }
          },
          'error-callback': () => {
            if (typeof onErrorRef.current === 'function') {
              onErrorRef.current();
            }
          },
        });
        widgetIdRef.current = id;
        isRenderedRef.current = true;
      } catch (err) {
        if (/already been rendered/i.test(err?.message || '')) {
          isRenderedRef.current = true;
        }
      }
    };

    const checkAndRender = () => {
      if (cancelled) return;

      if (
        window.grecaptcha &&
        typeof window.grecaptcha.render === 'function'
      ) {
        if (typeof window.grecaptcha.ready === 'function') {
          window.grecaptcha.ready(doRender);
        } else {
          doRender();
        }
        return;
      }

      attempts += 1;
      if (attempts < 50) {
        timer = setTimeout(checkAndRender, 200);
      }
    };

    checkAndRender();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isEnabled, resolvedSiteKey, theme, size]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      className={`recaptcha-wrapper ${className}`.trim()}
      style={{
        margin: '1.25rem 0',
        minHeight: '78px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 50,
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <div
        ref={containerRef}
        className="g-recaptcha"
        data-sitekey={resolvedSiteKey}
        data-theme={theme}
        data-size={size}
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
});

export default RecaptchaField;
