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
        // Fallback to env/default remains active
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
        if (
          widgetIdRef.current !== null &&
          window.grecaptcha &&
          typeof window.grecaptcha.reset === 'function'
        ) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch {
            // ignore reset error
          }
        } else if (
          window.grecaptcha &&
          typeof window.grecaptcha.reset === 'function'
        ) {
          try {
            window.grecaptcha.reset();
          } catch {
            // ignore reset error
          }
        }
      },
      getResponse: () => {
        if (
          widgetIdRef.current !== null &&
          window.grecaptcha &&
          typeof window.grecaptcha.getResponse === 'function'
        ) {
          try {
            return window.grecaptcha.getResponse(widgetIdRef.current) || '';
          } catch {
            return '';
          }
        }
        if (
          window.grecaptcha &&
          typeof window.grecaptcha.getResponse === 'function'
        ) {
          try {
            return window.grecaptcha.getResponse() || '';
          } catch {
            return '';
          }
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

    // Dynamically inject script if not present
    if (typeof window !== 'undefined' && !window.grecaptcha) {
      const existingScript = document.querySelector(
        'script[src*="google.com/recaptcha/api.js"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    const tryRender = () => {
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;

      // Ensure grecaptcha is ready and render method is available
      if (
        window.grecaptcha &&
        typeof window.grecaptcha.render === 'function' &&
        typeof window.grecaptcha.ready === 'function'
      ) {
        window.grecaptcha.ready(() => {
          if (cancelled || !containerRef.current) return;
          if (isRenderedRef.current || widgetIdRef.current !== null) return;

          // Double check container has not already been populated
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
                if (onChange) onChange(token);
              },
              'expired-callback': () => {
                if (onExpired) onExpired();
              },
              'error-callback': () => {
                if (onError) onError();
              },
            });
            widgetIdRef.current = id;
            isRenderedRef.current = true;
          } catch (err) {
            // Widget might have already rendered
            if (/already been rendered/i.test(err?.message || '')) {
              isRenderedRef.current = true;
            }
          }
        });
        return;
      }

      // Check again shortly until grecaptcha script is evaluated
      timer = setTimeout(tryRender, 200);
    };

    tryRender();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isEnabled, resolvedSiteKey, theme, size, onChange, onExpired, onError]);

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
        ...style,
      }}
    >
      <div ref={containerRef} className="recaptcha-inner-target" />
    </div>
  );
});

export default RecaptchaField;
