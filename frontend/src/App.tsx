import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import OTPSetup from './components/OTPSetup';
import Dashboard from './components/Dashboard';
import MedicineList from './components/MedicineList';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  return localStorage.getItem('role') === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar />}
      <div className="container-lg py-3">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
