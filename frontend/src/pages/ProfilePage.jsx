import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

/* ── Avatar Upload Component ─────────────────────────────────────────────── */
const AvatarUpload = ({ user, onUpdated }) => {
  const fileRef   = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const avatarUrl = preview || user?.profileImage?.url || '';
  const initials  = (user?.name?.[0] || user?.email?.[0] || '?').toUpperCase();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to backend → Cloudinary
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.patch('/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdated(data.result.user);
      setPreview(null); // use the real URL now
      toast.success('Profile picture updated ✦');
    } catch (err) {
      setPreview(null);
      toast.error(err.response?.data?.msg || 'Upload failed');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="relative group w-fit">
      {/* Avatar circle */}
      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-gold-dark to-gold flex items-center justify-center">
        {avatarUrl
          ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          : <span className="text-3xl font-bold text-white font-serif">{initials}</span>
        }
      </div>

      {/* Spinner overlay while uploading */}
      {loading && (
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <div className="spinner spinner-sm !border-white !border-t-transparent" />
        </div>
      )}

      {/* Camera button */}
      <label className="absolute bottom-0 right-0 w-7 h-7 bg-navy rounded-full border-2 border-white flex items-center justify-center cursor-pointer hover:bg-gold transition-colors shadow-sm">
        <span className="text-white text-xs">📷</span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};

/* ── Address Modal ───────────────────────────────────────────────────────── */
const EMPTY_ADDR = { label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' };

const AddressModal = ({ existing, onClose, onSave }) => {
  const [form,    setForm]    = useState(existing ? { ...existing } : { ...EMPTY_ADDR });
  const [loading, setLoading] = useState(false);
  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.line1 || !form.city || !form.state || !form.pincode) {
      return toast.error('Please fill all required fields');
    }
    setLoading(true);
    try { await onSave(form); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-navy/60 z-[200] flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-7 py-5 border-b border-slate-100">
          <h3 className="font-serif text-xl text-navy">{existing ? 'Edit Address' : 'Add New Address'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-4">
          {/* Label */}
          <div>
            <label className="form-label mb-2 block">Label</label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(l => (
                <button key={l} type="button" onClick={() => setForm(p => ({ ...p, label: l }))}
                  className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${form.label === l ? 'bg-navy border-navy text-gold-light' : 'border-slate-200 text-slate-500 hover:border-gold'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label mb-1.5 block">Address Line 1 *</label>
            <input name="line1" className="form-input" placeholder="House / Flat / Block No." value={form.line1} onChange={onChange} required />
          </div>
          <div>
            <label className="form-label mb-1.5 block">Address Line 2</label>
            <input name="line2" className="form-input" placeholder="Street / Area / Landmark" value={form.line2} onChange={onChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['city','City *'],['state','State *'],['pincode','Pincode *'],['country','Country']].map(([name, label]) => (
              <div key={name}>
                <label className="form-label mb-1.5 block">{label}</label>
                <input name={name} className="form-input" value={form[name]} onChange={onChange} required={label.endsWith('*')} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              {loading ? <><div className="spinner spinner-sm" /> Saving…</> : existing ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Profile Page ───────────────────────────────────────────────────── */
const ProfilePage = () => {
  const { user: storeUser, updateUser } = useAuthStore();
  const qc = useQueryClient();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: '', phone: '' });
  const [addressModal,   setAddressModal]   = useState(null);

  /* fetch fresh user */
  const { data: user, isLoading } = useQuery({
    queryKey:   ['me'],
    queryFn:    () => api.get('/auth/me').then(r => r.data.result.user),
    initialData: storeUser,
    onSuccess:  (u) => updateUser(u),
  });

  const addresses = user?.addresses ?? [];

  /* orders count */
  const { data: orderCount } = useQuery({
    queryKey: ['my-orders-count'],
    queryFn:  () => api.get('/order').then(r => r.data.result?.pagination?.totalItems ?? 0),
    initialData: 0,
  });

  /* profile update */
  const profileMutation = useMutation({
    mutationFn: (body) => api.patch('/auth/profile', body),
    onSuccess: (res) => {
      updateUser(res.data.result.user);
      qc.invalidateQueries(['me']);
      toast.success('Profile updated ✦');
      setEditingProfile(false);
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Update failed'),
  });

  /* address mutations */
  const addrMutation = useMutation({
    mutationFn: (body) => api.patch('/auth/address', body),
    onSuccess:  (res) => {
      updateUser({ addresses: res.data.result.addresses });
      qc.invalidateQueries(['me']);
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Failed'),
  });

  const handleAddAddress    = async (address)           => { await addrMutation.mutateAsync({ action: 'add', address }); toast.success('Address added'); };
  const handleEditAddress   = async (addressId, address) => { await addrMutation.mutateAsync({ action: 'edit', addressId, address }); toast.success('Address updated'); };
  const handleDeleteAddress = (addressId) => {
    if (!window.confirm('Remove this address?')) return;
    addrMutation.mutate({ action: 'delete', addressId });
    toast.success('Address removed');
  };

  const startEditProfile = () => {
    setProfileForm({ name: user?.name || '', phone: user?.phone || '' });
    setEditingProfile(true);
  };

  if (isLoading) return <div className="page-loader" style={{ minHeight: '80vh' }}><div className="spinner" /></div>;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-cream">
      <div className="container max-w-4xl">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="font-serif text-[2.2rem] text-navy">My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your account, avatar and saved addresses</p>
        </div>

        <div className="flex flex-col gap-6">

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '📦', label: 'Total Orders',    value: orderCount ?? 0 },
              { icon: '📍', label: 'Saved Addresses',  value: addresses.length },
              { icon: '✦',  label: 'Member Since',    value: new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
            ].map(stat => (
              <div key={stat.label} className="card p-5 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-semibold text-navy">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Profile Info Card ── */}
          <div className="card p-7">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-serif text-xl text-navy">Personal Information</h2>
              {!editingProfile && (
                <button onClick={startEditProfile} className="btn btn-outline !py-2 !px-4 text-xs">Edit</button>
              )}
            </div>

            {/* Avatar + info row */}
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar with upload */}
              <AvatarUpload user={user} onUpdated={(updatedUser) => { updateUser(updatedUser); qc.invalidateQueries(['me']); }} />

              <div className="flex-1">
                <h3 className="font-serif text-2xl text-navy">{user?.name || <em className="text-slate-400 not-italic text-base">No name set</em>}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
                {user?.phone && <p className="text-sm text-slate-400">{user.phone}</p>}
                <span className={`badge mt-2 ${user?.role === 'admin' ? 'bg-gold/20 text-gold-dark' : 'badge-muted'}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Edit form */}
            {editingProfile ? (
              <form onSubmit={e => { e.preventDefault(); profileMutation.mutate(profileForm); }}
                className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-1.5 block">Full Name</label>
                    <input className="form-input" placeholder="Your name" value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label mb-1.5 block">Phone</label>
                    <input className="form-input" placeholder="10-digit mobile" maxLength={10}
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value.replace(/\D/, '') }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={profileMutation.isPending} className="btn btn-primary gap-2">
                    {profileMutation.isPending ? <><div className="spinner spinner-sm" /> Saving…</> : '✓ Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-ghost">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                {[
                  { icon: '✉️', label: 'Email', value: user?.email },
                  { icon: '📱', label: 'Phone', value: user?.phone || '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex-1 bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{icon} {label}</p>
                    <p className="text-navy font-medium text-sm">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Link to="/orders" className="btn btn-outline !py-2 !px-5 text-xs">View My Orders →</Link>
            </div>
          </div>

          {/* ── Saved Addresses ── */}
          <div className="card p-7">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-serif text-xl text-navy">Saved Addresses</h2>
              <button onClick={() => setAddressModal('new')} className="btn btn-primary !py-2 !px-4 text-xs">+ Add Address</button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-4xl mb-3">📍</p>
                <p className="text-sm">No saved addresses yet.</p>
                <button onClick={() => setAddressModal('new')} className="btn btn-outline mt-4 !py-2 !px-5 text-xs">Add Your First Address</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="border border-slate-200 rounded-xl p-5 hover:border-gold/40 transition-colors">
                    <span className="badge badge-gold text-[9px] mb-2">{addr.label}</span>
                    <p className="text-sm text-navy font-medium">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{addr.city}, {addr.state} – {addr.pincode}</p>
                    <p className="text-xs text-slate-400">{addr.country}</p>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button onClick={() => setAddressModal(addr)} className="btn btn-outline !py-1.5 !px-3 text-xs flex-1">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr._id)} className="btn btn-danger !py-1.5 !px-3 text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {addressModal !== null && (
        <AddressModal
          existing={addressModal !== 'new' ? addressModal : null}
          onClose={() => setAddressModal(null)}
          onSave={addressModal === 'new'
            ? handleAddAddress
            : (form) => handleEditAddress(addressModal._id, form)
          }
        />
      )}
    </div>
  );
};

export default ProfilePage;
