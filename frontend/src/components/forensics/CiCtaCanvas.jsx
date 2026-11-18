import React, { useEffect, useRef } from 'react';

export default function CiCtaCanvas() {
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
    let nodes = [];
    let animId = null;
    let running = false;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createNode() {
      return {
        x: Math.random() * (W || 1200),
        y: Math.random() * (H || 600),
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      };
    }

    function init() {
      resize();
      nodes = Array.from({ length: 40 }, createNode);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(139,32,255,${0.15 * (1 - d / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,75,255,0.35)';
        ctx.fill();
        n.x += n.dx;
        n.y += n.dy;
        if (n.x < 0 || n.x > W) n.dx *= -1;
        if (n.y < 0 || n.y > H) n.dy *= -1;
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
      nodes = Array.from({ length: 40 }, createNode);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      obs.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} id="ciCtaCanvas" className="ci-cta-canvas" aria-hidden="true" />;
}

