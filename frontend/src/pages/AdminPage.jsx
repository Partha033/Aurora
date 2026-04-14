import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Grid, 
  Edit, 
  ChevronRight,
  ArrowLeft,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import api from '../api/axiosInstance';

// Import standalone management pages
import AdminProductsPage from './AdminProductsPage';
import AdminOrdersPage from './AdminOrdersPage';

/* ─── Constants ─────────────────────────────────────────────────────────── */

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
    queryKey:        ['admin-dashboard-data'],
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

/* ─── Admin Layout ───────────────────────────────────────────────────────  */
const AdminPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const linkCls  = ({ isActive }) =>
    `flex items-center gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-2xl mx-4 my-1.5 group ${isActive?'bg-gold/15 text-gold-light shadow-lg shadow-gold/5':'text-white/40 hover:text-white hover:bg-white/5'}`;

  return (
    <div className="flex min-h-screen pt-20 bg-[#020617]">
      {/* ── Mobile Sidebar/Menu ── */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg">
        <div className="bg-navy/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 flex items-center justify-around shadow-2xl">
          <NavLink to="/admin" end className={({isActive}) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive?'text-gold':'text-white/40'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Stats</span>
          </NavLink>
          <NavLink to="/admin/products" className={({isActive}) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive?'text-gold':'text-white/40'}`}>
            <Grid size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Items</span>
          </NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive?'text-gold':'text-white/40'}`}>
            <Package size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Orders</span>
          </NavLink>
          <button onClick={()=>navigate('/')} className="flex flex-col items-center gap-1 p-3 text-white/40">
            <ArrowLeft size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Exit</span>
          </button>
        </div>
      </div>

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
        <div className="p-0 max-w-[1600px] mx-auto min-h-full">
          <Routes>
            <Route index           element={<div className="p-8 md:p-14 lg:p-20"><AdminDashboard/></div>}/>
            <Route path="products" element={<AdminProductsPage/>}/>
            <Route path="orders"   element={<AdminOrdersPage/>}/>
            <Route path="manage-products" element={<AdminProductsPage/>}/>
            <Route path="manage-orders"   element={<AdminOrdersPage/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
