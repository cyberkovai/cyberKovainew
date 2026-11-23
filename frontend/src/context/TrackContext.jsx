import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TrackContext = createContext();

export const TrackProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read section from URL query or localStorage
  const getInitialTrack = () => {
    const params = new URLSearchParams(location.search);
    const sec = params.get('section') || params.get('track');
    if (sec && (sec === 'cyber' || sec === 'forensics')) return sec;
    if (location.pathname.includes('cyber-security') || location.pathname.includes('cybersecurity')) return 'cyber';
    if (location.pathname.includes('cyber-intelligence') || location.pathname.includes('digital-forensics') || location.pathname.includes('investigation') || location.pathname.includes('forensics')) return 'forensics';
    const saved = localStorage.getItem('ck_section');
    return saved === 'forensics' ? 'forensics' : 'cyber';
  };

  const [activeTrack, setActiveTrack] = useState(getInitialTrack);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sec = params.get('section') || params.get('track');
    if (sec && (sec === 'cyber' || sec === 'forensics')) {
      setActiveTrack(sec);
      localStorage.setItem('ck_section', sec);
      document.cookie = `ck_section=${sec}; path=/; max-age=2592000`;
    } else if (location.pathname.includes('cyber-security') || location.pathname.includes('cybersecurity')) {
      setActiveTrack('cyber');
      localStorage.setItem('ck_section', 'cyber');
    } else if (location.pathname.includes('cyber-intelligence') || location.pathname.includes('digital-forensics') || location.pathname.includes('investigation') || location.pathname.includes('forensics')) {
      setActiveTrack('forensics');
      localStorage.setItem('ck_section', 'forensics');
    }
  }, [location]);

  const switchTrack = (track) => {
    setActiveTrack(track);
    localStorage.setItem('ck_section', track);
    document.cookie = `ck_section=${track}; path=/; max-age=2592000`;
  };

  return (
    <TrackContext.Provider value={{ activeTrack, switchTrack }}>
      {children}
    </TrackContext.Provider>
  );
};

export const useTrack = () => useContext(TrackContext);

