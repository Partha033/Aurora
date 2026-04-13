import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const COOLDOWN = 60;

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setTokens, isAuthenticated } = useAuthStore();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated, navigate, from]);

  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer,   setTimer]   = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(n => n - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: email.trim().toLowerCase() });
      toast.success(`OTP sent to ${email}`);
      setStep(2); setTimer(COOLDOWN);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...otp]; updated[idx] = val; setOtp(updated);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (updated.every(Boolean)) handleVerify(updated.join(''));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); handleVerify(pasted); }
  };

  const handleVerify = async (otpStr) => {
    if (otpStr.length < 6) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: otpStr });
      // Backend: { success, msg, result: { accessToken, user } }
      setTokens(data.result.accessToken, data.result.user);
      toast.success(`Welcome${data.result.user.name ? ', ' + data.result.user.name : ''}! ✦`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']); otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '', '', '']); setTimer(COOLDOWN);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
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
            <h1 className="font-serif text-3xl text-white mb-2">{step === 1 ? 'Welcome Back' : 'Enter Your OTP'}</h1>
            <p className="text-sm text-white/50">
              {step === 1 ? 'Sign in with your email — no password needed' : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Step 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
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
                {loading ? <><div className="spinner spinner-sm" /> Sending OTP…</> : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              {/* OTP boxes */}
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    disabled={loading}
                    className={`w-12 h-14 rounded text-center text-2xl font-bold outline-none transition-all border ${
                      digit
                        ? 'border-gold bg-gold/10 text-gold-light'
                        : 'border-white/20 bg-white/[0.07] text-white focus:border-gold focus:bg-gold/10 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)]'
                    } disabled:opacity-50`}
                  />
                ))}
              </div>

              {loading && <div className="flex justify-center"><div className="spinner" /></div>}

              <div className="flex flex-col items-center gap-2">
                <button onClick={handleResend} disabled={timer > 0 || loading}
                  className="text-sm text-white/50 hover:text-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                </button>
                <button onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                  className="text-sm text-white/40 hover:text-white/70 transition-colors">
                  ← Change email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
