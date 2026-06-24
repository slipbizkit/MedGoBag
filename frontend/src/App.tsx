import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import OTPSetup from './components/OTPSetup';
import Dashboard from './components/Dashboard';
import MedicineList from './components/MedicineList';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import { useTheme } from './hooks/useTheme';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  return localStorage.getItem('role') === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('token')));
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    localStorage.clear();
    setIsLoggedIn(false);
  }

  function handleLogin() {
    setIsLoggedIn(true);
  }

  return (
    <BrowserRouter>
      {isLoggedIn && (
        <Navbar theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
      )}
      <div className="container-lg py-3">
        <Routes>
          <Route path="/login" element={<Login theme={theme} toggleTheme={toggleTheme} onLogin={handleLogin} />} />
          <Route path="/register" element={<Register theme={theme} toggleTheme={toggleTheme} />} />
          <Route
            path="/otp-setup"
            element={
              <RequireAuth>
                <OTPSetup />
              </RequireAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/medicines"
            element={
              <RequireAuth>
                <MedicineList />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPanel />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
