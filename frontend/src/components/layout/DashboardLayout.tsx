import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardNavbar from './DashboardNavbar';
import { UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  userRole: UserRole;
}

const DashboardLayout = ({ userRole }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDark } = useTheme();
  const { profile, isAuthenticated, isLoading } = useAuth();

  // Add debug logging
  useEffect(() => {
    console.log('DashboardLayout - Mounted with props:', { userRole });
    console.log('DashboardLayout - Auth state:', { 
      profile, 
      isAuthenticated, 
      isLoading,
      profileRole: profile?.role,
      expectedRole: userRole
    });
  }, [userRole, profile, isAuthenticated, isLoading]);

  // Log render
  console.log('DashboardLayout - Rendering. Auth state:', { isAuthenticated, isLoading });

  return (
    <div className="h-screen flex overflow-hidden bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      {/* Mobile sidebar */}
      <Sidebar 
        role={userRole} 
        isMobile={true}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Desktop sidebar */}
      <Sidebar role={userRole} isMobile={false} isOpen={true} />
      
      {/* Main content - with ml-64 to offset the sidebar width */}
      <div className="flex flex-col w-0 flex-1 md:ml-64 overflow-hidden">
        <DashboardNavbar
          openSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;