import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, User, FileText, Briefcase, Search, Mail, Building2 } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

const sidebarSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { path: '/user/home', label: 'Dashboard', icon: Home },
      { path: '/user/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    title: 'Career',
    items: [
      { path: '/user/offers', label: 'Browse Offers', icon: Briefcase },
      { path: '/user/companies', label: 'Browse Companies', icon: Building2 },
      { path: '/user/search', label: 'Search Students', icon: Search },
      { path: '/user/documents', label: 'My Documents', icon: FileText },
      { path: '/user/mail', label: 'Mailbox', icon: Mail },
    ],
  },
];

export function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        sections={sidebarSections}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
