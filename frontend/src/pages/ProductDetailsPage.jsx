import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { 
  ShoppingBag, 
  Heart, 
  Share2, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  Minus,
  Plus,
  Sparkles
} from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { setCart, openCart } = useCartStore();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/product/${id}`).then(r => r.data.result),
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) return toast.error('Please login to continue');
    try {
      const { data } = await api.post('/cart', { productId: product._id, quantity: qty });
      setCart(data.result);
      openCart();
      toast.success('Added to your collection');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add to cart');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Authenticating Assets...</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-white px-6">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
        <Sparkles size={40} strokeWidth={1} />
      </div>
      <h2 className="font-serif text-3xl text-navy mb-2">Masterpiece Not Found</h2>
      <p className="text-slate-400 text-sm mb-8 text-center max-w-md">The piece you are looking for may have been moved to our private collection or is temporarily unavailable.</p>
      <Link to="/shop" className="btn btn-primary px-10 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Back to Boutique</Link>
    </div>
  );

  const finalPrice = product.discountedPrice || product.price;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mb-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/" className="hover:text-gold transition-colors">Home</Link>
        <ChevronRight size={10} />
        <Link to="/shop" className="hover:text-gold transition-colors">Boutique</Link>
        <ChevronRight size={10} />
        <span className="text-navy">{product.category}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
          
          {/* Gallery Section */}
          <div className="flex flex-col gap-6">
            <div className="aspect-[4/5] rounded-[40px] overflow-hidden bg-slate-50 border border-slate-100 relative group shadow-2xl shadow-slate-200/50">
              <img 
                src={product.images?.[activeImg]?.url} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              {product.discountPercent > 0 && (
                <div className="absolute top-8 left-8 bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">
                  {product.discountPercent}% EXCLUSIVE OFFER
                </div>
              )}
            </div>
            
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {product.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-gold shadow-lg scale-95' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-col py-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-dark mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  {product.category} Collection
                </p>
                <h1 className="font-serif text-4xl md:text-5xl text-navy leading-[1.1] mb-4">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i<=4?'currentColor':'none'} />)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">4.8 (124 Verified Reviews)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all">
                  <Heart size={20} />
                </button>
                <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-navy hover:border-navy/10 hover:bg-slate-50 transition-all">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="mb-10">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-4xl font-black text-navy tracking-tighter italic">₹{finalPrice.toLocaleString('en-IN')}</span>
                {product.discountedPrice && (
                  <span className="text-xl text-slate-300 line-through font-light">₹{product.price.toLocaleString('en-IN')}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inclusive of all premium taxes & hallmarking</p>
            </div>

            <div className="space-y-8 mb-12">
              <p className="text-slate-500 leading-relaxed font-light text-lg">
                {product.description}
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-navy group-hover:bg-gold group-hover:text-white transition-all duration-500 shadow-sm">
                    <ShieldCheck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy">Certified</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">BIS Hallmarked</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-navy group-hover:bg-gold group-hover:text-white transition-all duration-500 shadow-sm">
                    <Truck size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy">Shipping</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Secure & Insured</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center bg-slate-50 rounded-[20px] p-1.5 border border-slate-100 shadow-inner">
                  <button 
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-12 h-12 rounded-[14px] bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="w-16 text-center text-sm font-black text-navy">{qty}</span>
                  <button 
                    onClick={() => setQty(qty + 1)}
                    className="w-12 h-12 rounded-[14px] bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Inventory Status</p>
                  <div className={`px-4 py-3.5 rounded-2xl border flex items-center gap-2 ${isOutOfStock ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isOutOfStock ? 'Sold Out' : `In Boutique Store (${product.stock} pieces)`}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-[2] h-20 bg-navy text-gold-light rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-navy/20 hover:bg-navy-mid transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 group"
                >
                  <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" /> Add to Your Collection
                </button>
                <button className="flex-1 h-20 bg-white border border-slate-100 text-navy rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center">
                  Consult Specialist
                </button>
              </div>
            </div>

            <div className="mt-12 p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group cursor-default">
               <div className="flex items-center gap-4">
                  <RefreshCw className="text-gold group-hover:rotate-180 transition-transform duration-700" size={24} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-navy">14-Day Assurance</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Hassle-Free Exchanges & Returns</p>
                  </div>
               </div>
               <ChevronRight size={16} className="text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;