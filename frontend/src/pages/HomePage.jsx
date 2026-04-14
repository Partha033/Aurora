import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import ProductCard from '../components/ProductCard';
import { 
  Sparkles, 
  ArrowRight, 
  Gem, 
  Dna, 
  Disc, 
  Zap, 
  Truck, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Rings',     icon: <Gem className="w-6 h-6 md:w-8 md:h-8" />, slug: 'rings' },
  { name: 'Necklaces', icon: <Dna className="w-6 h-6 md:w-8 md:h-8" />, slug: 'necklaces' },
  { name: 'Earrings',  icon: <Sparkles className="w-6 h-6 md:w-8 md:h-8" />, slug: 'earrings' },
  { name: 'Bracelets', icon: <Disc className="w-6 h-6 md:w-8 md:h-8" />, slug: 'bracelets' },
];

const HomePage = () => {
  const { data } = useQuery({
    queryKey: ['products-featured'],
    queryFn:  () => api.get('/product', { params: { perPage: 4, sortBy: 'newest', currentPage: 1 } }).then(r => r.data),
    staleTime: 60_000,
  });

  const featured = data?.result?.rows ?? [];

  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <section className="min-h-[calc(100vh-64px)] bg-[#020617] flex flex-col md:flex-row items-center justify-center md:justify-between px-6 sm:px-12 md:px-20 lg:px-32 gap-12 relative overflow-hidden py-20 md:py-0">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-mid/30 rounded-full blur-[120px]" />
        </div>

        {/* Content */}
        <div className="max-w-2xl relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold-light text-[10px] uppercase tracking-[0.2em] font-semibold">Exquisite Craftsmanship</span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.05] mb-6 tracking-tight">
            Timeless Elegance<br />
            <span className="bg-gradient-to-r from-gold-light via-white to-gold-dark bg-clip-text text-transparent italic font-light">Defined by You</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-10 max-w-lg mx-auto md:mx-0 font-light">
            Discover our curated collection of artisanal jewellery, where traditional mastery meets contemporary design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/shop" className="btn btn-primary px-10 py-4 text-xs tracking-widest uppercase flex items-center justify-center gap-3 group">
              Explore Collection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/shop?category=rings" className="px-10 py-4 text-xs tracking-widest uppercase text-white border border-white/20 hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-3">
              Shop Rings
            </Link>
          </div>
        </div>

        {/* Hero Image / Decoration */}
        <div className="relative z-10 hidden lg:flex items-center justify-center w-[400px] h-[400px]">
          <div className="absolute inset-0 bg-gold/20 rounded-full blur-[100px] animate-pulse" />
          <div className="relative w-full h-full border border-gold/30 rounded-full p-12 flex items-center justify-center animate-spin-slow">
             <div className="w-full h-full border border-gold/10 rounded-full p-8 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-gold/20 to-transparent rounded-full border border-gold/5" />
             </div>
             {/* Decorative Icons on Ring */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy p-2 border border-gold/30 rounded-full">
               <Gem size={20} className="text-gold" />
             </div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-navy p-2 border border-gold/30 rounded-full">
               <Sparkles size={20} className="text-gold" />
             </div>
          </div>
          <div className="absolute text-7xl text-gold-light filter drop-shadow-[0_0_30px_rgba(201,168,76,0.6)] animate-float">
            <Sparkles size={80} strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'On orders over ₹999' },
            { icon: <ShieldCheck size={24} />, title: 'Certified Purity', desc: '100% Authentic Jewels' },
            { icon: <RefreshCw size={24} />, title: 'Easy Returns', desc: '14-day hassle-free policy' },
            { icon: <Zap size={24} />, title: 'Secure Payment', desc: 'Encrypted transactions' },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center text-center md:items-start md:text-left gap-3">
              <div className="text-gold-dark">{feat.icon}</div>
              <div>
                <h4 className="text-sm font-bold text-navy">{feat.title}</h4>
                <p className="text-xs text-slate-400">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20 md:py-32 container">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl text-navy mb-4">The Collections</h2>
          <div className="w-20 h-1 bg-gold mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/shop?category=${cat.slug}`}
              className="group relative bg-slate-50 overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col items-center gap-6 transition-all duration-500 hover:bg-navy hover:-translate-y-2 no-underline">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white flex items-center justify-center text-gold-dark group-hover:bg-gold group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-gold/20">
                {cat.icon}
              </div>
              <div className="text-center">
                <span className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-navy group-hover:text-white transition-colors">{cat.name}</span>
                <p className="text-[10px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Explore Pieces <ArrowRight size={10} className="inline ml-1" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold-dark text-[10px] uppercase tracking-widest font-bold mb-2">Recently Added</p>
              <h2 className="font-serif text-3xl md:text-4xl text-navy">New Arrivals</h2>
            </div>
            <Link to="/shop" className="group flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold-dark transition-colors">
              View All Collection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="products-grid">
              {featured.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center border border-slate-100">
              <Sparkles size={48} className="text-gold/20 mx-auto mb-6" />
              <h3 className="font-serif text-2xl text-navy mb-2">Curating Excellence</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Our newest collection is arriving soon. Sign up for notifications to be the first to know.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="container py-20 md:py-32">
        <div className="relative rounded-3xl overflow-hidden bg-navy p-10 md:p-20 text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <Sparkles size={40} className="text-gold mb-8 mx-auto animate-pulse" />
            <h2 className="font-serif text-3xl md:text-5xl text-gold-light mb-6 leading-tight">Elevate Your Presence with Aurora</h2>
            <p className="text-white/60 text-base md:text-lg mb-10 font-light">Join our inner circle for exclusive previews, artisanal tips, and special offers on our finest collections.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop" className="btn btn-primary px-12 py-4 uppercase tracking-widest text-xs">Shop the Collection</Link>
              <button className="px-12 py-4 border border-white/20 text-white hover:bg-white/5 transition-all uppercase tracking-widest text-xs">Learn Our Story</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
