import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Building2, Users, Search, Mail } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

const sidebarSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { path: '/company/home', label: 'Dashboard', icon: Home },
      { path: '/company/profile', label: 'Company Profile', icon: Building2 },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { path: '/company/candidacies', label: 'Candidacies', icon: Users },
      { path: '/company/search', label: 'Search Candidates', icon: Search },
      { path: '/company/mail', label: 'Mailbox', icon: Mail },
    ],
  },
];

export function CompanyLayout() {
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
