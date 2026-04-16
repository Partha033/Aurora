import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, Eye, Heart, Sparkles } from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuthStore();
  const { setCart, openCart } = useCartStore();

  const { _id, name, images, price, discountedPrice, discountPercent, category, stock } = product;
  const image      = images?.[0]?.url;
  const finalPrice = discountedPrice && discountedPrice < price ? discountedPrice : price;
  const hasDiscount = discountedPrice && discountedPrice < price;
  const isOutOfStock = !stock || stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); return; }
    if (isOutOfStock) return;
    try {
      const { data } = await api.post('/cart', { productId: _id, quantity: 1 });
      setCart(data.result);
      openCart();
      toast.success(`${name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add to cart');
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -10, rotateX: 2, rotateY: 2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-gold/10 flex flex-col h-full"
    >
      {/* Image Container */}
      <Link to={`/shop/${_id}`} className="relative aspect-[4/5] overflow-hidden bg-slate-50 block">
        {image
          ? <motion.img 
              src={image} 
              alt={name} 
              loading="lazy"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover" 
            />
          : <div className="w-full h-full flex items-center justify-center bg-cream/30">
              <Sparkles className="text-gold/20 w-12 h-12" />
            </div>
        }
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-navy/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Sold Out
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 translate-y-4 group-hover:translate-y-0 shadow-xl"
          >
            <Heart size={18} />
          </motion.button>
          <Link to={`/shop/${_id}`}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all duration-300 translate-y-4 group-hover:translate-y-0 delay-75 shadow-xl"
            >
              <Eye size={18} />
            </motion.div>
          </Link>
        </div>

        {/* Quick Add Button */}
        {!isOutOfStock && (
          <motion.button
            onClick={handleAddToCart}
            initial={{ y: "100%" }}
            whileHover={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 py-4 bg-gold text-navy font-bold text-xs uppercase tracking-[0.2em] group-hover:translate-y-0 transition-transform duration-300 z-30 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} /> Quick Add
          </motion.button>
        )}
      </Link>

      {/* Details */}
      <div className="p-5 flex flex-col flex-1 bg-white">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gold-dark font-bold">{category}</span>
        </div>
        
        <Link to={`/shop/${_id}`} className="block mb-3 flex-1">
          <h3 className="font-serif text-lg font-semibold text-navy leading-snug group-hover:text-gold-dark transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-50">
          <span className="text-xl font-bold text-navy">₹{finalPrice.toLocaleString('en-IN')}</span>
          {hasDiscount && (
            <span className="text-sm text-slate-300 line-through font-light">
              ₹{price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
