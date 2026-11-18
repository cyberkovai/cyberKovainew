import React, { useEffect, useRef } from 'react';

export default function CiHeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let particles = [];
    let animId = null;
    let running = false;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * (W || 1200),
        y: Math.random() * (H || 700),
        r: Math.random() * 1.5 + 0.4,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '139,32,255' : '200,75,255',
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 80 }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible && !running) {
          running = true;
          draw();
        } else if (!visible && running) {
          running = false;
          cancelAnimationFrame(animId);
        }
      },
      { threshold: 0.01 }
    );

    init();
    obs.observe(canvas.parentElement || canvas);

    const handleResize = () => {
      resize();
      particles = Array.from({ length: 80 }, createParticle);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      obs.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} id="ciParticleCanvas" className="ci-hero-canvas" aria-hidden="true" />;
}

