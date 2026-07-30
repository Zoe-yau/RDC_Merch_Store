import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { adminLogin } = useShop();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bm-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-serif text-3xl text-bm-text">Fundraising Chair</div>
          <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-rho-teal mt-2">
            Admin Access
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
          />
          {error && <p className="text-xs text-rho-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rho-teal text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
