import React from 'react';

const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Consultation & Scoping',
    desc: 'Confidential case assessment under strict NDA to understand case requirements and define investigation scope.',
  },
  {
    num: '02',
    title: 'Evidence Acquisition',
    desc: 'Forensic bit-stream disk and device imaging adhering strictly to ISO/IEC 27037 standards.',
  },
  {
    num: '03',
    title: 'Forensic Analysis & OSINT',
    desc: 'Artifact extraction, deleted data recovery, timeline reconstruction, and cross-platform intelligence correlation.',
  },
  {
    num: '04',
    title: 'Evidentiary Reporting',
    desc: 'Comprehensive, court-admissible forensic dossiers with cryptographic SHA-256 verification.',
  },
  {
    num: '05',
    title: 'Legal & Ongoing Advisory',
    desc: 'Expert witness testimony, law enforcement filing support, and actionable guidance for legal proceedings.',
  },
];

export default function CiProcessTimeline() {
  return (
    <section className="section ci-process-section" id="ci-process">
      <div className="container">
        <div className="section-heading text-center ci-reveal">
          <span className="section-tag">
            <span className="pulse-dot"></span>
            EVIDENTIARY PROCESS
          </span>
          <h2>
            How We Conduct <span className="ci-grad-text">Digital Investigations</span>
          </h2>
          <p>A structured, chain-of-custody compliant process designed to deliver verified facts and court-admissible results.</p>
        </div>

        <div className="ci-process-timeline-wrap ci-reveal">
          <div className="ci-process-line" aria-hidden="true">
            <div className="ci-process-flow-stream"></div>
            <div className="ci-process-glow-pulse ci-pulse-primary">
              <span className="ci-pulse-photon"></span>
            </div>
            <div className="ci-process-glow-pulse ci-pulse-secondary">
              <span className="ci-pulse-photon"></span>
            </div>
          </div>

          <div className="ci-process-track">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="ci-process-step">
                <div className="ci-process-node">
                  <span className="ci-process-node-pulse"></span>
                  <span className="ci-process-node-num">{step.num}</span>
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

