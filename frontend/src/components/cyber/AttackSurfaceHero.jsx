import React, { useEffect, useRef, useState } from 'react';

const NAMES = ['Application Security', 'Network Security', 'Cloud Security', 'Enterprise Security'];
const TINT = [
  [192, 132, 252],
  [129, 140, 248],
  [167, 139, 250],
  [232, 121, 249],
];
const ISSUE = [
  ['SQLi', 'XSS', 'IDOR', 'Weak auth'],
  ['Open port', 'Rogue AP', 'DDoS', 'Sniffing'],
  ['Open bucket', 'Weak IAM', 'Misconfig', 'Exposed key'],
  ['Phishing', 'Unpatched', 'Shadow IT', 'Malware'],
];

export default function AttackSurfaceHero() {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeZone, setActiveZone] = useState(0);
  const [exposureRate, setExposureRate] = useState('0.0%');
  const [fixedCounts, setFixedCounts] = useState([128, 96, 74, 51]);

  useEffect(() => {
    const box = boxRef.current;
    const cv = canvasRef.current;
    if (!box || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0,
      H = 0,
      dpr = 1,
      r = 10,
      t = 0,
      cells = [],
      byZone = [[], [], [], []],
      vulns = 0,
      active = 0,
      actT = 0,
      lastNow = 0;
    const fixed = [128, 96, 74, 51];
    let animId = null;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth || 500;
      H = box.clientHeight || 340;
      if (W <= 0 || H <= 0) return;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      r = Math.max(10, W / 33);
      cells = [];
      byZone = [[], [], [], []];
      vulns = 0;
      const cx = W / 2,
        cy = H / 2,
        rx = W * 0.47,
        ry = H * 0.45,
        dx = 1.5 * r,
        dy = 1.7321 * r;
      for (let c = 0; c * dx < W; c++) {
        for (let j = 0; j * dy < H; j++) {
          const x = r + c * dx,
            y = r * 0.87 + j * dy + (c % 2 ? dy / 2 : 0),
            d = Math.sqrt(Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2));
          if (d > 1) continue;
          const z = y < cy ? (x < cx ? 0 : 1) : x < cx ? 2 : 3;
          const cell = { x, y, z, a: 1 - Math.pow(d, 3) * 0.85, st: 0, t: 0, life: 0, txt: '' };
          cells.push(cell);
          byZone[z].push(cell);
        }
      }
      if (reduce) seedStatic();
    }

    function hex(x, y, rr) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
    }

    function setActive(i) {
      active = i;
      setActiveZone(i);
    }

    function spawn() {
      const z = Math.random() < 0.6 ? active : (Math.random() * 4) | 0;
      const pool = byZone[z];
      if (!pool || !pool.length) return;
      const c = pool[(Math.random() * pool.length) | 0];
      if (!c || c.st || c.a < 0.5) return;
      c.st = 1;
      c.t = 0;
      c.life = 1.5 + Math.random() * 1.8;
      c.txt = ISSUE[z][(Math.random() * 4) | 0];
      vulns++;
    }

    function seedStatic() {
      [
        [10, 0],
        [60, 1],
        [110, 2],
        [160, 1],
        [200, 3],
      ].forEach((p, i) => {
        const c = cells[p[0] * 1 + i * 3];
        if (c) {
          c.st = p[1] === 1 ? 1 : 0;
          c.t = 0.3;
          c.txt = ISSUE[c.z][i % 4];
          c.life = 99;
          if (i % 2) {
            c.st = 2;
            c.t = 0.3;
          }
        }
      });
      cells.forEach((c) => {
        if (c.st === 1) vulns++;
      });
      setActive(0);
      if (cells.length) setExposureRate(((vulns / cells.length) * 100).toFixed(1) + '%');
    }

    function draw(now) {
      if (!now) now = performance.now();
      let dt = 0;
      if (!reduce) {
        dt = lastNow ? Math.min(0.05, Math.max(0, (now - lastNow) / 1000)) : 0.016;
        lastNow = now;
        if (!document.hidden) t += dt;
      }
      ctx.clearRect(0, 0, W, H);
      const s = ((t * 0.16) % 1.5) - 0.25;

      cells.forEach((c) => {
        const p = (c.x / W + c.y / H) / 2;
        const b = Math.exp(-Math.pow((p - s) / 0.055, 2));
        const T = TINT[c.z];
        const boost = c.z === active ? 0.07 : 0;
        if (c.st === 1) {
          c.t += dt;
          if (c.t > c.life) {
            c.st = 2;
            c.t = 0;
          }
        } else if (c.st === 2) {
          c.t += dt;
          if (c.t > 0.8) {
            c.st = 0;
            vulns--;
            fixed[c.z]++;
            setFixedCounts([...fixed]);
          }
        }
        const fa = 0.05 + 0.1 * b + boost;
        const sa = 0.2 + 0.55 * b + boost * 2.2;
        ctx.fillStyle = `rgba(${T.join(',')},${fa * c.a})`;
        ctx.strokeStyle = `rgba(${T.join(',')},${sa * c.a})`;
        ctx.lineWidth = 1;
        hex(c.x, c.y, r * 0.9);
        ctx.fill();
        ctx.stroke();

        if (c.st === 1) {
          const pu = 0.5 + 0.5 * Math.sin(t * 9 + c.x);
          ctx.shadowColor = '#ff4d6d';
          ctx.shadowBlur = 14;
          ctx.fillStyle = `rgba(255,77,109,${0.28 + 0.3 * pu})`;
          ctx.strokeStyle = 'rgba(255,100,130,.95)';
          ctx.lineWidth = 1.5;
          hex(c.x, c.y, r * 0.9);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
          const k = Math.min(1, c.t / 0.5);
          ctx.strokeStyle = `rgba(255,77,109,${0.6 * (1 - k)})`;
          hex(c.x, c.y, r * (0.9 + k * 1.4));
          ctx.stroke();
          ctx.font = '500 9.5px "IBM Plex Mono",monospace';
          ctx.fillStyle = 'rgba(255,170,188,.95)';
          if (c.x > W * 0.68) {
            ctx.textAlign = 'right';
            ctx.fillText(c.txt.toUpperCase(), c.x - r - 3, c.y + 3);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(c.txt.toUpperCase(), c.x + r + 3, c.y + 3);
          }
        } else if (c.st === 2) {
          const k2 = c.t / 0.8;
          ctx.shadowColor = '#5eead4';
          ctx.shadowBlur = 14;
          ctx.fillStyle = `rgba(94,234,212,${0.4 * (1 - k2) + 0.1})`;
          ctx.strokeStyle = 'rgba(94,234,212,.95)';
          ctx.lineWidth = 1.5;
          hex(c.x, c.y, r * 0.9);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `rgba(94,234,212,${1 - k2})`;
          hex(c.x, c.y, r * (0.9 + k2 * 1.6));
          ctx.stroke();
        }
      });
      ctx.textAlign = 'left';

      // Scan band line
      const g = ctx.createLinearGradient(2 * s * W, 0, 0, 2 * s * H);
      g.addColorStop(0, 'rgba(94,234,212,0)');
      g.addColorStop(0.5, 'rgba(94,234,212,.55)');
      g.addColorStop(1, 'rgba(94,234,212,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2 * s * W, 0);
      ctx.lineTo(0, 2 * s * H);
      ctx.stroke();

      if (!reduce) {
        if (!document.hidden) {
          actT += dt;
          if (actT >= 5) {
            actT = 0;
            setActive((active + 1) % 4);
          }
          if (vulns < 7 && Math.random() < 0.06) spawn();
          if (cells.length) setExposureRate(((vulns / cells.length) * 100).toFixed(1) + '%');
        }
        animId = requestAnimationFrame(draw);
      }
    }

    size();
    window.addEventListener('resize', size);
    if (!reduce) setActive(0);
    lastNow = performance.now();
    animId = requestAnimationFrame(draw);

    box._setActive = (k) => {
      actT = 0;
      setActive(k);
    };

    return () => {
      window.removeEventListener('resize', size);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleChipClick = (k) => {
    if (boxRef.current && typeof boxRef.current._setActive === 'function') {
      boxRef.current._setActive(k);
    }
  };

  return (
    <div className="ck-visual-wrapper">
      <div className="cap">
        ATTACK SURFACE · LIVE <span>EXPOSURE <b>{exposureRate}</b></span>
      </div>

      <div className="ck-visual" id="ck" ref={boxRef}>
        <canvas id="cv" ref={canvasRef} aria-hidden="true"></canvas>

        {NAMES.map((name, idx) => (
          <div
            key={name}
            className={`chip z${idx} ${activeZone === idx ? 'on' : ''}`}
            onClick={() => handleChipClick(idx)}
          >
            <i></i>
            <div>
              {name}
              <small>
                <b>{fixedCounts[idx]}</b> patched
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="leg">
        <span style={{ '--k': '#ff4d6d' }}>Vulnerable</span>
        <span style={{ '--k': '#5eead4' }}>Patched</span>
        <span style={{ '--k': '#a855f7' }}>Secure</span>
      </div>
    </div>
  );
}

