import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Home, Search, Heart, UserCircle } from 'lucide-react';
import logo from './assets/logo.png';
import NotificationBell from './components/NotificationBell';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import StorePage from './pages/StorePage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import StoreDashboard from './pages/StoreDashboard';
import StoreSignupPage from './pages/StoreSignupPage'; // New file we will create next
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dealnest_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem('dealnest_role') || 'customer');
  const isAuthenticated = user !== null;

  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('dealnest_admin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });
  const isAdminAuthenticated = admin !== null;

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem('dealnest_user', JSON.stringify(userData));
    localStorage.setItem('dealnest_role', userRole);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dealnest_user');
    localStorage.removeItem('dealnest_role');
    localStorage.removeItem('dealnest_token');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('dealnest_user', JSON.stringify(userData));
  };

  const adminLogin = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('dealnest_admin', JSON.stringify(adminData));
  };

  const adminLogout = () => {
    setAdmin(null);
    localStorage.removeItem('dealnest_admin');
    localStorage.removeItem('dealnest_admin_token');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage onLogin={login} /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />} />
        <Route path="/store-signup" element={!isAuthenticated ? <StoreSignupPage /> : <Navigate to="/" replace />} />

        <Route path="/admin/login" element={!isAdminAuthenticated ? <AdminLoginPage onLogin={adminLogin} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin" element={isAdminAuthenticated ? <AdminDashboard admin={admin} onLogout={adminLogout} /> : <Navigate to="/admin/login" replace />} />

        <Route path="/*" element={
          isAuthenticated ?
          <AuthenticatedLayout user={user} role={role} onLogout={logout} onUpdateUser={updateUser} /> :
          <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
}

function AuthenticatedLayout({ user, role, onLogout, onUpdateUser }) {
  const location = useLocation();

  if (role === 'store') {
    return <StoreDashboard user={user} onLogout={onLogout} />;
  }

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/explore', label: 'Explore', icon: Search },
    { path: '/favorites', label: 'Saved', icon: Heart },
    { path: '/profile', label: 'Account', icon: UserCircle },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <img src={logo} alt="DealNest" width={103} height={56} className="h-14 w-auto" />
        <div className="flex items-center gap-2">
          <Link to="/profile" className="text-sm font-medium text-gray-600 hidden sm:block hover:text-teal-600 transition mr-2">Hi, {user?.firstName || 'User'}</Link>
          <NotificationBell user={user} />
          <button type="button" onClick={onLogout} aria-label="Log out" className="min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/explore" element={<ExplorePage user={user} />} />
          <Route path="/store/:storeId" element={<StorePage user={user} />} />
          <Route path="/favorites" element={<FavoritesPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 h-16 flex justify-around items-center z-20 shadow-lg">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'}`}>
              <item.icon className={`w-7 h-7 ${isActive ? 'stroke-2' : 'stroke-1'}`} aria-hidden="true" />
              <span className="text-xs font-semibold mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default App;