import React, { useEffect, useRef, useState } from 'react';

const SERVICES = [
  {
    name: 'Digital Forensics',
    color: '#a855f7',
    run: 'Digital Forensics: recovering deleted artifacts…',
    done: 'Artifacts recovered, chain of custody logged',
    tag: 'Device image',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4M7 9l2 2-2 2M12 13h4" />
      </svg>
    ),
  },
  {
    name: 'OSINT Recon',
    color: '#22d3ee',
    run: 'OSINT Recon: linking public footprints…',
    done: 'Identity linked across public sources',
    tag: 'Profile matched',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-4.3-4.3M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    name: 'Evidence Vault',
    color: '#e879f9',
    run: 'Evidence Vault: hashing and sealing files…',
    done: 'Evidence sealed and tamper-proof',
    tag: 'Hash verified',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3M12 14v2" />
      </svg>
    ),
  },
  {
    name: 'Cyber Fraud Tracing',
    color: '#34d399',
    run: 'Cyber Fraud Tracing: following the money…',
    done: 'Beneficiary account identified',
    tag: 'Account found',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 17l5-5 4 3 8-8" />
        <path d="M15 7h5v5" />
      </svg>
    ),
  },
];

export default function CiLiveTrace() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeService, setActiveService] = useState(0);
  const [statusText, setStatusText] = useState(SERVICES[0].run);
  const [progresses, setProgresses] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let nodes = [];
    let adj = [];
    let current = 0;
    let path = [];
    let startT = performance.now();
    let doneShown = false;
    let animId = null;

    const SEG = 520;
    const HOLD = 1700;

    let seed = 7;
    function rnd() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function build() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width || root.clientWidth || 540;
      H = r.height || 270;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      seed = 7;
      nodes = [];
      const cols = 9;
      const rows = 5;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          nodes.push({
            bx: ((i + 0.5 + (rnd() - 0.5) * 0.7) / cols) * W,
            by: ((j + 0.5 + (rnd() - 0.5) * 0.7) / rows) * H,
            ph: rnd() * 6.28,
            x: 0,
            y: 0,
          });
        }
      }

      adj = nodes.map(() => []);
      nodes.forEach((a, ai) => {
        nodes
          .map((b, bi) => ({ bi, d: Math.hypot(a.bx - b.bx, a.by - b.by) }))
          .sort((p, q) => p.d - q.d)
          .slice(1, 4)
          .forEach((o) => {
            if (adj[ai].indexOf(o.bi) < 0) adj[ai].push(o.bi);
            if (adj[o.bi].indexOf(ai) < 0) adj[o.bi].push(ai);
          });
      });
    }

    function makePath(k) {
      if (k < 0) k = 0;
      seed = 100 + k * 37;
      const lefts = nodes
        .map((n, i) => i)
        .filter((i) => nodes[i].bx < W * 0.25);
      if (!lefts.length) return [0];
      let cur = lefts[Math.floor(rnd() * lefts.length)];
      const p = [cur];
      for (let s = 0; s < 7; s++) {
        const opts = adj[cur].filter((n) => p.indexOf(n) < 0 && nodes[n].bx > nodes[cur].bx - 8);
        if (!opts.length) break;
        cur = opts[Math.floor(rnd() * opts.length)];
        p.push(cur);
      }
      return p;
    }

    function select(k) {
      if (k < 0 || k >= SERVICES.length) return;
      current = k;
      setActiveService(k);
      path = makePath(k);
      startT = performance.now();
      doneShown = false;
      const s = SERVICES[k];
      setStatusText(s.run);
      root.style.setProperty('--ci-accent', s.color);
    }

    function glowLine(x1, y1, x2, y2, color, w) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    function brackets(x, y, size, color) {
      const a = size;
      const l = size * 0.45;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(x + c[0] * a, y + c[1] * (a - l));
        ctx.lineTo(x + c[0] * a, y + c[1] * a);
        ctx.lineTo(x + c[0] * (a - l), y + c[1] * a);
        ctx.stroke();
      });
      ctx.restore();
    }

    function frame(now) {
      if (!ctx || W === 0 || H === 0) return;
      ctx.clearRect(0, 0, W, H);
      const t = reduce ? 0 : now;
      nodes.forEach((n) => {
        n.x = n.bx + Math.sin(t * 0.0008 + n.ph) * 3;
        n.y = n.by + Math.cos(t * 0.0006 + n.ph) * 3;
      });

      // base graph
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(168,85,247,0.16)';
      ctx.beginPath();
      adj.forEach((list, i) => {
        list.forEach((j) => {
          if (j > i) {
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          }
        });
      });
      ctx.stroke();

      nodes.forEach((n) => {
        ctx.fillStyle = 'rgba(190,160,255,0.45)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, 6.28);
        ctx.fill();
      });

      if (!SERVICES[current] || !path.length) return;
      const s = SERVICES[current];
      const el = now - startT;
      const segs = path.length - 1;
      const travel = segs * SEG;

      // traced path
      for (let i = 0; i < segs; i++) {
        const a = nodes[path[i]];
        const b = nodes[path[i + 1]];
        if (!a || !b) break;
        const p = Math.max(0, Math.min(1, (el - i * SEG) / SEG));
        if (p <= 0) break;
        glowLine(a.x, a.y, a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, s.color, 2);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 4, 0, 6.28);
        ctx.fill();
        if (p < 1) {
          const hx = a.x + (b.x - a.x) * p;
          const hy = a.y + (b.y - a.y) * p;
          ctx.save();
          ctx.fillStyle = '#fff';
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(hx, hy, 3.5, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }
      }

      // target found
      if (el >= travel && path.length) {
        const tg = nodes[path[path.length - 1]];
        if (tg) {
          const pulse = 14 + Math.sin(now * 0.008) * 2;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(tg.x, tg.y, 5, 0, 6.28);
          ctx.fill();
          brackets(tg.x, tg.y, pulse, s.color);
          ctx.font = '600 12px "Segoe UI",system-ui,sans-serif';
          const tw = ctx.measureText(s.tag).width + 16;
          const tx = Math.min(W - tw - 6, Math.max(6, tg.x - tw / 2));
          const ty = tg.y < H / 2 ? tg.y + 24 : tg.y - 42;
          ctx.fillStyle = 'rgba(11,7,22,0.92)';
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(tx, ty, tw, 22, 6);
          } else {
            ctx.rect(tx, ty, tw, 22);
          }
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.fillText(s.tag, tx + 8, ty + 15);
          if (!doneShown) {
            setStatusText(s.done);
            doneShown = true;
          }
        }
      }

      // card progress + advance
      const total = travel + HOLD;
      const pct = Math.min(100, (el / total) * 100);
      setProgresses((prev) => {
        const next = [0, 0, 0, 0];
        next[current] = pct;
        return next;
      });

      if (!reduce && el > total) {
        select((current + 1) % SERVICES.length);
      }

      if (!reduce) {
        animId = requestAnimationFrame(frame);
      }
    }

    build();
    select(0);
    animId = requestAnimationFrame(frame);

    const ro = window.ResizeObserver
      ? new ResizeObserver(() => {
          build();
          path = makePath(current >= 0 ? current : 0);
        })
      : null;

    if (ro) ro.observe(canvas);

    root._select = select;

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleCardClick = (idx) => {
    if (rootRef.current && typeof rootRef.current._select === 'function') {
      rootRef.current._select(idx);
    }
  };

  const activeColor = SERVICES[activeService].color;

  return (
    <div className="ci-trace-wrapper ci-reveal">
      <div className="ci-trace" id="ciTrace" ref={rootRef} style={{ '--ci-accent': activeColor }}>
        <div className="ci-trace__bar">
          <span className="ci-trace__dot"></span>
          <span>Live trace</span>
          <span className="ci-trace__case">Case CK-2047 · Confidential</span>
        </div>

        <div className="ci-trace__stage">
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>

        <div className="ci-trace__status" aria-live="polite">
          <i style={{ background: activeColor }}></i>
          <b style={{ fontWeight: 500 }}>{statusText}</b>
        </div>

        <div className="ci-trace__services">
          {SERVICES.map((s, idx) => (
            <button
              key={s.name}
              className={`ci-svc ${idx === activeService ? 'is-active' : ''}`}
              type="button"
              style={{ '--c': s.color }}
              onClick={() => handleCardClick(idx)}
            >
              {s.icon}
              <span>{s.name}</span>
              <div className="ci-svc__bar" style={{ width: `${progresses[idx]}%` }}></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

