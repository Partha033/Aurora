import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { 
  Clock, 
  CheckCircle2, 
  Settings, 
  Truck, 
  Sparkles, 
  X, 
  Check, 
  Package, 
  Search, 
  LayoutGrid, 
  Menu,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CreditCard,
  MapPin,
  User,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ── Constants ──────────────────────────────────────────────────────────── */
const ALL_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_META = {
  placed:     { label: 'Placed',      icon: <Clock size={14} />,      cls: 'bg-amber-50 text-amber-700 border-amber-100',   dot: 'bg-amber-400' },
  confirmed:  { label: 'Confirmed',   icon: <CheckCircle2 size={14} />, cls: 'bg-blue-50 text-blue-700 border-blue-100',     dot: 'bg-blue-400'   },
  processing: { label: 'Processing',  icon: <Settings size={14} />,    cls: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-400' },
  shipped:    { label: 'Shipped',     icon: <Truck size={14} />,       cls: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-400' },
  delivered:  { label: 'Delivered',   icon: <Sparkles size={14} />,    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
  cancelled:  { label: 'Cancelled',   icon: <X size={14} />,           cls: 'bg-rose-50 text-rose-700 border-rose-100',       dot: 'bg-rose-400'    },
};

const NEXT_STATUS = {
  placed:     'confirmed',
  confirmed:  'processing',
  processing: 'shipped',
  shipped:    'delivered',
};
const NEXT_LABEL = {
  placed:     'Confirm Order',
  confirmed:  'Mark Processing',
  processing: 'Mark Shipped',
  shipped:    'Mark Delivered',
};
const NEXT_ICON = {
  placed:     <Check size={14} />,
  confirmed:  <Settings size={14} />,
  processing: <Truck size={14} />,
  shipped:    <Sparkles size={14} />,
};
const NEXT_CLS = {
  placed:     'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
  confirmed:  'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200',
  processing: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200',
  shipped:    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200',
};

/* ── Order Detail Drawer ────────────────────────────────────────────────── */
const OrderDrawer = ({ order, onClose, onUpdateStatus }) => {
  if (!order) return null;
  const s = STATUS_META[order.orderStatus] || {};
  const activeFlow = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

  return (
    <div className="fixed inset-0 z-[300] flex animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-md" />
      <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-navy px-8 py-8 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1 font-bold">Transaction Record</p>
            <h2 className="text-white font-serif text-2xl flex items-center gap-3">
              #{order._id.slice(-10).toUpperCase()}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.cls} border-none`}>{s.label}</span>
            </h2>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
              <Clock size={12} />
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="relative z-10 w-10 h-10 rounded-full bg-white/5 text-white/60 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-1 bg-slate-200 rounded-full -z-0" />
            <div className="absolute left-0 top-4 h-1 bg-gold transition-all duration-1000 rounded-full -z-0"
              style={{ width: `${order.orderStatus === 'cancelled' ? 0 : (activeFlow.indexOf(order.orderStatus) / (activeFlow.length - 1)) * 100}%` }} />
            {activeFlow.map((st, i) => {
              const done    = activeFlow.indexOf(order.orderStatus) >= i && order.orderStatus !== 'cancelled';
              const current = order.orderStatus === st;
              return (
                <div key={st} className="flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    done ? 'bg-gold border-gold text-navy shadow-lg shadow-gold/20' : 'bg-white border-slate-200 text-slate-300'
                  } ${current ? 'ring-4 ring-gold/20 scale-110' : ''}`}>
                    {done ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${done ? 'text-navy' : 'text-slate-400'}`}>
                    {STATUS_META[st]?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${s.cls}`}>
              <div className="flex items-center justify-between opacity-60">
                <span className="text-[10px] uppercase tracking-widest font-bold">Status</span>
                {s.icon}
              </div>
              <p className="font-bold text-lg">{s.label}</p>
            </div>
            <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <div className="flex items-center justify-between opacity-60">
                <span className="text-[10px] uppercase tracking-widest font-bold">Payment</span>
                <CreditCard size={14} />
              </div>
              <p className="font-bold text-lg capitalize">{order.paymentStatus} <span className="text-xs opacity-60 font-medium">via {order.paymentMethod?.toUpperCase()}</span></p>
            </div>
          </div>

          {/* Customer Profile */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 flex items-center gap-2">
              <User size={12} /> Customer Profile
            </h3>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-gold/20">
                {order.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy">{order.user?.name || 'Guest User'}</p>
                <p className="text-xs text-slate-500">{order.user?.email}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-gold transition-colors">
                <ExternalLink size={18} />
              </button>
            </div>
          </section>

          {/* Order Manifest */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 flex items-center gap-2">
              <Package size={12} /> Order Manifest ({order.items?.length})
            </h3>
            <div className="flex flex-col gap-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-3 hover:border-gold/30 transition-colors group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate group-hover:text-gold-dark transition-colors">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Qty: <span className="font-bold text-navy">{item.quantity}</span> × ₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <section>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <MapPin size={12} /> Shipping Destination
                </h3>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-xs text-slate-600 leading-relaxed">
                  <p className="font-bold text-navy mb-1 text-sm">{order.shippingAddress?.name || order.user?.name}</p>
                  <p>{order.shippingAddress?.line1}</p>
                  {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p className="mt-1 font-medium">{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
                </div>
             </section>
             <section>
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 flex items-center gap-2">
                   Financial Summary
                </h3>
                <div className="bg-navy rounded-2xl p-5 text-white/80 text-xs flex flex-col gap-2.5 shadow-xl shadow-navy/10">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-medium">₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Logistics</span><span className="text-emerald-400 font-medium">{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span></div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex justify-between text-lg font-bold text-gold-light"><span>Total</span><span>₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>
                </div>
             </section>
          </div>

          {/* Manual Controls */}
          <section className="mb-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">Administrative Override</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map(st => (
                <button key={st} onClick={() => onUpdateStatus(order._id, st)}
                  disabled={order.orderStatus === st}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all flex items-center gap-2 ${
                    order.orderStatus === st
                      ? `${STATUS_META[st]?.cls} ring-2 ring-offset-2 ring-navy border-transparent`
                      : 'border-slate-200 text-slate-500 hover:border-navy hover:text-navy bg-white'
                  }`}>
                  {STATUS_META[st]?.icon} {STATUS_META[st]?.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 border-t border-slate-100 flex gap-4 flex-shrink-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          {NEXT_STATUS[order.orderStatus] && (
            <button onClick={() => onUpdateStatus(order._id, NEXT_STATUS[order.orderStatus])}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2 ${NEXT_CLS[order.orderStatus]}`}>
              {NEXT_ICON[order.orderStatus]} {NEXT_LABEL[order.orderStatus]}
            </button>
          )}
          {!['delivered', 'cancelled'].includes(order.orderStatus) && (
            <button onClick={() => window.confirm('Cancel this order?') && onUpdateStatus(order._id, 'cancelled')}
              className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
              Void
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Status Badge ──────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || {};
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${m.cls}`}>
      {m.icon}
      {m.label}
    </span>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
const AdminOrdersPage = () => {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const [selectedOrder, setSelected]    = useState(null);
  const [statusFilter,  setStatusFilter] = useState('');
  const [search,        setSearch]       = useState('');
  const [viewMode,      setView]         = useState('cards');

  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey:        ['admin-orders-page', statusFilter, search],
    queryFn:         () => api.get('/order/admin/all', {
      params: { perPage: 100, currentPage: 1, ...(statusFilter && { status: statusFilter }) }
    }).then(r => r.data.result),
    refetchInterval: 20_000,
    staleTime:       10_000,
    enabled:         isAdmin,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/order/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      toast.success(`Order set to ${vars.status}`);
      qc.invalidateQueries(['admin-orders-page']);
      qc.invalidateQueries(['admin-dashboard-data']);
      setSelected(prev => prev ? { ...prev, orderStatus: vars.status } : null);
    },
    onError: err => toast.error(err.response?.data?.msg || 'Update failed'),
  });

  const handleUpdateStatus = (id, status) => updateStatus.mutate({ id, status });

  if (!isAdmin) { navigate('/'); return null; }

  const orders = (data?.rows ?? []).filter(o =>
    !search ||
    o._id.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const allOrders = data?.rows ?? [];
  const stats = {
    total:     allOrders.length,
    pending:   allOrders.filter(o => o.orderStatus === 'placed').length,
    confirmed: allOrders.filter(o => o.orderStatus === 'confirmed').length,
    shipped:   allOrders.filter(o => o.orderStatus === 'shipped').length,
    delivered: allOrders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: allOrders.filter(o => o.orderStatus === 'cancelled').length,
  };

  return (
    <div className="bg-[#f8fafc]">
      {/* ── Page Header ── */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gold/10 to-transparent" />
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-12 flex flex-wrap items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col gap-4">
            <Link to="/admin" className="text-white/40 hover:text-gold transition-colors text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>
            <div>
              <h1 className="font-serif text-4xl text-gold-light tracking-tight">Order Fulfilment</h1>
              <p className="text-sm text-white/40 mt-2 font-light">Monitor and manage customer transactions across your boutique</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {stats.pending > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertCircle size={16} /> {stats.pending} New Orders Pending
              </div>
            )}
            <div className="bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-2xl flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin-slow" /> Real-time sync
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 md:px-12 py-12">
        {/* ── Stats Highlights ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-12">
          {[
            { label: 'All Orders', val: stats.total,     icon: <Package />,   bg: 'bg-white',           text: 'text-navy'       },
            { label: 'Pending',    val: stats.pending,   icon: <Clock />,     bg: 'bg-amber-50/50',     text: 'text-amber-700' },
            { label: 'Confirmed',  val: stats.confirmed, icon: <CheckCircle2 />, bg: 'bg-blue-50/50',    text: 'text-blue-700'   },
            { label: 'In Transit', val: stats.shipped,   icon: <Truck />,     bg: 'bg-purple-50/50',   text: 'text-purple-700' },
            { label: 'Completed',  val: stats.delivered, icon: <Sparkles />,  bg: 'bg-emerald-50/50',   text: 'text-emerald-700'},
            { label: 'Cancelled',  val: stats.cancelled, icon: <X />,          bg: 'bg-rose-50/50',      text: 'text-rose-600'    },
          ].map(({ label, val, icon, bg, text }) => (
            <button key={label}
              onClick={() => setStatusFilter(label === 'All Orders' ? '' : label.toLowerCase() === 'in transit' ? 'shipped' : label.toLowerCase() === 'completed' ? 'delivered' : label.toLowerCase())}
              className={`${bg} rounded-3xl p-6 flex flex-col gap-4 border border-slate-100 shadow-sm text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:border-gold/30 group ${statusFilter === (label === 'All Orders' ? '' : label.toLowerCase()) ? 'ring-2 ring-gold border-transparent' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${text} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              <div>
                <p className={`text-2xl font-bold ${text}`}>{val}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Functional Toolbar ── */}
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <div className="relative flex-1 min-w-[300px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={18} />
            <input className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all shadow-sm"
              placeholder="Search by ID, customer name or email address…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm">
            <button onClick={() => setView('cards')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'cards' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-slate-400 hover:text-navy hover:bg-slate-50'}`}>
              <LayoutGrid size={14} /> Cards
            </button>
            <button onClick={() => setView('table')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'table' ? 'bg-navy text-white shadow-lg shadow-navy/20' : 'text-slate-400 hover:text-navy hover:bg-slate-50'}`}>
              <Menu size={14} /> Table
            </button>
          </div>
        </div>

        {/* ── Advanced Filters ── */}
        <div className="flex gap-2 flex-wrap mb-10">
          <button onClick={() => setStatusFilter('')}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${!statusFilter ? 'bg-navy text-gold-light border-navy shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-gold hover:text-gold'}`}>
            All Transactions ({allOrders.length})
          </button>
          {ALL_STATUSES.map(s => {
            const cnt = allOrders.filter(o => o.orderStatus === s).length;
            const m   = STATUS_META[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${
                  statusFilter === s ? `${m.cls} border-transparent shadow-md` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                }`}>
                {m.icon} {m.label}
                <span className={`text-[9px] rounded-full px-2 py-0.5 ${statusFilter === s ? 'bg-white/40' : 'bg-slate-100'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* ── Order Display ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-8 animate-pulse flex gap-8 items-center">
                <div className="w-24 h-6 bg-slate-100 rounded-full" />
                <div className="flex-1 h-4 bg-slate-50 rounded-full" />
                <div className="w-32 h-10 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-slate-100 py-32 text-center shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
               <Package size={48} />
            </div>
            <h3 className="font-serif text-3xl text-navy mb-3">No orders found</h3>
            <p className="text-slate-400 text-sm max-w-sm font-light">
              {search || statusFilter ? "We couldn't find any orders matching your current search or filter criteria." : "You haven't received any orders yet. Once a customer makes a purchase, it will appear here."}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="flex flex-col gap-4">
            {orders.map(o => {
              const next = NEXT_STATUS[o.orderStatus];
              return (
                <div key={o._id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:border-gold/20">
                  <div className="flex flex-wrap items-center gap-8 px-8 py-6">
                    {/* Order Identifier */}
                    <div className="min-w-[160px]">
                      <p className="font-mono text-xs font-bold text-navy tracking-tighter">#{o._id.slice(-10).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={10} />
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center gap-4 min-w-[200px] flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center text-navy text-sm font-bold flex-shrink-0 group-hover:scale-110 transition-transform group-hover:bg-gold/10 group-hover:border-gold/20">
                        {o.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{o.user?.name || 'Guest User'}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{o.user?.email}</p>
                      </div>
                    </div>

                    {/* Item Preview */}
                    <div className="hidden lg:flex -space-x-3 hover:space-x-1 transition-all flex-shrink-0">
                      {o.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {o.items?.length > 3 && (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
                          +{o.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="text-right min-w-[120px] flex-shrink-0">
                      <p className="text-lg font-bold text-navy tracking-tight">₹{o.totalAmount?.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                        <CreditCard size={10} /> {o.paymentMethod?.toUpperCase()}
                      </p>
                    </div>

                    {/* Status Tracking */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <StatusBadge status={o.orderStatus} />
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border self-end ${
                        o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {o.paymentStatus === 'paid' ? <Check size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />} {o.paymentStatus}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                      {next && (
                        <button onClick={() => handleUpdateStatus(o._id, next)}
                          disabled={updateStatus.isPending}
                          className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${NEXT_CLS[o.orderStatus]}`}>
                          {NEXT_ICON[o.orderStatus]} {NEXT_LABEL[o.orderStatus]}
                        </button>
                      )}
                      <button onClick={() => setSelected(o)}
                        className="p-3 text-navy bg-slate-50 border border-slate-200 rounded-xl hover:border-gold hover:text-gold transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy border-none">
                  {['Transaction', 'Date', 'Client', 'Manifest', 'Total', 'Tracking', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-5 text-left text-[10px] uppercase tracking-[0.2em] text-gold-light font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs font-bold text-navy">#{o._id.slice(-10).toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-5 text-xs text-slate-400 whitespace-nowrap font-medium">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-navy text-xs truncate max-w-[150px]">{o.user?.name || 'Guest'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{o.user?.email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2">
                        {o.items?.slice(0, 2).map((item, i) => (
                          <img key={i} src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-sm" />
                        ))}
                        {o.items?.length > 2 && <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold border-2 border-white">+{o.items.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-navy whitespace-nowrap">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-5"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${o.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-2 justify-end">
                        {NEXT_STATUS[o.orderStatus] && (
                          <button onClick={() => handleUpdateStatus(o._id, NEXT_STATUS[o.orderStatus])}
                            disabled={updateStatus.isPending}
                            className="w-8 h-8 rounded-lg bg-navy text-gold-light flex items-center justify-center hover:bg-gold hover:text-navy transition-colors">
                            {NEXT_ICON[o.orderStatus]}
                          </button>
                        )}
                        <button onClick={() => setSelected(o)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:border-gold hover:text-gold transition-all flex items-center justify-center">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
