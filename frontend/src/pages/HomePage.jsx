import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { name: 'Rings',     icon: '💍', slug: 'rings' },
  { name: 'Necklaces', icon: '📿', slug: 'necklaces' },
  { name: 'Earrings',  icon: '✨', slug: 'earrings' },
  { name: 'Bracelets', icon: '💛', slug: 'bracelets' },
];

const HomePage = () => {
  const { data } = useQuery({
    queryKey: ['products-featured'],
    queryFn:  () => api.get('/product', { params: { perPage: 4, sortBy: 'newest', currentPage: 1 } }).then(r => r.data),
    staleTime: 60_000,
  });

  const featured = data?.result?.rows ?? [];

  return (
    <div className="pt-14 md:pt-16">
      {/* ── Hero ── */}
      <section className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] bg-gradient-to-br from-navy via-[#1a0a2e] to-[#0d1a2e] flex flex-col md:flex-row items-center justify-center md:justify-between px-5 sm:px-8 md:px-12 lg:px-24 gap-8 md:gap-10 relative overflow-hidden py-16 md:py-0">
        {/* Content */}
        <div className="max-w-xl relative z-10 text-center md:text-left">
          <p className="text-gold text-[10px] sm:text-xs uppercase tracking-[3px] font-medium mb-3 md:mb-4">✦ Handcrafted with love</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-4 md:mb-5">
            Where Every Jewel<br />
            <em className="text-gold-light not-italic">Tells a Story</em>
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-7 md:mb-9 max-w-md mx-auto md:mx-0">
            Discover our curated collection of exquisite gold and silver jewellery, crafted for every occasion.
          </p>
          <div className="flex gap-3 md:gap-4 flex-wrap justify-center md:justify-start">
            <Link to="/shop" className="btn btn-primary px-6 sm:px-9 py-3 md:py-4 text-sm">Explore Collection →</Link>
            <Link to="/shop?category=rings" className="btn btn-outline px-5 sm:px-8 py-3 md:py-4 text-sm text-gold border-gold hover:bg-gold hover:text-white">Shop Rings</Link>
          </div>
        </div>

        {/* Animated decoration — hide on small mobile */}
        <div className="hidden sm:flex items-center justify-center w-56 h-56 md:w-80 md:h-80 lg:w-96 lg:h-96 relative flex-shrink-0">
          {[0, 40, 80].map((inset, i) => (
            <div key={i} className="absolute rounded-full border border-gold/20 animate-pulse-ring"
              style={{ inset, animationDelay: `${i * 0.8}s` }} />
          ))}
          <span className="text-6xl md:text-7xl text-gold animate-float filter drop-shadow-[0_0_20px_rgba(201,168,76,0.4)]">✦</span>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-12 md:py-20 container">
        <div className="flex items-baseline justify-between mb-6 md:mb-9 flex-wrap gap-2">
          <h2 className="font-serif text-2xl md:text-3xl text-navy">Shop by Category</h2>
          <p className="text-xs md:text-sm text-slate-500">Find the perfect piece</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/shop?category=${cat.slug}`}
              className="group bg-white border border-[#f0e6d2] rounded-xl p-5 md:p-8 flex flex-col items-center gap-2 md:gap-3 text-center transition-all duration-300 hover:border-gold hover:shadow-[0_8px_24px_rgba(201,168,76,0.15)] hover:-translate-y-1 no-underline">
              <span className="text-2xl md:text-3xl">{cat.icon}</span>
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-navy">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-6 md:py-10 pb-12 md:pb-20 container">
        <div className="flex items-baseline justify-between mb-6 md:mb-9 flex-wrap gap-2">
          <h2 className="font-serif text-2xl md:text-3xl text-navy">New Arrivals</h2>
          <Link to="/shop" className="text-xs md:text-sm font-medium text-gold-dark hover:text-gold transition-colors">View all →</Link>
        </div>
        {featured.length > 0 ? (
          <div className="products-grid">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-10 md:p-16 text-center text-slate-400">
            <p className="text-3xl md:text-4xl mb-3">✦</p>
            <h3 className="font-serif text-lg md:text-xl text-navy mb-1">Coming Soon</h3>
            <p className="text-sm">Our collection is being curated. Check back soon!</p>
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="container pb-12 md:pb-20">
        <div className="bg-gradient-to-br from-navy to-[#1a0a2e] rounded-2xl p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 text-center md:text-left">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-gold-light mb-1.5 md:mb-2">Free Shipping Over ₹999</h2>
            <p className="text-white/60 text-xs md:text-sm">On all domestic orders — delivered with care</p>
          </div>
          <Link to="/shop" className="btn btn-primary flex-shrink-0 px-7 md:px-8 w-full sm:w-auto">Shop Now →</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
