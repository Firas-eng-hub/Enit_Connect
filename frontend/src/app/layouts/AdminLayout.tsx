import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, Mail, FileText, MessageSquare, UserPlus, Handshake, BarChart2 } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const sidebarSections: SidebarSection[] = [
    {
      title: t('nav._overview'),
      items: [
        { path: '/admin/home', label: t('nav.dashboard'), icon: Home },
        { path: '/admin/dashboard', label: t('nav.analytics'), icon: BarChart2 },
      ],
    },
    {
      title: t('nav._userMgmt'),
      items: [
        { path: '/admin/search', label: t('nav.users'), icon: Users },
        { path: '/admin/add', label: t('nav.addUsers'), icon: UserPlus },
      ],
    },
    {
      title: t('nav._content'),
      items: [
        { path: '/admin/documents', label: t('nav.documents'), icon: FileText },
        { path: '/admin/partners', label: t('nav.partners'), icon: Handshake },
        { path: '/admin/mail', label: t('nav.mail'), icon: Mail },
        { path: '/admin/messages', label: t('nav.support'), icon: MessageSquare },
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
