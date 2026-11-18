import React, { useEffect, useRef, useState } from 'react';

const HUB = { name: 'Coimbatore', x: 733, y: 415 };
const NODES = [
  { name: 'Canada', x: 135, y: 232, region: 'na', cases: 18, tags: ['Cyber Fraud', 'Online Harassment'] },
  { name: 'United States', x: 142, y: 314, region: 'na', cases: 42, tags: ['Cyber Fraud', 'Data Breach Investigation', 'Intellectual Property Theft'] },
  { name: 'UK', x: 466, y: 248, region: 'europe', cases: 31, tags: ['Financial Fraud', 'Digital Forensics'] },
  { name: 'Germany', x: 507, y: 259, region: 'europe', cases: 16, tags: ['Data Breach Investigation'] },
  { name: 'UAE', x: 656, y: 371, region: 'me', cases: 37, tags: ['Financial Fraud', 'Crypto Tracing'] },
  { name: 'India', x: 737, y: 382, region: 'asia', cases: 290, tags: ['Cyber Fraud', 'Digital Forensics', 'Social Media Crimes'], ly: -10 },
  { name: 'Singapore', x: 824, y: 447, region: 'asia', cases: 22, tags: ['Corporate Investigation'] },
  { name: 'Australia', x: 926, y: 535, region: 'aus', cases: 19, tags: ['IP Theft', 'Data Breach Investigation'], lx: -70 },
  { name: 'South Africa', x: 558, y: 549, region: 'africa', cases: 12, tags: ['Financial Fraud'] },
];

const MASK =
  'AAAH/4///+AAV4AAAADwAAAAAAAD/w///8AAeAAAAABwAAAAAABDvj///8AAfAAAAAA8AAAAAAZr/n///8AAeAAAAAAMAAAAAAAoPv///8AAOgAAAAAIAAAAAAQEfH///8AAEgAAAAAAAAAAACAAeD///8AAMAAAAAAEAAAAAGAG/H///4AAAAAAGAAOAAAAANozCD///8AAAAAAeAAfwAAAAB2xEAH//8AAAAAA4AD/4AOAAB8V+AH//8AAAAABgAP/wAOwAAQA+AD//8AAAAABAAf/gAAAAeACAAD//4AAAAADAAf/gAAAAPCfVAB//4AAAAACAD//+YGAAfee+AB//4AAAAAGBj///8EAAf6Y/gB//wAAAAAEBl///8HwAL+O/4A//4AAAAAODf///9/wAD/G/8Bf/oAAAcAGD///////CR/mO+B//4AAB8AAD///////v9/LMeAf/wAAD/AAb/////////GLseA//AAAH/wFdv//////////svA/8AAAH/5f/v//////////8Pw/4AAAP/5f/f//////////wOg/wLgAP/H/////////////4+A/AHgAfPX/////////////sPA/AHAA/f//////////////IHAeAAAB+//////////////+EhAOAAAD8//////////////8A4AOAAAD8//////////+///8A8gCAAAD+z/////////8f//8A8gAAAADcf////////8EH//+A/wAAABAcf////////4BH///gfwAAABAo/////////wBD///w/4AAABhQ/////////gBB///9/8AAAGg3/////////yBB///8/+AAAHz//////////+BA/////8AAAB3//////////+BA/////4AAAAP//////////6AAf///9HAAAAf//////////6AAH////AAAAA///////////6AAP////oAAAAf/8vn//////wAAP///+gAAAAf38PP//////iAAf///4AAAAH4T4Hn/////+GAAP///4AAAAH4N93j/////8AAAP///wAAAAHwFv/n////+oEAAP///gAAAAHgIv/j////+MEAAH///gAAAAAPgBf//////EcAAH///AAAAAD/gAf//////BQAAB//+AAAAAH/wg///////CAAABf/8AAAAAH/9////////AAAAA/8CAAAAAP////v/////gAAAA/4CAAAAAf///f3/////AAAAAX4AAAAAA////PyD///+AAAAALwCAAAAA////v/B///8AAAAAB4wgAAAB////3/Afz+AAAAAAB4gMAAAA////3/Afh+gAAAAAAfgAAAAA////z8AeB+AgAAAAAB4AAAAB////7wAcAfAAAAAAAAYAAAAB////8AAMAfAQAAAAAAIeQAAA////+wAMATAgAAAAAAG/4AAAf////wACAQAIAAAAAAA/8AAAP////gACAIAAAAAAAAA//gAAAC///gAAAsGAAAAAAAA//gAAAA///AAAAceAAAAAAAB//gAAAA//8AAAAM9AAAAAAAD//8AAAA//4AAAAMdBYAAAAAD///gAAAf/4AAAAGBgfEAAAAB///4AAAP/wAAAABAAviAAAAB///4AAAP/4AAAAADoGgAAAAA///wAAAP/4AAAAAAAAAAAAAAf//gAAAP/4QAAAAADyAAAAAAf//gAAAf/4wAAAAAPjAAAAAAH//gAAAf/xwAAAAAf7AAAAAAD//AAAAP/hgAAAAA//gAAAAAD//AAAAP/hgAAAAH//wAAAAAD/8AAAAH/hgAAAAH//wAAAAAH/wAAAAH/BAAAAAH//4AAAAAH/wAAAAH+AAAAAAH//8AAAAAH/wAAAAD+AAAAAAH//8AAAAAH/gAAAAD8AAAAAAH//8AAAAAH/AAAAAD4AAAAAAHw/4AAAAAH+AAAAAAAAAAAAACAPwAAAAAP8AAAAAAAAAAAAAAAHwAAAAAP8AAAAAAAAAAAAAAACgAAAAAPwAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAgAAAAAPAAAAAAAAAAAAAAAAAgAAAAAPAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAcMAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAA';

export default function CiWorldMap() {
  const canvasRef = useRef(null);
  const mapSvgRef = useRef(null);
  const tipRef = useRef(null);
  const [activeRegion, setActiveRegion] = useState('all');
  const [activeTooltip, setActiveTooltip] = useState({ show: false, name: '', cases: 0, tags: [], style: {} });

  // Draw Dots on Canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const W = 1014;
    const COLS = 144;
    const STEP = 7;
    const k = cv.width / W;

    const bin = atob(MASK);
    cx.clearRect(0, 0, cv.width, cv.height);

    for (let i = 0; i < COLS * 95; i++) {
      if (!((bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1)) continue;
      const c = i % COLS;
      const r = (i / COLS) | 0;
      cx.fillStyle = `rgba(${70 + (r % 3) * 20},${90 + (c % 4) * 10},255,${0.35 + ((c * 7 + r * 13) % 10) / 22})`;
      cx.beginPath();
      cx.arc((c + 0.5) * STEP * k, (r + 0.5) * STEP * k, 1.6 * k, 0, 6.283);
      cx.fill();
    }
  }, []);

  // Animate Arcs and Packets
  useEffect(() => {
    const svg = mapSvgRef.current;
    if (!svg) return;

    const gArcs = svg.querySelector('#ciArcs');
    const gPk = svg.querySelector('#ciPackets');
    const gNodes = svg.querySelector('#ciNodes');
    if (!gArcs || !gPk || !gNodes) return;

    gArcs.innerHTML = '';
    gPk.innerHTML = '';
    gNodes.innerHTML = '';

    const NS = 'http://www.w3.org/2000/svg';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const packets = [];
    const nodeObjMap = [];

    const W = 1014;
    const H = 665;

    const el = (n, a = {}) => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      return e;
    };

    NODES.forEach((n, i) => {
      const dx = HUB.x - n.x;
      const dy = HUB.y - n.y;
      const dist = Math.hypot(dx, dy);
      const sign = n.y <= HUB.y ? -1 : 1;
      const cx = (n.x + HUB.x) / 2;
      const cy = (n.y + HUB.y) / 2 + sign * dist * 0.22;
      const path = el('path', { d: `M${n.x},${n.y} Q${cx},${cy} ${HUB.x},${HUB.y}`, class: 'ci-arc' });
      gArcs.appendChild(path);
      n.arc = path;
      const len = path.getTotalLength();

      if (!reduce) {
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
          duration: 1600,
          delay: 300 + i * 180,
          fill: 'forwards',
          easing: 'ease-out',
        }).onfinish = () => {
          path.style.strokeDasharray = '';
          path.style.strokeDashoffset = '';
          path.classList.add('is-flow');
        };

        const pk = el('circle', { r: 3, fill: '#fff', filter: 'url(#ciGlow)', opacity: 0 });
        gPk.appendChild(pk);
        packets.push({ pk, path, len, speed: 0.00012 + (i % 3) * 0.00004, t: (i * 0.17) % 1 });
      }

      const g = el('g', { class: 'ci-node', tabindex: 0, role: 'button', 'aria-label': n.name });
      g.append(
        el('circle', { class: 'ring', cx: n.x, cy: n.y, r: 7 }),
        el('circle', { class: 'halo', cx: n.x, cy: n.y, r: 11 }),
        el('circle', { class: 'core', cx: n.x, cy: n.y, r: 4.5 })
      );
      const t = el('text', { x: n.x + (n.lx ?? 12), y: n.y + (n.ly ?? -9) });
      t.textContent = n.name;
      g.appendChild(t);

      const handleFocus = () => focusNode(n, true);
      g.addEventListener('mouseenter', handleFocus);
      g.addEventListener('focus', handleFocus);
      g.addEventListener('click', handleFocus);

      gNodes.appendChild(g);
      n.g = g;
      nodeObjMap.push(n);
    });

    // Hub node
    const hub = el('g', { class: 'ci-node is-hub' });
    hub.append(
      el('circle', { class: 'ring', cx: HUB.x, cy: HUB.y, r: 9 }),
      el('circle', { class: 'halo', cx: HUB.x, cy: HUB.y, r: 14 }),
      el('circle', { class: 'core', cx: HUB.x, cy: HUB.y, r: 6 })
    );
    const ht = el('text', { x: HUB.x - 30, y: HUB.y + 30 });
    ht.textContent = HUB.name;
    hub.appendChild(ht);
    gNodes.appendChild(hub);

    let last = performance.now();
    let animId = null;

    function animPackets(now) {
      const dt = now - last;
      last = now;
      packets.forEach((p) => {
        p.t += p.speed * dt;
        if (p.t > 1) p.t = 0;
        const pt = p.path.getPointAtLength(p.t * p.len);
        p.pk.setAttribute('cx', pt.x);
        p.pk.setAttribute('cy', pt.y);
        p.pk.setAttribute('opacity', p.path.classList.contains('is-dim') ? 0 : Math.sin(p.t * Math.PI));
      });
      animId = requestAnimationFrame(animPackets);
    }

    if (!reduce) {
      animId = requestAnimationFrame(animPackets);
    }

    let paused = false;
    let rt = null;

    function focusNode(n, user) {
      if (n.g.classList.contains('is-dim')) return;
      NODES.forEach((o) => o.g.classList.toggle('is-active', o === n));

      const px = (n.x / W) * 100;
      const py = (n.y / H) * 100;

      setActiveTooltip({
        show: true,
        name: n.name,
        cases: n.cases,
        tags: n.tags,
        style: {
          left: px > 55 ? 'auto' : `calc(${px}% + 16px)`,
          right: px > 55 ? `calc(${100 - px}% + 16px)` : 'auto',
          top: `min(${py}%, calc(100% - 150px))`,
        },
      });

      if (user) {
        paused = true;
        clearTimeout(rt);
        rt = setTimeout(() => {
          paused = false;
        }, 8000);
      }
    }

    let idx = 0;
    const interval = setInterval(() => {
      if (paused || reduce) return;
      const v = NODES.filter((n) => !n.g.classList.contains('is-dim'));
      if (v.length) focusNode(v[idx++ % v.length], false);
    }, 4000);

    // Initial focus on United States
    focusNode(NODES[1], false);

    svg._focusNode = focusNode;

    return () => {
      if (animId) cancelAnimationFrame(animId);
      clearInterval(interval);
      clearTimeout(rt);
    };
  }, []);

  // Handle region switching
  const handleRegionClick = (region) => {
    setActiveRegion(region);
    NODES.forEach((n) => {
      const dim = region !== 'all' && n.region !== region;
      if (n.g) n.g.classList.toggle('is-dim', dim);
      if (n.arc) n.arc.classList.toggle('is-dim', dim);
    });

    const f = NODES.find((n) => region === 'all' || n.region === region);
    if (f && mapSvgRef.current && typeof mapSvgRef.current._focusNode === 'function') {
      mapSvgRef.current._focusNode(f, true);
    }
  };

  return (
    <section className="section ci-coverage-section" id="ci-coverage">
      <div className="container">
        <div className="ci-coverage-grid">
          <div className="ci-coverage-map-col ci-reveal">
            <div className="ci-map-card">
              <div className="ci-map-head">
                <div className="ci-map-title">GLOBAL INVESTIGATION FOOTPRINT</div>
                <div className="ci-live">
                  <span className="ci-live-dot"></span>Live Investigation Network
                </div>
              </div>

              <div className="ci-world-map-wrap" id="ciMap">
                <canvas ref={canvasRef} id="ciDots" width="2028" height="1330" />
                <svg ref={mapSvgRef} className="ci-map-svg" id="ciMapSvg" viewBox="0 0 1014 665" aria-hidden="true">
                  <defs>
                    <linearGradient id="ciArcGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#22d3ee" />
                      <stop offset="1" stopColor="#a855f7" />
                    </linearGradient>
                    <filter id="ciGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g id="ciArcs"></g>
                  <g id="ciPackets"></g>
                  <g id="ciNodes"></g>
                </svg>

                {activeTooltip.show && (
                  <div
                    ref={tipRef}
                    className="ci-tip is-show"
                    id="ciTip"
                    role="status"
                    aria-live="polite"
                    style={activeTooltip.style}
                  >
                    <h4 id="ciTipName">{activeTooltip.name}</h4>
                    <div className="ci-tip-count">
                      <b id="ciTipCases">{activeTooltip.cases}</b> Cases Investigated
                    </div>
                    <ul id="ciTipList">
                      {activeTooltip.tags.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="ci-region-tabs" id="ciTabs">
                {[
                  { id: 'all', label: 'All Regions' },
                  { id: 'asia', label: 'Asia' },
                  { id: 'na', label: 'North America' },
                  { id: 'europe', label: 'Europe' },
                  { id: 'me', label: 'Middle East' },
                  { id: 'aus', label: 'Australia' },
                  { id: 'africa', label: 'Africa' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    className={activeRegion === reg.id ? 'is-active' : ''}
                    onClick={() => handleRegionClick(reg.id)}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ci-coverage-content">
            <span className="section-tag ci-reveal">
              <span className="pulse-dot"></span>GLOBAL FOOTPRINT
            </span>
            <h2 className="ci-reveal">
              From Coimbatore <span className="ci-grad-text">to the World</span>
            </h2>
            <p className="ci-reveal">
              We provide discreet digital investigation and forensics services to individuals, legal practices, corporations, and law enforcement agencies across India and internationally.
            </p>
            <div className="ci-stats-row ci-reveal">
              <div className="ci-stat-item">
                <strong data-count="15" data-suffix="+">15+</strong>
                <span>Countries Covered</span>
              </div>
              <div className="ci-stat-item">
                <strong data-count="500" data-suffix="+">500+</strong>
                <span>Cases Investigated</span>
              </div>
              <div className="ci-stat-item">
                <strong data-count="100" data-suffix="%">100%</strong>
                <span>Confidentiality Guaranteed</span>
              </div>
              <div className="ci-stat-item">
                <strong data-count="99.4" data-suffix="%" data-decimals="1">99.4%</strong>
                <span>Evidentiary Precision</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

