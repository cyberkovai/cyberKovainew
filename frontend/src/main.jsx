import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TrackProvider } from './context/TrackContext';
import './style.css';
import './admin.css';
import './index.css';

function Root() {
  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    window.lenis = lenis;

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TrackProvider>
          <App />
        </TrackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
