import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

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
      // POST /cart — addItem endpoint
      const { data } = await api.post('/cart', { productId: _id, quantity: 1 });
      setCart(data.result);   // result: { items, subtotal, shipping, total }
      openCart();
      toast.success(`${name} added to cart ✦`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add to cart');
    }
  };

  return (
    <Link to={`/shop/${_id}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-black/[0.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl no-underline text-inherit">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream">
        {image
          ? <img src={image} alt={name} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-5xl text-gold-light bg-gradient-to-br from-cream to-amber-50">✦</div>
        }
        {hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discountPercent ? `-${discountPercent}%` : 'SALE'}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
            <span className="text-white text-xs font-semibold uppercase tracking-widest">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gold-dark font-medium">{category}</span>
        <h3 className="font-serif text-base md:text-lg font-semibold text-navy leading-snug line-clamp-2">{name}</h3>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-semibold text-navy">₹{finalPrice.toLocaleString('en-IN')}</span>
          {hasDiscount && <span className="text-sm text-slate-400 line-through">₹{price.toLocaleString('en-IN')}</span>}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`mt-auto w-full py-3 rounded text-xs font-semibold tracking-wide uppercase transition-all duration-200 min-h-[44px] touch-manipulation ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-gold-dark to-gold text-white hover:shadow-[0_4px_16px_rgba(201,168,76,0.4)] hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
