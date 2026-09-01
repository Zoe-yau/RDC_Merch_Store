import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/mockData';
import { PlaceholderImage } from './PlaceholderImage';
import { colorForName } from '../lib/colorSwatch';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [typeIndex, setTypeIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeType = product.garmentTypes[typeIndex] ?? product.garmentTypes[0];
  const activeVariant = activeType?.colorVariants[colorIndex] ?? activeType?.colorVariants[0];
  const images = activeVariant?.photos ?? [];

  useEffect(() => {
    if (hovering && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setFlash(true);
        setTimeout(() => {
          setSlideIndex((i) => (i + 1) % images.length);
          setFlash(false);
        }, 120);
      }, 900);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering, colorIndex]);

  const handleMouseLeave = () => {
    setHovering(false);
    setSlideIndex(0);
    setFlash(false);
  };

  const thumbnail = images[slideIndex] ?? images[0] ?? '';

  return (
    <div className="group">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={handleMouseLeave}
        >
          <PlaceholderImage
            src={thumbnail}
            className={`transition-[transform,opacity] duration-500 group-hover:scale-105 ${
              flash ? 'opacity-0' : 'opacity-100'
            } ${!activeType?.inStock ? 'blur-sm' : ''}`}
          />
          {!activeType?.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-bm-bg/40">
              <span className="font-sans text-sm sm:text-base font-bold uppercase tracking-widest text-bm-text text-center px-2">
                Unavailable
              </span>
            </div>
          )}
        </div>
        <div className="pt-3 font-sans">
          <h3 className="text-sm text-bm-text leading-snug">{product.name}</h3>
          <p className="text-sm text-bm-muted mt-1">${(activeType?.price ?? 0).toFixed(2)}</p>
        </div>
      </Link>

      {product.garmentTypes.length > 1 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {product.garmentTypes.map((t, i) => (
            <button
              key={t.type}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTypeIndex(i);
                setColorIndex(0);
                setSlideIndex(0);
              }}
              className={`px-2 py-1 text-[10px] uppercase tracking-wide border ${
                i === typeIndex ? 'border-rho-teal text-rho-teal' : 'border-bm-border text-bm-muted hover:border-bm-text'
              }`}
            >
              {t.type}
            </button>
          ))}
        </div>
      )}

      {activeType && activeType.colorVariants.length > 1 && (
        <div className="flex gap-1 mt-2 -ml-1.5">
          {activeType.colorVariants.map((variant, i) => (
            <button
              key={variant.name}
              type="button"
              aria-label={variant.name}
              title={variant.name}
              onClick={(e) => {
                e.preventDefault();
                setColorIndex(i);
                setSlideIndex(0);
              }}
              className="p-1.5 flex items-center justify-center"
            >
              <span
                style={{ backgroundColor: variant.swatch || colorForName(variant.name) }}
                className={`block w-6 h-6 rounded-full border-2 ${
                  i === colorIndex ? 'border-rho-teal ring-1 ring-rho-teal ring-offset-1' : 'border-bm-border'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
