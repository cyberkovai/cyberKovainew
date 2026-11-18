import React, { useEffect, useRef } from 'react';

const GLOBE_ITEMS = [
  ['Cybercrime & Online Fraud', '', 1],
  ['Volatile Memory Extraction', 'c', 0],
  ['Crypto & Blockchain Tracing', 'c', 1],
  ['SIM Swapping & OTP Fraud', 'a', 0],
  ['Digital Evidence Preservation', 'g', 1],
  ['Metadata & Timestamp Forensics', '', 0],
  ['Ransomware Incident Triage', 'r', 1],
  ['WhatsApp & Telegram Forensics', 'g', 0],
  ['Social Media Impersonation', '', 1],
  ['Business Email Compromise (BEC)', 'a', 0],
  ['Device Bit-Stream Imaging', 'c', 0],
  ['Corporate Data Theft & Espionage', 'a', 1],
  ['Fake Profile & Botnet Tracking', '', 0],
  ['Deepfake & AI Media Abuse', 'c', 0],
  ['Matrimonial & Personal Disputes', '', 0],
  ['Investment & Ponzi Scams', 'a', 0],
  ['OSINT Threat Intelligence', 'c', 1],
  ['Malicious APK & Spyware Analysis', 'r', 0],
  ['Cyberstalking & Harassment', 'r', 0],
  ['Chain of Custody Certification', 'g', 0],
  ['Extortion & Blackmail Tracing', 'r', 1],
  ['UPI & Banking Scams', 'c', 0],
  ['Dark Web Data Leak Tracing', '', 0],
  ['E-Commerce Marketplace Fraud', 'a', 0],
  ['Digital Forensics & Artifact Analysis', 'c', 1],
  ['Cryptographic SHA-256 Hashing', 'g', 0],
  ['Account Takeovers & Hacking', '', 0],
  ['Cloud & Email Forensics', '', 0],
  ['Child Digital Safety Threats', 'g', 0],
  ['Phishing & Credential Theft', 'r', 0],
  ['Defamation & Slander Evidence', '', 0],
  ['Court-Admissible Evidence Dossiers', 'g', 1],
  ['Sextortion Emergency Takedowns', 'r', 0],
  ['Insider Threat Investigation', 'a', 0],
  ['Deleted File & Artifact Carving', 'c', 0],
  ['Cross-Border LEA Reporting', 'c', 0],
  ['Cell Tower & GPS Geolocation Tracing', 'c', 0],
  ['Executive Anti-Doxxing & Privacy', 'g', 0],
];

export default function CiThreatGlobe() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    if (!stage || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId = null;
    let isDisposed = false;

    const N = GLOBE_ITEMS.length;
    const GA = Math.PI * (3 - Math.sqrt(5));
    let moved = 0;

    // Create pills on Fibonacci sphere
    const pillElements = [];
    const items = GLOBE_ITEMS.map((k, i) => {
      const y = 1 - ((i + 0.5) / N) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * GA;
      const el = document.createElement('div');
      el.className = 'pill ' + (k[1] || '') + (k[2] ? ' big' : '');
      el.innerHTML = '<i></i><span>' + k[0].replace(/&/g, '&amp;') + '</span>';
      stage.appendChild(el);
      pillElements.push(el);

      const it = { v: [Math.cos(t) * r, -y, Math.sin(t) * r], el };
      el.addEventListener('click', () => {
        if (moved < 6) focus(it.v);
      });
      el.addEventListener('pointerenter', () => el.classList.add('on'));
      el.addEventListener('pointerleave', () => el.classList.remove('on'));
      return it;
    });

    // Globe dots landmask
    const MASK_STR =
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/gAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAA4AEHf///+/8gBAP/7/nJdjwD/+AAAH/AA7f///////f4P//////h8H/gAAAf/6//f////////Mf/////9H4D8AeAA+ev///////////AP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+A/4A///////////////////////////////////////////////////////////////////////////////////////';

    const MASK = Uint8Array.from(atob(MASK_STR), (c) => c.charCodeAt(0));

    const isLand = (lat, lon) => {
      const c = Math.min(179, Math.floor((lon + 180) / 2));
      const r = Math.min(89, Math.floor((90 - lat) / 2));
      const i = r * 180 + c;
      return (MASK[i >> 3] >> (7 - (i & 7))) & 1;
    };

    const dots = [];
    const D = 9000;
    for (let i = 0; i < D; i++) {
      const y = 1 - ((i + 0.5) / D) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * GA;
      const v = [Math.cos(t) * r, -y, Math.sin(t) * r];
      const L = isLand((Math.asin(y) * 180) / Math.PI, (Math.atan2(v[0], v[2]) * 180) / Math.PI);
      if (L || i % 5 === 0) dots.push([v[0], v[1], v[2], L]);
    }

    // Coimbatore HQ marker (11.0N, 77.0E)
    const la = (11 * Math.PI) / 180;
    const lo = (77 * Math.PI) / 180;
    const home = [Math.cos(la) * Math.sin(lo), -Math.sin(la), Math.cos(la) * Math.cos(lo)];

    let W = 0;
    let H = 0;
    let R = 0;
    let ry = -lo + 0.2;
    let rx = 0.3;
    let vy = 0.0035;
    let vx = 0;
    let hover = false;
    let down = false;
    let lx = 0;
    let ly = 0;
    let anim = null;

    function resize() {
      if (!stage || !cv) return;
      const b = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = b.width;
      H = b.height;
      if (W <= 0 || H <= 0) return;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fitFactor = W < 600 ? 0.5 : W < 900 ? 0.55 : 0.58;
      R = Math.min(W * 0.5, H * 0.5) * fitFactor;
    }

    function rot(v) {
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const x1 = v[0] * cy + v[2] * sy;
      const z1 = -v[0] * sy + v[2] * cy;
      return [x1, v[1] * cx - z1 * sx, v[1] * sx + z1 * cx];
    }

    function focus(v) {
      const ty = Math.atan2(-v[0], v[2]);
      const z1 = -v[0] * Math.sin(ty) + v[2] * Math.cos(ty);
      const tx = Math.atan2(v[1], z1);
      const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
      anim = { t: 0, y0: ry, x0: rx, dy: wrap(ty - ry), dx: wrap(tx - rx) };
      vy = 0;
      vx = 0;
    }

    function frame() {
      if (isDisposed) return;
      if (anim) {
        anim.t += 0.025;
        const e = 1 - Math.pow(1 - Math.min(anim.t, 1), 3);
        ry = anim.y0 + anim.dy * e;
        rx = anim.x0 + anim.dx * e;
        if (anim.t >= 1) anim = null;
      } else if (!down) {
        if (!hover && Math.abs(vx) < 0.0005) {
          vy += (0.0035 - vy) * 0.02;
        }
        ry += hover && Math.abs(vy) < 0.004 ? 0 : vy;
        rx += vx;
        vx *= 0.95;
        if (Math.abs(vy) > 0.0035) vy *= 0.97;
      }
      rx = Math.max(-1.2, Math.min(1.2, rx));

      ctx.clearRect(0, 0, W, H);
      if (W > 0 && H > 0) {
        const cx = W / 2;
        const cy = H / 2;
        const G = R * 0.88;
        const fov = R * 3.6;

        // Ambient background glow
        const g = ctx.createRadialGradient(cx, cy, G * 0.6, cx, cy, G * 1.25);
        g.addColorStop(0, 'rgba(120, 70, 255, 0.3)');
        g.addColorStop(1, 'rgba(120, 70, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, G * 1.25, 0, 7);
        ctx.fill();

        // Inner dark globe core
        ctx.fillStyle = 'rgba(18, 10, 42, 0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, G, 0, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(167, 120, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dotted world landmass
        for (const d of dots) {
          const p = rot(d);
          const s = fov / (fov - p[2] * G);
          const f = p[2] > 0;
          if (d[3]) {
            ctx.fillStyle = f ? `rgba(205,170,255,${0.55 + 0.45 * p[2]})` : 'rgba(150,110,230,0.16)';
          } else {
            ctx.fillStyle = f ? `rgba(120,90,200,${0.12 + 0.12 * p[2]})` : 'rgba(120,90,200,0.04)';
          }
          const z = d[3] ? (f ? 2.6 : 1.6) : 1.2;
          ctx.fillRect(cx + p[0] * G * s - z / 2, cy + p[1] * G * s - z / 2, z, z);
        }

        // Coimbatore HQ Radar Pulse
        const hp = rot(home);
        if (hp[2] > -0.05) {
          const s = fov / (fov - hp[2] * G);
          const x = cx + hp[0] * G * s;
          const y = cy + hp[1] * G * s;
          const k = (performance.now() % 1800) / 1800;
          ctx.strokeStyle = `rgba(34,211,238,${1 - k})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 4 + k * 22, 0, 7);
          ctx.stroke();
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 7);
          ctx.fill();
          ctx.fillStyle = '#e6fbff';
          ctx.font = '600 11px system-ui, -apple-system, sans-serif';
          ctx.fillText('Coimbatore (HQ)', x + 10, y + 4);
        }

        // 3D Fibonacci Pills positioning
        const PR = R * 1.18;
        for (const it of items) {
          const p = rot(it.v);
          const s = fov / (fov - p[2] * PR);
          const sc = Math.min(s * (0.75 + (0.25 * (p[2] + 1)) / 2), 1.22);
          const x = cx + p[0] * PR * s;
          const y = cy + p[1] * PR * s * 0.94;
          const o = p[2] < 0 ? 0.05 + 0.15 * (p[2] + 1) : 0.35 + 0.65 * p[2];
          it.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${sc})`;
          it.el.style.opacity = o;
          it.el.style.zIndex = Math.round((p[2] + 1) * 100);
          it.el.style.pointerEvents = p[2] > -0.1 ? 'auto' : 'none';
        }
      }

      animId = requestAnimationFrame(frame);
    }

    const onPointerDown = (e) => {
      down = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      anim = null;
      stage.classList.add('drag');
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerMove = (e) => {
      if (!down) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      ry += dx * 0.007;
      rx -= dy * 0.007;
      vy = dx * 0.007;
      vx = -dy * 0.007;
    };

    const onPointerUp = (e) => {
      down = false;
      stage.classList.remove('drag');
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerCancel = () => {
      down = false;
      stage.classList.remove('drag');
    };

    const onPointerEnter = (e) => {
      if (e.pointerType === 'mouse') hover = true;
    };

    const onPointerLeave = () => {
      hover = false;
    };

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    stage.addEventListener('pointerenter', onPointerEnter);
    stage.addEventListener('pointerleave', onPointerLeave);

    window.addEventListener('resize', resize);
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(stage);

    resize();
    animId = requestAnimationFrame(frame);

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      stage.removeEventListener('pointerenter', onPointerEnter);
      stage.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
      pillElements.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div className="ci-globe-wrapper ci-reveal">
      <div id="globe-stage" ref={stageRef}>
        <canvas id="globe-cv" ref={canvasRef} />
        <div id="globe-hint">
          <span className="globe-hint-icon">🌐</span>
          <span>Drag to rotate · Click any keyword to focus · Auto-rotating</span>
        </div>
      </div>
    </div>
  );
}

