import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Ticket, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Search,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const CouponModal = ({ coupon, onClose }) => {
  const qc = useQueryClient();
  const isEdit = Boolean(coupon?._id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || '',
    minOrderAmount: coupon?.minOrderAmount || 0,
    maxDiscountAmount: coupon?.maxDiscountAmount || '',
    expiryDate: coupon?.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
    usageLimit: coupon?.usageLimit || '',
    isActive: coupon?.isActive ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await api.put(`/coupon/${coupon._id}`, form);
      else await api.post('/coupon', form);
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created ✦');
      qc.invalidateQueries(['admin-coupons']);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-md" />
      <form 
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300"
      >
        <div className="bg-navy px-10 py-8 flex justify-between items-center text-white">
          <div>
            <h2 className="font-serif text-2xl text-gold-light">{isEdit ? 'Modify Coupon' : 'Generate Coupon'}</h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Promotion Strategy</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500 transition-all">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coupon Code</label>
            <input 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-gold/20 uppercase"
              placeholder="e.g. FESTIVE50"
              value={form.code}
              onChange={e => setForm({...form, code: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 appearance-none"
                value={form.discountType}
                onChange={e => setForm({...form, discountType: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Value</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder={form.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                value={form.discountValue}
                onChange={e => setForm({...form, discountValue: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min. Order (₹)</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                value={form.minOrderAmount}
                onChange={e => setForm({...form, minOrderAmount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Discount (₹)</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="Optional"
                value={form.maxDiscountAmount}
                onChange={e => setForm({...form, maxDiscountAmount: e.target.value})}
                disabled={form.discountType === 'fixed'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry Date</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                value={form.expiryDate}
                onChange={e => setForm({...form, expiryDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usage Limit</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={e => setForm({...form, usageLimit: e.target.value})}
              />
            </div>
          </div>

          <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 cursor-pointer group hover:border-gold/20 transition-all">
             <div className={`w-12 h-6 rounded-full relative transition-all ${form.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
             </div>
             <div className="flex-1">
                <p className="text-sm font-bold text-navy">Active Status</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Enable or disable this coupon globally</p>
             </div>
             <input type="checkbox" className="hidden" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} />
          </label>
        </div>

        <div className="p-10 border-t border-slate-100 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy transition-all">Discard</button>
          <button type="submit" disabled={loading} className="flex-[2] btn btn-primary h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
            {loading ? <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 size={16}/>}
            {isEdit ? 'Save Changes' : 'Launch Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminCouponsPage = () => {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/coupon').then(r => r.data.result),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupon/${id}`),
    onSuccess: () => { toast.success('Coupon expunged'); qc.invalidateQueries(['admin-coupons']); },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (coupons || []).filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return (
    <div className="p-20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fetching Active Offers...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="bg-navy px-10 py-12 relative overflow-hidden mb-10 rounded-b-[40px]">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
          <div>
            <Link to="/admin" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-gold flex items-center gap-2 mb-4 transition-colors">
              <ArrowLeft size={12} /> Back to Suite
            </Link>
            <h1 className="font-serif text-4xl text-gold-light tracking-tight">Voucher Management</h1>
            <p className="text-white/40 text-xs mt-2">Create and manage high-conversion discount incentives.</p>
          </div>
          <button 
            onClick={() => setModal({})}
            className="btn btn-primary h-14 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gold/20 flex items-center gap-3"
          >
            <Plus size={18} /> New Voucher
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10">
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between gap-6">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={18} />
              <input 
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all shadow-sm"
                placeholder="Search by coupon code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Pool</p>
                  <p className="text-sm font-black text-navy">{filtered.length} Vouchers</p>
               </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-32 text-center flex flex-col items-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <Ticket size={40} strokeWidth={1} />
               </div>
               <h3 className="font-serif text-2xl text-navy mb-2">No Active Vouchers</h3>
               <p className="text-slate-400 text-sm max-w-xs font-light italic">Inject velocity into your sales by creating your first promotional voucher today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-none">
                    {['Code','Incentive','Criteria','Velocity','Expiry','Status','Control'].map(h => (
                      <th key={h} className="px-8 py-6 text-left text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold-dark font-mono font-black text-xs">#</div>
                           <span className="font-mono font-bold text-navy tracking-wider text-sm">{c.code}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="font-black text-navy text-lg leading-none">
                             {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue.toLocaleString('en-IN')}`}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">OFF Total Bill</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-slate-600 font-medium">Min order: <span className="font-bold text-navy">₹{c.minOrderAmount}</span></p>
                        {c.maxDiscountAmount && <p className="text-[10px] text-slate-400 mt-0.5">Capped at ₹{c.maxDiscountAmount}</p>}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-navy rounded-full" 
                                style={{ width: c.usageLimit ? `${(c.usedCount / c.usageLimit) * 100}%` : '5%' }} 
                              />
                           </div>
                           <span className="text-[10px] font-bold text-navy">{c.usedCount} used</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500">
                           <Calendar size={14} />
                           <span className="text-xs font-medium">
                             {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Never'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${c.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {c.isActive ? <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> : null}
                          {c.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => setModal(c)}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-navy hover:bg-gold hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => window.confirm('Delete this coupon permanently?') && deleteMutation.mutate(c._id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                          >
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
        </div>
      </div>

      {modal && <CouponModal coupon={modal} onClose={() => setModal(null)} />}
    </div>
  );
};

export default AdminCouponsPage;