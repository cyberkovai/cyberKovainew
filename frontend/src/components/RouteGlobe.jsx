import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

// Cache loaded TopoJSON in memory so switching pages doesn't trigger re-fetch
let cachedLandData = null;

export default function RouteGlobe({ height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let isDestroyed = false;
    let animId = null;

    // Hub (Coimbatore HQ) & Global Connection Points
    const HUB = { n: 'Coimbatore (HQ)', ll: [76.9558, 11.0168], o: [14, -4], hub: 1 };
    const C = [
      { n: 'Delhi', ll: [77.20, 28.60], o: [10, -14] },
      { n: 'Hyderabad', ll: [78.48, 17.38], o: [-70, -20] },
      { n: 'Bengaluru', ll: [77.59, 12.97], o: [-78, 8] },
      { n: 'Sri Lanka', ll: [79.86, 6.93], o: [-66, 18] },
      { n: 'Singapore', ll: [103.82, 1.35], o: [10, 8] },
      { n: 'Malaysia', ll: [101.69, 3.14], o: [-62, 0] },
      { n: 'Thailand', ll: [100.50, 13.75], o: [10, -4] },
      { n: 'Vietnam', ll: [106.63, 10.82], o: [10, 4] },
      { n: 'Taiwan', ll: [121.56, 25.03], o: [10, -8] },
      { n: 'Australia', ll: [151.20, -33.87], o: [10, 0] },
      { n: 'Canada', ll: [-79.38, 43.65], o: [-58, -12] },
      { n: 'Germany', ll: [8.68, 50.11], o: [-58, -10] },
      { n: 'Saudi Arabia', ll: [46.70, 24.70], o: [-84, -4] },
      { n: 'South Africa', ll: [28.05, -26.20], o: [10, 4] }
    ];

    // Initialize routes with flight speed, arc lift height, and phase offsets
    const routes = C.map((c, i) => {
      const f = d3.geoInterpolate(HUB.ll, c.ll);
      const d = d3.geoDistance(HUB.ll, c.ll);
      return {
        c,
        f,
        d,
        lift: 0.03 + (0.13 * d) / Math.PI,
        v: 0.09 / (0.4 + d),
        off: i * 0.37
      };
    });

    const proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
    const path = d3.geoPath(proj, ctx);
    const grat = d3.geoGraticule10();

    let W = 0;
    let R = 0;
    let dpr = 1;
    let rot = [-70, -14];
    let land = null;
    const dots = [];

    // Responsive Canvas Resizing
    function resize() {
      if (isDestroyed || !cv) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const p = cv.parentElement || cv;
      const pw = p.clientWidth || 520;
      const ph = p.clientHeight || (height || 520);
      W = Math.min(pw, ph);
      if (W < 240) W = 520;

      cv.style.width = W + 'px';
      cv.style.height = W + 'px';
      cv.width = W * dpr;
      cv.height = W * dpr;
      R = W * 0.40;
      proj.scale(R).translate([W / 2, W / 2]);
    }
    window.addEventListener('resize', resize);
    resize();

    // Generate dotted land matrix from land feature geometry
    function initLand(topoData) {
      if (!topoData || !topoData.objects || !topoData.objects.land) return;
      land = topojson.feature(topoData, topoData.objects.land);

      // Rasterize equirectangular mask on hidden canvas
      const mc = document.createElement('canvas');
      mc.width = 360;
      mc.height = 180;
      const mx = mc.getContext('2d');
      if (!mx) return;

      const eq = d3.geoEquirectangular().scale(360 / (2 * Math.PI)).translate([180, 90]);
      mx.beginPath();
      d3.geoPath(eq, mx)(land);
      mx.fill();

      const md = mx.getImageData(0, 0, 360, 180).data;
      dots.length = 0;
      for (let lat = -58; lat <= 84; lat += 1.8) {
        const step = 1.8 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
        for (let lon = -180; lon < 180; lon += step) {
          const pixelIdx = (Math.floor(90 - lat) * 360 + Math.floor(lon + 180)) * 4 + 3;
          if (md[pixelIdx] > 128) {
            dots.push([lon, lat]);
          }
        }
      }
    }

    // Interactive Dragging Handlers
    let drag = false;
    let lx = 0;
    let ly = 0;
    let lastInt = -1e9;

    const onPointerDown = (e) => {
      drag = true;
      lx = e.clientX;
      ly = e.clientY;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerMove = (e) => {
      if (!drag) return;
      const k = (180 / (Math.PI * R)) * 1.1;
      rot[0] += (e.clientX - lx) * k;
      rot[1] = Math.max(-80, Math.min(80, rot[1] - (e.clientY - ly) * k));
      lx = e.clientX;
      ly = e.clientY;
      lastInt = performance.now();
    };

    const onPointerUp = (e) => {
      drag = false;
      lastInt = performance.now();
      try {
        if (cv.hasPointerCapture && cv.hasPointerCapture(e.pointerId)) {
          cv.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    };

    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', onPointerUp);
    cv.addEventListener('pointercancel', onPointerUp);

    // Compute 3D point with radial elevation (lift)
    let center = [0, 0];
    function P(ll, lift) {
      if (d3.geoDistance(ll, center) > 1.5708) return null; // Behind visible hemisphere
      const p = proj(ll);
      const k = 1 + lift;
      const m = W / 2;
      return [m + (p[0] - m) * k, m + (p[1] - m) * k];
    }

    // Vector drawing function for the Jet Aircraft
    function plane(x, y, a, s) {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.scale(s, s);

      // Exact symmetrical airplane polygon coordinate vertices
      const pts = [
        [10, 0],
        [3, -1.8],
        [-1, -9],
        [-3.5, -9],
        [-2.6, -2],
        [-8, -1.4],
        [-9.5, -4],
        [-11, -4],
        [-10, 0]
      ];

      ctx.beginPath();
      ctx.moveTo(10, 0);
      for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
      for (const p of pts.slice(1).reverse()) ctx.lineTo(p[0], -p[1]);
      ctx.closePath();

      ctx.shadowColor = isLight ? '#7514e8' : '#c084fc';
      ctx.shadowBlur = 10;
      ctx.fillStyle = isLight ? '#6219d8' : '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // Location Badge Pill
    function label(t, x, y, a, hub) {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      const w = ctx.measureText(t).width + 12;
      const h = 18;

      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(18, 8, 38, 0.85)';
      ctx.strokeStyle = hub ? '#ff4d8d' : (isLight ? 'rgba(117, 20, 232, 0.6)' : 'rgba(168, 110, 255, 0.7)');
      ctx.lineWidth = 1;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y - h / 2, w, h, 4);
      } else {
        ctx.rect(x, y - h / 2, w, h);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = hub ? '#ff4d8d' : (isLight ? '#0e0924' : '#ffffff');
      ctx.textBaseline = 'middle';
      ctx.fillText(t, x + 6, y + 0.5);
      ctx.restore();
    }

    // Main Animation Loop
    let prev = performance.now();
    let isGlobeVisible = true;
    let isGlobeRunning = false;

    function frame(now) {
      if (isDestroyed) return;

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;

      // Auto-rotation when idle for > 2 seconds
      if (!drag && now - lastInt > 2000) {
        rot[0] += 7 * dt;
      }

      proj.rotate([rot[0], rot[1]]);
      center = [-rot[0], -rot[1]];
      const t = now / 1000;
      const m = W / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);

      // 1. Atmosphere Halo Gradient
      let g = ctx.createRadialGradient(m, m, R * 0.9, m, m, R * 1.28);
      g.addColorStop(0, isLight ? 'rgba(117, 20, 232, 0.30)' : 'rgba(150, 70, 255, 0.55)');
      g.addColorStop(1, 'rgba(150, 70, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m, m, R * 1.28, 0, 2 * Math.PI);
      ctx.fill();

      // 2. Globe Dark Sphere Core
      g = ctx.createRadialGradient(m - R * 0.3, m - R * 0.3, R * 0.1, m, m, R);
      if (isLight) {
        g.addColorStop(0, '#f0ebff');
        g.addColorStop(1, '#dcd0ff');
      } else {
        g.addColorStop(0, '#1a0d33');
        g.addColorStop(1, '#07030f');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m, m, R, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = isLight ? 'rgba(117, 20, 232, 0.5)' : 'rgba(180, 120, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m, m, R, 0, 2 * Math.PI);
      ctx.stroke();

      // 3. Graticule Lat/Lon Grid Lines
      ctx.beginPath();
      path(grat);
      ctx.strokeStyle = isLight ? 'rgba(117, 20, 232, 0.2)' : 'rgba(160, 100, 255, 0.12)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // 4. Land Mass Fill & Outline
      if (land) {
        ctx.beginPath();
        path(land);
        ctx.fillStyle = isLight ? 'rgba(117, 20, 232, 0.18)' : 'rgba(120, 60, 220, 0.10)';
        ctx.fill();
        ctx.strokeStyle = isLight ? 'rgba(117, 20, 232, 0.6)' : 'rgba(190, 130, 255, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 5. Digital Dots Grid on Continents
      const r = Math.max(0.9, R / 230);
      for (const d of dots) {
        const dist = d3.geoDistance(d, center);
        if (dist > 1.5708) continue;
        const p = proj(d);
        const f = 1 - dist / 1.5708;
        ctx.fillStyle = isLight
          ? `rgba(117, 20, 232, ${0.35 + 0.65 * Math.sqrt(f)})`
          : `rgba(196, 132, 252, ${0.25 + 0.75 * Math.sqrt(f)})`;
        ctx.fillRect(p[0] - r / 2, p[1] - r / 2, r, r);
      }

      // 6. Arcs & Airplanes
      for (const rt of routes) {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = isLight ? 'rgba(117, 20, 232, 0.7)' : 'rgba(200, 150, 255, 0.55)';
        ctx.lineWidth = 1;
        let pen = false;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const u = i / 48;
          const p = P(rt.f(u), rt.lift * Math.sin(Math.PI * u));
          if (!p) {
            pen = false;
            continue;
          }
          pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          pen = true;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Airplane position & flight orientation
        const s = (t * rt.v + rt.off) % 2;
        const fw = s <= 1;
        const u = fw ? s : 2 - s;
        const dir = fw ? 1 : -1;
        const lf = (x) => rt.lift * Math.sin(Math.PI * x);
        const a = P(rt.f(u), lf(u));
        const b = P(rt.f(Math.min(1, Math.max(0, u + 0.015 * dir))), lf(u + 0.015 * dir));

        if (a && b) {
          plane(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 1.05);
        }
      }

      // 7. City Markers & Coimbatore HQ Radar Pulse
      for (const c of [...C, HUB]) {
        const p = P(c.ll, 0);
        if (!p) continue;
        const al = Math.max(0, Math.min(1, (1.45 - d3.geoDistance(c.ll, center)) / 0.35));
        ctx.globalAlpha = al;
        ctx.fillStyle = c.hub ? '#ff4d8d' : (isLight ? '#6219d8' : '#ffffff');
        ctx.beginPath();
        ctx.arc(p[0], p[1], c.hub ? 5 : 3.4, 0, 2 * Math.PI);
        ctx.fill();

        // Radar pulse for HQ
        if (c.hub) {
          const q = (t % 1.6) / 1.6;
          ctx.strokeStyle = `rgba(255, 77, 141, ${0.8 * (1 - q) * al})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 5 + q * 16, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        label(c.n, p[0] + c.o[0], p[1] + c.o[1], al, c.hub);
      }

      if (isGlobeVisible && !isDestroyed) {
        animId = requestAnimationFrame(frame);
      } else {
        isGlobeRunning = false;
      }
    }

    // IntersectionObserver to pause loop when scrolled out of view
    const parentEl = cv.parentElement || cv;
    const globeObserver = new IntersectionObserver(
      (entries) => {
        isGlobeVisible = entries[0].isIntersecting;
        if (isGlobeVisible && !isGlobeRunning && !isDestroyed) {
          isGlobeRunning = true;
          prev = performance.now();
          animId = requestAnimationFrame(frame);
        }
      },
      { threshold: 0.02 }
    );
    globeObserver.observe(parentEl);

    // Load land data
    const startRender = (topoData) => {
      if (isDestroyed) return;
      cachedLandData = topoData;
      initLand(topoData);
      if (isGlobeVisible && !isGlobeRunning) {
        isGlobeRunning = true;
        prev = performance.now();
        animId = requestAnimationFrame(frame);
      }
    };

    if (cachedLandData) {
      startRender(cachedLandData);
    } else {
      // Fetch local public copy first, fallback to CDN
      fetch('/data/land-110m.json')
        .then((r) => {
          if (!r.ok) throw new Error('Local land-110m.json not found');
          return r.json();
        })
        .then((topoData) => startRender(topoData))
        .catch(() => {
          fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
            .then((r) => r.json())
            .then((topoData) => startRender(topoData))
            .catch((err) => {
              console.error('Error loading world land data:', err);
              // Start animation anyway so globe core & routes still render
              if (isGlobeVisible && !isGlobeRunning && !isDestroyed) {
                isGlobeRunning = true;
                prev = performance.now();
                animId = requestAnimationFrame(frame);
              }
            });
        });
    }

    return () => {
      isDestroyed = true;
      if (animId) cancelAnimationFrame(animId);
      globeObserver.disconnect();
      window.removeEventListener('resize', resize);
      cv.removeEventListener('pointerdown', onPointerDown);
      cv.removeEventListener('pointermove', onPointerMove);
      cv.removeEventListener('pointerup', onPointerUp);
      cv.removeEventListener('pointercancel', onPointerUp);
    };
  }, [height]);

  return <canvas id="c" ref={canvasRef} />;
}
