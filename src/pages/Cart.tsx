import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { CartItemRow } from '../components/CartItemRow';
import { useShop } from '../context/ShopContext';

export const Cart: React.FC = () => {
  const { cart } = useShop();
  const navigate = useNavigate();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl text-bm-text mb-8">Your Bag</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 font-sans">
            <p className="text-bm-muted mb-6">Your bag is empty.</p>
            <Link to="/shop" className="text-xs uppercase tracking-widest text-rho-teal border-b border-rho-teal pb-1">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div>
              {cart.map((item) => (
                <CartItemRow key={`${item.product.id}-${item.size}-${item.color}`} item={item} />
              ))}
            </div>

            <div className="flex justify-between items-center py-6 font-sans">
              <span className="text-sm uppercase tracking-wide text-bm-muted">Subtotal</span>
              <span className="text-lg text-bm-text">${subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-rho-rose text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-rose/90 transition-colors"
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
};
