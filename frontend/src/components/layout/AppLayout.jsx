import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AiFloatingRobot from '../common/AiFloatingRobot';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#fafaf8] dark:bg-[#171717]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Interactive AI Floating Companion Robot at screen bottom */}
      <AiFloatingRobot />
    </div>
  );
};

export default AppLayout;
