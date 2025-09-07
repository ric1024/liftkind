import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar w-64 bg-white dark:bg-gray-800 shadow-md p-6 hidden md:flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-orange-500 mb-8">LiftKind</h2>
        <nav className="sidebar-nav flex flex-col space-y-4 font-medium">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active text-orange-500 font-semibold"
                : "sidebar-link text-gray-700 dark:text-gray-200 hover:text-orange-500"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active text-orange-500 font-semibold"
                : "sidebar-link text-gray-700 dark:text-gray-200 hover:text-orange-500"
            }
          >
            Explore
          </NavLink>

          <NavLink
            to="/submit"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active text-orange-500 font-semibold"
                : "sidebar-link text-gray-700 dark:text-gray-200 hover:text-orange-500"
            }
          >
            Submit a Need
          </NavLink>

          <NavLink
            to="/donate"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active text-orange-500 font-semibold"
                : "sidebar-link text-gray-700 dark:text-gray-200 hover:text-orange-500"
            }
          >
            Donate
          </NavLink>

          {/* Replace Donation History link with My Activity */}
          <NavLink
            to="/my-activity"
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active text-orange-500 font-semibold"
                : "sidebar-link text-gray-700 dark:text-gray-200 hover:text-orange-500"
            }
          >
            My Activity
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}