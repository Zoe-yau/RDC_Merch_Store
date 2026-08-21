import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';
import type { VariantFiles } from '../lib/api';
import type { ColorVariant, Product } from '../data/mockData';
import { colorForName } from '../lib/colorSwatch';
import { DraggableColorPicker } from '../components/DraggableColorPicker';

type Step = 'details' | 'photos';

const emptyDetails = {
  name: '',
  price: 0,
  category: 'Tops' as Product['category'],
  description: '',
  sizes: '',
  inStock: true,
};

const emptyVariant = (): ColorVariant => ({ name: '', photos: [], swatch: '' });

export const AdminProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useShop();
  const editingProduct = id ? products.find((p) => p.id === id) : undefined;
  const editingId = editingProduct?.id ?? null;

  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState(emptyDetails);
  const [colorCount, setColorCount] = useState(1);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([emptyVariant()]);
  const [variantFiles, setVariantFiles] = useState<VariantFiles>([[]]);
  const [draggedPhoto, setDraggedPhoto] = useState<{ variantIndex: number; photoIndex: number } | null>(null);
  const [dragOverPhoto, setDragOverPhoto] = useState<{ variantIndex: number; photoIndex: number } | null>(null);
  const [editingSortOrder, setEditingSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [openSwatchIndex, setOpenSwatchIndex] = useState<number | null>(null);
  const [swatchAnchor, setSwatchAnchor] = useState({ x: 0, y: 0 });
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!editingProduct) {
      if (id) setNotFound(true);
      return;
    }
    setNotFound(false);
    setEditingSortOrder(editingProduct.sortOrder);
    setDetails({
      name: editingProduct.name,
      price: editingProduct.price,
      category: editingProduct.category,
      description: editingProduct.description,
      sizes: editingProduct.sizes.join(', '),
      inStock: editingProduct.inStock,
    });
    const variants =
      editingProduct.colorVariants.length > 0
        ? editingProduct.colorVariants.map((v) => ({ ...v, swatch: v.swatch ?? '' }))
        : [emptyVariant()];
    setColorCount(variants.length);
    setColorVariants(variants);
    setVariantFiles(variants.map((v) => v.photos.map(() => undefined)));
    setStep('details');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goBackToProducts = () => navigate('/admin/dashboard', { state: { tab: 'Products' } });

  const resizeVariants = (count: number, current: ColorVariant[]): ColorVariant[] => {
    const next = current.slice(0, count);
    while (next.length < count) next.push(emptyVariant());
    return next;
  };

  const resizeVariantFiles = (count: number, current: VariantFiles): VariantFiles => {
    const next = current.slice(0, count);
    while (next.length < count) next.push([]);
    return next;
  };

  const handleColorCountChange = (raw: string) => {
    const count = Math.max(1, Math.min(20, Number(raw) || 1));
    setColorCount(count);
    setColorVariants((prev) => resizeVariants(count, prev));
    setVariantFiles((prev) => resizeVariantFiles(count, prev));
  };

  const handleVariantNameChange = (index: number, name: string) => {
    setColorVariants((prev) => prev.map((v, i) => (i === index ? { ...v, name } : v)));
  };

  const handleVariantSwatchChange = (index: number, swatch: string) => {
    setColorVariants((prev) => prev.map((v, i) => (i === index ? { ...v, swatch } : v)));
  };

  const handleAddPhotos = (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setColorVariants((prev) =>
          prev.map((v, i) => (i === index ? { ...v, photos: [...v.photos, dataUrl] } : v))
        );
        setVariantFiles((prev) => prev.map((v, i) => (i === index ? [...v, file] : v)));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number, photoIndex: number) => {
    setColorVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, photos: v.photos.filter((_, j) => j !== photoIndex) } : v))
    );
    setVariantFiles((prev) => prev.map((v, i) => (i === index ? v.filter((_, j) => j !== photoIndex) : v)));
  };

  const handleReorderPhoto = (index: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setColorVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const photos = [...v.photos];
        const [moved] = photos.splice(fromIndex, 1);
        photos.splice(toIndex, 0, moved);
        return { ...v, photos };
      })
    );
    setVariantFiles((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const files = [...v];
        const [moved] = files.splice(fromIndex, 1);
        files.splice(toIndex, 0, moved);
        return files;
      })
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.name.trim()) return;
    setStep('photos');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedVariants = colorVariants
      .map((v) => ({ ...v, name: v.name.trim() }))
      .filter((v) => v.name);
    if (cleanedVariants.length === 0) return;

    const productData = {
      name: details.name,
      price: Number(details.price),
      category: details.category,
      description: details.description,
      sizes: details.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colorVariants: cleanedVariants,
      inStock: details.inStock,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, { ...productData, sortOrder: editingSortOrder }, variantFiles);
      } else {
        await addProduct(productData, variantFiles);
      }
      goBackToProducts();
    } catch (err) {
      console.error('Failed to save product', err);
      window.alert('Could not save product: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-bm-bg">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-10 font-sans">
          <p className="text-bm-muted mb-4">Product not found.</p>
          <button
            type="button"
            onClick={goBackToProducts}
            className="text-xs uppercase tracking-widest text-rho-teal"
          >
            ‹ Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 font-sans">
        <button
          type="button"
          onClick={goBackToProducts}
          className="text-[11px] uppercase tracking-widest text-bm-muted hover:text-bm-text mb-4"
        >
          ‹ Back to Products
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl text-bm-text">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h1>
          <span className="text-xs uppercase tracking-wide text-bm-muted">
            Step {step === 'details' ? '1' : '2'} of 2
          </span>
        </div>

        {step === 'photos' && (
          <button
            type="button"
            onClick={() => setStep('details')}
            className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-bm-text mb-4"
          >
            ‹ Back to Details
          </button>
        )}

        {step === 'details' ? (
          <form onSubmit={handleNextStep} className="space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={details.price || ''}
              onChange={(e) => setDetails({ ...details, price: Number(e.target.value) })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
            />
            <select
              value={details.category}
              onChange={(e) => setDetails({ ...details, category: e.target.value as Product['category'] })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
            >
              <option value="Tops">Tops</option>
              <option value="Tanks">Tanks</option>
              <option value="Outerwear">Outerwear</option>
              <option value="Bottoms">Bottoms</option>
              <option value="Accessories">Accessories</option>
            </select>
            <textarea
              placeholder="Description"
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
              rows={3}
            />
            <input
              type="text"
              placeholder="Sizes (comma separated)"
              value={details.sizes}
              onChange={(e) => setDetails({ ...details, sizes: e.target.value })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
            />

            <div>
              <label className="text-xs uppercase tracking-wide text-bm-muted block mb-1">
                Number of Colors
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={colorCount}
                onChange={(e) => handleColorCountChange(e.target.value)}
                className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
              />
              <p className="text-[11px] text-bm-muted mt-1">
                Next you'll name each color and upload as many photos as you'd like for it.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-rho-teal text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors"
            >
              Next: Upload Photos ›
            </button>
            <button
              type="button"
              onClick={goBackToProducts}
              className="w-full border border-bm-border text-bm-text py-3 text-xs uppercase tracking-widest hover:border-rho-teal transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <form onSubmit={handleSaveProduct} className="space-y-5">
            {colorVariants.map((variant, i) => (
              <div key={i} className="border border-bm-border bg-bm-card p-4 space-y-3">
                <input
                  type="text"
                  placeholder={`Color ${i + 1} name (e.g. Dusty Rose)`}
                  value={variant.name}
                  onChange={(e) => handleVariantNameChange(i, e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                />
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                    Shop Swatch Color
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSwatchAnchor({ x: rect.left, y: rect.bottom + 8 });
                        setOpenSwatchIndex(i);
                      }}
                      style={{ backgroundColor: variant.swatch || colorForName(variant.name || 'default') }}
                      className="w-10 h-10 border border-bm-border shrink-0 cursor-pointer"
                      aria-label="Choose swatch color"
                    />
                    <input
                      type="text"
                      placeholder="#000000"
                      value={variant.swatch}
                      onChange={(e) => handleVariantSwatchChange(i, e.target.value)}
                      className="flex-1 border border-bm-border bg-bm-bg px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                    />
                  </div>
                  <p className="text-[11px] text-bm-muted mt-1">
                    Shown as the color dot on the shop grid. Leave blank to auto-match the color name.
                  </p>
                  {openSwatchIndex === i && (
                    <DraggableColorPicker
                      value={variant.swatch || colorForName(variant.name || 'default')}
                      onChange={(hex) => handleVariantSwatchChange(i, hex)}
                      onClose={() => setOpenSwatchIndex(null)}
                      anchor={swatchAnchor}
                    />
                  )}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                    Photos
                  </label>
                  {variant.photos.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-2">
                      {variant.photos.map((photo, j) => {
                        const isDragged = draggedPhoto?.variantIndex === i && draggedPhoto.photoIndex === j;
                        const isOver = dragOverPhoto?.variantIndex === i && dragOverPhoto.photoIndex === j;
                        return (
                          <div
                            key={j}
                            draggable
                            onDragStart={() => setDraggedPhoto({ variantIndex: i, photoIndex: j })}
                            onDragEnter={() =>
                              draggedPhoto?.variantIndex === i && setDragOverPhoto({ variantIndex: i, photoIndex: j })
                            }
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedPhoto && draggedPhoto.variantIndex === i) {
                                handleReorderPhoto(i, draggedPhoto.photoIndex, j);
                              }
                              setDraggedPhoto(null);
                              setDragOverPhoto(null);
                            }}
                            onDragEnd={() => {
                              setDraggedPhoto(null);
                              setDragOverPhoto(null);
                            }}
                            className={`relative w-20 shrink-0 cursor-grab active:cursor-grabbing transition-colors ${
                              isOver ? 'ring-2 ring-rho-teal' : ''
                            } ${isDragged ? 'opacity-40' : ''}`}
                          >
                            <PlaceholderImage src={photo} />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(i, j)}
                              aria-label="Remove photo"
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center bg-bm-bg border border-bm-border text-bm-muted hover:text-rho-rose hover:border-rho-rose text-xs leading-none"
                            >
                              ×
                            </button>
                            {j === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-bm-bg/90 text-[9px] uppercase tracking-wide text-center py-0.5">
                                Default
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleAddPhotos(i, e.target.files);
                      e.target.value = '';
                    }}
                    className="w-full text-xs text-bm-muted file:mr-2 file:py-2 file:px-3 file:border file:border-bm-border file:bg-bm-bg file:text-[11px] file:uppercase"
                  />
                  <p className="text-[11px] text-bm-muted mt-1">
                    Add as many as you'd like. Drag to reorder — the first is used as the thumbnail.
                  </p>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-rho-teal text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={goBackToProducts}
              className="w-full border border-bm-border text-bm-text py-3 text-xs uppercase tracking-widest hover:border-rho-teal transition-colors"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
