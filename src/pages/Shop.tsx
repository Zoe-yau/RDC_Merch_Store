import React, { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import type { Product } from '../data/mockData';

const CATEGORIES: Array<Product['category'] | 'All'> = ['All', 'Tops', 'Outerwear', 'Bottoms', 'Accessories'];

export const Shop: React.FC = () => {
  const { products } = useShop();
  const [category, setCategory] = useState<Product['category'] | 'All'>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === 'All' || p.category === category;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 font-sans">
          <div className="flex gap-6 text-xs uppercase tracking-widest">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`pb-1 border-b ${
                  category === c ? 'border-rho-rose text-bm-text' : 'border-transparent text-bm-muted hover:text-bm-text'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-bm-border bg-bm-card px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:border-rho-teal"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-bm-muted font-sans py-20">No products found.</p>
        )}
      </div>
    </div>
  );
};
