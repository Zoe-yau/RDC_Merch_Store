import React from 'react';
import { useShop } from '../context/ShopContext';
import type { CartItem } from '../context/ShopContext';
import { PlaceholderImage } from './PlaceholderImage';

export const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
  const { updateCartQuantity, removeFromCart } = useShop();
  const variant = item.product.colorVariants.find((v) => v.name === item.color);

  return (
    <div className="flex gap-4 py-5 border-b border-bm-border font-sans">
      <div className="w-20 h-24 shrink-0">
        <PlaceholderImage src={variant?.front} className="aspect-auto h-full" />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-bm-text">{item.product.name}</p>
            <p className="text-xs text-bm-muted mt-1">
              Size: {item.size} · Color: {item.color}
            </p>
          </div>
          <p className="text-sm text-bm-text">${(item.product.price * item.quantity).toFixed(2)}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-bm-border">
            <button
              onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
              className="w-7 h-7 text-bm-muted hover:text-bm-text"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => updateCartQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
              className="w-7 h-7 text-bm-muted hover:text-bm-text"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.product.id, item.size, item.color)}
            className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-rho-rose"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
