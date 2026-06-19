import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, CalendarDays, Clock, TrendingUp, Camera } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-container">
      <Outlet />
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <Home />
            <span>Home</span>
          </NavLink>
          <NavLink to="/workouts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList />
            <span>Workouts</span>
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays />
            <span>Plan</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock />
            <span>History</span>
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <TrendingUp />
            <span>Progress</span>
          </NavLink>
          <NavLink to="/photos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Camera />
            <span>Photos</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
