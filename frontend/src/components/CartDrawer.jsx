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
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8 custom-scrollbar bg-slate-50/30">
              {/* Free Shipping Progress */}
              {subtotal < 3000 && (
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy flex items-center gap-2">
                      <Truck size={14} className="text-gold" /> Free Shipping Goal
                    </p>
                    <span className="text-[10px] font-bold text-gold-dark">₹{subtotal.toLocaleString('en-IN')} / ₹3,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-dark to-gold-light rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((subtotal / 3000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium mt-3 italic">
                    Add <span className="text-gold-dark font-bold">₹{(3000 - subtotal).toLocaleString('en-IN')}</span> more to unlock complimentary premium shipping.
                  </p>
                </div>
              )}

              {items.map((item) => {
                const product = item.product;
                const image   = product?.images?.[0]?.url;
                return (
                  <div key={item._id} className="relative group animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-sm hover:shadow-xl hover:border-gold/20 transition-all duration-500 flex gap-5">
                      <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 relative">
                        {image
                          ? <img src={image} alt={product?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          : <div className="w-full h-full flex items-center justify-center text-gold/20"><Sparkles size={24} /></div>
                        }
                        <div className="absolute inset-0 bg-navy/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col py-1">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-sm font-bold text-navy leading-tight group-hover:text-gold-dark transition-colors truncate">
                            {product?.name}
                          </p>
                          <button 
                            onClick={() => removeMutation.mutate(item._id)} 
                            disabled={busy}
                            className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 flex items-center justify-center flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <p className="text-[9px] uppercase tracking-widest text-gold-dark font-black mb-3 px-2 py-0.5 bg-gold/5 rounded-full self-start border border-gold/10">
                          {product?.category}
                        </p>
                        
                        <div className="mt-auto flex items-end justify-between">
                          <div className="flex flex-col gap-2">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Quantity</p>
                            <div className="inline-flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-inner">
                              <button 
                                onClick={() => item.quantity > 1 ? updateMutation.mutate({ itemId: item._id, quantity: item.quantity - 1 }) : removeMutation.mutate(item._id)}
                                disabled={busy} 
                                className="w-7 h-7 rounded-lg bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm disabled:opacity-50"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-navy">{item.quantity}</span>
                              <button 
                                onClick={() => updateMutation.mutate({ itemId: item._id, quantity: item.quantity + 1 })}
                                disabled={busy} 
                                className="w-7 h-7 rounded-lg bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm disabled:opacity-50"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right">
                             <p className="text-xs text-slate-400 font-medium line-through decoration-gold/40 mb-0.5">₹{(item.priceAtAddition * item.quantity * 1.2).toLocaleString('en-IN')}</p>
                             <p className="text-base font-black text-navy tracking-tight">₹{(item.priceAtAddition * item.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="px-10 pt-10 pb-12 safe-bottom border-t border-slate-100 bg-white flex flex-col gap-6 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Subtotal</span>
                  <span className="text-sm font-bold text-navy">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Logistics</span>
                  <span className={`text-sm font-bold ${shipping === 0 ? 'text-emerald-500' : 'text-navy'}`}>
                    {shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping}`}
                  </span>
                </div>
                <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold-dark block mb-1">Total Amount</span>
                    <p className="text-xs text-slate-400 font-medium italic">Incl. all premium taxes</p>
                  </div>
                  <span className="text-3xl font-black text-navy tracking-tighter italic">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <Link to="/checkout" onClick={closeCart} className="btn btn-primary h-16 justify-center text-[10px] tracking-[0.3em] font-black uppercase flex items-center gap-4 group shadow-xl shadow-gold/20 hover:shadow-2xl hover:shadow-gold/30 transition-all">
                  Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={closeCart} 
                  className="py-2 text-[9px] uppercase tracking-[0.3em] text-slate-300 font-bold hover:text-navy transition-all duration-300"
                >
                  Return to Boutique
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
