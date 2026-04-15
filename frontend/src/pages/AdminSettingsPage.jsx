import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  CreditCard, 
  Truck, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  Settings as SettingsIcon,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const AdminSettingsPage = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.get('/settings').then(r => r.data.result),
  });

  const updateMutation = useMutation({
    mutationFn: (newVal) => api.put('/settings', newVal),
    onSuccess: () => {
      toast.success('System configuration updated');
      qc.invalidateQueries(['system-settings']);
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Update failed'),
  });

  const handleToggle = (path, current) => {
    const parts = path.split('.');
    const newVal = { ...settings };
    let obj = newVal;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = !current;
    updateMutation.mutate(newVal);
  };

  const handleInputChange = (path, val) => {
    const parts = path.split('.');
    const newVal = { ...settings };
    let obj = newVal;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = val;
    // We'll save on button click for text inputs
    setLocalSettings(newVal);
  };

  // Local state for buffered text inputs
  const [localSettings, setLocalSettings] = useState(null);
  if (!localSettings && settings) setLocalSettings(settings);

  if (isLoading || !localSettings) return (
    <div className="p-20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading System Config...</p>
    </div>
  );

  const TABS = [
    { id: 'general',  label: 'General',  icon: <SettingsIcon size={16} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
    { id: 'shipping', label: 'Logistics', icon: <Truck size={16} /> },
  ];

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="bg-navy px-10 py-12 relative overflow-hidden mb-10 rounded-b-[40px]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <Link to="/admin" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-gold flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft size={12} /> Back to Suite
          </Link>
          <h1 className="font-serif text-4xl text-gold-light tracking-tight">System Controls</h1>
          <p className="text-white/40 text-xs mt-2 max-w-md">Configure global platform behaviour, payment gateways, and logistics parameters.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
          
          {/* Sidebar Nav */}
          <div className="flex flex-col gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-navy text-gold-light shadow-xl shadow-navy/20' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                {t.icon} {t.label}
                <ChevronRight size={14} className={`ml-auto ${activeTab === t.id ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm">
            
            {activeTab === 'general' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold-dark">
                    <SettingsIcon size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-navy">General Settings</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Core Platform configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" 
                        value={localSettings.contact.email}
                        onChange={(e) => handleInputChange('contact.email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Support Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" 
                        value={localSettings.contact.phone}
                        onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-navy rounded-3xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap size={100} />
                   </div>
                   <h3 className="text-gold-light font-serif text-xl mb-2">Maintenance Mode</h3>
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6">Take the entire storefront offline for upgrades.</p>
                   <button className="px-8 py-3 rounded-xl border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Enable Maintenance</button>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-navy">Payment Methods</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Control active transaction gateways</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'cod',    label: 'Cash on Delivery', desc: 'Allow customers to pay at the time of delivery.', icon: <Truck size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { id: 'online', label: 'Online Payment',   desc: 'Accept Credit/Debit cards, UPI and NetBanking via Razorpay.', icon: <ShieldCheck size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                  ].map(pm => (
                    <div key={pm.id} className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 bg-slate-50/30 group hover:border-gold/20 transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pm.bg} ${pm.color}`}>
                          {pm.icon}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{pm.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{pm.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggle(`paymentMethods.${pm.id}`, localSettings.paymentMethods[pm.id])}
                        disabled={updateMutation.isPending}
                        className={`w-14 h-8 rounded-full relative transition-all ${localSettings.paymentMethods[pm.id] ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-all ${localSettings.paymentMethods[pm.id] ? 'left-7.5' : 'left-1.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-navy">Logistics & Shipping</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Configure delivery costs and thresholds</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Base Shipping Charge (₹)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" 
                      value={localSettings.shipping.baseCharge}
                      onChange={(e) => handleInputChange('shipping.baseCharge', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Free Shipping Threshold (₹)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" 
                      value={localSettings.shipping.freeThreshold}
                      onChange={(e) => handleInputChange('shipping.freeThreshold', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                   <p className="text-xs text-amber-700 leading-relaxed">
                     <span className="font-bold uppercase tracking-widest block mb-1">Logistics Note</span>
                     These charges are applied globally at checkout. Orders above the threshold will automatically unlock "Complimentary Shipping".
                   </p>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-12 pt-10 border-t border-slate-50 flex justify-end">
               <button 
                 onClick={() => updateMutation.mutate(localSettings)}
                 disabled={updateMutation.isPending}
                 className="btn btn-primary h-14 px-10 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-3"
               >
                 {updateMutation.isPending ? <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"/> : <Save size={16}/>}
                 Save All Changes
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;