import React, { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  anchor: { x: number; y: number };
}

export const DraggableColorPicker: React.FC<Props> = ({ value, onChange, onClose, anchor }) => {
  const [position, setPosition] = useState(anchor);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragOffset.current) return;
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handlePointerUp = () => {
      dragOffset.current = null;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const startDrag = (e: React.PointerEvent) => {
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  return (
    <div
      ref={panelRef}
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 w-56 border border-bm-border bg-bm-card shadow-lg font-sans"
    >
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between px-3 py-2 border-b border-bm-border bg-bm-bg cursor-move select-none"
      >
        <span className="text-[11px] uppercase tracking-wide text-bm-muted">Drag to Move</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close color picker"
          className="text-bm-muted hover:text-bm-text text-sm leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-3 space-y-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-16 border border-bm-border bg-bm-bg p-0.5 cursor-pointer"
        />
        <input
          type="text"
          placeholder="#000000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
        />
      </div>
    </div>
  );
};
