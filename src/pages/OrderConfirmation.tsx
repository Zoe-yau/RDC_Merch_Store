import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useShop } from '../context/ShopContext';

export const OrderConfirmation: React.FC = () => {
  const { lastOrder: latestOrder } = useShop();

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-md mx-auto px-6 py-20 text-center font-sans">
        <div className="w-12 h-12 rounded-full border border-rho-teal flex items-center justify-center mx-auto mb-6 text-rho-teal">
          ✓
        </div>
        <h1 className="font-serif text-3xl text-bm-text mb-3">Order Received</h1>
        <p className="text-sm text-bm-muted leading-relaxed mb-8">
          Thank you! Your order{' '}
          {latestOrder ? <span className="text-bm-text">#{latestOrder.id.slice(0, 8).toUpperCase()}</span> : ''} has
          been submitted and is pending review. You'll be notified once your payment is confirmed and your items
          are ready.
        </p>
        <Link
          to="/shop"
          className="inline-block text-xs uppercase tracking-widest text-rho-teal border-b border-rho-teal pb-1"
        >
          Back to Shop
        </Link>
      </div>
    </div>
  );
};
