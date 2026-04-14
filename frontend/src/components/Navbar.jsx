import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useNotificationStore } from '../store/notificationStore';
import toast from 'react-hot-toast';
import api from '../api/axiosInstance';
import io from 'socket.io-client';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, toggleCart } = useCartStore();
  const { unreadCount, toggleNotifications, fetchNotifications, addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      
      const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const socket = io(socketUrl);
      
      socket.on('connect', () => {
        socket.emit('join', user._id);
        if (user.role === 'admin') {
          socket.emit('join_admin');
        }
      });

      socket.on('new_notification', (notification) => {
        addNotification(notification);
        toast.success(notification.title || 'New Notification');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, fetchNotifications, addNotification]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    toast.success('Logged out');
    navigate('/');
    setMenuOpen(false);
  };

  const linkCls = ({ isActive }) =>
    `text-xs uppercase tracking-widest transition-colors duration-200 pb-0.5 border-b ${
      isActive ? 'text-gold-light border-gold' : 'text-white/70 border-transparent hover:text-gold-light hover:border-gold'
    }`;

  const navLinks = [
    { to: '/shop',   label: 'Shop' },
    ...(isAuthenticated ? [{ to: '/orders', label: 'Orders' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-gold/20">
      <div className="container flex items-center justify-between h-14 md:h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 font-serif text-lg md:text-xl text-gold-light tracking-widest hover:text-gold transition-colors">
          <span className="text-gold">✦</span>
          <span className="hidden xs:inline">Aurora Jewels</span>
          <span className="xs:hidden">Aurora</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          {isAuthenticated && (
            <button onClick={toggleNotifications} className="relative text-white/75 hover:text-gold transition-colors p-1.5 rounded touch-manipulation" aria-label="Notifications">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Cart */}
          {isAuthenticated && (
            <button onClick={toggleCart} className="relative text-white/75 hover:text-gold transition-colors p-1.5 rounded touch-manipulation" aria-label="Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-navy text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center animate-pop">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <div className="relative group hidden md:block">
              <button className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gold-dark to-gold text-white text-sm font-bold flex items-center justify-center ring-2 ring-gold/30 touch-manipulation">
                {user?.profileImage?.url
                  ? <img src={user.profileImage.url} alt="avatar" className="w-full h-full object-cover" />
                  : (user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?')
                }
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-navy-mid border border-gold/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                <p className="px-4 py-2 text-xs text-white/40 border-b border-white/10 truncate">{user?.email}</p>
                <Link to="/profile" className="block px-4 py-2.5 text-sm text-white/75 hover:text-gold-light hover:bg-white/5 transition-colors">Profile</Link>
                <Link to="/orders"  className="block px-4 py-2.5 text-sm text-white/75 hover:text-gold-light hover:bg-white/5 transition-colors">My Orders</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="block px-4 py-2.5 text-sm text-white/75 hover:text-gold-light hover:bg-white/5 transition-colors">Admin Panel</Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-500 hover:bg-white/5 transition-colors border-t border-white/10 mt-1">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary !py-2 !px-4 md:!px-5 text-xs hidden md:inline-flex">Login</Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-[5px] p-2 touch-manipulation"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white/80 rounded transition-transform duration-200 origin-center ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white/80 rounded transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white/80 rounded transition-transform duration-200 origin-center ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-96 border-t border-gold/15' : 'max-h-0'}`}>
        <div className="bg-navy flex flex-col px-5 py-2">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="py-3.5 text-white/75 border-b border-white/5 text-sm hover:text-gold-light transition-colors font-medium">
              {label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 py-3.5 border-b border-white/5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-gold-dark to-gold text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {user?.profileImage?.url
                    ? <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
                    : (user?.name?.[0]?.toUpperCase() || '?')
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/80 font-medium truncate">{user?.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
                </div>
              </div>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="py-3.5 text-white/70 border-b border-white/5 text-sm hover:text-gold-light transition-colors">Profile</Link>
              <button onClick={handleLogout} className="py-3.5 text-left text-red-400 text-sm hover:text-red-300 transition-colors">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="py-3.5 text-gold text-sm font-semibold">Sign In →</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
