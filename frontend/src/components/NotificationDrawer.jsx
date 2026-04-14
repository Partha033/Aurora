import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

const NotificationDrawer = () => {
  const { 
    isOpen, 
    closeNotifications, 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchNotifications(1);
    }
  }, [isAuthenticated, isOpen, fetchNotifications]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeNotifications(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeNotifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'order_placed': return '📦';
      case 'new_order': return '🛍️';
      case 'order_status_update': return '🔄';
      case 'order_cancelled': return '❌';
      default: return '🔔';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeNotifications}
        className={`fixed inset-0 bg-navy/50 z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] max-w-full bg-white z-[120] flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-serif text-xl text-navy">Notifications</h2>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllAsRead} className="text-xs text-gold-dark hover:underline font-medium">Mark all as read</button>
            )}
            <button onClick={closeNotifications} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-sm flex items-center justify-center hover:bg-navy hover:text-white transition-colors">✕</button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500">
            <span className="text-4xl text-gold-light">✦</span>
            <p>Please <Link to="/login" onClick={closeNotifications} className="text-gold-dark font-medium underline">login</Link> to view notifications</p>
          </div>
        ) : isLoading && notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center"><div className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500">
            <span className="text-5xl">🔔</span>
            <p className="font-medium text-navy">No notifications yet</p>
            <p className="text-sm">We'll notify you when something happens!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`group flex gap-3 p-4 rounded-xl mb-2 transition-colors relative ${notif.isRead ? 'bg-white opacity-70' : 'bg-gold/5 border border-gold/10'}`}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`text-sm font-semibold truncate pr-6 ${notif.isRead ? 'text-navy/70' : 'text-navy'}`}>
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-1.5">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                    className="w-6 h-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {!notif.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold animate-pulse group-hover:hidden" />
                )}
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
};

export default NotificationDrawer;
