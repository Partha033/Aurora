import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axiosInstance';

const STATUS_STEPS = ['placed','confirmed','processing','shipped','delivered'];

const STATUS_BADGE = {
  placed:     'badge-muted',
  confirmed:  'badge-gold',
  processing: 'badge-gold',
  shipped:    'bg-blue-100 text-blue-700',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
};

const PAYMENT_BADGE = {
  pending:  'badge-muted',
  paid:     'badge-success',
  failed:   'badge-danger',
  refunded: 'bg-purple-100 text-purple-700',
};

/* ── Single Order Detail Page ── */
const OrderDetail = ({ orderId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn:  () => api.get(`/order/${orderId}`).then(r => r.data.result.order),
  });

  if (isLoading) return <div className="page-loader"><div className="spinner" /></div>;
  if (isError || !data) return <div className="empty-state"><div className="empty-state-icon">✦</div><h3>Order not found</h3></div>;

  const order = data;
  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Order ID</p>
          <p className="font-mono font-bold text-navy text-lg">#{order._id.slice(-10).toUpperCase()}</p>
          <p className="text-xs text-slate-400 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`badge ${STATUS_BADGE[order.orderStatus] || 'badge-muted'}`}>{order.orderStatus.toUpperCase()}</span>
          <span className={`badge ${PAYMENT_BADGE[order.paymentStatus] || 'badge-muted'}`}>{order.paymentStatus.toUpperCase()}</span>
          <span className="badge badge-muted">{order.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}</span>
        </div>
      </div>

      {/* Progress bar */}
      {!isCancelled && (
        <div className="card p-6 mb-5">
          <h3 className="font-serif text-base text-navy mb-5">Order Progress</h3>
          <div className="relative flex items-center justify-between">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0" />
            <div className="absolute top-4 left-0 h-0.5 bg-gold z-0 transition-all duration-500"
              style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }} />
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i <= currentStep ? 'bg-gold border-gold text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-wide ${i <= currentStep ? 'text-gold-dark' : 'text-slate-400'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Items */}
        <div className="card p-6">
          <h3 className="font-serif text-lg text-navy mb-4 pb-3 border-b border-slate-100">Items Ordered ({order.items.length})</h3>
          <div className="flex flex-col gap-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-cream flex-shrink-0 border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gold-dark mt-0.5">{item.category}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
                <strong className="text-sm text-navy flex-shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + Address */}
        <div className="flex flex-col gap-5">
          <div className="card p-6">
            <h3 className="font-serif text-lg text-navy mb-4 pb-3 border-b border-slate-100">Price Summary</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Shipping</span>
                <span>{order.shippingCharge === 0 ? <em className="text-green-600 not-italic font-semibold">FREE</em> : `₹${order.shippingCharge}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−₹{order.discount.toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between text-base font-semibold text-navy border-t border-slate-200 pt-2.5 mt-1">
                <strong>Total</strong><strong>₹{order.totalAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg text-navy mb-4 pb-3 border-b border-slate-100">Delivery Address</h3>
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-medium text-navy">{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="card p-6 mt-5">
          <h3 className="font-serif text-lg text-navy mb-4">Status History</h3>
          <div className="flex flex-col gap-3">
            {[...order.statusHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`badge mt-0.5 ${STATUS_BADGE[h.status] || 'badge-muted'}`}>{h.status}</span>
                <div>
                  {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
                  <p className="text-xs text-slate-400">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Orders List Page ── */
const OrdersPage = () => {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn:  () => api.get('/order').then(r => r.data.result),
    enabled:  !id,
  });

  const orders = data?.rows ?? [];

  if (id) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-cream">
        <div className="container max-w-4xl">
          <Link to="/orders" className="text-sm text-gold-dark hover:text-gold flex items-center gap-1 mb-6">
            ← Back to Orders
          </Link>
          <OrderDetail orderId={id} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-cream">
      <div className="container">
        <div className="mb-8">
          <h1 className="font-serif text-[2.2rem] text-navy">My Orders</h1>
          <p className="text-slate-500 mt-1 text-sm">{data?.pagination?.totalItems ?? 0} order{(data?.pagination?.totalItems ?? 0) !== 1 ? 's' : ''} placed</p>
        </div>

        {isLoading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : isError ? (
          <div className="empty-state"><div className="empty-state-icon">✦</div><h3>Couldn't load orders</h3></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p className="text-5xl mb-4">📦</p>
            <h3 className="font-serif text-xl text-navy mb-2">No orders yet</h3>
            <p className="text-sm mb-5">When you place an order, it'll appear here.</p>
            <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => (
              <div key={order._id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <p className="font-mono font-bold text-navy">#{order._id.slice(-10).toUpperCase()}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[order.orderStatus] || 'badge-muted'}`}>{order.orderStatus}</span>
                    <span className={`badge ${PAYMENT_BADGE[order.paymentStatus] || 'badge-muted'}`}>{order.paymentStatus}</span>
                  </div>
                </div>

                {/* Item previews */}
                <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
                  {order.items.slice(0, 4).map((item, i) => (
                    <img key={i} src={item.image} alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-cream flex-shrink-0 border border-slate-100" />
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400">{order.items.length} item(s) · {order.paymentMethod === 'cod' ? 'COD' : 'Paid Online'}</p>
                    <p className="text-lg font-semibold text-navy">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <Link to={`/orders/${order._id}`} className="btn btn-outline !py-2 !px-5 text-sm">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
