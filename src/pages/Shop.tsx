import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';

const Arrow: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="w-4 h-4">
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

const photoOf = (p?: { garmentTypes: { colorVariants: { photos: string[] }[] }[] }) =>
  p?.garmentTypes[0]?.colorVariants[0]?.photos[0] ?? '';

export const Shop: React.FC = () => {
  const { products, productsLoading, siteSettings } = useShop();
  const [garmentType, setGarmentType] = useState<string>('All');
  const [search, setSearch] = useState('');

  const types = useMemo(() => {
    const unique = Array.from(new Set(products.flatMap((p) => p.garmentTypes.map((t) => t.type))));
    return ['All', ...unique.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesType = garmentType === 'All' || p.garmentTypes.some((t) => t.type === garmentType);
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [products, garmentType, search]);

  const heroPhoto = siteSettings.heroImageUrl || photoOf(products[0]);
  const storyPhoto = siteSettings.promiseImageUrl || photoOf(products[1] ?? products[0]);

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-rho-teal">
            <span className="w-8 h-px bg-rho-teal" />
            The Merch Collection
          </div>
          <h1 className="font-serif display text-6xl sm:text-7xl lg:text-8xl text-rho-rose-deep mt-6">
            Made for
            <br />
            <em className="text-rho-teal font-normal">sisterhood.</em>
          </h1>
          <p className="font-sans text-bm-muted text-base sm:text-lg leading-relaxed mt-8 max-w-md">
            Rho Delta Chi apparel and goods, designed by us and made to be worn well past rush week.
          </p>
          <a
            href="#collection"
            className="inline-flex items-center gap-4 mt-10 bg-rho-rose text-bm-text px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] hover:bg-rho-rose/80 transition-colors"
          >
            Shop the collection <Arrow />
          </a>
        </div>
        <div className="relative">
          <PlaceholderImage src={heroPhoto} className="!border-0 !aspect-[4/5] md:!aspect-[5/6]" />
          <span className="absolute bottom-5 right-6 font-serif italic text-5xl text-white drop-shadow">01</span>
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 scroll-mt-28">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-rho-teal">
          Shop our favorites
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mt-3 pb-5 border-b border-bm-border">
          <h2 className="font-serif display text-4xl sm:text-6xl text-rho-rose-deep">Good things, well made.</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 min-w-0">
            <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.18em] overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => setGarmentType(t)}
                  className={`pb-1 border-b shrink-0 whitespace-nowrap transition-colors ${
                    garmentType === t
                      ? 'border-rho-teal text-rho-teal'
                      : 'border-transparent text-bm-muted hover:text-bm-text'
                  }`}
                >
                  {t === 'All' ? 'All goods' : t}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search"
              aria-label="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-b border-bm-text/40 py-1 text-sm w-full sm:w-40 focus:outline-none focus:border-rho-teal"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14 mt-8 sm:mt-12">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-bm-muted font-sans py-20">
            {productsLoading ? 'Loading products…' : 'No products found.'}
          </p>
        )}
      </section>

      {/* Info band */}
      <section className="grid md:grid-cols-2 mt-20 sm:mt-28">
        <PlaceholderImage src={storyPhoto} className="!border-0 !aspect-auto h-72 md:h-full" />
        <div className="bg-rho-teal text-white px-6 sm:px-16 lg:px-24 py-14 sm:py-20">
          <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-rho-rose">
            How it works
          </div>
          <h2 className="font-serif display text-4xl sm:text-6xl mt-5">Order once, pick up together.</h2>
          <p className="font-sans text-white/80 leading-relaxed mt-6 max-w-md">
            Orders are collected during each drop window, then printed and delivered in a single batch. Check the
            info page for deadlines, payment, and pickup details.
          </p>
          <Link
            to="/info"
            className="inline-flex items-center gap-3 mt-8 pb-1 border-b border-white font-sans text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Read the info <Arrow />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 mt-12 border-t border-bm-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <span className="font-serif text-xl text-rho-rose-deep">
          Rho Delta Chi<span className="text-rho-teal">.</span>
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-bm-muted">Merch Shop</span>
        <Link to="/info" className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-bm-text">
          Info
        </Link>
      </footer>
    </div>
  );
};
