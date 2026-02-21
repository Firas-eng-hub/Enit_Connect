import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, User, FileText, Briefcase, Search, Mail, Building2 } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

export function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const sidebarSections: SidebarSection[] = [
    {
      title: t('nav._main'),
      items: [
        { path: '/user/home', label: t('nav.home'), icon: Home },
        { path: '/user/profile', label: t('nav.profile'), icon: User },
      ],
    },
    {
      title: t('nav._career'),
      items: [
        { path: '/user/offers', label: t('nav.offers'), icon: Briefcase },
        { path: '/user/companies', label: t('nav.companies'), icon: Building2 },
        { path: '/user/search', label: t('nav.search'), icon: Search },
        { path: '/user/documents', label: t('nav.documents'), icon: FileText },
        { path: '/user/mail', label: t('nav.mail'), icon: Mail },
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
