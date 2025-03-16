import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../../context/ThemeContext';

const MainLayout = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;