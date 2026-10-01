import React, { useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Home, Search, Heart, UserCircle, Ticket } from 'lucide-react';
import logo from './assets/logo.png';
import NotificationBell from './components/NotificationBell';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import DealsPage from './pages/DealsPage';
import StorePage from './pages/StorePage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import StoreDashboard from './pages/StoreDashboard';
import StoreSignupPage from './pages/StoreSignupPage'; // New file we will create next
import ResetPasswordPage from './pages/ResetPasswordPage';
import { hasValidToken } from './services/api';

// The admin console is not part of the public site. Its routes are only
// registered when VITE_ADMIN_CONSOLE=true is set at BUILD time, so by default
// /admin and /admin/login match no route, fall through to the catch-all, and
// land on the public landing page. Nothing links to them either.
//
// Set VITE_ADMIN_CONSOLE=true for a local build, or on a separate private
// deployment, if you need the console.
//
// React.lazy keeps the two admin pages in their own chunks rather than the main
// bundle, so they are only fetched if a route that mounts them exists. The
// chunks are still emitted into dist/assets either way — this hides the console
// at the routing layer, it does not strip the files from the build output.
const ADMIN_CONSOLE_ENABLED = import.meta.env.VITE_ADMIN_CONSOLE === 'true';

const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Reads a JSON blob back out of storage. A truncated or hand-edited value would
// otherwise throw during render and white-screen the whole app, not just the
// section that owns it.
const readStoredJson = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

function App() {
  const [user, setUser] = useState(() => readStoredJson('dealnest_user'));
  const [role, setRole] = useState(() => localStorage.getItem('dealnest_role') || 'customer');
  // A saved user alone isn't a valid session — the JWT must exist and be unexpired.
  const isAuthenticated = user !== null && hasValidToken('user');

  const [admin, setAdmin] = useState(() => readStoredJson('dealnest_admin'));
  // Same rule as the customer session, and for the same reason: the admin JWT is
  // checked against ROLE_ADMIN by every endpoint the console loads, so a saved admin
  // object with a dead token rendered a dashboard whose every request was refused.
  const isAdminAuthenticated = admin !== null && hasValidToken('admin');

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
        {/* Public marketing page. Stays reachable for signed-in users too — the nav
            and footer offer "Open the app" rather than hiding the page behind a
            redirect, so a subscriber can still share the link. */}
        <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />

        <Route path="/login" element={!isAuthenticated ? <LoginPage onLogin={login} /> : <Navigate to="/app" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage /> : <Navigate to="/app" replace />} />
        <Route path="/store-signup" element={!isAuthenticated ? <StoreSignupPage onLogin={login} /> : <Navigate to="/app" replace />} />
        <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/app" replace />} />

        {ADMIN_CONSOLE_ENABLED && (
          <>
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<ConsoleFallback />}>
                  {!isAdminAuthenticated ? <AdminLoginPage onLogin={adminLogin} /> : <Navigate to="/admin" replace />}
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<ConsoleFallback />}>
                  {isAdminAuthenticated ? <AdminDashboard admin={admin} onLogout={adminLogout} /> : <Navigate to="/admin/login" replace />}
                </Suspense>
              }
            />
          </>
        )}

        {/* The signed-in shell lives under /app so it can't collide with marketing
            routes added later. Every internal link carries the same prefix. */}
        <Route path="/app/*" element={
          isAuthenticated ?
          <AuthenticatedLayout user={user} role={role} onLogout={logout} onUpdateUser={updateUser} /> :
          <RequireAuth />
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function ConsoleFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="h-8 w-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" role="status">
        <span className="sr-only">Loading admin console</span>
      </div>
    </div>
  );
}

/**
 * Sends a signed-out visitor to sign-in, carrying where they were headed.
 *
 * The category links are the reason this exists. A visitor who clicks a category on the
 * landing page arrives at /app/explore?category=… which is behind the session, and a bare
 * redirect to /login dropped the query string on the floor — signing in then landed them
 * on the home feed with no category applied, which reads as the filter not working. The
 * pathname and search go across as router state and LoginPage comes back to them.
 */
function RequireAuth() {
  const location = useLocation();
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

function AuthenticatedLayout({ user, role, onLogout, onUpdateUser }) {
  const location = useLocation();

  if (role === 'store') {
    return <StoreDashboard user={user} onLogout={onLogout} />;
  }

  const navItems = [
    { path: '/app', label: 'Home', icon: Home },
    { path: '/app/deals', label: 'Deals', icon: Ticket },
    { path: '/app/explore', label: 'Explore', icon: Search },
    { path: '/app/favorites', label: 'Saved', icon: Heart },
    { path: '/app/profile', label: 'Account', icon: UserCircle },
  ];

  return (
    <div className="app-shell flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
        <img src={logo} alt="DealNest" width={103} height={56} className="h-14 w-auto" />
        <div className="flex items-center gap-2">
          <Link to="/app/profile" className="text-sm font-medium text-gray-600 hidden sm:block hover:text-teal-600 transition mr-2">Hi, {user?.firstName || 'User'}</Link>
          <NotificationBell user={user} />
          <button type="button" onClick={onLogout} aria-label="Log out" className="min-w-11 min-h-11 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 bg-gray-50">
        {/* These paths are relative to the /app/* parent route above, so they
            must NOT repeat the /app prefix. React Router resolves a descendant
            route against the parent match, so path="/app" under a parent matched
            at /app/* asks for /app/app, matches nothing, and the catch-all then
            redirects back to /app — leaving the header and bottom nav rendered
            over an entirely empty <main> on every tab. */}
        <Routes>
          <Route index element={<HomePage user={user} />} />
          <Route path="explore" element={<ExplorePage user={user} />} />
          <Route path="deals" element={<DealsPage user={user} />} />
          <Route path="store/:storeId" element={<StorePage user={user} />} />
          <Route path="favorites" element={<FavoritesPage user={user} />} />
          <Route path="profile" element={<ProfilePage user={user} onLogout={onLogout} onUpdateUser={onUpdateUser} />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
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