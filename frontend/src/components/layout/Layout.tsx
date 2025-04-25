import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  sidebarLinks?: { to: string; icon: ReactNode; label: string }[];
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = false,
  sidebarLinks = [],
  title = 'Predicción de Goles - Fútbol Colombiano',
}) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row">
            {showSidebar && sidebarLinks.length > 0 && (
              <div className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0 md:mr-6">
                <Sidebar links={sidebarLinks} />
              </div>
            )}
            
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;