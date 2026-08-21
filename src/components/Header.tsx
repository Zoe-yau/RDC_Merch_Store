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
        <div className="bg-rho-rose text-white text-center px-4 py-2 font-sans text-[11px] uppercase tracking-widest">
          {siteSettings.bannerText}
        </div>
      )}
      <div className="border-b border-bm-border bg-bm-bg">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="sm:hidden p-2.5 -ml-2.5 text-bm-text"
            >
              <MenuIcon open={menuOpen} />
            </button>
            <span className="hidden sm:inline font-sans text-xs uppercase tracking-widest text-bm-muted">
              {currentUser ? currentUser.firstName : ''}
            </span>
          </div>

          <Link to="/shop" className="text-center px-1" onClick={() => setMenuOpen(false)}>
            <div className="font-serif text-lg sm:text-2xl tracking-wide text-bm-text">Rho Delta Chi</div>
            <div className="font-sans text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-rho-teal">
              Merch Shop
            </div>
          </Link>

          <div className="flex items-center gap-1 flex-1 justify-end">
            <nav className="hidden sm:flex items-center gap-5 font-sans text-xs uppercase tracking-wide mr-5">
              <Link to="/info" className="text-bm-muted hover:text-bm-text transition-colors">
                Info
              </Link>
              <Link
                to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
                className="text-rho-teal hover:text-rho-rose transition-colors"
              >
                Admin
              </Link>
              {currentUser && (
                <button onClick={handleLogout} className="text-bm-muted hover:text-bm-text transition-colors">
                  Exit
                </button>
              )}
            </nav>
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="relative p-2.5 -mr-2.5 text-bm-text hover:text-rho-rose transition-colors"
            >
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rho-rose text-white text-[9px]">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="sm:hidden border-t border-bm-border bg-bm-bg px-4 py-4 flex flex-col gap-4 font-sans text-xs uppercase tracking-widest">
            {currentUser && (
              <span className="text-bm-muted">Signed in as {currentUser.firstName}</span>
            )}
            <Link to="/info" onClick={() => setMenuOpen(false)} className="text-bm-text py-1">
              Info
            </Link>
            <Link
              to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
              onClick={() => setMenuOpen(false)}
              className="text-rho-teal py-1"
            >
              Admin
            </Link>
            {currentUser && (
              <button onClick={handleLogout} className="text-bm-muted text-left py-1">
                Exit
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
