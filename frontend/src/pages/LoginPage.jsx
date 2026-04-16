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

  const [isLogin, setIsLogin] = useState(true);
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [password,setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return toast.error('Please fill in all fields');
    if (!isLogin && !name.trim()) return toast.error('Please enter your name');
    
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email: email.trim().toLowerCase(), password } : { email: email.trim().toLowerCase(), password, name: name.trim() };
      
      const { data } = await api.post(endpoint, payload);
      setTokens(data.result.accessToken, data.result.user);
      toast.success(isLogin ? `Welcome back${data.result.user.name ? ', ' + data.result.user.name : ''}! ✦` : `Registration successful! ✦`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || (isLogin ? 'Login failed.' : 'Registration failed.'));
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
            <h1 className="font-serif text-3xl text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-sm text-white/50">
              {isLogin ? 'Sign in to access your account' : 'Join us for exclusive collections'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs uppercase tracking-wide text-white/50 font-medium">Full Name</label>
                <input
                  id="name" type="text" autoFocus required={!isLogin}
                  placeholder="John Doe"
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.07] border border-white/15 rounded text-white placeholder-white/30 text-sm focus:border-gold focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)] outline-none transition-all"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase tracking-wide text-white/50 font-medium">Email Address</label>
              <input
                id="email" type="email" autoFocus={isLogin} required
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.07] border border-white/15 rounded text-white placeholder-white/30 text-sm focus:border-gold focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)] outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wide text-white/50 font-medium">Password</label>
              <input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.07] border border-white/15 rounded text-white placeholder-white/30 text-sm focus:border-gold focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)] outline-none transition-all"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-sm gap-2.5">
              {loading ? <><div className="spinner spinner-sm" /> Processing…</> : (isLogin ? 'Login →' : 'Register →')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs text-gold-light hover:text-white transition-colors">
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
