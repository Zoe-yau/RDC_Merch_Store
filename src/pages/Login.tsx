import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export const Login: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { checkMember } = useShop();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const isMember = await checkMember(firstName, lastName);
      if (!isMember) {
        setError("We couldn't find that name on the roster. Check the spelling and try again.");
        return;
      }
      navigate('/shop');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bm-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-serif text-4xl text-bm-text">Rho Delta Chi</div>
          <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-rho-teal mt-2">
            Sisterhood Merch Shop
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
          />
          {error && <p className="text-xs text-rho-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rho-rose text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-rose/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Checking…' : 'Enter Merch Shop'}
          </button>
        </form>
        <p className="text-center text-xs text-bm-muted mt-6 font-sans">
          Members only. Enter your name exactly as on the roster.
        </p>
      </div>
    </div>
  );
};
