import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/mockData';
import { PlaceholderImage } from './PlaceholderImage';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const thumbnail = product.colorVariants[0]?.front ?? '';

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="overflow-hidden">
        <PlaceholderImage src={thumbnail} className="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="pt-3 font-sans">
        <h3 className="text-sm text-bm-text leading-snug">{product.name}</h3>
        <p className="text-sm text-bm-muted mt-1">${product.price.toFixed(2)}</p>
        {!product.inStock && (
          <p className="text-[10px] uppercase tracking-wide text-rho-rose mt-1">Sold Out</p>
        )}
      </div>
    </Link>
  );
};
