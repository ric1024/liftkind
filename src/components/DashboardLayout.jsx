import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();
  const isHome =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/explore";

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-orange-500 font-semibold"
      : "text-gray-700 dark:text-gray-200 hover:text-orange-500";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md px-6 pt-1 pb-4 hidden md:flex flex-col justify-between">
        <div>
          <nav className="flex flex-col space-y-4 font-medium">
            <NavLink to="/" className={linkClass}>
              🏠 Home
            </NavLink>
            <NavLink to="/explore" className={linkClass}>
              🔍 Explore
            </NavLink>
            <NavLink to="/submit" className={linkClass}>
              ✏️ Submit a Need
            </NavLink>
            <NavLink to="/my-activity" className={linkClass}>
              📝 My Activity
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              ⚙️ Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      <main className="flex-1 px-6 pt-1 pb-4 overflow-y-auto">
        {!isHome && (
          <div className="mb-4">
            {/* Optional: Add a BackButton here */}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}