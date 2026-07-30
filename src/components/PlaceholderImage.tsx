import React from 'react';

export const PlaceholderImage: React.FC<{ src?: string; label?: string; className?: string }> = ({
  src,
  label,
  className = '',
}) => {
  if (src) {
    return (
      <img
        src={src}
        alt={label ?? ''}
        className={`w-full aspect-[4/5] object-cover border border-bm-border ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full aspect-[4/5] bg-bm-border/40 border border-bm-border flex flex-col items-center justify-center text-center font-sans ${className}`}
    >
      <span className="text-xs uppercase tracking-widest text-bm-muted">Insert Picture Here</span>
      {label && <span className="text-[10px] uppercase tracking-wide text-bm-muted/70 mt-1">({label})</span>}
    </div>
  );
};
