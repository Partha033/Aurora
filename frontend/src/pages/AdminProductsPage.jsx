import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = ['rings','necklaces','earrings','bracelets','pendants','sets','other'];
const CAT_ICONS  = { rings:'💍', necklaces:'📿', earrings:'👂', bracelets:'⌚', pendants:'🔮', sets:'✨', other:'📦' };

/* ── Product Form Modal ─────────────────────────────────────────────────── */
const ProductFormModal = ({ product, onClose }) => {
  const qc     = useQueryClient();
  const isEdit = Boolean(product?._id);
  const imgRef = useRef(null);

  const [form, setForm] = useState({
    name:            product?.name            ?? '',
    description:     product?.description     ?? '',
    price:           product?.price           ?? '',
    discountedPrice: product?.discountedPrice ?? '',
    category:        product?.category        ?? 'rings',
    stock:           product?.stock           ?? '',
    isActive:        product?.isActive        ?? true,
  });
  const [previews, setPreviews] = useState(product?.images?.map(i => i.url) ?? []);
  const [files,    setFiles]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(1); // 1 = basics, 2 = pricing, 3 = images

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleFiles = e => {
    const sel = Array.from(e.target.files);
    if (!sel.length) return;
    setFiles(e.target.files);
    setPreviews(sel.map(f => URL.createObjectURL(f)));
  };

  const removeImg = i => {
    if (files) {
      const dt = new DataTransfer();
      Array.from(files).filter((_, fi) => fi !== i).forEach(f => dt.items.add(f));
      setFiles(dt.files.length ? dt.files : null);
      if (imgRef.current) imgRef.current.files = dt.files;
    }
    setPreviews(p => p.filter((_, pi) => pi !== i));
  };

  const discountPct = form.price && form.discountedPrice && Number(form.discountedPrice) < Number(form.price)
    ? Math.round((1 - form.discountedPrice / form.price) * 100) : 0;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price || !form.stock)
      return toast.error('Name, description, price and stock are required');
    if (!isEdit && (!files || files.length === 0))
      return toast.error('At least one image is required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('price', form.price);
      fd.append('category', form.category);
      fd.append('stock', form.stock);
      fd.append('isActive', form.isActive);
      if (form.discountedPrice) fd.append('discountedPrice', form.discountedPrice);
      if (files) Array.from(files).forEach(f => fd.append('images', f));
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEdit) await api.put(`/product/${product._id}`, fd, cfg);
      else        await api.post('/product', fd, cfg);
      toast.success(isEdit ? '✦ Product updated!' : '✦ Product created!');
      qc.invalidateQueries(['admin-products-page']);
      qc.invalidateQueries(['admin-dashboard-data']);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Save failed');
    } finally { setLoading(false); }
  };

  const STEPS = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Pricing'   },
    { n: 3, label: 'Images'    },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />

      {/* Slide-in panel */}
      <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-8 py-6 flex items-center justify-between flex-shrink-0 ${isEdit ? 'bg-gradient-to-r from-navy to-navy-mid' : 'bg-gradient-to-r from-[#1a0a2e] to-navy'}`}>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{isEdit ? 'Editing Product' : 'New Product'}</p>
            <h2 className="text-white font-serif text-xl">{isEdit ? product.name : '✦ Add to Catalogue'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-sm">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          {STEPS.map(s => (
            <button key={s.n} onClick={() => setStep(s.n)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${step === s.n ? 'border-gold text-gold-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <span className={`inline-flex w-5 h-5 rounded-full text-[10px] items-center justify-center mr-1.5 ${step === s.n ? 'bg-gold text-navy' : 'bg-slate-100 text-slate-400'}`}>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 flex flex-col gap-5">

            {/* ── Step 1: Basic Info ── */}
            {step === 1 && (
              <>
                <div>
                  <label className="form-label mb-2 block">Product Name <span className="text-red-400">*</span></label>
                  <input name="name" className="form-input" placeholder="e.g. 22K Gold Bangle" value={form.name} onChange={set} required />
                </div>
                <div>
                  <label className="form-label mb-2 block">Category <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                        className={`py-2.5 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                          form.category === c ? 'bg-navy border-navy text-gold-light shadow-md' : 'border-slate-200 text-slate-500 hover:border-gold hover:text-gold-dark'
                        }`}>
                        <span className="text-lg">{CAT_ICONS[c]}</span>
                        <span className="capitalize text-[10px]">{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label mb-2 block">Description <span className="text-red-400">*</span></label>
                  <textarea name="description" className="form-input resize-none" rows={4}
                    placeholder="Describe the product — material, design, occasion…"
                    value={form.description} onChange={set} required />
                  <p className="text-[11px] text-slate-400 mt-1">{form.description.length} characters</p>
                </div>
                {/* Visibility */}
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-200 hover:border-gold transition-colors">
                  <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${form.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    <input name="isActive" type="checkbox" className="hidden" checked={form.isActive} onChange={set} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">{form.isActive ? '● Published — visible in shop' : '○ Hidden — not visible in shop'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle to control customer visibility</p>
                  </div>
                </label>
              </>
            )}

            {/* ── Step 2: Pricing & Stock ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-2 block">Original Price (₹) <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                      <input name="price" type="number" min="0" step="0.01" className="form-input !pl-8" placeholder="0" value={form.price} onChange={set} required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label mb-2 block">Sale Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                      <input name="discountedPrice" type="number" min="0" step="0.01" className="form-input !pl-8" placeholder="Optional" value={form.discountedPrice} onChange={set} />
                    </div>
                  </div>
                </div>

                {/* Discount preview */}
                {discountPct > 0 ? (
                  <div className="rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white font-black text-lg">{discountPct}%</span>
                      </div>
                      <div className="text-white">
                        <p className="font-bold text-sm">Great discount!</p>
                        <p className="text-xs text-white/80">Customers save ₹{(Number(form.price) - Number(form.discountedPrice)).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-100 border-t-0 rounded-b-2xl px-5 py-3 flex justify-between text-xs text-green-700">
                      <span>Original: ₹{Number(form.price).toLocaleString('en-IN')}</span>
                      <span>Sale: ₹{Number(form.discountedPrice).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center text-xs text-slate-400">
                    Add a sale price to show a discount badge on the product
                  </div>
                )}

                <div>
                  <label className="form-label mb-2 block">Stock Quantity <span className="text-red-400">*</span></label>
                  <input name="stock" type="number" min="0" className="form-input" placeholder="0" value={form.stock} onChange={set} required />
                  {/* Stock status indicator */}
                  {form.stock !== '' && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${Number(form.stock) === 0 ? 'text-red-500' : Number(form.stock) <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                      <span>{Number(form.stock) === 0 ? '⚠️ Out of stock' : Number(form.stock) <= 5 ? '⚠️ Low stock — will show warning' : '✓ Good stock level'}</span>
                    </div>
                  )}
                </div>

                {/* Price summary card */}
                {form.price && form.stock && (
                  <div className="bg-navy rounded-2xl p-5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Inventory Value</p>
                    <p className="text-2xl font-bold text-gold-light">
                      ₹{((form.discountedPrice || form.price) * form.stock).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-white/40 mt-1">{form.stock} units × ₹{(form.discountedPrice || form.price)}</p>
                  </div>
                )}
              </>
            )}

            {/* ── Step 3: Images ── */}
            {step === 3 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label">
                      Product Images {!isEdit && <span className="text-red-400">*</span>}
                    </label>
                    <span className="text-[11px] text-slate-400">{previews.length}/5 uploaded</span>
                  </div>

                  {/* Upload area */}
                  <label className="block cursor-pointer mb-4">
                    <div className="border-2 border-dashed border-slate-200 hover:border-gold rounded-2xl p-8 text-center transition-all group hover:bg-gold/5">
                      <div className="text-5xl text-slate-200 group-hover:text-gold transition-colors mb-3">📷</div>
                      <p className="text-sm font-medium text-slate-500 group-hover:text-navy">Click to add images</p>
                      <p className="text-xs text-slate-300 mt-1">PNG, JPG, WEBP · max 5MB each · up to 5 images</p>
                    </div>
                    <input ref={imgRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFiles} />
                  </label>

                  {/* Previews */}
                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeImg(i)}
                              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600">✕</button>
                          </div>
                          {i === 0 && <span className="absolute top-1.5 left-1.5 bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full">Main</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2">📸 Image Tips</p>
                  <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                    <li>Use square images (1:1) for best results</li>
                    <li>First image becomes the product thumbnail</li>
                    <li>White or neutral background recommended</li>
                    <li>High resolution — at least 800×800px</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-8 pb-8 pt-4 border-t border-slate-100 flex-shrink-0 flex items-center justify-between gap-3 sticky bottom-0 bg-white">
            <div className="flex gap-2">
              {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="btn btn-ghost text-sm">← Back</button>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn btn-ghost text-sm text-slate-400">Cancel</button>
              {step < 3
                ? <button type="button" onClick={() => setStep(s => s + 1)} className="btn btn-primary text-sm gap-2">Next step →</button>
                : <button type="submit" disabled={loading} className="btn btn-primary gap-2 min-w-[160px] justify-center text-sm">
                    {loading ? <><div className="spinner spinner-sm" /> {isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? '✓ Save Changes' : '✦ Create Product'}
                  </button>
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Delete Confirm Modal ─────────────────────────────────────────────────  */
const DeleteModal = ({ product, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[300] bg-navy/60 flex items-center justify-center p-6" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="p-7 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
        <h3 className="font-serif text-xl text-navy mb-2">Delete Product?</h3>
        <p className="text-sm text-slate-500 mb-1">You are about to delete</p>
        <p className="font-semibold text-navy mb-5">"{product.name}"</p>
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-6">This action cannot be undone. The product will be hidden from the shop.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn btn-outline text-sm">Keep it</button>
          <button onClick={onConfirm} className="flex-1 btn btn-danger text-sm">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Main Admin Products Page ─────────────────────────────────────────────  */
const AdminProductsPage = () => {
  const { user }    = useAuthStore();
  const navigate    = useNavigate();
  const qc          = useQueryClient();

  const [modal,      setModal]   = useState(null);
  const [deleteItem, setDelete]  = useState(null);
  const [search,     setSearch]  = useState('');
  const [catFilter,  setCat]     = useState('');
  const [viewMode,   setView]    = useState('grid');
  const [sortBy,     setSort]    = useState('newest');

  // ── ALL hooks must be called before any early return ──
  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products-page', search, catFilter, sortBy],
    queryFn:  () => api.get('/product', {
      params: { perPage: 100, currentPage: 1, adminView: 'true', sortBy, ...(search && { search }), ...(catFilter && { category: catFilter }) }
    }).then(r => r.data.result),
    staleTime: 20_000,
    enabled:  isAdmin,   // only fetch when user is admin
  });

  const allProducts = data?.rows ?? [];

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/product/${id}`),
    onSuccess:  () => { 
      toast.success('Product deleted'); 
      qc.invalidateQueries(['admin-products-page']); 
      qc.invalidateQueries(['admin-dashboard-data']);
      setDelete(null); 
    },
    onError:   err => toast.error(err.response?.data?.msg || 'Delete failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: id => api.patch(`/product/${id}/toggle`),
    onSuccess: res => { 
      toast.success(res.data.result.isActive ? 'Product published ✦' : 'Product hidden'); 
      qc.invalidateQueries(['admin-products-page']); 
      qc.invalidateQueries(['admin-dashboard-data']);
    },
    onError:  err => toast.error(err.response?.data?.msg || 'Toggle failed'),
  });

  // Guard — redirect non-admins AFTER all hooks are declared
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const stats = {
    total:      allProducts.length,
    active:     allProducts.filter(p =>  p.isActive).length,
    hidden:     allProducts.filter(p => !p.isActive).length,
    outOfStock: allProducts.filter(p =>  p.stock === 0).length,
    lowStock:   allProducts.filter(p =>  p.stock > 0 && p.stock <= 5).length,
  };

  return (
    <div className="bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-navy shadow-xl">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-white/30 hover:text-white/70 transition-colors text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <div>
              <h1 className="font-serif text-2xl text-gold-light">Product Management</h1>
              <p className="text-xs text-white/40 mt-0.5">Add, edit and manage your jewellery catalogue</p>
            </div>
          </div>
          <button onClick={() => setModal({})} className="btn btn-primary shadow-lg shadow-gold/20 gap-2">
            <span className="text-lg leading-none font-light">+</span> Add New Product
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Products', val: stats.total,      icon: '💍', bg: 'bg-white',     text: 'text-navy'       },
            { label: 'Published',      val: stats.active,     icon: '✅', bg: 'bg-green-50',  text: 'text-green-700'  },
            { label: 'Hidden',         val: stats.hidden,     icon: '🚫', bg: 'bg-slate-100', text: 'text-slate-600'  },
            { label: 'Out of Stock',   val: stats.outOfStock, icon: '❌', bg: 'bg-red-50',    text: 'text-red-600'    },
            { label: 'Low Stock',      val: stats.lowStock,   icon: '⚠️', bg: 'bg-amber-50',  text: 'text-amber-700'  },
          ].map(({ label, val, icon, bg, text }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-black/[0.05] shadow-sm`}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className={`text-xl font-bold ${text}`}>{val}</p>
                <p className="text-[10px] text-slate-400 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar row ── */}
        <div className="flex flex-wrap gap-3 items-center mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input className="form-input !pl-10 !py-2.5 text-sm shadow-sm" placeholder="Search products…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Sort */}
          <select className="form-input w-44 !py-2.5 text-sm shadow-sm" value={sortBy} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <button onClick={() => setView('grid')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-navy text-white' : 'bg-white text-slate-400 hover:text-navy'}`}>
              ⊞ Grid
            </button>
            <button onClick={() => setView('table')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-navy text-white' : 'bg-white text-slate-400 hover:text-navy'}`}>
              ☰ Table
            </button>
          </div>
        </div>

        {/* ── Category pill filters ── */}
        <div className="flex gap-2 flex-wrap mb-7">
          <button onClick={() => setCat('')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${!catFilter ? 'bg-navy text-gold-light border-navy shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-navy hover:text-navy'}`}>
            All ({allProducts.length})
          </button>
          {CATEGORIES.map(c => {
            const cnt = allProducts.filter(p => p.category === c).length;
            if (!cnt && catFilter !== c) return null;
            return (
              <button key={c} onClick={() => setCat(c === catFilter ? '' : c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  catFilter === c ? 'bg-gold text-navy border-gold shadow-md shadow-gold/20' : 'bg-white border-slate-200 text-slate-500 hover:border-gold hover:text-gold-dark'
                }`}>
                {CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${catFilter === c ? 'bg-white/30' : 'bg-slate-100'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-56 bg-slate-100" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" /><div className="h-3 bg-slate-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] py-24 text-center shadow-sm">
            <p className="text-6xl mb-5">💍</p>
            <h3 className="font-serif text-2xl text-navy mb-2">No products found</h3>
            <p className="text-slate-400 text-sm mb-8">{search || catFilter ? 'Try different search or filters' : 'Start by adding your first product'}</p>
            {!search && !catFilter && (
              <button onClick={() => setModal({})} className="btn btn-primary gap-2">✦ Add First Product</button>
            )}
          </div>

        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
            {allProducts.map(p => (
              <div key={p._id}
                className={`group relative bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${!p.isActive ? 'opacity-55 grayscale-[40%]' : ''}`}>
                {/* Image */}
                <div className="relative h-56 bg-cream overflow-hidden">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    : <div className="w-full h-full flex items-center justify-center text-6xl text-gold/20">✦</div>
                  }
                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-navy/75 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-center justify-center gap-2">
                    <button onClick={() => setModal(p)}
                      className="bg-white text-navy text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gold hover:text-white transition-colors shadow-lg">
                      ✏ Edit
                    </button>
                    <button onClick={() => toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl shadow-lg transition-colors ${p.isActive ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                      {p.isActive ? '🚫' : '👁'}
                    </button>
                    <button onClick={() => setDelete(p)}
                      className="bg-red-500 text-white text-xs font-semibold p-2 rounded-xl hover:bg-red-600 transition-colors shadow-lg">
                      🗑
                    </button>
                  </div>
                  {/* Status badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
                    {!p.isActive          && <span className="bg-slate-800/90 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Hidden</span>}
                    {p.discountPercent > 0 && <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{p.discountPercent}% OFF</span>}
                    {p.stock === 0         && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>}
                    {p.stock > 0 && p.stock <= 5 && <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Low Stock</span>}
                  </div>
                  {/* Image count */}
                  {p.images?.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      +{p.images.length - 1} more
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <span className="text-[9px] uppercase tracking-widest text-gold-dark font-semibold">
                    {CAT_ICONS[p.category]} {p.category}
                  </span>
                  <h3 className="font-serif font-semibold text-navy text-base mt-0.5 leading-snug line-clamp-1">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div>
                      <p className="font-bold text-navy">₹{(p.discountedPrice || p.price).toLocaleString('en-IN')}</p>
                      {p.discountedPrice && <p className="text-[11px] text-slate-400 line-through">₹{p.price.toLocaleString('en-IN')}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {p.stock} in stock
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom quick-action row */}
                <div className="border-t border-slate-50 flex">
                  <button onClick={() => setModal(p)}
                    className="flex-1 py-2.5 text-xs text-navy font-medium hover:bg-gold/10 hover:text-gold-dark transition-colors">
                    Edit
                  </button>
                  <div className="w-px bg-slate-100" />
                  <button onClick={() => toggleMutation.mutate(p._id)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${p.isActive ? 'text-slate-400 hover:bg-slate-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {p.isActive ? 'Hide' : 'Publish'}
                  </button>
                  <div className="w-px bg-slate-100" />
                  <button onClick={() => setDelete(p)}
                    className="flex-1 py-2.5 text-xs text-red-400 font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy">
                  {['','Product','Category','Price','Discount','Stock','Visibility','Actions'].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-gold-light font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allProducts.map(p => (
                  <tr key={p._id} className={`border-t border-slate-50 hover:bg-slate-50/60 transition-colors ${!p.isActive ? 'opacity-55' : ''}`}>
                    <td className="pl-4 pr-2 py-3 w-16">
                      {p.images?.[0]?.url
                        ? <img src={p.images[0].url} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100" />
                        : <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center text-gold text-xl border border-slate-100">✦</div>
                      }
                    </td>
                    <td className="px-3 py-3 max-w-[220px]">
                      <p className="font-semibold text-navy truncate text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description?.slice(0, 55)}…</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 bg-gold/10 text-gold-dark text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap">
                        {CAT_ICONS[p.category]} {p.category}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-navy">₹{p.price.toLocaleString('en-IN')}</p>
                      {p.discountedPrice && <p className="text-[11px] text-green-600">₹{p.discountedPrice.toLocaleString('en-IN')}</p>}
                    </td>
                    <td className="px-3 py-3">
                      {p.discountPercent > 0
                        ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full">{p.discountPercent}% OFF</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <p className={`font-bold text-sm ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-navy'}`}>{p.stock}</p>
                      {p.stock === 0 && <p className="text-[10px] text-red-400">Out of stock</p>}
                      {p.stock > 0 && p.stock <= 5 && <p className="text-[10px] text-amber-400">Low stock</p>}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                        className={`text-[10px] font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all border ${
                          p.isActive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}>
                        {p.isActive ? '● Live' : '○ Hidden'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(p)}
                          className="px-3 py-1.5 text-xs border border-slate-200 text-navy rounded-lg hover:border-gold hover:text-gold transition-colors font-medium">
                          Edit
                        </button>
                        <button onClick={() => setDelete(p)}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {allProducts.length} product{allProducts.length !== 1 && 's'}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal !== null && (
        <ProductFormModal
          product={Object.keys(modal).length > 0 ? modal : null}
          onClose={() => setModal(null)}
        />
      )}
      {deleteItem && (
        <DeleteModal
          product={deleteItem}
          onClose={() => setDelete(null)}
          onConfirm={() => deleteMutation.mutate(deleteItem._id)}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
