import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';

export const Checkout: React.FC = () => {
  const { cart, currentUser, submitOrder, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [buyerName, setBuyerName] = useState(
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
  );
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referrer, setReferrer] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !email.trim() || !phone.trim() || !referrer || !proofFile || cart.length === 0) return;

    setError('');
    setSubmitting(true);
    try {
      await submitOrder(
        {
          buyerName,
          email,
          phone,
          referrer,
          items: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
          total: subtotal,
        },
        proofFile
      );
      navigate('/confirmation');
    } catch {
      setError('Something went wrong submitting your order. Please try again.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-bm-bg">
        <Header />
        <p className="text-center py-20 font-sans text-bm-muted">Your bag is empty.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl text-bm-text mb-8">Checkout</h1>

        <div className="border border-bm-border bg-bm-card p-5 mb-8 font-sans">
          <div className="space-y-4 mb-4">
            {cart.map((item) => {
              const variant = item.product.colorVariants.find((v) => v.name === item.color);
              return (
              <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3 items-center">
                <div className="w-12 h-14 shrink-0">
                  <PlaceholderImage src={variant?.front} className="aspect-auto h-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-bm-text">{item.product.name}</p>
                  <p className="text-xs text-bm-muted mt-0.5">
                    Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm text-bm-text">${(item.product.price * item.quantity).toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                  className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-rho-rose"
                >
                  Remove
                </button>
              </div>
              );
            })}
          </div>

          <div className="flex justify-between text-sm mb-2 pt-4 border-t border-bm-border">
            <span className="text-bm-muted">Items</span>
            <span>{cart.reduce((n, i) => n + i.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-bm-muted">Total Due (Venmo)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          <div>
            <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">Full Name</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">Referred By</label>
            <input
              type="text"
              placeholder="Sister's name"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              className="w-full border border-bm-border bg-bm-card px-4 py-3 text-sm focus:outline-none focus:border-rho-teal"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">
              Venmo Payment Screenshot
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-bm-muted file:mr-4 file:py-2 file:px-4 file:border file:border-bm-border file:bg-bm-card file:text-xs file:uppercase file:tracking-wide"
              required={!proofFile}
            />
            {proofPreview && (
              <div className="mt-3 flex items-end gap-3">
                <img src={proofPreview} alt="Payment proof preview" className="w-32 border border-bm-border" />
                <button
                  type="button"
                  onClick={handleRemoveProof}
                  className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-rho-rose"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rho-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-rho-rose text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-rose/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
};
