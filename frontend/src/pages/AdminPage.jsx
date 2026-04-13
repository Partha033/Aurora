import { useState, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const ORDER_STATUSES = ['placed','confirmed','processing','shipped','delivered','cancelled'];
const CATEGORIES     = ['rings','necklaces','earrings','bracelets','pendants','sets','other'];
const CAT_ICONS      = { rings:'💍', necklaces:'📿', earrings:'👂', bracelets:'⌚', pendants:'🔮', sets:'✨', other:'📦' };

const STATUS_META = {
  placed:     { cls: 'bg-yellow-100 text-yellow-700', label: 'Placed' },
  confirmed:  { cls: 'bg-blue-100   text-blue-700',   label: 'Confirmed' },
  processing: { cls: 'bg-indigo-100 text-indigo-700', label: 'Processing' },
  shipped:    { cls: 'bg-purple-100 text-purple-700', label: 'Shipped' },
  delivered:  { cls: 'bg-green-100  text-green-700',  label: 'Delivered' },
  cancelled:  { cls: 'bg-red-100    text-red-700',    label: 'Cancelled' },
};
const statusCls = s => STATUS_META[s]?.cls || 'bg-slate-100 text-slate-600';

/* ─── Stat Card (Dashboard) ──────────────────────────────────────────────  */
const StatCard = ({ icon, label, value, sub, color, bg }) => (
  <div className={`rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-black/[0.06] ${bg} hover:-translate-y-0.5 hover:shadow-md transition-all`}>
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color} bg-white/60`}>{sub}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-500 font-medium">{label}</p>
  </div>
);

/* ─── Dashboard ──────────────────────────────────────────────────────────  */
const AdminDashboard = () => {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey:        ['admin-dashboard'],
    queryFn:         () => api.get('/order/admin/dashboard').then(r => r.data.result),
    refetchInterval: 30_000,
    staleTime:       10_000,
  });
  const s  = data?.stats        || {};
  const ro = data?.recentOrders || [];
  const rd = data?.revenueByDay || [];
  const CARDS = [
    { icon:'💰', label:'Total Revenue (Paid)',  value:`₹${(s.totalRevenue||0).toLocaleString('en-IN')}`, sub:'All time',        color:'text-emerald-700', bg:'bg-emerald-50' },
    { icon:'📦', label:'Total Orders',          value:s.totalOrders    ||0,                              sub:'All time',        color:'text-blue-700',   bg:'bg-blue-50'    },
    { icon:'⏳', label:'Awaiting Confirmation', value:s.pendingOrders  ||0,                              sub:'Needs attention', color:'text-amber-700',  bg:'bg-amber-50'   },
    { icon:'✅', label:'Delivered',              value:s.deliveredOrders||0,                              sub:'Completed',       color:'text-teal-700',   bg:'bg-teal-50'    },
    { icon:'❌', label:'Cancelled',              value:s.cancelledOrders||0,                              sub:'Total',           color:'text-red-700',    bg:'bg-red-50'     },
    { icon:'💍', label:'Active Products',        value:s.totalProducts  ||0,                              sub:'In catalogue',    color:'text-purple-700', bg:'bg-purple-50'  },
    { icon:'👥', label:'Customers',              value:s.totalUsers     ||0,                              sub:'Registered',      color:'text-indigo-700', bg:'bg-indigo-50'  },
  ];
  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array(7).fill(0).map((_,i) => (
        <div key={i} className="rounded-2xl bg-white border border-black/[0.06] p-5 h-28 animate-pulse">
          <div className="w-8 h-8 bg-slate-100 rounded-lg mb-3"/><div className="h-5 bg-slate-100 rounded w-14 mb-2"/><div className="h-3 bg-slate-50 rounded w-20"/>
        </div>
      ))}
    </div>
  );
  const maxRev = Math.max(...rd.map(d => d.revenue), 1);
  return (
    <div>
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-3xl text-navy">Dashboard</h2>
          {dataUpdatedAt && <p className="text-xs text-slate-400 mt-1">Last updated {new Date(dataUpdatedAt).toLocaleTimeString('en-IN')} · auto refreshes every 30s</p>}
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium border border-emerald-100">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"/> Live
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">{CARDS.map(c => <StatCard key={c.label} {...c}/>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-lg text-navy">Revenue — Last 7 Days</h3>
            <span className="text-xs text-slate-400">{rd.length} day(s)</span>
          </div>
          {rd.length === 0 ? <p className="text-slate-400 text-sm text-center py-10">No paid orders yet</p> : (
            <div className="flex items-end gap-2 h-36 mt-5">
              {rd.map(d => { const pct=(d.revenue/maxRev)*100; return (
                <div key={d._id} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-navy text-gold-light text-[10px] px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">₹{d.revenue.toLocaleString('en-IN')} · {d.count} orders</div>
                    <div className="w-2 h-2 bg-navy rotate-45 -mt-1"/>
                  </div>
                  <div className="w-full bg-gold/10 rounded-t-md relative" style={{height:`${Math.max(pct,3)}%`}}>
                    <div className="absolute inset-0 bg-gradient-to-t from-gold-dark to-gold rounded-t-md"/>
                  </div>
                  <span className="text-[9px] text-slate-400">{d._id?.slice(5)}</span>
                </div>
              );})}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
          <h3 className="font-serif text-lg text-navy mb-5">Order Breakdown</h3>
          <div className="flex flex-col gap-3.5">
            {[
              {label:'Pending',val:s.pendingOrders  ||0,color:'bg-amber-400'},
              {label:'Delivered',val:s.deliveredOrders||0,color:'bg-emerald-400'},
              {label:'Cancelled',val:s.cancelledOrders||0,color:'bg-red-400'},
            ].map(({label,val,color}) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-500">{label}</span><span className="font-bold text-navy">{val}</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{width:`${s.totalOrders?(val/s.totalOrders)*100:0}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-serif text-lg text-navy">Recent Orders</h3>
          <NavLink to="/admin/orders" className="text-xs text-gold-dark hover:text-gold font-medium">View all →</NavLink>
        </div>
        {ro.length === 0 ? <p className="text-center py-10 text-slate-400 text-sm">No orders yet</p> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50">{['Order ID','Customer','Amount','Status','Date'].map(h=>(
              <th key={h} className="px-5 py-3 text-left text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{h}</th>
            ))}</tr></thead>
            <tbody>{ro.map(o=>(
              <tr key={o._id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs font-bold text-navy">#{o._id.slice(-8).toUpperCase()}</td>
                <td className="px-5 py-3.5"><p className="font-medium text-navy text-xs">{o.user?.name||'—'}</p><p className="text-[11px] text-slate-400">{o.user?.email}</p></td>
                <td className="px-5 py-3.5 font-semibold text-navy">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusCls(o.orderStatus)}`}>{STATUS_META[o.orderStatus]?.label||o.orderStatus}</span></td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ─── Product Modal ──────────────────────────────────────────────────────  */
const ProductModal = ({ product, onClose }) => {
  const qc     = useQueryClient();
  const isEdit = Boolean(product?._id);
  const imgRef = useRef(null);
  const [form, setForm] = useState({
    name: product?.name ?? '', description: product?.description ?? '',
    price: product?.price ?? '', discountedPrice: product?.discountedPrice ?? '',
    category: product?.category ?? 'rings', stock: product?.stock ?? '', isActive: product?.isActive ?? true,
  });
  const [previews, setPreviews] = useState(product?.images?.map(i => i.url) ?? []);
  const [files,    setFiles]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.type==='checkbox'?e.target.checked:e.target.value }));
  const handleFiles  = e => { const sel=Array.from(e.target.files); if(!sel.length)return; setFiles(e.target.files); setPreviews(sel.map(f=>URL.createObjectURL(f))); };
  const removePreview = i => {
    if(files){ const dt=new DataTransfer(); Array.from(files).filter((_,fi)=>fi!==i).forEach(f=>dt.items.add(f)); setFiles(dt.files.length?dt.files:null); if(imgRef.current)imgRef.current.files=dt.files; }
    setPreviews(p=>p.filter((_,pi)=>pi!==i));
  };
  const discountPct = form.price&&form.discountedPrice&&Number(form.discountedPrice)<Number(form.price)
    ? Math.round((1-form.discountedPrice/form.price)*100) : 0;

  const handleSubmit = async e => {
    e.preventDefault();
    if(!form.name.trim()||!form.description.trim()||!form.price||!form.stock) return toast.error('Name, description, price and stock are required');
    if(!isEdit&&(!files||files.length===0)) return toast.error('At least one product image is required');
    setLoading(true);
    try {
      const fd=new FormData();
      fd.append('name',form.name.trim()); fd.append('description',form.description.trim());
      fd.append('price',form.price); fd.append('category',form.category);
      fd.append('stock',form.stock); fd.append('isActive',form.isActive);
      if(form.discountedPrice) fd.append('discountedPrice',form.discountedPrice);
      if(files) Array.from(files).forEach(f=>fd.append('images',f));
      const cfg = { headers:{'Content-Type':'multipart/form-data'} };
      if(isEdit) await api.put(`/product/${product._id}`,fd,cfg);
      else       await api.post('/product',fd,cfg);
      toast.success(isEdit?'Product updated ✦':'Product created ✦');
      qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']);
      onClose();
    } catch(err) { toast.error(err.response?.data?.msg||'Failed to save product'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-navy/65 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white flex justify-between items-center px-7 py-5 border-b border-slate-100">
          <h2 className="font-serif text-xl text-navy">{isEdit?`Editing: ${product.name}`:'✦ Add New Product'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm hover:bg-red-500 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-5">
          {/* Images */}
          <div>
            <label className="form-label mb-2 block">Product Images {!isEdit&&<span className="text-red-400">*</span>}</label>
            {previews.length>0 ? (
              <div className="flex gap-3 flex-wrap">
                {previews.map((src,i)=>(
                  <div key={i} className="relative group w-20 h-20 flex-shrink-0">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-slate-200"/>
                    <button type="button" onClick={()=>removePreview(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] hidden group-hover:flex items-center justify-center shadow">✕</button>
                  </div>
                ))}
                {previews.length<5&&(
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors text-slate-300 hover:text-gold flex-shrink-0">
                    <span className="text-3xl leading-none">+</span><span className="text-[10px] mt-0.5">More</span>
                    <input ref={imgRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFiles}/>
                  </label>
                )}
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-200 hover:border-gold rounded-xl p-10 text-center transition-colors group">
                  <div className="text-5xl text-slate-200 group-hover:text-gold transition-colors mb-2">📷</div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-600 font-medium">Click to upload images</p>
                  <p className="text-xs text-slate-300 mt-1">PNG, JPG, WEBP · up to 5 · max 5MB each</p>
                </div>
                <input ref={imgRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFiles}/>
              </label>
            )}
          </div>
          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="form-label mb-1.5 block">Name <span className="text-red-400">*</span></label>
              <input name="name" className="form-input" placeholder="e.g. 22K Gold Bangle" value={form.name} onChange={handleChange} required/></div>
            <div><label className="form-label mb-1.5 block">Category <span className="text-red-400">*</span></label>
              <select name="category" className="form-input" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select></div>
          </div>
          {/* Description */}
          <div><label className="form-label mb-1.5 block">Description <span className="text-red-400">*</span></label>
            <textarea name="description" className="form-input resize-none" rows={3} placeholder="Material, occasion, design…" value={form.description} onChange={handleChange} required/></div>
          {/* Price / Sale / Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div><label className="form-label mb-1.5 block">Price (₹) <span className="text-red-400">*</span></label>
              <input name="price" type="number" min="0" step="0.01" className="form-input" placeholder="0" value={form.price} onChange={handleChange} required/></div>
            <div><label className="form-label mb-1.5 block">Sale Price (₹)</label>
              <input name="discountedPrice" type="number" min="0" step="0.01" className="form-input" placeholder="Optional" value={form.discountedPrice} onChange={handleChange}/></div>
            <div><label className="form-label mb-1.5 block">Stock <span className="text-red-400">*</span></label>
              <input name="stock" type="number" min="0" className="form-input" placeholder="0" value={form.stock} onChange={handleChange} required/></div>
          </div>
          {discountPct>0&&(
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <span className="text-green-700 font-bold text-sm">{discountPct}% OFF</span>
              <span className="text-xs text-slate-500">Customer saves ₹{(Number(form.price)-Number(form.discountedPrice)).toLocaleString('en-IN')}</span>
            </div>
          )}
          {/* Visibility */}
          <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 hover:border-gold transition-colors">
            <div className={`w-10 h-6 rounded-full relative transition-colors ${form.isActive?'bg-green-500':'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?'translate-x-5':'translate-x-1'}`}/>
              <input name="isActive" type="checkbox" className="hidden" checked={form.isActive} onChange={handleChange}/>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">{form.isActive?'Published — visible in shop':'Hidden — not visible in shop'}</p>
              <p className="text-xs text-slate-400">Toggle to show or hide from customers</p>
            </div>
          </label>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2 min-w-[160px] justify-center">
              {loading?<><div className="spinner spinner-sm"/> {isEdit?'Saving…':'Creating…'}</>:isEdit?'✓ Save Changes':'✦ Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Admin Products — Enhanced UI ──────────────────────────────────────  */
const AdminProducts = () => {
  const qc = useQueryClient();
  const [modal,    setModal]  = useState(null);
  const [search,   setSearch] = useState('');
  const [catFilter,setCat]    = useState('');
  const [viewMode, setView]   = useState('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, catFilter],
    queryFn:  () => api.get('/product', {
      params: { perPage: 100, currentPage: 1, adminView: 'true', ...(search&&{search}), ...(catFilter&&{category:catFilter}) }
    }).then(r => r.data.result),
    staleTime: 20_000,
  });

  const allProducts = data?.rows ?? [];

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/product/${id}`),
    onSuccess:  ()  => { toast.success('Product deleted'); qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']); },
    onError:   err  => toast.error(err.response?.data?.msg||'Delete failed'),
  });
  const toggleMutation = useMutation({
    mutationFn: id => api.patch(`/product/${id}/toggle`),
    onSuccess:  res => { toast.success(res.data.result.isActive?'Published ✦':'Hidden'); qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']); },
    onError:   err  => toast.error(err.response?.data?.msg||'Toggle failed'),
  });

  const stats = {
    total:      allProducts.length,
    active:     allProducts.filter(p => p.isActive).length,
    hidden:     allProducts.filter(p => !p.isActive).length,
    outOfStock: allProducts.filter(p => p.stock === 0).length,
    lowStock:   allProducts.filter(p => p.stock > 0 && p.stock <= 5).length,
  };

  const Skel = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-52 bg-slate-100"/><div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-slate-100 rounded w-3/4"/><div className="h-3 bg-slate-50 rounded w-1/2"/><div className="h-3 bg-slate-50 rounded w-1/4 mt-1"/>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-3xl text-navy">Products</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your jewellery catalogue</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary gap-2 shadow-lg shadow-gold/20">
          <span className="text-lg leading-none font-light">+</span> Add Product
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          {label:'Total',       val:stats.total,      icon:'💍', cls:'bg-navy/5    text-navy'},
          {label:'Published',   val:stats.active,     icon:'✅', cls:'bg-green-50  text-green-700'},
          {label:'Hidden',      val:stats.hidden,     icon:'🚫', cls:'bg-slate-100 text-slate-600'},
          {label:'Out of Stock',val:stats.outOfStock, icon:'❌', cls:'bg-red-50    text-red-600'},
          {label:'Low Stock',   val:stats.lowStock,   icon:'⚠️', cls:'bg-amber-50  text-amber-700'},
        ].map(({label,val,icon,cls}) => (
          <div key={label} className={`${cls} rounded-xl px-4 py-3 flex items-center gap-3 border border-black/[0.05]`}>
            <span className="text-xl">{icon}</span>
            <div><p className="font-bold text-lg leading-tight">{val}</p><p className="text-[10px] font-medium opacity-70">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 mb-5 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input className="form-input !pl-9 !py-2.5 text-sm" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          <button onClick={()=>setView('grid')} className={`px-3.5 py-2 text-sm transition-colors ${viewMode==='grid'?'bg-navy text-white':'text-slate-400 hover:text-navy'}`}>⊞</button>
          <button onClick={()=>setView('table')} className={`px-3.5 py-2 text-sm transition-colors ${viewMode==='table'?'bg-navy text-white':'text-slate-400 hover:text-navy'}`}>☰</button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={()=>setCat('')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${!catFilter?'bg-navy text-gold-light border-navy':'border-slate-200 text-slate-500 hover:border-navy hover:text-navy'}`}>
          All ({allProducts.length})
        </button>
        {CATEGORIES.map(c => {
          const cnt = allProducts.filter(p=>p.category===c).length;
          if(!cnt && catFilter!==c) return null;
          return (
            <button key={c} onClick={()=>setCat(c===catFilter?'':c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                catFilter===c?'bg-gold text-navy border-gold shadow-md shadow-gold/20':'border-slate-200 text-slate-500 hover:border-gold hover:text-gold-dark'}`}>
              {CAT_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}
              <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${catFilter===c?'bg-navy/20':'bg-slate-100'}`}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode==='grid'
          ? <div className="grid gap-5" style={{gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))'}}>
              {Array(8).fill(0).map((_,i)=><Skel key={i}/>)}
            </div>
          : <div className="page-loader"><div className="spinner"/></div>
      ) : allProducts.length===0 ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] py-20 text-center shadow-sm">
          <p className="text-5xl mb-4">💍</p>
          <h3 className="font-serif text-xl text-navy mb-2">No products found</h3>
          <p className="text-sm text-slate-400 mb-6">{search||catFilter?'Try different search / filters':'Add your first jewellery product'}</p>
          {!search&&!catFilter&&<button onClick={()=>setModal({})} className="btn btn-primary">✦ Add First Product</button>}
        </div>

      /* Grid view */
      ) : viewMode==='grid' ? (
        <div className="grid gap-5" style={{gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))'}}>
          {allProducts.map(p => (
            <div key={p._id}
              className={`group relative bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${!p.isActive?'opacity-60 grayscale-[30%]':''}`}>
              <div className="relative h-52 bg-cream overflow-hidden">
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                  : <div className="w-full h-full flex items-center justify-center text-5xl text-gold/20">✦</div>
                }
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5">
                  <button onClick={()=>setModal(p)}
                    className="bg-white text-navy text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gold hover:text-white transition-colors shadow">✏ Edit</button>
                  <button onClick={()=>toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                    className={`text-xs font-semibold px-3 py-2 rounded-lg shadow transition-colors ${p.isActive?'bg-slate-200 text-slate-700 hover:bg-slate-300':'bg-green-500 text-white hover:bg-green-600'}`}>
                    {p.isActive?'🚫 Hide':'👁 Show'}
                  </button>
                  <button onClick={()=>window.confirm(`Delete "${p.name}"?`)&&deleteMutation.mutate(p._id)}
                    className="bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors shadow">🗑</button>
                </div>
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
                  {!p.isActive         && <span className="bg-slate-700/90 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Hidden</span>}
                  {p.discountPercent>0  && <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{p.discountPercent}% OFF</span>}
                  {p.stock===0          && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Out of Stock</span>}
                  {p.stock>0&&p.stock<=5&& <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Low Stock</span>}
                </div>
              </div>
              <div className="p-4">
                <span className="text-[9px] uppercase tracking-widest text-gold-dark font-semibold">{CAT_ICONS[p.category]} {p.category}</span>
                <h3 className="font-serif font-semibold text-navy text-base mt-0.5 leading-snug line-clamp-1">{p.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.description?.slice(0,50)}…</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div>
                    <p className="font-bold text-navy">₹{(p.discountedPrice||p.price).toLocaleString('en-IN')}</p>
                    {p.discountedPrice&&<p className="text-[11px] text-slate-400 line-through">₹{p.price.toLocaleString('en-IN')}</p>}
                  </div>
                  <p className={`text-xs font-bold ${p.stock===0?'text-red-500':p.stock<=5?'text-amber-500':'text-slate-400'}`}>Stock: {p.stock}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      /* Table view */
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {['','Product','Category','Price','Discount','Stock','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-gold-light font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allProducts.map(p=>(
                <tr key={p._id} className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${!p.isActive?'opacity-60':''}`}>
                  <td className="pl-4 pr-2 py-3">
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100"/>
                      : <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-gold text-xl">✦</div>}
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="font-semibold text-navy truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.description?.slice(0,50)}…</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="bg-gold/10 text-gold-dark text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize whitespace-nowrap">{CAT_ICONS[p.category]} {p.category}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-navy">₹{p.price.toLocaleString('en-IN')}</p>
                    {p.discountedPrice&&<p className="text-[11px] text-green-600">₹{p.discountedPrice.toLocaleString('en-IN')}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {p.discountPercent>0
                      ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{p.discountPercent}% OFF</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`font-bold text-sm ${p.stock===0?'text-red-500':p.stock<=5?'text-amber-500':'text-navy'}`}>{p.stock}</span>
                    {p.stock===0&&<p className="text-[10px] text-red-400">Out of stock</p>}
                    {p.stock>0&&p.stock<=5&&<p className="text-[10px] text-amber-400">Low stock</p>}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={()=>toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all border ${p.isActive?'bg-green-50 text-green-700 border-green-200 hover:bg-green-100':'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                      {p.isActive?'● Active':'○ Hidden'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setModal(p)} className="px-3 py-1.5 text-xs border border-slate-200 text-navy rounded-lg hover:border-gold hover:text-gold transition-colors font-medium">Edit</button>
                      <button onClick={()=>window.confirm(`Delete "${p.name}"?`)&&deleteMutation.mutate(p._id)} disabled={deleteMutation.isPending}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal!==null&&(
        <ProductModal product={Object.keys(modal).length>0?modal:null} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
};

/* ─── Orders Tab ─────────────────────────────────────────────────────────  */
const AdminOrders = () => {
  const qc = useQueryClient();
  const [statusFilter,setStatus] = useState('');
  const [expandedId,  setExpand] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey:        ['admin-orders', statusFilter],
    queryFn:         () => api.get('/order/admin/all', { params:{ perPage:50, currentPage:1, ...(statusFilter&&{status:statusFilter}) } }).then(r=>r.data.result),
    refetchInterval: 20_000,
    staleTime:       10_000,
  });
  const updateStatus = useMutation({
    mutationFn: ({id,status}) => api.patch(`/order/${id}/status`,{status}),
    onSuccess:  () => { toast.success('Order updated ✦'); qc.invalidateQueries(['admin-orders']); qc.invalidateQueries(['admin-dashboard']); },
    onError:   err => toast.error(err.response?.data?.msg||'Update failed'),
  });
  const orders     = data?.rows ?? [];
  const PENDING    = orders.filter(o=>o.orderStatus==='placed').length;
  const NEXT_ACT   = {placed:'confirmed',confirmed:'processing',processing:'shipped',shipped:'delivered'};
  const NEXT_LABEL = {placed:'✓ Confirm',confirmed:'→ Processing',processing:'→ Shipped',shipped:'→ Delivered'};
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif text-3xl text-navy flex items-center gap-3 flex-wrap">
          Orders
          <span className="text-xs font-sans bg-navy text-gold-light px-3 py-1 rounded-full">{data?.pagination?.totalItems??orders.length}</span>
          {PENDING>0&&<span className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-semibold animate-pulse">{PENDING} awaiting confirmation</span>}
        </h2>
        <select className="form-input w-52" value={statusFilter} onChange={e=>setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s=><option key={s} value={s}>{STATUS_META[s]?.label||s}</option>)}
        </select>
      </div>
      {isLoading ? <div className="page-loader"><div className="spinner"/></div> : (
        <div className="flex flex-col gap-3">
          {orders.length===0 ? (
            <div className="empty-state bg-white rounded-2xl py-16"><p className="text-4xl mb-3">📦</p><h3>No orders {statusFilter?`with status "${statusFilter}"`:' yet'}</h3></div>
          ) : orders.map(o => {
            const isExpanded = expandedId===o._id;
            return (
              <div key={o._id} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-[130px]">
                    <p className="font-mono text-xs font-bold text-navy">#{o._id.slice(-10).toUpperCase()}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</p>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <p className="font-medium text-navy text-xs">{o.user?.name||'—'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{o.user?.email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {o.items?.slice(0,3).map((item,i)=><img key={i} src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100"/>)}
                    {o.items?.length>3&&<span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">+{o.items.length-3}</span>}
                  </div>
                  <div className="text-right min-w-[90px]">
                    <p className="font-bold text-navy">₹{o.totalAmount?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400">{o.paymentMethod==='cod'?'COD':'Online'}</p>
                  </div>
                  <div className="flex flex-col gap-1 min-w-[90px]">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold w-fit ${statusCls(o.orderStatus)}`}>{STATUS_META[o.orderStatus]?.label||o.orderStatus}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold w-fit ${o.paymentStatus==='paid'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>{o.paymentStatus}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {NEXT_ACT[o.orderStatus]&&(
                      <button onClick={()=>updateStatus.mutate({id:o._id,status:NEXT_ACT[o.orderStatus]})} disabled={updateStatus.isPending}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${o.orderStatus==='placed'?'bg-blue-600 text-white hover:bg-blue-700 shadow-sm':'bg-navy text-gold-light hover:bg-navy-mid'}`}>
                        {NEXT_LABEL[o.orderStatus]}
                      </button>
                    )}
                    {!['delivered','cancelled'].includes(o.orderStatus)&&(
                      <button onClick={()=>window.confirm('Cancel order?')&&updateStatus.mutate({id:o._id,status:'cancelled'})} disabled={updateStatus.isPending}
                        className="px-3 py-1.5 text-xs text-red-400 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">Cancel</button>
                    )}
                    <button onClick={()=>setExpand(isExpanded?null:o._id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-navy hover:text-white transition-colors flex items-center justify-center text-xs">
                      {isExpanded?'▲':'▼'}
                    </button>
                  </div>
                </div>
                {isExpanded&&(
                  <div className="border-t border-slate-100 px-5 py-5 bg-slate-50/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Items ({o.items?.length})</p>
                        <div className="flex flex-col gap-2">
                          {o.items?.map((item,i)=>(
                            <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
                              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover"/>
                              <div className="flex-1 min-w-0"><p className="text-xs font-medium text-navy truncate">{item.name}</p><p className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p></div>
                              <p className="text-xs font-semibold text-navy">₹{(item.price*item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Delivery Address</p>
                          <div className="bg-white rounded-xl border border-slate-100 p-3 text-xs text-slate-600 leading-relaxed">
                            <p className="font-medium text-navy">{o.shippingAddress?.line1}</p>
                            {o.shippingAddress?.line2&&<p>{o.shippingAddress.line2}</p>}
                            <p>{o.shippingAddress?.city}, {o.shippingAddress?.state} – {o.shippingAddress?.pincode}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Set Status</p>
                          <div className="flex flex-wrap gap-2">
                            {ORDER_STATUSES.map(s=>(
                              <button key={s} onClick={()=>updateStatus.mutate({id:o._id,status:s})} disabled={o.orderStatus===s||updateStatus.isPending}
                                className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${o.orderStatus===s?`${statusCls(s)} border-transparent ring-2 ring-offset-1 ring-navy`:'border-slate-200 text-slate-500 hover:border-navy hover:text-navy bg-white'}`}>
                                {STATUS_META[s]?.label||s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Price</p>
                          <div className="bg-white rounded-xl border border-slate-100 p-3 text-xs flex flex-col gap-1.5">
                            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{o.subtotal?.toLocaleString('en-IN')}</span></div>
                            <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{o.shippingCharge===0?'FREE':`₹${o.shippingCharge}`}</span></div>
                            <div className="flex justify-between font-bold text-navy border-t border-slate-100 pt-1.5 mt-0.5"><span>Total</span><span>₹{o.totalAmount?.toLocaleString('en-IN')}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Admin Layout ───────────────────────────────────────────────────────  */
const AdminPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const linkCls  = ({ isActive }) =>
    `flex items-center gap-3 px-5 py-3 text-sm transition-all rounded-xl mx-2 my-0.5 ${isActive?'bg-gold/15 text-gold-light font-semibold':'text-white/50 hover:text-white hover:bg-white/5'}`;
  return (
    <div className="flex min-h-screen pt-16 bg-[#0a1628]">
      <aside className="w-60 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] hidden md:flex flex-col border-r border-white/[0.06]">
        <div className="px-6 py-7 border-b border-white/[0.06]">
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Admin Panel</p>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.profileImage?.url?<img src={user.profileImage.url} alt="" className="w-full h-full object-cover"/>:(user?.name?.[0]||'A')}
            </div>
            <div className="overflow-hidden">
              <p className="text-gold-light font-semibold text-sm font-serif truncate">{user?.name||'Admin'}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          <p className="text-[10px] text-white/20 uppercase tracking-widest px-6 mb-2 mt-2">Navigation</p>
          <NavLink to="/admin"          end className={linkCls}><span>📊</span> Dashboard</NavLink>
          <NavLink to="/admin/products"     className={linkCls}><span>💍</span> Products</NavLink>
          <NavLink to="/admin/orders"       className={linkCls}><span>📋</span> Orders</NavLink>
          <div className="mx-2 my-2 border-t border-white/[0.06]" />
          <p className="text-[10px] text-white/20 uppercase tracking-widest px-6 mb-2">Manage</p>
          <NavLink to="/admin/manage-products" className={linkCls}><span>⚙️</span> Product CRUD</NavLink>
          <NavLink to="/admin/manage-orders"   className={linkCls}><span>📬</span> Order Updates</NavLink>
        </nav>
        <div className="px-4 pb-6 pt-4 border-t border-white/[0.06]">
          <button onClick={()=>navigate('/')} className="w-full text-left text-xs text-white/25 hover:text-white/60 transition-colors px-2 py-2">← Back to Storefront</button>
        </div>
      </aside>
      <main className="flex-1 bg-slate-50 overflow-x-hidden">
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
          <Routes>
            <Route index           element={<AdminDashboard/>}/>
            <Route path="products" element={<AdminProducts/>}/>
            <Route path="orders"   element={<AdminOrders/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
