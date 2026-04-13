import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['all', 'rings', 'necklaces', 'earrings', 'bracelets', 'pendants', 'sets', 'other'];

// Matches actual backend: GET /api/product?category=&search=&sortBy=&perPage=&currentPage=
const fetchProducts = ({ category, search, page, sort }) =>
  api.get('/product', {
    params: {
      ...(category && category !== 'all' && { category }),
      ...(search && { search }),
      perPage:     12,
      currentPage: page,
      sortBy:      sort,
    },
  }).then(r => r.data);

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,   setSearch]   = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [sort,     setSort]     = useState('newest');
  const [page,     setPage]     = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { category, search, page, sort }],
    queryFn:  () => fetchProducts({ category, search, page, sort }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // Backend returns: { success, result: { rows, pagination } }
  const products   = data?.result?.rows        ?? [];
  const totalItems = data?.result?.pagination?.totalItems  ?? 0;
  const totalPages = data?.result?.pagination?.totalPages  ?? 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ ...(search && { search }), ...(category !== 'all' && { category }) });
  };

  return (
    <div className="pt-14 md:pt-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-[#1a0a2e] text-white text-center py-10 md:py-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[12rem] md:text-[18rem] text-gold/[0.04] font-serif select-none">✦</div>
        <h1 className="font-serif text-3xl md:text-5xl text-gold-light mb-2 relative">Our Collection</h1>
        <p className="text-white/60 text-sm md:text-base relative">Handcrafted jewellery for every story</p>
      </section>

      <div className="container py-6 md:py-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input className="form-input flex-1" type="text" placeholder="Search jewellery…" value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-primary flex-shrink-0 !px-4">Search</button>
          </form>
          <select className="form-input sm:w-48" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Category pills — scrollable on mobile */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
              className={`flex-shrink-0 px-3.5 md:px-4 py-1.5 rounded-full border text-xs font-medium capitalize transition-all duration-200 touch-manipulation ${
                category === cat
                  ? 'bg-navy border-navy text-gold-light'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-gold hover:text-gold-dark'
              }`}>
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {totalItems > 0 && (
          <p className="text-xs text-slate-400 mb-5">{totalItems} product{totalItems !== 1 ? 's' : ''} found</p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="page-loader"><div className="spinner" /><p>Loading jewellery…</p></div>
        ) : isError ? (
          <div className="empty-state"><div className="empty-state-icon">✦</div><h3>Something went wrong</h3><p>Could not load products. Please try again.</p></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">✦</div><h3>No products found</h3><p>Try a different category or search term.</p></div>
        ) : (
          <div className="products-grid">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 md:gap-4 mt-10 mb-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-outline !px-3 md:!px-5 text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                // Show limited pages on mobile
                const p = i + 1;
                if (totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== totalPages) return null;
                return (
                  <button key={i} onClick={() => setPage(p)}
                    className={`w-8 h-8 md:w-9 md:h-9 rounded text-xs md:text-sm font-medium border transition-all touch-manipulation ${
                      page === p ? 'bg-navy border-navy text-gold-light' : 'bg-white border-slate-200 text-slate-500 hover:border-gold'
                    }`}>
                    {p}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn btn-outline !px-3 md:!px-5 text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
