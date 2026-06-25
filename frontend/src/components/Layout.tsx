import { useState } from 'react';
import Sidebar from './Sidebar';

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
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <main className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
