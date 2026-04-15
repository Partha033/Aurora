import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { Tag, XCircle } from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [useProfileAddr, setUseProfileAddr] = useState(null); // null = custom form
  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', label: 'Home' });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applying, setApplying] = useState(false);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => api.get('/cart').then(r => r.data.result),
  });

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn:  () => api.get('/settings').then(r => r.data.result),
  });

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => api.get('/auth/me').then(r => r.data.result.user),
  });

  const savedAddresses = meData?.addresses ?? [];
  const items    = cart?.items    ?? [];
  const subtotal = cart?.subtotal ?? 0;
  
  // Dynamic shipping calculation
  const baseShipping = settings?.shipping?.baseCharge ?? 100;
  const threshold    = settings?.shipping?.freeThreshold ?? 3000;
  const shipping     = subtotal >= threshold ? 0 : baseShipping;

  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total          = subtotal + shipping - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const { data } = await api.post('/coupon/apply', { code: couponCode, orderAmount: subtotal });
      setAppliedCoupon(data.result);
      toast.success(`Coupon "${data.result.code}" applied!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setApplying(false);
    }
  };

  const onChange = e => setAddress(p => ({ ...p, [e.target.name]: e.target.value }));

  const getShippingAddress = () => {
    if (useProfileAddr !== null) {
      return savedAddresses[useProfileAddr];
    }
    return address;
  };

  const validate = () => {
    const addr = getShippingAddress();
    if (!addr?.line1 || !addr?.city || !addr?.state || !addr?.pincode) {
      toast.error('Please fill all required address fields'); return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/order', {
        shippingAddress: getShippingAddress(),
        paymentMethod,
        couponCode: appliedCoupon?.code
      });
      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${data.result.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to place order');
    } finally { setLoading(false); }
  };

  const handleRazorpay = async () => {
    if (!validate()) return;
    if (!window.Razorpay) { toast.error('Payment gateway not loaded'); return; }
    setLoading(true);
    try {
      const { data: rpData } = await api.post('/order/razorpay', {
        shippingAddress: getShippingAddress(),
        couponCode: appliedCoupon?.code
      });
      const options = {
        key: rpData.result.keyId, amount: rpData.result.amount,
        currency: 'INR', name: 'Aurora Jewels',
        description: 'Jewellery Purchase', order_id: rpData.result.razorpayOrderId,
        prefill: { email: user?.email, name: user?.name },
        theme: { color: '#c9a84c' },
        handler: async (response) => {
          try {
            const { data: v } = await api.post('/order/razorpay/verify', response);
            clearCart();
            toast.success('Payment successful! ✦');
            navigate(`/orders/${v.result.order._id}`);
          } catch { toast.error('Payment verification failed'); }
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Payment failed');
      setLoading(false);
    }
  };

  if (isLoading) return <div className="page-loader" style={{ minHeight: '80vh' }}><div className="spinner" /></div>;
  if (items.length === 0) { navigate('/shop'); return null; }

  return (
    <div className="pt-20 md:pt-24 pb-12 md:pb-16 min-h-screen bg-cream">
      <div className="container">
        <h1 className="font-serif text-2xl md:text-[2.2rem] text-navy mb-6 md:mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 md:gap-7 items-start">
          {/* ── Left ── */}
          <div className="flex flex-col gap-5">

            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div className="card p-7">
                <h2 className="font-serif text-xl text-navy mb-5 pb-3 border-b border-slate-100">Saved Addresses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {savedAddresses.map((addr, i) => (
                    <label key={addr._id} className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${useProfileAddr === i ? 'border-gold bg-gold/5' : 'border-slate-200 hover:border-gold/50'}`}>
                      <input type="radio" name="savedAddr" checked={useProfileAddr === i}
                        onChange={() => setUseProfileAddr(i)} className="accent-gold mt-0.5 w-4 h-4 flex-shrink-0" />
                      <div>
                        <span className="badge badge-gold text-[9px] mb-1">{addr.label}</span>
                        <p className="text-sm text-navy font-medium">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-xs text-slate-400">{addr.city}, {addr.state} – {addr.pincode}</p>
                      </div>
                    </label>
                  ))}
                  {/* Custom option */}
                  <label className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-all ${useProfileAddr === null ? 'border-gold bg-gold/5' : 'border-slate-200 hover:border-gold/50'}`}>
                    <input type="radio" name="savedAddr" checked={useProfileAddr === null}
                      onChange={() => setUseProfileAddr(null)} className="accent-gold mt-0.5 w-4 h-4 flex-shrink-0" />
                    <div><p className="text-sm text-navy font-medium">Enter new address</p></div>
                  </label>
                </div>
              </div>
            )}

            {/* Address form */}
            {(savedAddresses.length === 0 || useProfileAddr === null) && (
              <div className="card p-7">
                <h2 className="font-serif text-xl text-navy mb-5 pb-3 border-b border-slate-100">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="form-label">Address Line 1 *</label>
                    <input name="line1" className="form-input" placeholder="House / Flat / Block No." value={address.line1} onChange={onChange} />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="form-label">Address Line 2</label>
                    <input name="line2" className="form-input" placeholder="Street / Area / Landmark" value={address.line2} onChange={onChange} />
                  </div>
                  {[['city','City *'],['state','State *'],['pincode','Pincode *'],['country','Country']].map(([name, label]) => (
                    <div key={name} className="flex flex-col gap-1.5">
                      <label className="form-label">{label}</label>
                      <input name={name} className="form-input" maxLength={name === 'pincode' ? 6 : undefined} value={address[name]} onChange={onChange} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Payment */}
          <div className="card p-5 md:p-7">
            <h2 className="font-serif text-lg md:text-xl text-navy mb-4 md:mb-5 pb-3 border-b border-slate-100">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {[
                  { val: 'cod',    icon: '💵', title: 'Cash on Delivery',        sub: 'Pay when your order arrives', enabled: settings?.paymentMethods?.cod ?? true },
                  { val: 'online', icon: '💳', title: 'Pay Online via Razorpay', sub: 'UPI, Cards, Net Banking — instant confirmation', enabled: settings?.paymentMethods?.online ?? true },
                  { val: 'upi',    icon: '📲', title: 'Direct UPI Transfer',     sub: 'Pay via UPI ID: 9344619085@ptyes', enabled: true },
                ].filter(p => p.enabled).map(({ val, icon, title, sub }) => (
                  <label key={val} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === val ? 'border-gold bg-gold/5' : 'border-slate-200 hover:border-gold/40'}`}>
                    <input type="radio" name="payment" value={val} checked={paymentMethod === val}
                      onChange={() => setPaymentMethod(val)} className="accent-gold w-4 h-4" />
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <strong className="text-sm text-navy block">{title}</strong>
                      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'upi' && (
                <div className="mt-5 p-5 bg-gold/5 border border-gold/20 rounded-2xl flex flex-col items-center text-center">
                  <p className="text-sm text-navy mb-3 font-medium">Scan QR or use UPI ID to pay</p>
                  <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                    {/* Placeholder for QR Code - User can replace src with their actual image path */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("upi://pay?pa=9344619085@ptyes&pn=Parthiban A&cu=INR")}`} 
                      alt="UPI QR Code" 
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">UPI ID</span>
                    <strong className="text-lg text-navy tracking-wide">9344619085@ptyes</strong>
                    <p className="text-[10px] text-slate-400 mt-2 px-4 italic">
                      Please mention your name or order total in the payment note. Your order will be confirmed once payment is verified.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Summary ── */}
          <div className="card p-7 sticky top-24">
            <h2 className="font-serif text-xl text-navy mb-5 pb-3 border-b border-slate-100">Order Summary</h2>

            {/* Coupon Application */}
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Promotional Voucher</p>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-gold/20 uppercase font-bold"
                    placeholder="Enter Code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={applying || !couponCode.trim()}
                    className="bg-navy text-gold-light px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-mid transition-all disabled:opacity-50"
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between animate-in zoom-in duration-300">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                      <Tag size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-700 uppercase">{appliedCoupon.code}</p>
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Discount Applied</p>
                    </div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400 hover:text-emerald-700 transition-colors">
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mb-5 max-h-72 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <img src={item.product?.images?.[0]?.url} alt={item.product?.name}
                    className="w-12 h-12 rounded-lg object-cover bg-cream flex-shrink-0 border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy truncate">{item.product?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <strong className="text-sm text-navy whitespace-nowrap">₹{(item.priceAtAddition * item.quantity).toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5 mb-5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? <em className="text-green-600 font-semibold not-italic">FREE</em> : `₹${shipping}`}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold italic">
                  <span>Voucher Discount</span><span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-navy border-t border-slate-200 pt-2.5 mt-1">
                <strong>Total</strong><strong>₹{total.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <button
              onClick={() => paymentMethod === 'online' ? handleRazorpay() : handlePlaceOrder()}
              disabled={loading}
              className="btn btn-primary w-full py-4 text-sm gap-2.5"
            >
              {loading
                ? <><div className="spinner spinner-sm" /> Processing…</>
                : paymentMethod === 'cod'
                  ? `📦 Place COD Order — ₹${total.toLocaleString('en-IN')}`
                  : paymentMethod === 'upi'
                    ? `📲 I've Paid via UPI — ₹${total.toLocaleString('en-IN')}`
                    : `💳 Pay ₹${total.toLocaleString('en-IN')}`
              }
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              By placing this order you agree to our Terms & Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
