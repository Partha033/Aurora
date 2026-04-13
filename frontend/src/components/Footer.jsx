import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-navy text-white/60 mt-12 md:mt-20">
    <div className="container grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-8 md:gap-12 py-10 md:py-14">
      {/* Brand */}
      <div>
        <span className="block font-serif text-xl md:text-2xl text-gold-light mb-2 md:mb-3">✦ Aurora Jewels</span>
        <p className="text-sm leading-relaxed max-w-xs text-white/50">
          Exquisite handcrafted jewellery, made with love and precision for every occasion.
        </p>
        {/* Social row on mobile */}
        <div className="flex gap-4 mt-5">
          {['Instagram', 'Facebook', 'Pinterest'].map(s => (
            <span key={s} className="text-[11px] text-white/30 hover:text-gold transition-colors cursor-pointer">{s}</span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-8 md:gap-12">
        <div>
          <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-gold mb-3 md:mb-4">Shop</h4>
          {[
            { to: '/shop',                    label: 'All Jewellery' },
            { to: '/shop?category=rings',     label: 'Rings' },
            { to: '/shop?category=necklaces', label: 'Necklaces' },
            { to: '/shop?category=earrings',  label: 'Earrings' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="block text-sm text-white/50 mb-2 md:mb-2.5 hover:text-gold-light transition-colors">{label}</Link>
          ))}
        </div>
        <div>
          <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-gold mb-3 md:mb-4">Account</h4>
          {[
            { to: '/login',   label: 'Login' },
            { to: '/orders',  label: 'My Orders' },
            { to: '/profile', label: 'Profile' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="block text-sm text-white/50 mb-2 md:mb-2.5 hover:text-gold-light transition-colors">{label}</Link>
          ))}
        </div>
      </div>
    </div>

    <div className="border-t border-white/[0.08] text-center py-4 md:py-5 px-4 text-xs text-white/30">
      © {new Date().getFullYear()} Aurora Jewels — All rights reserved.
    </div>
  </footer>
);

export default Footer;
