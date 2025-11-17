import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { Menu } from 'lucide-react';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Initialize state from localStorage, default to false if not found
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState ? JSON.parse(savedState) : false;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // The main content area should not have left margin on small screens because the sidebar is fixed.
  // On medium screens and up, the sidebar is relative and takes up space, so we need padding.
  const mainContentClass = `flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:ml-0`;
  const mainContentPaddingClass = 'md:pl-64'; // Padding only for medium screens and up

  return (
    <div className="flex h-screen bg-brand-light">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Hamburger button - always visible and clickable on small screens */}
      <button 
        onClick={toggleSidebar} 
        className="absolute top-4 left-4 p-2 rounded-md bg-brand-green-dark text-white z-40 md:hidden"
      >
        <Menu size={24} />
      </button>

      <div className={mainContentClass}>
        <Header />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-4 md:p-6 lg:p-8 ${mainContentPaddingClass}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
