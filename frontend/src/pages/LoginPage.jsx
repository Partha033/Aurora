import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setTokens, isAuthenticated } = useAuthStore();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated, navigate, from]);

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase() });
      // Backend: { success, msg, result: { accessToken, user } }
      setTokens(data.result.accessToken, data.result.user);
      toast.success(`Welcome${data.result.user.name ? ', ' + data.result.user.name : ''}! ✦`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-gradient-to-br from-navy via-[#1a0a2e] to-navy">
      {/* Decorative orbs */}
      <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-gold/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.04] border border-gold/25 rounded-2xl px-10 py-12 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="text-center mb-9">
            <Link to="/" className="font-serif text-xl text-gold-light tracking-widest mb-5 block">✦ Aurora Jewels</Link>
            <h1 className="font-serif text-3xl text-white mb-2">Welcome Back</h1>
            <p className="text-sm text-white/50">
              Sign in with your email — no password needed
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wide text-white/50 font-medium">Email Address</label>
              <input
                id="email" type="email" autoFocus required
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.07] border border-white/15 rounded text-white placeholder-white/30 text-sm focus:border-gold focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)] outline-none transition-all"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-sm gap-2.5">
              {loading ? <><div className="spinner spinner-sm" /> Logging in…</> : 'Login →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
