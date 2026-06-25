import { useState } from 'react';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';

interface Props {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ theme, toggleTheme, onLogout, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        onLogout={onLogout}
        collapsed={collapsed}
      />
      <div className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <PageHeader
          theme={theme}
          toggleTheme={toggleTheme}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}
