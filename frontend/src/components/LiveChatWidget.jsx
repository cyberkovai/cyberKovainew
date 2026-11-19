import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTrack } from '../context/TrackContext';
import { getSections } from '../api/client';
import { isSectionVisible } from '../utils/sections';

export default function LiveChatWidget({ settings = {}, sections: propSections }) {
  const [open, setOpen] = useState(true);
  const [sections, setSections] = useState(propSections || {});
  const { activeTrack } = useTrack();

  useEffect(() => {
    if (propSections && Object.keys(propSections).length > 0) {
      setSections(propSections);
    } else {
      getSections().then((s) => s && setSections(s)).catch(() => {});
    }
  }, [propSections]);

  if (!isSectionVisible(sections, 'global_chat_widget')) {
    return null;
  }

  const siteName = settings.site_name || 'Cyber Kovai';
  const contactUrl = `/contact?section=${activeTrack}`;

  return (
    <div className={`chat-widget-badge ${!open ? 'chat-closed' : ''}`} id="chatWidgetBadge" role="complementary" aria-label="Customer Support">
      {open && (
        <div className="chat-bubble-card">
          <button
            className="chat-close-btn"
            id="chatCloseBtn"
            aria-label="Close message"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <div className="chat-avatar">
            <span className="chat-online-indicator"></span>
            🛡️
          </div>
          <div className="chat-text-area">
            <p>
              Welcome to <strong>{siteName}</strong>, if you have questions simply click here — <em>online and ready to help.</em>
            </p>
            <Link to={contactUrl} className="chat-reply-action">
              Chat with an Expert ➔
            </Link>
          </div>
        </div>
      )}

      <button
        className="chat-toggle-pill"
        id="chatToggleBtn"
        aria-label="Open support chat"
        onClick={() => setOpen(!open)}
      >
        <span className="chat-pulse-ring"></span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="chat-online-label">Online</span>
      </button>
    </div>
  );
}

