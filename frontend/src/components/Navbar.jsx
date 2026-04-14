import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  ShoppingBag, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBasket,
  UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import io from 'socket.io-client';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, toggleCart } = useCartStore();
  const { unreadCount, toggleNotifications, fetchNotifications, addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      
      const getSocketUrl = () => {
        const baseURL = api.defaults.baseURL || '';
        return baseURL.replace('/api', '');
      };
      
      const socketUrl = getSocketUrl();
      const socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        const userIdStr = String(user._id);
        socket.emit('join', userIdStr);
        
        if (user.role === 'admin') {
          socket.emit('join_admin');
        }
      });

      socket.on('new_notification', (notification) => {
        addNotification(notification);
        toast.success(notification.title || 'New Notification');
      });

      socket.on('order_updated', ({ orderId, status }) => {
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries(['admin-orders']);
      });

      socket.on('dashboard_update', () => {
        queryClient.invalidateQueries(['admin-dashboard']);
        queryClient.invalidateQueries(['admin-orders']);
      });

      socket.on('product_update', () => {
        queryClient.invalidateQueries(['admin-products']);
        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['cart']);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchNotifications, addNotification, queryClient]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    toast.success('Logged out');
    navigate('/');
    setMenuOpen(false);
  };

  const linkCls = ({ isActive }) =>
    `text-[10px] uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b-2 ${
      isActive ? 'text-gold-light border-gold font-bold' : 'text-white/60 border-transparent hover:text-gold-light hover:border-gold/40'
    }`;

  const navLinks = [
    { to: '/shop',   label: 'Collection' },
    ...(isAuthenticated ? [{ to: '/orders', label: 'My Orders' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Dashboard' }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-serif text-xl md:text-2xl text-gold-light tracking-widest hover:text-gold transition-all group">
          <span className="text-gold group-hover:rotate-12 transition-transform duration-500">✦</span>
          <span className="hidden xs:inline bg-gradient-to-r from-gold-light to-white bg-clip-text text-transparent uppercase font-light">Aurora Jewels</span>
          <span className="xs:hidden font-light">Aurora</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10 lg:gap-14">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Notifications */}
          {isAuthenticated && (
            <button onClick={toggleNotifications} className="relative text-white/60 hover:text-gold-light transition-all p-2 rounded-full hover:bg-white/5 group" aria-label="Notifications">
              <Bell size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-navy animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Cart */}
          {isAuthenticated && (
            <button onClick={toggleCart} className="relative text-white/60 hover:text-gold-light transition-all p-2 rounded-full hover:bg-white/5 group" aria-label="Cart">
              <ShoppingBag size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-gold text-navy text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-navy animate-pop">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <div className="relative group hidden md:block ml-2">
              <button className="w-10 h-10 rounded-full overflow-hidden border border-gold/30 hover:border-gold transition-all duration-300 shadow-lg shadow-gold/5 touch-manipulation">
                {user?.profileImage?.url
                  ? <img src={user.profileImage.url} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                }
              </button>
              <div className="absolute right-0 top-full mt-3 w-60 bg-navy/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 py-3 scale-95 group-hover:scale-100 origin-top-right">
                <div className="px-5 py-3 mb-2 border-b border-white/10">
                  <p className="text-[10px] text-gold-light/50 uppercase tracking-widest font-semibold mb-0.5">Signed in as</p>
                  <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                </div>
                <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:text-gold-light hover:bg-white/5 transition-colors">
                  <User size={16} strokeWidth={1.5} /> Profile
                </Link>
                <Link to="/orders"  className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:text-gold-light hover:bg-white/5 transition-colors">
                  <ShoppingBasket size={16} strokeWidth={1.5} /> My Orders
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gold-light hover:bg-gold/10 transition-colors border-t border-white/5 mt-1 pt-3">
                    <LayoutDashboard size={16} strokeWidth={1.5} /> Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-400 hover:text-red-500 hover:bg-red-500/5 transition-colors border-t border-white/5 mt-2 pt-3">
                  <LogOut size={16} strokeWidth={1.5} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary !py-2.5 !px-6 text-[10px] tracking-[0.2em] uppercase hidden md:inline-flex ml-4">Login</Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white/70 p-2 hover:text-gold-light transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${menuOpen ? 'max-h-screen border-t border-white/5' : 'max-h-0'}`}>
        <div className="bg-navy/95 backdrop-blur-2xl flex flex-col px-6 py-6 gap-2">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between py-4 text-white/80 border-b border-white/5 text-sm hover:text-gold-light transition-colors tracking-wide">
              {label}
              <ChevronRight size={16} className="text-white/20" />
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-4 py-6 border-b border-white/5">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gold/30">
                  {user?.profileImage?.url
                    ? <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white text-base font-bold">
                        {user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                  <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
                </div>
              </div>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 py-4 text-white/70 border-b border-white/5 text-sm">
                <UserCircle size={18} strokeWidth={1.5} /> Profile
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 py-6 text-red-400 text-sm font-medium">
                <LogOut size={18} strokeWidth={1.5} /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-6 text-gold text-base font-medium tracking-wide">
              Sign In to Aurora
              <ChevronRight size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
