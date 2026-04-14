import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
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
        className={`fixed inset-0 bg-navy/60 backdrop-blur-sm z-[110] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] max-w-full bg-white z-[120] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-2xl text-navy">Shopping Bag</h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">You have {itemCount} items</p>
          </div>
          <button onClick={closeCart} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-navy hover:text-white transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-gold/30">
              <Sparkles size={40} />
            </div>
            <div>
              <p className="text-navy font-bold">Your bag is calling</p>
              <p className="text-sm text-slate-400 mt-2 font-light leading-relaxed">Please <Link to="/login" onClick={closeCart} className="text-gold-dark font-bold hover:underline">sign in</Link> to view your curated selection.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="spinner w-10 h-10 border-gold border-t-transparent" />
               <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Gathering items...</p>
             </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <ShoppingBag size={48} strokeWidth={1} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 text-gold/40 animate-pulse" size={24} />
            </div>
            <div>
              <p className="font-serif text-xl text-navy">Your bag is empty</p>
              <p className="text-sm text-slate-400 mt-2 font-light max-w-xs mx-auto">Fill it with something special from our handcrafted collection.</p>
            </div>
            <Link to="/shop" className="btn btn-primary px-10 py-4 text-[10px] tracking-widest uppercase flex items-center gap-3" onClick={closeCart}>
              Browse Collection <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 custom-scrollbar">
              {items.map((item) => {
                const product = item.product;
                const image   = product?.images?.[0]?.url;
                return (
                  <div key={item._id} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 group animate-in slide-in-from-bottom-4 duration-300">
                    <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      {image
                        ? <img src={image} alt={product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-gold/20"><Sparkles size={24} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-navy leading-snug mb-1 group-hover:text-gold-dark transition-colors truncate pr-4">{product?.name}</p>
                        <button onClick={() => removeMutation.mutate(item._id)} disabled={busy}
                          className="text-slate-200 hover:text-rose-500 transition-colors flex-shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-gold-dark font-bold mb-4">{product?.category}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        {/* Stepper */}
                        <div className="inline-flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button onClick={() => item.quantity > 1 ? updateMutation.mutate({ itemId: item._id, quantity: item.quantity - 1 }) : removeMutation.mutate(item._id)}
                            disabled={busy} className="w-8 h-8 rounded-lg bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm disabled:opacity-50">
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-xs font-bold text-navy">{item.quantity}</span>
                          <button onClick={() => updateMutation.mutate({ itemId: item._id, quantity: item.quantity + 1 })}
                            disabled={busy} className="w-8 h-8 rounded-lg bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm disabled:opacity-50">
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-navy">₹{(item.priceAtAddition * item.quantity).toLocaleString('en-IN')}</p>
                           <p className="text-[10px] text-slate-400 font-medium line-through decoration-gold/40">₹{item.priceAtAddition?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-8 pt-8 pb-10 safe-bottom border-t border-slate-100 bg-slate-50/40 flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-emerald-500">Free</span> : `₹${shipping}`}</span>
                </div>
                <div className="h-px bg-slate-200/50 my-2" />
                <div className="flex justify-between text-xl font-bold text-navy">
                  <span>Estimated Total</span><span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              {subtotal < 999 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                   <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">
                     Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
                   </p>
                </div>
              )}
              
              <Link to="/checkout" onClick={closeCart} className="btn btn-primary mt-2 w-full h-14 justify-center text-xs tracking-[0.2em] uppercase flex items-center gap-3 group">
                Checkout Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={closeCart} className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold hover:text-navy transition-colors">
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
