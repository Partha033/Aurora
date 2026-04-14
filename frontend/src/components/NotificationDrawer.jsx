import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { 
  Bell, 
  X, 
  Package, 
  ShoppingBag, 
  RefreshCw, 
  XCircle, 
  CheckCheck,
  Trash2,
  Clock
} from 'lucide-react';

const NotificationDrawer = () => {
  const navigate = useNavigate();
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
  const { isAuthenticated, user } = useAuthStore();

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

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    
    closeNotifications();

    if (notif.metadata?.orderId) {
      if (user?.role === 'admin') {
        navigate('/admin/orders');
      } else {
        navigate(`/orders/${notif.metadata.orderId}`);
      }
    }
  };

  const getIcon = (type) => {
    const cls = "w-5 h-5";
    switch (type) {
      case 'order_placed': return <Package className={`${cls} text-blue-500`} />;
      case 'new_order': return <ShoppingBag className={`${cls} text-gold-dark`} />;
      case 'order_status_update': return <RefreshCw className={`${cls} text-indigo-500`} />;
      case 'order_cancelled': return <XCircle className={`${cls} text-rose-500`} />;
      default: return <Bell className={`${cls} text-slate-400`} />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeNotifications}
        className={`fixed inset-0 bg-navy/60 backdrop-blur-sm z-[110] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] max-w-full bg-white z-[120] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="font-serif text-2xl text-navy">Notifications</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Updates on your collection</p>
          </div>
          <div className="flex items-center gap-4">
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllAsRead} className="p-2 text-gold-dark hover:bg-gold/10 rounded-full transition-colors group" title="Mark all as read">
                <CheckCheck size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button onClick={closeNotifications} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-navy hover:text-white transition-all duration-300">
              <X size={20} />
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <Bell size={40} strokeWidth={1} />
            </div>
            <p className="text-sm text-slate-400 font-light leading-relaxed">Please <Link to="/login" onClick={closeNotifications} className="text-gold-dark font-bold hover:underline">sign in</Link> to view your notifications.</p>
          </div>
        ) : isLoading && notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="spinner w-8 h-8 border-gold border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 relative">
              <Bell size={48} strokeWidth={1} />
              <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-slate-200 rounded-full" />
              </div>
            </div>
            <div>
              <p className="font-serif text-xl text-navy">Quiet for now</p>
              <p className="text-sm text-slate-400 mt-2 font-light max-w-xs mx-auto">We'll let you know when there's an update on your orders or our collection.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col custom-scrollbar bg-slate-50/30">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`group flex gap-4 p-5 rounded-3xl mb-3 transition-all relative cursor-pointer border shadow-sm ${notif.isRead ? 'bg-white/50 border-slate-100 opacity-75 grayscale-[20%]' : 'bg-white border-gold/10 ring-1 ring-gold/5 shadow-gold/5'}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${notif.isRead ? 'bg-slate-50' : 'bg-gold/10'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold truncate pr-6 transition-colors ${notif.isRead ? 'text-navy/60' : 'text-navy group-hover:text-gold-dark'}`}>
                      {notif.title}
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${notif.isRead ? 'text-slate-400 font-light' : 'text-slate-600'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <Clock size={10} />
                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="absolute top-5 right-5 flex flex-col gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                    className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {!notif.isRead && (
                  <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-gold animate-pulse group-hover:hidden shadow-lg shadow-gold/50" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
           <div className="px-8 py-6 border-t border-slate-100 bg-white">
              <button onClick={closeNotifications} className="w-full py-4 bg-navy text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-navy-mid transition-all shadow-xl shadow-navy/10">
                Dismiss Drawer
              </button>
           </div>
        )}
      </aside>
    </>
  );
};

export default NotificationDrawer;
