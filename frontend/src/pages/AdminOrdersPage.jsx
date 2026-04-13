import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ── Constants ──────────────────────────────────────────────────────────── */
const ALL_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_META = {
  placed:     { label: 'Placed',      icon: '🕐', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
  confirmed:  { label: 'Confirmed',   icon: '✅', cls: 'bg-blue-100   text-blue-700   border-blue-200',   dot: 'bg-blue-400'   },
  processing: { label: 'Processing',  icon: '⚙️', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-400' },
  shipped:    { label: 'Shipped',     icon: '🚚', cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  delivered:  { label: 'Delivered',   icon: '✦',  cls: 'bg-green-100  text-green-700  border-green-200',  dot: 'bg-green-400'  },
  cancelled:  { label: 'Cancelled',   icon: '✕',  cls: 'bg-red-100    text-red-700    border-red-200',    dot: 'bg-red-400'    },
};

const NEXT_STATUS = {
  placed:     'confirmed',
  confirmed:  'processing',
  processing: 'shipped',
  shipped:    'delivered',
};
const NEXT_LABEL = {
  placed:     '✓ Confirm Order',
  confirmed:  '→ Mark Processing',
  processing: '→ Mark Shipped',
  shipped:    '→ Mark Delivered',
};
const NEXT_CLS = {
  placed:     'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
  confirmed:  'bg-indigo-600 text-white hover:bg-indigo-700',
  processing: 'bg-purple-600 text-white hover:bg-purple-700',
  shipped:    'bg-green-600 text-white hover:bg-green-700',
};

/* ── Order Detail Drawer ────────────────────────────────────────────────── */
const OrderDrawer = ({ order, onClose, onUpdateStatus }) => {
  if (!order) return null;
  const s = STATUS_META[order.orderStatus] || {};
  const activeFlow = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

  return (
    <div className="fixed inset-0 z-[300] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
      <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-[#1a0a2e] px-7 py-6 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Order Details</p>
            <h2 className="text-white font-serif text-xl">#{order._id.slice(-10).toUpperCase()}</h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-sm">✕</button>
        </div>

        {/* Progress bar */}
        <div className="px-7 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between relative">
            {/* line */}
            <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200 -z-0" />
            <div className="absolute left-0 top-3 h-0.5 bg-gold transition-all duration-700 -z-0"
              style={{ width: `${order.orderStatus === 'cancelled' ? 0 : (activeFlow.indexOf(order.orderStatus) / (activeFlow.length - 1)) * 100}%` }} />
            {activeFlow.map((st, i) => {
              const done    = activeFlow.indexOf(order.orderStatus) >= i && order.orderStatus !== 'cancelled';
              const current = order.orderStatus === st;
              return (
                <div key={st} className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    done ? 'bg-gold border-gold text-navy' : 'bg-white border-slate-200 text-slate-300'
                  } ${current ? 'ring-4 ring-gold/30 scale-110' : ''}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[9px] font-medium whitespace-nowrap ${done ? 'text-gold-dark' : 'text-slate-400'}`}>
                    {STATUS_META[st]?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-6">
          {/* Status + Payment */}
          <div className="flex gap-3">
            <div className={`flex-1 rounded-xl border px-4 py-3 ${s.cls}`}>
              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Order Status</p>
              <p className="font-bold text-sm flex items-center gap-1.5">{s.icon} {s.label}</p>
            </div>
            <div className={`flex-1 rounded-xl border px-4 py-3 ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Payment</p>
              <p className="font-bold text-sm capitalize">{order.paymentStatus} · {order.paymentMethod?.toUpperCase()}</p>
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Customer</p>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {order.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">{order.user?.name || '—'}</p>
                <p className="text-xs text-slate-400">{order.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Items ({order.items?.length})</p>
            <div className="flex flex-col gap-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-bold text-navy flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Price Breakdown</p>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span></div>
              <div className="flex justify-between font-bold text-navy border-t border-slate-200 pt-2 mt-1"><span>Total</span><span>₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {/* Shipping address */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Delivery Address</p>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-sm text-slate-600 leading-relaxed">
              <p className="font-semibold text-navy">{order.shippingAddress?.name || order.user?.name}</p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
            </div>
          </div>

          {/* Manual status override */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Override Status</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map(st => (
                <button key={st} onClick={() => onUpdateStatus(order._id, st)}
                  disabled={order.orderStatus === st}
                  className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                    order.orderStatus === st
                      ? `${STATUS_META[st]?.cls} ring-2 ring-offset-1 ring-navy`
                      : 'border-slate-200 text-slate-500 hover:border-navy hover:text-navy bg-white'
                  }`}>
                  {STATUS_META[st]?.icon} {STATUS_META[st]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-7 py-5 border-t border-slate-100 flex gap-3 flex-shrink-0 bg-white">
          {NEXT_STATUS[order.orderStatus] && (
            <button onClick={() => onUpdateStatus(order._id, NEXT_STATUS[order.orderStatus])}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${NEXT_CLS[order.orderStatus]}`}>
              {NEXT_LABEL[order.orderStatus]}
            </button>
          )}
          {!['delivered', 'cancelled'].includes(order.orderStatus) && (
            <button onClick={() => window.confirm('Cancel this order?') && onUpdateStatus(order._id, 'cancelled')}
              className="px-5 py-3 text-sm text-red-500 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-medium">
              Cancel Order
            </button>
          )}
          <button onClick={onClose} className="px-5 py-3 text-sm text-slate-400 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Status Badge ──────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || {};
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
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

  // ALL hooks first
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
      toast.success(`Order ${vars.status} ✦`);
      qc.invalidateQueries(['admin-orders-page']);
      // Update the drawer in-place
      setSelected(prev => prev ? { ...prev, orderStatus: vars.status } : null);
    },
    onError: err => toast.error(err.response?.data?.msg || 'Update failed'),
  });

  const handleUpdateStatus = (id, status) => updateStatus.mutate({ id, status });

  // Guard after all hooks
  if (!isAdmin) { navigate('/'); return null; }

  const orders = (data?.rows ?? []).filter(o =>
    !search ||
    o._id.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
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
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* ── Page Header ── */}
      <div className="bg-navy shadow-xl">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-white/30 hover:text-white/70 transition-colors text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <div>
              <h1 className="font-serif text-2xl text-gold-light">Order Management</h1>
              <p className="text-xs text-white/40 mt-0.5">Review and update your customer orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.pending > 0 && (
              <span className="flex items-center gap-2 bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl animate-pulse">
                ⚡ {stats.pending} new order{stats.pending > 1 && 's'} awaiting confirmation
              </span>
            )}
            <span className="text-[10px] text-white/30 border border-white/10 rounded-lg px-3 py-2">
              Auto-refreshes every 20s
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total',     val: stats.total,     icon: '📦', bg: 'bg-white',     text: 'text-navy'       },
            { label: 'Pending',   val: stats.pending,   icon: '🕐', bg: 'bg-yellow-50', text: 'text-yellow-700' },
            { label: 'Confirmed', val: stats.confirmed, icon: '✅', bg: 'bg-blue-50',   text: 'text-blue-700'   },
            { label: 'Shipped',   val: stats.shipped,   icon: '🚚', bg: 'bg-purple-50', text: 'text-purple-700' },
            { label: 'Delivered', val: stats.delivered, icon: '✦',  bg: 'bg-green-50',  text: 'text-green-700'  },
            { label: 'Cancelled', val: stats.cancelled, icon: '✕',  bg: 'bg-red-50',    text: 'text-red-600'    },
          ].map(({ label, val, icon, bg, text }) => (
            <button key={label}
              onClick={() => setStatusFilter(label === 'Total' ? '' : label.toLowerCase())}
              className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-black/[0.05] shadow-sm text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${statusFilter === label.toLowerCase() ? 'ring-2 ring-gold' : ''}`}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className={`text-xl font-bold ${text}`}>{val}</p>
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-3 items-center mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input className="form-input !pl-10 !py-2.5 text-sm shadow-sm"
              placeholder="Search by order ID, name or email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <button onClick={() => setView('cards')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'cards' ? 'bg-navy text-white' : 'bg-white text-slate-400 hover:text-navy'}`}>
              ⊞ Cards
            </button>
            <button onClick={() => setView('table')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-navy text-white' : 'bg-white text-slate-400 hover:text-navy'}`}>
              ☰ Table
            </button>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex gap-2 flex-wrap mb-7">
          <button onClick={() => setStatusFilter('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${!statusFilter ? 'bg-navy text-gold-light border-navy shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-navy hover:text-navy'}`}>
            All ({allOrders.length})
          </button>
          {ALL_STATUSES.map(s => {
            const cnt = allOrders.filter(o => o.orderStatus === s).length;
            const m   = STATUS_META[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  statusFilter === s ? `${m.cls} shadow-md` : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                }`}>
                {m.icon} {m.label}
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${statusFilter === s ? 'bg-white/40' : 'bg-slate-100'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* ── Loading skeletons ── */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse flex gap-4 items-center">
                <div className="w-16 h-4 bg-slate-100 rounded" />
                <div className="flex-1 h-3 bg-slate-50 rounded" />
                <div className="w-20 h-6 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>

        /* ── Empty state ── */
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] py-24 text-center shadow-sm">
            <p className="text-6xl mb-5">📦</p>
            <h3 className="font-serif text-2xl text-navy mb-2">No orders found</h3>
            <p className="text-slate-400 text-sm">
              {search || statusFilter ? 'Try different search or filter' : 'No orders placed yet'}
            </p>
          </div>

        /* ── CARD VIEW ── */
        ) : viewMode === 'cards' ? (
          <div className="flex flex-col gap-3">
            {orders.map(o => {
              const next = NEXT_STATUS[o.orderStatus];
              return (
                <div key={o._id}
                  className="bg-white rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                  {/* Main row */}
                  <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                    {/* Order ID + date */}
                    <div className="min-w-[140px]">
                      <p className="font-mono text-xs font-bold text-navy">#{o._id.slice(-10).toUpperCase()}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 min-w-[140px] flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {o.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{o.user?.name || '—'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{o.user?.email}</p>
                      </div>
                    </div>

                    {/* Item thumbnails */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {o.items?.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                      ))}
                      {o.items?.length > 3 && (
                        <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                          +{o.items.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Amount + payment */}
                    <div className="text-right min-w-[90px] flex-shrink-0">
                      <p className="font-bold text-navy">₹{o.totalAmount?.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400">{o.paymentMethod?.toUpperCase()}</p>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <StatusBadge status={o.orderStatus} />
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        o.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {o.paymentStatus === 'paid' ? '✓' : '○'} {o.paymentStatus}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      {/* Primary action button */}
                      {next && (
                        <button onClick={() => handleUpdateStatus(o._id, next)}
                          disabled={updateStatus.isPending}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${NEXT_CLS[o.orderStatus]}`}>
                          {NEXT_LABEL[o.orderStatus]}
                        </button>
                      )}
                      {!['delivered', 'cancelled'].includes(o.orderStatus) && (
                        <button onClick={() => window.confirm('Cancel this order?') && handleUpdateStatus(o._id, 'cancelled')}
                          disabled={updateStatus.isPending}
                          className="px-3 py-1.5 text-xs text-red-400 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                          Cancel
                        </button>
                      )}
                      {/* Details button */}
                      <button onClick={() => setSelected(o)}
                        className="px-3 py-1.5 text-xs text-navy border border-slate-200 rounded-lg hover:border-gold hover:text-gold-dark transition-colors font-medium">
                        Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        /* ── TABLE VIEW ── */
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['Order ID', 'Date', 'Customer', 'Items', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-gold-light font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-bold text-navy">#{o._id.slice(-10).toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="font-medium text-navy text-xs truncate">{o.user?.name || '—'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        {o.items?.slice(0, 2).map((item, i) => (
                          <img key={i} src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                        ))}
                        {o.items?.length > 2 && <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">+{o.items.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-navy whitespace-nowrap">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${o.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 items-center">
                        {NEXT_STATUS[o.orderStatus] && (
                          <button onClick={() => handleUpdateStatus(o._id, NEXT_STATUS[o.orderStatus])}
                            disabled={updateStatus.isPending}
                            className="px-3 py-1.5 text-[10px] font-semibold bg-navy text-gold-light rounded-lg hover:bg-navy-mid transition-colors whitespace-nowrap">
                            {NEXT_LABEL[o.orderStatus]}
                          </button>
                        )}
                        <button onClick={() => setSelected(o)}
                          className="px-3 py-1.5 text-[10px] border border-slate-200 text-navy rounded-lg hover:border-gold hover:text-gold-dark transition-colors font-medium">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {orders.length} order{orders.length !== 1 && 's'}
            </div>
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
