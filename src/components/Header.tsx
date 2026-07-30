import React from 'react';
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

export const Header: React.FC = () => {
  const { cart, currentUser, isAdminLoggedIn, logout } = useShop();
  const navigate = useNavigate();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-bm-border bg-bm-bg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-widest text-bm-muted w-32">
          {currentUser ? currentUser.firstName : ''}
        </span>

        <Link to="/shop" className="text-center">
          <div className="font-serif text-2xl tracking-wide text-bm-text">Rho Delta Chi</div>
          <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-rho-teal">Merch Shop</div>
        </Link>

        <nav className="flex items-center gap-5 w-32 justify-end font-sans text-xs uppercase tracking-wide">
          <Link
            to={isAdminLoggedIn ? '/admin/dashboard' : '/admin'}
            className="text-rho-teal hover:text-rho-rose transition-colors"
          >
            Admin
          </Link>
          {currentUser && (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-bm-muted hover:text-bm-text transition-colors"
            >
              Exit
            </button>
          )}
          <Link to="/cart" className="relative text-bm-text hover:text-rho-rose transition-colors">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rho-rose text-white text-[9px]">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
};
