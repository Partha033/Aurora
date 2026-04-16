import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { 
  Plus, Search, LayoutGrid, List, Pencil, Trash2, Eye, EyeOff, 
  Package, CheckCircle2, XCircle, AlertTriangle, X, Camera, 
  Gem, Dna, Sparkles, Disc, CircleDot, Layers, 
  Globe, Lock, Image as ImageIcon, Info, Check
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = ['rings','necklaces','earrings','bracelets','pendants','sets','other'];
const CAT_ICONS  = { 
  rings: <Gem size={18} />, 
  necklaces: <Dna size={18} />, 
  earrings: <Sparkles size={18} />, 
  bracelets: <Disc size={18} />, 
  pendants: <CircleDot size={18} />, 
  sets: <Layers size={18} />, 
  other: <Package size={18} /> 
};

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
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
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
            <h2 className="text-white font-serif text-xl flex items-center gap-2">
              {!isEdit && <Plus size={20} className="text-gold" />}
              {isEdit ? product.name : 'Add to Catalogue'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-sm">
            <X size={18} />
          </button>
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
                  <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Product Name <span className="text-red-400">*</span></label>
                  <input name="name" className="form-input" placeholder="e.g. 22K Gold Bangle" value={form.name} onChange={set} required />
                </div>
                <div>
                  <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Category <span className="text-red-400">*</span></label>
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
                  <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description <span className="text-red-400">*</span></label>
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
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${form.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                      {form.isActive ? <Globe size={16} /> : <Lock size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">{form.isActive ? 'Published — visible in shop' : 'Hidden — not visible in shop'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Toggle to control customer visibility</p>
                    </div>
                  </div>
                </label>
              </>
            )}

            {/* ── Step 2: Pricing & Stock ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Original Price (₹) <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                      <input name="price" type="number" min="0" step="0.01" className="form-input !pl-8" placeholder="0" value={form.price} onChange={set} required />
                    </div>
                  </div>
                  <div>
                    <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Sale Price (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                      <input name="discountedPrice" type="number" min="0" step="0.01" className="form-input !pl-8" placeholder="Optional" value={form.discountedPrice} onChange={set} />
                    </div>
                  </div>
                </div>

                {/* Discount preview */}
                {discountPct > 0 ? (
                  <div className="rounded-2xl overflow-hidden shadow-sm">
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
                  <label className="form-label mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Stock Quantity <span className="text-red-400">*</span></label>
                  <input name="stock" type="number" min="0" className="form-input" placeholder="0" value={form.stock} onChange={set} required />
                  {/* Stock status indicator */}
                  {form.stock !== '' && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${Number(form.stock) === 0 ? 'text-red-500' : Number(form.stock) <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                      {Number(form.stock) === 0 ? <XCircle size={14} /> : Number(form.stock) <= 5 ? <AlertTriangle size={14} /> : <Check size={14} />}
                      <span>{Number(form.stock) === 0 ? 'Out of stock' : Number(form.stock) <= 5 ? 'Low stock — will show warning' : 'Good stock level'}</span>
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
                    <label className="form-label text-xs font-bold uppercase tracking-wider text-slate-500">
                      Product Images {!isEdit && <span className="text-red-400">*</span>}
                    </label>
                    <span className="text-[11px] text-slate-400">{previews.length}/5 uploaded</span>
                  </div>

                  {/* Upload area */}
                  <label className="block cursor-pointer mb-4">
                    <div className="border-2 border-dashed border-slate-200 hover:border-gold rounded-2xl p-8 text-center transition-all group hover:bg-gold/5">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-gold group-hover:text-white transition-all mx-auto mb-3">
                        <Camera size={32} />
                      </div>
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
                              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600">
                              <X size={14} />
                            </button>
                          </div>
                          {i === 0 && <span className="absolute top-1.5 left-1.5 bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">Main</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Info size={14} /> Image Tips
                  </p>
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
                    {loading ? <><div className="spinner spinner-sm" /> {isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? <><Check size={18} /> Save Changes</> : <><Plus size={18} /> Create Product</>}
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
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-7 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={32} />
        </div>
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
      toast.success(res.data.result.isActive ? 'Product published' : 'Product hidden'); 
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
    <div className="bg-slate-50 min-h-screen">
      {/* ── Page Header ── */}
      <div className="bg-navy shadow-xl">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-white/30 hover:text-white/70 transition-colors text-sm">← Dashboard</Link>
            <span className="text-white/20">/</span>
            <div>
              <h1 className="font-serif text-2xl text-gold-light tracking-wide">Product Management</h1>
              <p className="text-xs text-white/40 mt-0.5">Add, edit and manage your jewellery catalogue</p>
            </div>
          </div>
          <button onClick={() => setModal({})} className="btn btn-primary shadow-lg shadow-gold/20 gap-2 font-bold uppercase tracking-widest text-[10px] py-3.5">
            <Plus size={16} /> Add New Product
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Products', val: stats.total,      icon: <Package size={22} />,      bg: 'bg-white',     text: 'text-navy', border: 'border-slate-100' },
            { label: 'Published',      val: stats.active,     icon: <CheckCircle2 size={22} />, bg: 'bg-white',     text: 'text-green-600', border: 'border-green-100' },
            { label: 'Hidden',         val: stats.hidden,     icon: <EyeOff size={22} />,       bg: 'bg-white',     text: 'text-slate-500', border: 'border-slate-200' },
            { label: 'Out of Stock',   val: stats.outOfStock, icon: <XCircle size={22} />,      bg: 'bg-white',     text: 'text-red-500', border: 'border-red-100' },
            { label: 'Low Stock',      val: stats.lowStock,   icon: <AlertTriangle size={22} />, bg: 'bg-white',     text: 'text-amber-600', border: 'border-amber-100' },
          ].map(({ label, val, icon, bg, text, border }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4 border ${border} shadow-sm transition-all hover:shadow-md`}>
              <div className={`${text} opacity-80`}>{icon}</div>
              <div>
                <p className={`text-xl font-black ${text}`}>{val}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar row ── */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="form-input !pl-11 !py-3 text-sm shadow-sm bg-white border-slate-200" placeholder="Search products by name or category…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Sort */}
          <select className="form-input w-48 !py-3 text-sm shadow-sm bg-white border-slate-200" value={sortBy} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          {/* View toggle */}
          <div className="flex bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm p-1">
            <button onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-navy hover:bg-slate-50'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-navy text-white shadow-md' : 'text-slate-400 hover:text-navy hover:bg-slate-50'}`}>
              <List size={18} />
            </button>
          </div>
        </div>

        {/* ── Category pill filters ── */}
        <div className="flex gap-2.5 flex-wrap mb-8">
          <button onClick={() => setCat('')}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${!catFilter ? 'bg-navy text-gold-light border-navy shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-navy hover:text-navy'}`}>
            All ({allProducts.length})
          </button>
          {CATEGORIES.map(c => {
            const cnt = allProducts.filter(p => p.category === c).length;
            if (!cnt && catFilter !== c) return null;
            return (
              <button key={c} onClick={() => setCat(c === catFilter ? '' : c)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                  catFilter === c ? 'bg-gold text-navy border-gold shadow-md shadow-gold/20' : 'bg-white border-slate-200 text-slate-500 hover:border-gold hover:text-gold-dark'
                }`}>
                <span className="opacity-70">{CAT_ICONS[c]}</span>
                {c}
                <span className={`text-[10px] rounded-full px-2 py-0.5 ml-1 ${catFilter === c ? 'bg-navy/10' : 'bg-slate-100'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-60 bg-slate-100" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-5 bg-slate-100 rounded w-3/4" /><div className="h-4 bg-slate-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.06] py-24 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Gem size={40} />
            </div>
            <h3 className="font-serif text-2xl text-navy mb-2">No products found</h3>
            <p className="text-slate-400 text-sm mb-8">{search || catFilter ? 'Try different search or filters' : 'Start by adding your first product to the catalogue'}</p>
            {!search && !catFilter && (
              <button onClick={() => setModal({})} className="btn btn-primary gap-3 px-8">
                <Plus size={18} /> Add First Product
              </button>
            )}
          </div>

        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
            {allProducts.map(p => (
              <div key={p._id}
                className={`group relative bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${!p.isActive ? 'opacity-60 grayscale-[40%]' : ''}`}>
                {/* Image */}
                <div className="relative h-60 bg-slate-50 overflow-hidden">
                  {p.images?.[0]?.url
                    ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    : <div className="w-full h-full flex items-center justify-center text-gold/20"><Sparkles size={60} strokeWidth={1} /></div>
                  }
                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button onClick={() => setModal(p)}
                      className="bg-white text-navy p-3 rounded-xl hover:bg-gold hover:text-white transition-all shadow-xl" title="Edit Product">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                      className={`p-3 rounded-xl shadow-xl transition-all ${p.isActive ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-500 text-white hover:bg-green-600'}`}
                      title={p.isActive ? 'Hide Product' : 'Publish Product'}>
                      {p.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button onClick={() => setDelete(p)}
                      className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-all shadow-xl" title="Delete Product">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
                    {!p.isActive          && <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">Hidden</span>}
                    {p.discountPercent > 0 && <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-green-500/20">{p.discountPercent}% OFF</span>}
                    {p.stock === 0         && <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg shadow-red-500/20">Out of Stock</span>}
                    {p.stock > 0 && p.stock <= 5 && <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/20">Low Stock</span>}
                  </div>
                  {/* Image count indicator */}
                  {p.images?.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                      <ImageIcon size={10} /> {p.images.length}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-gold-dark opacity-70">{CAT_ICONS[p.category]}</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gold-dark font-bold">
                      {p.category}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base mt-1 leading-tight line-clamp-1 group-hover:text-gold-dark transition-colors">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed h-8">{p.description}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <div>
                      <p className="font-black text-navy text-lg">₹{(p.discountedPrice || p.price).toLocaleString('en-IN')}</p>
                      {p.discountedPrice && <p className="text-[10px] text-slate-400 line-through font-medium">₹{p.price.toLocaleString('en-IN')}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom quick-action row */}
                <div className="border-t border-slate-50 flex bg-slate-50/50">
                  <button onClick={() => setModal(p)}
                    className="flex-1 py-3 text-[10px] text-navy font-bold uppercase tracking-wider hover:bg-white hover:text-gold-dark transition-all">
                    Edit
                  </button>
                  <div className="w-px bg-slate-100" />
                  <button onClick={() => toggleMutation.mutate(p._id)}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${p.isActive ? 'text-slate-400 hover:bg-white' : 'text-green-600 hover:bg-green-50'}`}>
                    {p.isActive ? 'Hide' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-navy border-b border-white/5">
                    {['','Product','Category','Price','Discount','Stock','Visibility','Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-4 text-left text-[10px] uppercase tracking-widest text-gold-light font-bold ${i === 0 ? 'w-20' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allProducts.map(p => (
                    <tr key={p._id} className={`hover:bg-slate-50/80 transition-colors ${!p.isActive ? 'opacity-60 bg-slate-50/30' : ''}`}>
                      <td className="px-5 py-4">
                        {p.images?.[0]?.url
                          ? <img src={p.images[0].url} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm" />
                          : <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-gold/40 border border-slate-200"><Sparkles size={20} /></div>
                        }
                      </td>
                      <td className="px-5 py-4 max-w-[280px]">
                        <p className="font-bold text-navy truncate text-sm">{p.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 bg-slate-100 text-navy text-[10px] font-bold px-3 py-1.5 rounded-full capitalize whitespace-nowrap">
                          <span className="opacity-60">{CAT_ICONS[p.category]}</span>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-navy">₹{p.price.toLocaleString('en-IN')}</p>
                        {p.discountedPrice && <p className="text-[11px] text-green-600 font-medium">₹{p.discountedPrice.toLocaleString('en-IN')}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {p.discountPercent > 0
                          ? <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-md">{p.discountPercent}% OFF</span>
                          : <span className="text-slate-300 font-light">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className={`font-black text-sm ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-navy'}`}>{p.stock}</p>
                          {p.stock === 0 && <span className="p-1 bg-red-50 text-red-500 rounded"><XCircle size={10} /></span>}
                          {p.stock > 0 && p.stock <= 5 && <span className="p-1 bg-amber-50 text-amber-500 rounded"><AlertTriangle size={10} /></span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                          className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                            p.isActive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}>
                          {p.isActive ? <Globe size={12} /> : <Lock size={12} />}
                          {p.isActive ? 'Live' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setModal(p)}
                            className="p-2 text-slate-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-all" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDelete(p)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {allProducts.length} Product{allProducts.length !== 1 && 's'} in Catalogue
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
