import React, { useState } from 'react';
import { PlaceholderImage } from './PlaceholderImage';

export interface CarouselSlide {
  src: string;
  label: string;
}

export const ImageCarousel: React.FC<{ slides: CarouselSlide[] }> = ({ slides: slidesProp }) => {
  const [index, setIndex] = useState(0);
  const slides = slidesProp.length > 0 ? slidesProp : [{ src: '', label: 'Front' }];
  const safeIndex = index % slides.length;

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="relative border border-bm-border bg-bm-card overflow-hidden">
      <PlaceholderImage src={slides[safeIndex].src} label={slides[safeIndex].label} className="border-none" />

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-bm-card/90 border border-bm-border text-bm-text hover:border-rho-teal"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-bm-card/90 border border-bm-border text-bm-text hover:border-rho-teal"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full ${i === safeIndex ? 'bg-rho-teal' : 'bg-bm-border'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
