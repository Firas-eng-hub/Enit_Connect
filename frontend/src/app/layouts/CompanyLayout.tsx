import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Building2, Users, Search, Mail, BarChart2 } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

export function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const sidebarSections: SidebarSection[] = [
    {
      title: t('nav._main'),
      items: [
        { path: '/company/home', label: t('nav.home'), icon: Home },
        { path: '/company/dashboard', label: t('nav.analytics'), icon: BarChart2 },
        { path: '/company/profile', label: t('nav.profile'), icon: Building2 },
      ],
    },
    {
      title: t('nav._recruitment'),
      items: [
        { path: '/company/candidacies', label: t('nav.candidacies'), icon: Users },
        { path: '/company/search', label: t('nav.search'), icon: Search },
        { path: '/company/mail', label: t('nav.mail'), icon: Mail },
      ],
    },
  ];

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
