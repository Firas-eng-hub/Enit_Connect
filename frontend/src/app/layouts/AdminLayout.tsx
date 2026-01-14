import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Users, Mail, FileText, MessageSquare, UserPlus } from 'lucide-react';
import { Topbar } from '@/widgets/navbars/Topbar';
import { Sidebar, type SidebarSection } from '@/widgets/sidebars/Sidebar';

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/admin/home', label: 'Dashboard', icon: Home },
    ],
  },
  {
    title: 'User Management',
    items: [
      { path: '/admin/search', label: 'All Users', icon: Users },
      { path: '/admin/add-users', label: 'Add Users', icon: UserPlus },
    ],
  },
  {
    title: 'Content',
    items: [
      { path: '/admin/documents', label: 'Documents', icon: FileText },
      { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { path: '/admin/send-email', label: 'Send Email', icon: Mail },
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

