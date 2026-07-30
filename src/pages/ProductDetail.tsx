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

  const [size, setSize] = useState(product?.sizes[0] ?? '');
  const [color, setColor] = useState(product?.colorVariants[0]?.name ?? '');
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

  const activeVariant = product.colorVariants.find((v) => v.name === color) ?? product.colorVariants[0];
  const slides = activeVariant
    ? [
        { src: activeVariant.front, label: 'Front' },
        { src: activeVariant.back, label: 'Back' },
      ]
    : [];

  const handleAdd = () => {
    addToCart(product, size, color, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-12">
        <ImageCarousel key={color} slides={slides} />

        <div className="font-sans">
          <span className="text-[10px] uppercase tracking-widest text-rho-teal">{product.category}</span>
          <h1 className="font-serif text-3xl text-bm-text mt-2 mb-3">{product.name}</h1>
          <p className="text-lg text-bm-text mb-6">${product.price.toFixed(2)}</p>
          <p className="text-sm text-bm-muted leading-relaxed mb-8">{product.description}</p>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-bm-muted mb-2">Color</p>
            <div className="flex gap-2 flex-wrap">
              {product.colorVariants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setColor(v.name)}
                  className={`px-4 py-2 text-xs border ${
                    color === v.name ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
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
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 text-xs border ${
                    size === s ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
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
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 text-bm-muted hover:text-bm-text">
                −
              </button>
              <span className="w-10 text-center text-sm">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 text-bm-muted hover:text-bm-text">
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="w-full bg-rho-rose text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-rose/90 transition-colors disabled:bg-bm-muted disabled:cursor-not-allowed"
          >
            {!product.inStock ? 'Sold Out' : added ? 'Added to Bag ✓' : 'Add to Bag'}
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
