import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarLink {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface SidebarProps {
  title?: string;
  links: SidebarLink[];
}

const Sidebar: React.FC<SidebarProps> = ({ title = 'Panel de navegación', links }) => {
  return (
    <aside className="bg-white shadow-md rounded-lg overflow-hidden w-64">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      
      <nav className="p-2">
        <ul className="space-y-1">
          {links.map((link, index) => (
            <li key={index}>
              <NavLink
                to={link.to}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;