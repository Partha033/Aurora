/**
 * App.js — Root application with React Query, React Router, global providers
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

import Navbar      from './components/Navbar';
import Footer      from './components/Footer';
import CartDrawer  from './components/CartDrawer';
import NotificationDrawer from './components/NotificationDrawer';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute     from './routes/AdminRoute';

// Eager-loaded (always needed)
import HomePage    from './pages/HomePage';
import LoginPage   from './pages/LoginPage';
import ShopPage    from './pages/ShopPage';

// Lazy-loaded (only when visited)
const CheckoutPage       = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage         = lazy(() => import('./pages/OrdersPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));

// React Query global config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// Fallback while lazy components load
const PageLoader = () => (
  <div className="page-loader" style={{ minHeight: '80vh' }}>
    <div className="spinner" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <CartDrawer />
        <NotificationDrawer />

        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/"       element={<HomePage />} />
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/shop"   element={<ShopPage />} />

              {/* Protected — requires login */}
              <Route path="/checkout" element={
                <ProtectedRoute><CheckoutPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div className="empty-state" style={{ minHeight: '80vh' }}>
                  <div className="empty-state-icon">✦</div>
                  <h3>Page Not Found</h3>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>

        <Footer />

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color:       '#fff',
              fontSize:    '0.875rem',
              border:      '1px solid rgba(201,168,76,0.3)',
            },
            success: { iconTheme: { primary: '#c9a84c', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;