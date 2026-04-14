import { useState, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings, 
  Users, 
  IndianRupee, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2, 
  Image as ImageIcon,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ─── Constants ─────────────────────────────────────────────────────────── */
const CATEGORIES     = ['rings','necklaces','earrings','bracelets','pendants','sets','other'];

const STATUS_META = {
  placed:     { cls: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Placed', icon: <Clock size={12}/> },
  confirmed:  { cls: 'bg-blue-50 text-blue-700 border-blue-100',   label: 'Confirmed', icon: <CheckCircle2 size={12}/> },
  processing: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Processing', icon: <Settings size={12}/> },
  shipped:    { cls: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Shipped', icon: <Package size={12}/> },
  delivered:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Delivered', icon: <Sparkles size={12}/> },
  cancelled:  { cls: 'bg-rose-50 text-rose-700 border-rose-100',    label: 'Cancelled', icon: <XCircle size={12}/> },
};
const statusCls = s => STATUS_META[s]?.cls || 'bg-slate-50 text-slate-500 border-slate-100';

/* ─── Stat Card (Dashboard) ──────────────────────────────────────────────  */
const StatCard = ({ icon, label, value, sub, color, bg }) => (
  <div className={`rounded-3xl p-6 flex flex-col gap-4 shadow-sm border border-slate-100 bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group`}>
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${color} bg-white border border-current opacity-70`}>{sub}</span>
    </div>
    <div>
      <p className={`text-2xl font-bold text-navy`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{label}</p>
    </div>
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
    { icon:<IndianRupee size={24}/>, label:'Revenue', value:`₹${(s.totalRevenue||0).toLocaleString('en-IN')}`, sub:'Paid', color:'text-emerald-600', bg:'bg-emerald-50' },
    { icon:<ShoppingBag size={24}/>, label:'Orders',  value:s.totalOrders || 0, sub:'Total', color:'text-blue-600', bg:'bg-blue-50' },
    { icon:<Clock size={24}/>, label:'Pending', value:s.pendingOrders || 0, sub:'Action', color:'text-amber-600', bg:'bg-amber-50' },
    { icon:<Users size={24}/>, label:'Customers', value:s.totalUsers || 0, sub:'Growth', color:'text-indigo-600', bg:'bg-indigo-50' },
  ];

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {Array(4).fill(0).map((_,i) => (
        <div key={i} className="rounded-3xl bg-white border border-slate-100 p-8 h-40 animate-pulse flex flex-col gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl"/>
          <div className="space-y-2">
            <div className="h-6 bg-slate-50 rounded w-1/2"/>
            <div className="h-3 bg-slate-50 rounded w-1/4"/>
          </div>
        </div>
      ))}
    </div>
  );

  const maxRev = Math.max(...rd.map(d => d.revenue), 1);
  
  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
        <div>
          <h2 className="font-serif text-4xl text-navy tracking-tight">Executive Overview</h2>
          {dataUpdatedAt && (
            <div className="flex items-center gap-2 mt-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Live Sync: {new Date(dataUpdatedAt).toLocaleTimeString('en-IN')}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
           <button className="btn bg-white border-slate-200 text-navy hover:bg-slate-50 px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm">Export Data</button>
           <button className="btn btn-primary px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-gold/20">New Campaign</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">{CARDS.map(c => <StatCard key={c.label} {...c}/>)}</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mb-8">
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-xl text-navy flex items-center gap-3">
              <TrendingUp size={20} className="text-gold" /> Performance Analytics
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Weekly Trend</span>
          </div>
          {rd.length === 0 ? <p className="text-slate-400 text-sm text-center py-20">No revenue data found for this period</p> : (
            <div className="flex items-end gap-3 h-48 mt-10">
              {rd.map(d => { 
                const pct=(d.revenue/maxRev)*100; 
                return (
                  <div key={d._id} className="flex-1 flex flex-col items-center gap-3 group relative">
                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <div className="bg-navy text-gold-light text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">₹{d.revenue.toLocaleString('en-IN')}</div>
                      <div className="w-2 h-2 bg-navy rotate-45 mx-auto -mt-1"/>
                    </div>
                    <div className="w-full bg-slate-50 rounded-t-xl relative overflow-hidden group-hover:bg-gold/5 transition-colors" style={{height:`100%`}}>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gold-dark to-gold-light transition-all duration-1000 ease-out" style={{height:`${Math.max(pct,5)}%`}}/>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{d._id?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
          <h3 className="font-serif text-xl text-navy mb-8">Operations Status</h3>
          <div className="flex flex-col gap-6">
            {[
              {label:'Awaiting Confirmation',val:s.pendingOrders  ||0, color:'bg-amber-400', icon:<Clock size={14}/>},
              {label:'Success Deliveries',val:s.deliveredOrders||0, color:'bg-emerald-400', icon:<Sparkles size={14}/>},
              {label:'Order Retractions',val:s.cancelledOrders||0, color:'bg-rose-400', icon:<XCircle size={14}/>},
            ].map(({label,val,color,icon}) => (
              <div key={label} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    {icon} {label}
                  </span>
                  <span className="text-sm font-bold text-navy">{val}</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-px">
                  <div className={`h-full ${color} rounded-full transition-all duration-1000 shadow-sm`} style={{width:`${s.totalOrders?(val/s.totalOrders)*100:0}%`}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-5 bg-navy rounded-2xl text-white/80">
             <div className="flex items-center gap-3 mb-2">
                <LayoutDashboard size={18} className="text-gold" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light">System Health</p>
             </div>
             <p className="text-xs font-light leading-relaxed">All fulfilment systems are operational. Average processing time is down by 12%.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/30">
          <h3 className="font-serif text-xl text-navy">Recent Order Activity</h3>
          <NavLink to="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-gold-dark hover:text-gold flex items-center gap-2 transition-colors group">
            Manage Fulfilment <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </NavLink>
        </div>
        {ro.length === 0 ? <p className="text-center py-20 text-slate-400 text-sm italic font-light">No transaction history found</p> : (
          <table className="w-full text-sm">
            <thead>
               <tr className="bg-white">
                 {['Transaction','Customer','Net Amount','Status','Processed'].map(h=>(
                   <th key={h} className="px-8 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400 font-bold">{h}</th>
                 ))}
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ro.map(o=>(
                <tr key={o._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4 font-mono text-xs font-bold text-navy">#{o._id.slice(-10).toUpperCase()}</td>
                  <td className="px-8 py-4">
                    <p className="font-bold text-navy text-xs">{o.user?.name||'Guest'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{o.user?.email}</p>
                  </td>
                  <td className="px-8 py-4 font-bold text-navy">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${statusCls(o.orderStatus)}`}>
                      {STATUS_META[o.orderStatus]?.icon} {STATUS_META[o.orderStatus]?.label||o.orderStatus}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
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
    if(!form.name.trim()||!form.description.trim()||!form.price||!form.stock) return toast.error('Required fields: Name, description, price, stock');
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
      toast.success(isEdit?'Collection updated':'Piece added to catalogue');
      qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']);
      onClose();
    } catch(err) { toast.error(err.response?.data?.msg||'Failed to update catalogue'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-navy/70 backdrop-blur-md z-[300] flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300 flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex justify-between items-center px-10 py-8 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-2xl text-navy">{isEdit ? 'Refine Masterpiece' : 'Add to Collection'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Catalogue Item ID: {isEdit ? product._id.slice(-10).toUpperCase() : 'NEW_ITEM'}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-8">
          {/* Images */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 block">Catalogue Imagery</label>
            {previews.length>0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {previews.map((src,i)=>(
                  <div key={i} className="relative group aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-2xl border border-slate-200 shadow-sm"/>
                    <button type="button" onClick={()=>removePreview(i)} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {previews.length<5&&(
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-all text-slate-300 hover:text-gold group">
                    <Plus size={24} />
                    <input ref={imgRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFiles}/>
                  </label>
                )}
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-100 bg-slate-50/30 hover:border-gold hover:bg-gold/5 rounded-[32px] p-16 text-center transition-all group">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm group-hover:scale-110 transition-transform mx-auto mb-4">
                    <ImageIcon size={40} strokeWidth={1} />
                  </div>
                  <p className="text-sm text-navy font-bold">Upload High-Res Assets</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-widest">PNG, WEBP or JPG · Max 5MB each</p>
                </div>
                <input ref={imgRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFiles}/>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Item Name</label>
              <input name="name" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all" placeholder="e.g. Celestial Diamond Bangle" value={form.name} onChange={handleChange} required/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Category</label>
              <select name="category" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all appearance-none cursor-pointer" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Product Description</label>
            <textarea name="description" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all resize-none" rows={4} placeholder="Narrate the story of this piece..." value={form.description} onChange={handleChange} required/>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Price (₹)</label>
              <input name="price" type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all" placeholder="0" value={form.price} onChange={handleChange} required/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sale (₹)</label>
              <input name="discountedPrice" type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all" placeholder="Optional" value={form.discountedPrice} onChange={handleChange}/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">In-Stock</label>
              <input name="stock" type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all" placeholder="0" value={form.stock} onChange={handleChange} required/>
            </div>
          </div>

          {discountPct>0&&(
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <TrendingUp size={18} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">{discountPct}% Price Incentive</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Customer value: ₹{(Number(form.price)-Number(form.discountedPrice)).toLocaleString('en-IN')}</p>
                 </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-slate-50 rounded-[28px] p-6 border border-slate-100">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${form.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                   {form.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
                <div>
                   <p className="text-sm font-bold text-navy">{form.isActive ? 'Active on Storefront' : 'Archived from Shop'}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Public Visibility Toggle</p>
                </div>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
                <input name="isActive" type="checkbox" className="sr-only peer" checked={form.isActive} onChange={handleChange}/>
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-gold-dark"></div>
             </label>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-navy transition-colors">Discard</button>
            <button type="submit" disabled={loading} className="flex-[2] h-14 bg-navy text-gold-light rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-navy/20 hover:bg-navy-mid transition-all disabled:opacity-70 flex items-center justify-center gap-3">
              {loading ? <div className="spinner w-4 h-4 border-gold border-t-transparent" /> : (isEdit ? <CheckCircle2 size={16} /> : <Plus size={16} />)}
              {isEdit ? 'Authorize Updates' : 'Commit to Catalogue'}
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
    onSuccess:  ()  => { toast.success('Removed from collection'); qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']); },
    onError:   err  => toast.error(err.response?.data?.msg||'Deletion failed'),
  });
  const toggleMutation = useMutation({
    mutationFn: id => api.patch(`/product/${id}/toggle`),
    onSuccess:  res => { toast.success(res.data.result.isActive?'Now visible':'Hidden from public'); qc.invalidateQueries(['admin-products']); qc.invalidateQueries(['admin-dashboard']); },
    onError:   err  => toast.error(err.response?.data?.msg||'Status toggle failed'),
  });

  const stats = {
    total:      allProducts.length,
    active:     allProducts.filter(p => p.isActive).length,
    hidden:     allProducts.filter(p => !p.isActive).length,
    outOfStock: allProducts.filter(p => p.stock === 0).length,
    lowStock:   allProducts.filter(p => p.stock > 0 && p.stock <= 5).length,
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-6">
        <div>
          <h2 className="font-serif text-4xl text-navy tracking-tight">Jewellery Catalogue</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Inventory Oversight & Control</p>
        </div>
        <button onClick={() => setModal({})} className="h-14 bg-navy text-gold-light px-10 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-navy/20 hover:bg-navy-mid transition-all flex items-center gap-3">
          <Plus size={16} /> New Addition
        </button>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          {label:'Total', val:stats.total, icon:<Grid size={18}/>, cls:'bg-white text-navy border-slate-100 shadow-sm'},
          {label:'Published', val:stats.active, icon:<CheckCircle2 size={18}/>, cls:'bg-emerald-50/50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-500/5'},
          {label:'Archived', val:stats.hidden, icon:<EyeOff size={18}/>, cls:'bg-slate-50 text-slate-500 border-slate-200 shadow-sm'},
          {label:'Sold Out', val:stats.outOfStock, icon:<XCircle size={18}/>, cls:'bg-rose-50/50 text-rose-700 border-rose-100 shadow-sm shadow-rose-500/5'},
          {label:'Low Inventory', val:stats.lowStock, icon:<AlertTriangle size={18}/>, cls:'bg-amber-50/50 text-amber-700 border-amber-100 shadow-sm shadow-amber-500/5'},
        ].map(({label,val,icon,cls}) => (
          <div key={label} className={`${cls} rounded-3xl p-5 border flex items-center gap-4 group transition-all hover:-translate-y-1`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
            <div>
              <p className="font-bold text-xl leading-tight">{val}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Strip */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-5 mb-10 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[250px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={18} />
          <input className="w-full bg-slate-50 border border-slate-50 rounded-2xl py-3.5 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/10 focus:border-gold transition-all" placeholder="Search by item name, material or ID..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner">
          <button onClick={()=>setView('grid')} className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all ${viewMode==='grid'?'bg-white text-navy shadow-md':'text-slate-400 hover:text-navy'}`}>
            <Grid size={18} />
          </button>
          <button onClick={()=>setView('table')} className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all ${viewMode==='table'?'bg-white text-navy shadow-md':'text-slate-400 hover:text-navy'}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-3 flex-wrap mb-10">
        <button onClick={()=>setCat('')}
          className={`px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${!catFilter?'bg-navy text-gold-light border-navy shadow-xl shadow-navy/10':'bg-white border-slate-200 text-slate-400 hover:border-gold hover:text-gold'}`}>
          All Collection ({allProducts.length})
        </button>
        {CATEGORIES.map(c => {
          const cnt = allProducts.filter(p=>p.category===c).length;
          if(!cnt && catFilter!==c) return null;
          return (
            <button key={c} onClick={()=>setCat(c===catFilter?'':c)}
              className={`px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${
                catFilter===c?'bg-gold text-navy border-gold shadow-lg shadow-gold/20':'bg-white border-slate-200 text-slate-400 hover:border-gold hover:text-gold'}`}>
              {c} <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${catFilter===c?'bg-white/30':'bg-slate-50 text-slate-400'}`}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Catalogue Items */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {Array(8).fill(0).map((_,i)=>(
             <div key={i} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 animate-pulse">
               <div className="aspect-[4/5] bg-slate-50" />
               <div className="p-6 space-y-3">
                 <div className="h-4 bg-slate-50 rounded w-3/4" />
                 <div className="h-3 bg-slate-50 rounded w-1/2" />
               </div>
             </div>
           ))}
        </div>
      ) : allProducts.length===0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 py-32 text-center shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 animate-bounce">
            <Package size={48} />
          </div>
          <h3 className="font-serif text-3xl text-navy mb-4">No results in catalogue</h3>
          <p className="text-slate-400 text-sm max-w-sm font-light mb-10">Expand your search or adjust filters to explore your collections.</p>
          {!search&&!catFilter&&<button onClick={()=>setModal({})} className="btn btn-primary px-10 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Add First Masterpiece</button>}
        </div>

      ) : viewMode==='grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {allProducts.map(p => (
            <div key={p._id}
              className={`group relative bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${!p.isActive?'opacity-70 grayscale-[50%]':''}`}>
              <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden">
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"/>
                  : <div className="w-full h-full flex items-center justify-center text-gold/20"><Sparkles size={48} strokeWidth={1} /></div>
                }
                
                {/* Visual Overlay */}
                <div className="absolute inset-0 bg-navy/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                  <button onClick={()=>setModal(p)} className="w-12 h-12 rounded-2xl bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-xl -translate-y-4 group-hover:translate-y-0 duration-300">
                    <Edit size={20} />
                  </button>
                  <button onClick={()=>toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending} className="w-12 h-12 rounded-2xl bg-white text-navy flex items-center justify-center hover:bg-gold hover:text-white transition-all shadow-xl -translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                    {p.isActive ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <button onClick={()=>window.confirm(`Expunge "${p.name}"?`)&&deleteMutation.mutate(p._id)} className="w-12 h-12 rounded-2xl bg-white text-navy flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-xl -translate-y-4 group-hover:translate-y-0 duration-300 delay-150">
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  {!p.isActive && <span className="bg-navy text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 shadow-lg">Archived</span>}
                  {p.discountPercent>0 && <span className="bg-rose-500 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg shadow-rose-500/20">{p.discountPercent}% Price Break</span>}
                  {p.stock===0 && <span className="bg-rose-500 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">Stock Void</span>}
                </div>
              </div>
              <div className="p-6">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold-dark">{p.category}</span>
                <h3 className="font-serif font-bold text-navy text-lg mt-1 group-hover:text-gold-dark transition-colors truncate">{p.name}</h3>
                
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                  <div>
                    <p className="font-bold text-navy text-lg">₹{(p.discountedPrice||p.price).toLocaleString('en-IN')}</p>
                    {p.discountedPrice&&<p className="text-[10px] text-slate-400 font-bold line-through decoration-gold/40">₹{p.price.toLocaleString('en-IN')}</p>}
                  </div>
                  <div className={`text-right ${p.stock<=5 ? 'text-amber-500' : 'text-slate-400'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{p.stock === 0 ? 'Out' : p.stock} Stock</p>
                    <div className="h-1 w-12 bg-slate-50 rounded-full mt-1.5 overflow-hidden">
                       <div className={`h-full ${p.stock<=5 ? 'bg-amber-400' : 'bg-gold'} rounded-full`} style={{width:`${Math.min(p.stock*10, 100)}%`}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy">
                {['Asset','Masterpiece','Collection','Financials','Inventory','Status','Control'].map(h=>(
                  <th key={h} className="px-8 py-5 text-left text-[10px] uppercase tracking-widest text-gold-light font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allProducts.map(p=>(
                <tr key={p._id} className={`hover:bg-slate-50/50 transition-colors group ${!p.isActive?'bg-slate-50/30 opacity-60':''}`}>
                  <td className="px-8 py-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                      {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/> : <Sparkles className="m-auto text-gold/20" size={24}/>}
                    </div>
                  </td>
                  <td className="px-8 py-4 max-w-[250px]">
                    <p className="font-bold text-navy text-sm group-hover:text-gold-dark transition-colors truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{p.description}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-slate-200">{p.category}</span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-bold text-navy">₹{p.price.toLocaleString('en-IN')}</p>
                    {p.discountedPrice&&<p className="text-[10px] text-emerald-600 font-bold tracking-tight italic">Offer: ₹{p.discountedPrice.toLocaleString('en-IN')}</p>}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                       <span className={`text-sm font-bold ${p.stock===0?'text-rose-500':p.stock<=5?'text-amber-500':'text-navy'}`}>{p.stock}</span>
                       <div className="h-1.5 w-16 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div className={`h-full ${p.stock===0?'bg-rose-500':p.stock<=5?'bg-amber-400':'bg-gold'} rounded-full`} style={{width:`${Math.min(p.stock*10, 100)}%`}} />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <button onClick={()=>toggleMutation.mutate(p._id)} disabled={toggleMutation.isPending} className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border shadow-sm ${p.isActive?'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100':'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
                      {p.isActive ? <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"/> Active</> : <><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> Archived</>}
                    </button>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex gap-2">
                      <button onClick={()=>setModal(p)} className="p-2 text-navy hover:text-gold bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <Edit size={16} />
                      </button>
                      <button onClick={()=>window.confirm(`Expunge "${p.name}"?`)&&deleteMutation.mutate(p._id)} className="p-2 text-rose-500 hover:text-white bg-rose-50 rounded-xl hover:bg-rose-500 transition-all shadow-sm hover:shadow-rose-500/20">
                        <Trash2 size={16} />
                      </button>
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

/* ─── Admin Orders Tab ───────────────────────────────────────────────────  */
const AdminOrders = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-700">
       <div className="w-24 h-24 bg-gold/5 rounded-full flex items-center justify-center text-gold-dark mb-8">
          <ShoppingBag size={48} strokeWidth={1} />
       </div>
       <h2 className="font-serif text-3xl text-navy mb-4">Dedicated Fulfilment Suite</h2>
       <p className="text-slate-400 text-sm max-w-sm text-center font-light mb-10">We've redesigned the order management experience to give you surgical precision over your boutique's fulfilment.</p>
       <button onClick={()=>navigate('/admin/orders')} className="h-14 bg-navy text-gold-light px-12 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-navy/20 hover:bg-navy-mid transition-all flex items-center gap-3 group">
          Enter Fulfilment Hub <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
       </button>
    </div>
  );
};

/* ─── Admin Layout ───────────────────────────────────────────────────────  */
const AdminPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const linkCls  = ({ isActive }) =>
    `flex items-center gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-2xl mx-4 my-1.5 group ${isActive?'bg-gold/15 text-gold-light shadow-lg shadow-gold/5':'text-white/40 hover:text-white hover:bg-white/5'}`;

  return (
    <div className="flex min-h-screen pt-20 bg-[#020617]">
      <aside className="w-72 flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] hidden xl:flex flex-col border-r border-white/5">
        <div className="px-10 py-10 border-b border-white/5">
          <p className="text-[10px] text-gold-light/40 uppercase tracking-[0.3em] mb-4 font-bold">Executive Suite</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gold/30 p-1 shadow-2xl">
              <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-gold-dark to-gold-light flex items-center justify-center text-navy font-black">
                {user?.profileImage?.url?<img src={user.profileImage.url} alt="" className="w-full h-full object-cover"/>:(user?.name?.[0]||'A')}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-serif font-bold text-lg truncate tracking-tight">{user?.name||'Administrator'}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold truncate">Level 5 Access</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-8 custom-scrollbar">
          <div className="mb-10">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] px-10 mb-6 font-bold">Main Dashboard</p>
            <NavLink to="/admin" end className={linkCls}>
              <LayoutDashboard size={18} className="transition-transform group-hover:scale-110" /> 
              <span>Analytics</span>
            </NavLink>
          </div>
          
          <div className="mb-10">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] px-10 mb-6 font-bold">Operations</p>
            <NavLink to="/admin/products" className={linkCls}>
              <Grid size={18} className="transition-transform group-hover:scale-110" /> 
              <span>Catalogue</span>
            </NavLink>
            <NavLink to="/admin/orders" className={linkCls}>
              <Package size={18} className="transition-transform group-hover:scale-110" /> 
              <span>Fulfilment</span>
            </NavLink>
          </div>

          <div>
             <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] px-10 mb-6 font-bold">Management</p>
             <NavLink to="/admin/manage-products" className={linkCls}>
               <Edit size={18} className="transition-transform group-hover:scale-110" /> 
               <span>Authoring</span>
             </NavLink>
             <NavLink to="/admin/manage-orders" className={linkCls}>
               <Settings size={18} className="transition-transform group-hover:scale-110" /> 
               <span>Configuration</span>
             </NavLink>
          </div>
        </nav>

        <div className="px-8 pb-10 pt-6 border-t border-white/5">
          <button onClick={()=>navigate('/')} className="w-full h-12 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-gold transition-all border border-white/5 rounded-2xl hover:bg-white/5 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Storefront
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#f8fafc] overflow-x-hidden rounded-tl-[60px] shadow-inner">
        <div className="p-8 md:p-14 lg:p-20 max-w-[1600px] mx-auto min-h-full">
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
