import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, CalendarDays, Clock, TrendingUp, Camera } from 'lucide-react';
import { useT } from '../i18n/context';
import { layoutStrings } from '../i18n/strings/layout';
import Onboarding from './Onboarding';
import FeedbackPrompt from './FeedbackPrompt';
import { hasSeenOnboarding, setOnboardingSeen } from '../utils/uiFlags';

export default function Layout() {
  const t = useT(layoutStrings);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());

  function closeOnboarding() {
    setOnboardingSeen();
    setShowOnboarding(false);
  }

  return (
    <div className="app-container">
      <Onboarding open={showOnboarding} onClose={closeOnboarding} />
      <FeedbackPrompt />
      <Outlet />
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <Home />
            <span>{t('home')}</span>
          </NavLink>
          <NavLink to="/workouts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList />
            <span>{t('workouts')}</span>
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays />
            <span>{t('plan')}</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock />
            <span>{t('history')}</span>
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <TrendingUp />
            <span>{t('progress')}</span>
          </NavLink>
          <NavLink to="/photos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Camera />
            <span>{t('glowUp')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
