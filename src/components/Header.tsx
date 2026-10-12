import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const CartIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="w-5 h-5"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.5 3h2l2.68 12.39a2 2 0 0 0 2 1.61h8.64a2 2 0 0 0 2-1.61L21.5 7H6" />
  </svg>
);

const MenuIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    className="w-5 h-5"
  >
    {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
  </svg>
);

export const Header: React.FC = () => {
  const { cart, currentUser, isAdminLoggedIn, logout, siteSettings } = useShop();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40">
      {siteSettings.bannerEnabled && siteSettings.bannerText && (
        <div className="bg-rho-rose text-bm-text text-center px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em]">
          {siteSettings.bannerText}
        </div>
      )}
      <div className="border-b border-bm-border bg-bm-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="sm:hidden p-2.5 -ml-2.5 text-bm-text"
            >
              <MenuIcon open={menuOpen} />
            </button>
            <Link
              to="/shop"
              onClick={() => setMenuOpen(false)}
              className="hidden sm:block font-serif text-2xl text-rho-rose-deep tracking-tight"
            >
              Rho Delta Chi<span className="text-rho-teal">.</span>
            </Link>
          </div>

          <nav className="hidden sm:flex items-center gap-10 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-bm-text">
            <Link to="/shop" className="hover:text-rho-rose-deep transition-colors">Shop</Link>
            <Link to="/info" className="hover:text-rho-rose-deep transition-colors">Info</Link>
            <Link
              to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
              className="hover:text-rho-rose-deep transition-colors"
            >
              Admin
            </Link>
          </nav>
          <Link
            to="/shop"
            onClick={() => setMenuOpen(false)}
            className="sm:hidden font-serif text-xl text-rho-rose-deep tracking-tight text-center"
          >
            Rho Delta Chi<span className="text-rho-teal">.</span>
          </Link>

          <div className="flex items-center justify-end gap-5">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="hidden sm:block font-sans text-xs font-semibold uppercase tracking-[0.18em] text-bm-muted hover:text-bm-text transition-colors"
              >
                Exit
              </button>
            )}
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 -mr-2.5 sm:mr-0 sm:p-0 text-bm-text hover:text-rho-rose-deep transition-colors font-sans text-xs font-semibold uppercase tracking-[0.18em]"
            >
              <CartIcon />
              <span className="hidden sm:inline">Bag</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rho-rose text-bm-text text-[10px]">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-bm-border bg-bm-bg px-4 py-4 flex flex-col gap-4 font-sans text-xs font-semibold uppercase tracking-[0.18em]">
            {currentUser && <span className="text-bm-muted">Signed in as {currentUser.firstName}</span>}
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="text-bm-text py-1">Shop</Link>
            <Link to="/info" onClick={() => setMenuOpen(false)} className="text-bm-text py-1">Info</Link>
            <Link
              to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
              onClick={() => setMenuOpen(false)}
              className="text-rho-teal py-1"
            >
              Admin
            </Link>
            {currentUser && (
              <button onClick={handleLogout} className="text-bm-muted text-left py-1">Exit</button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
