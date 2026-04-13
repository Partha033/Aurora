import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { isOpen, closeCart, setCart, itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => api.get('/cart').then(r => r.data.result),
    enabled:  isAuthenticated && isOpen,
    onSuccess: (c) => setCart(c),
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => api.patch(`/cart/${itemId}`, { quantity }),
    onSuccess: (res) => { setCart(res.data.result); qc.invalidateQueries(['cart']); },
    onError:   (err) => toast.error(err.response?.data?.msg || 'Update failed'),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId) => api.delete(`/cart/${itemId}`),
    onSuccess: (res) => { setCart(res.data.result); qc.invalidateQueries(['cart']); toast.success('Item removed'); },
    onError:   (err) => toast.error(err.response?.data?.msg || 'Remove failed'),
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeCart]);

  const items    = cart?.items    ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total    = cart?.total    ?? 0;
  const busy     = updateMutation.isPending || removeMutation.isPending;

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeCart}
        className={`fixed inset-0 bg-navy/50 z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer — full width on mobile, 400px on larger */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] max-w-full bg-white z-[120] flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-serif text-xl text-navy">Your Cart <span className="text-sm text-slate-400 font-sans">({itemCount})</span></h2>
          <button onClick={closeCart} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-sm flex items-center justify-center hover:bg-navy hover:text-white transition-colors">✕</button>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500">
            <span className="text-4xl text-gold-light">✦</span>
            <p>Please <Link to="/login" onClick={closeCart} className="text-gold-dark font-medium underline">login</Link> to view your cart</p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center text-slate-500">
            <span className="text-5xl">🛍️</span>
            <p className="font-medium text-navy">Your cart is empty</p>
            <p className="text-sm">Add some beautiful jewellery!</p>
            <Link to="/shop" className="btn btn-primary" onClick={closeCart}>Browse Collection</Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {items.map((item) => {
                const product = item.product;
                const image   = product?.images?.[0]?.url;
                return (
                  <div key={item._id} className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-slate-100">
                      {image
                        ? <img src={image} alt={product?.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gold-light text-xl">✦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy leading-snug mb-1 truncate">{product?.name}</p>
                      <p className="text-xs text-gold-dark font-semibold mb-2">₹{item.priceAtAddition?.toLocaleString('en-IN')}</p>
                      {/* Stepper */}
                      <div className="inline-flex items-center border border-slate-200 rounded overflow-hidden">
                        <button onClick={() => item.quantity > 1 ? updateMutation.mutate({ itemId: item._id, quantity: item.quantity - 1 }) : removeMutation.mutate(item._id)}
                          disabled={busy} className="w-9 h-9 text-navy bg-slate-50 hover:bg-gold hover:text-white disabled:opacity-40 transition-colors text-lg touch-manipulation">−</button>
                        <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateMutation.mutate({ itemId: item._id, quantity: item.quantity + 1 })}
                          disabled={busy} className="w-9 h-9 text-navy bg-slate-50 hover:bg-gold hover:text-white disabled:opacity-40 transition-colors text-lg touch-manipulation">+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold text-navy">₹{(item.priceAtAddition * item.quantity).toLocaleString('en-IN')}</span>
                      <button onClick={() => removeMutation.mutate(item._id)} disabled={busy}
                        className="text-slate-300 text-xs hover:text-red-400 hover:bg-red-50 rounded p-1 transition-colors">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 pt-4 pb-6 safe-bottom border-t border-slate-100 bg-slate-50/60 flex flex-col gap-2.5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? <em className="text-green-600 font-semibold not-italic">FREE</em> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-navy border-t border-slate-200 pt-2.5 mt-1">
                <strong>Total</strong><strong>₹{total.toLocaleString('en-IN')}</strong>
              </div>
              {subtotal < 999 && (
                <p className="text-[11px] text-slate-400 text-center">Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping</p>
              )}
              <Link to="/checkout" onClick={closeCart} className="btn btn-primary mt-2 w-full justify-center">
                Proceed to Checkout →
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
