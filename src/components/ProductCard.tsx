import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/mockData';
import { PlaceholderImage } from './PlaceholderImage';
import { colorForName } from '../lib/colorSwatch';

const BADGE_STYLES: Record<string, string> = {
  SALE: 'bg-bm-bg text-bm-text',
  LIMITED: 'bg-bm-bg text-bm-text',
};

// Pulls "[SALE]"-style tags out of a product name so they can render as badges.
const splitTags = (name: string) => {
  const tags: string[] = [];
  const title = name
    .replace(/\[([^\]]+)\]/g, (_, tag: string) => {
      tags.push(tag.trim().toUpperCase());
      return '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { title: title || name, tags };
};

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

  const { title, tags } = splitTags(product.name);
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
            className={`!border-0 aspect-[4/5] transition-[transform,opacity] duration-500 group-hover:scale-105 ${
              flash ? 'opacity-0' : 'opacity-100'
            } ${!activeType?.inStock ? 'blur-sm' : ''}`}
          />
          {tags.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-3 py-2 tracking-[0.18em] ${
                    BADGE_STYLES[tag] ?? 'bg-bm-bg text-bm-text'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {activeType?.inStock && (
            <div className="hidden sm:flex absolute left-4 right-4 bottom-4 bg-bm-bg px-5 py-4 items-center justify-between font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-bm-text shadow opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              View item <span aria-hidden>→</span>
            </div>
          )}
          {!activeType?.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-bm-bg/40">
              <span className="font-sans text-sm sm:text-base font-bold uppercase tracking-widest text-bm-text text-center px-2">
                Unavailable
              </span>
            </div>
          )}
        </div>
        <div className="pt-4 font-sans">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rho-teal">
            {activeType?.type}
          </div>
          <div className="flex items-baseline justify-between gap-3 mt-1">
            <h3 className="font-serif text-lg sm:text-xl text-rho-rose-deep leading-snug">{title}</h3>
            <p className="text-sm font-semibold text-bm-text shrink-0">${(activeType?.price ?? 0).toFixed(2)}</p>
          </div>
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

      <div className="flex gap-1 mt-1 -ml-1.5 min-h-[36px] items-center">
        {activeType && activeType.colorVariants.length > 1 &&
          activeType.colorVariants.map((variant, i) => (
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
    </div>
  );
};
