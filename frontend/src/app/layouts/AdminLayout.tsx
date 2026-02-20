import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Users, Mail, FileText, MessageSquare, UserPlus, Handshake, BarChart2 } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/admin/home', label: 'Dashboard', icon: Home },
      { path: '/admin/dashboard', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    title: 'User Management',
    items: [
      { path: '/admin/search', label: 'All Users', icon: Users },
      { path: '/admin/add', label: 'Add Users', icon: UserPlus },
    ],
  },
  {
    title: 'Content',
    items: [
      { path: '/admin/documents', label: 'Documents', icon: FileText },
      { path: '/admin/partners', label: 'Partners', icon: Handshake },
      { path: '/admin/mail', label: 'Mailbox', icon: Mail },
      { path: '/admin/messages', label: 'Support Inbox', icon: MessageSquare },
    ],
  },
];

export function AdminLayout() {
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
