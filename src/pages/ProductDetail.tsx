import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { ImageCarousel } from '../components/ImageCarousel';
import { useShop } from '../context/ShopContext';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { products, addToCart } = useShop();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);

  const [garmentType, setGarmentType] = useState(product?.garmentTypes[0]?.type ?? '');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-bm-bg">
        <Header />
        <p className="text-center py-20 font-sans text-bm-muted">Product not found.</p>
      </div>
    );
  }

  const activeType = product.garmentTypes.find((t) => t.type === garmentType) ?? product.garmentTypes[0];
  const activeVariant = activeType?.colorVariants.find((v) => v.name === color) ?? activeType?.colorVariants[0];
  const slides = (activeVariant?.photos ?? []).map((src, i) => ({ src, label: `Photo ${i + 1}` }));

  const currentSize = size || activeType?.sizes[0] || '';
  const currentColor = color || activeVariant?.name || '';

  const handleTypeChange = (nextType: string) => {
    setGarmentType(nextType);
    const next = product.garmentTypes.find((t) => t.type === nextType);
    setColor(next?.colorVariants[0]?.name ?? '');
    setSize(next?.sizes[0] ?? '');
  };

  const handleAdd = () => {
    if (!activeType) return;
    addToCart(product, activeType.type, currentSize, currentColor, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-12">
        <ImageCarousel key={`${garmentType}-${currentColor}`} slides={slides} />

        <div className="font-sans">
          <span className="text-[10px] uppercase tracking-widest text-rho-teal">{activeType?.type}</span>
          <h1 className="font-serif text-3xl text-bm-text mt-2 mb-3">{product.name}</h1>
          <p className="text-lg text-bm-text mb-6">${(activeType?.price ?? 0).toFixed(2)}</p>
          <p className="text-sm text-bm-muted leading-relaxed mb-8">{product.description}</p>

          {product.garmentTypes.length > 1 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">Type</p>
              <div className="flex gap-2 flex-wrap">
                {product.garmentTypes.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => handleTypeChange(t.type)}
                    className={`px-4 py-2 text-xs border ${
                      garmentType === t.type ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
                    }`}
                  >
                    {t.type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {activeType?.colorVariants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setColor(v.name)}
                  className={`px-4 py-2 text-xs border ${
                    currentColor === v.name ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {activeType?.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 text-xs border ${
                    currentSize === s ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">Quantity</p>
            <div className="flex items-center border border-bm-border w-fit">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-11 h-11 text-bm-muted hover:text-bm-text">
                −
              </button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-11 h-11 text-bm-muted hover:text-bm-text">
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!activeType?.inStock}
            className="w-full bg-rho-rose text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-rose/90 transition-colors disabled:bg-bm-muted disabled:cursor-not-allowed"
          >
            {!activeType?.inStock ? 'Sold Out' : added ? 'Added to Bag ✓' : 'Add to Bag'}
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="w-full mt-3 border border-bm-border text-bm-text py-3 text-xs uppercase tracking-widest hover:border-rho-teal transition-colors"
          >
            View Bag
          </button>
        </div>
      </div>
    </div>
  );
};
