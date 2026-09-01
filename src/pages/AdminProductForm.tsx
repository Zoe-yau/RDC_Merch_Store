import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';
import type { VariantFiles } from '../lib/api';
import type { ColorVariant, GarmentType } from '../data/mockData';
import { colorForName } from '../lib/colorSwatch';
import { DraggableColorPicker } from '../components/DraggableColorPicker';

type Step = 'details' | 'types';

const GARMENT_TYPE_PRESETS = ['T-Shirt', 'Tank Top', 'Hoodie', 'Jacket', 'Crewneck', 'Long Sleeve'];

interface LocalGarmentType {
  type: string;
  price: number;
  sizesInput: string;
  inStock: boolean;
  colorVariants: ColorVariant[];
}

const emptyDetails = { name: '', description: '' };

const emptyVariant = (): ColorVariant => ({ name: '', photos: [], swatch: '' });

const emptyGarmentType = (): LocalGarmentType => ({
  type: '',
  price: 0,
  sizesInput: '',
  inStock: true,
  colorVariants: [emptyVariant()],
});

const garmentTypeToLocal = (t: GarmentType): LocalGarmentType => ({
  type: t.type,
  price: t.price,
  sizesInput: t.sizes.join(', '),
  inStock: t.inStock,
  colorVariants: t.colorVariants.length > 0 ? t.colorVariants.map((v) => ({ ...v, swatch: v.swatch ?? '' })) : [emptyVariant()],
});

export const AdminProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useShop();
  const editingProduct = id ? products.find((p) => p.id === id) : undefined;
  const editingId = editingProduct?.id ?? null;

  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState(emptyDetails);
  const [garmentTypes, setGarmentTypes] = useState<LocalGarmentType[]>([emptyGarmentType()]);
  const [variantFiles, setVariantFiles] = useState<VariantFiles>([[[]]]);
  const [draggedPhoto, setDraggedPhoto] = useState<{ typeIndex: number; colorIndex: number; photoIndex: number } | null>(null);
  const [dragOverPhoto, setDragOverPhoto] = useState<{ typeIndex: number; colorIndex: number; photoIndex: number } | null>(null);
  const [editingSortOrder, setEditingSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [openSwatch, setOpenSwatch] = useState<{ typeIndex: number; colorIndex: number } | null>(null);
  const [swatchAnchor, setSwatchAnchor] = useState({ x: 0, y: 0 });
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!editingProduct) {
      if (id) setNotFound(true);
      return;
    }
    setNotFound(false);
    setEditingSortOrder(editingProduct.sortOrder);
    setDetails({ name: editingProduct.name, description: editingProduct.description });
    const types =
      editingProduct.garmentTypes.length > 0 ? editingProduct.garmentTypes.map(garmentTypeToLocal) : [emptyGarmentType()];
    setGarmentTypes(types);
    setVariantFiles(types.map((t) => t.colorVariants.map((v) => v.photos.map(() => undefined))));
    setStep('details');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const goBackToProducts = () => navigate('/admin/dashboard', { state: { tab: 'Products' } });

  const handleAddType = () => {
    setGarmentTypes((prev) => [...prev, emptyGarmentType()]);
    setVariantFiles((prev) => [...prev, [[]]]);
  };

  const handleRemoveType = (typeIndex: number) => {
    setGarmentTypes((prev) => prev.filter((_, i) => i !== typeIndex));
    setVariantFiles((prev) => prev.filter((_, i) => i !== typeIndex));
  };

  const handleTypeFieldChange = <K extends keyof LocalGarmentType>(typeIndex: number, field: K, value: LocalGarmentType[K]) => {
    setGarmentTypes((prev) => prev.map((t, i) => (i === typeIndex ? { ...t, [field]: value } : t)));
  };

  const handleAddColor = (typeIndex: number) => {
    setGarmentTypes((prev) =>
      prev.map((t, i) => (i === typeIndex ? { ...t, colorVariants: [...t.colorVariants, emptyVariant()] } : t))
    );
    setVariantFiles((prev) => prev.map((files, i) => (i === typeIndex ? [...files, []] : files)));
  };

  const handleRemoveColor = (typeIndex: number, colorIndex: number) => {
    setGarmentTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex ? { ...t, colorVariants: t.colorVariants.filter((_, j) => j !== colorIndex) } : t
      )
    );
    setVariantFiles((prev) => prev.map((files, i) => (i === typeIndex ? files.filter((_, j) => j !== colorIndex) : files)));
  };

  const handleVariantNameChange = (typeIndex: number, colorIndex: number, name: string) => {
    setGarmentTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex
          ? { ...t, colorVariants: t.colorVariants.map((v, j) => (j === colorIndex ? { ...v, name } : v)) }
          : t
      )
    );
  };

  const handleVariantSwatchChange = (typeIndex: number, colorIndex: number, swatch: string) => {
    setGarmentTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex
          ? { ...t, colorVariants: t.colorVariants.map((v, j) => (j === colorIndex ? { ...v, swatch } : v)) }
          : t
      )
    );
  };

  const handleAddPhotos = (typeIndex: number, colorIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setGarmentTypes((prev) =>
          prev.map((t, i) =>
            i === typeIndex
              ? {
                  ...t,
                  colorVariants: t.colorVariants.map((v, j) =>
                    j === colorIndex ? { ...v, photos: [...v.photos, dataUrl] } : v
                  ),
                }
              : t
          )
        );
        setVariantFiles((prev) =>
          prev.map((typeFiles, i) =>
            i === typeIndex ? typeFiles.map((colorFiles, j) => (j === colorIndex ? [...colorFiles, file] : colorFiles)) : typeFiles
          )
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (typeIndex: number, colorIndex: number, photoIndex: number) => {
    setGarmentTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex
          ? {
              ...t,
              colorVariants: t.colorVariants.map((v, j) =>
                j === colorIndex ? { ...v, photos: v.photos.filter((_, k) => k !== photoIndex) } : v
              ),
            }
          : t
      )
    );
    setVariantFiles((prev) =>
      prev.map((typeFiles, i) =>
        i === typeIndex
          ? typeFiles.map((colorFiles, j) => (j === colorIndex ? colorFiles.filter((_, k) => k !== photoIndex) : colorFiles))
          : typeFiles
      )
    );
  };

  const handleReorderPhoto = (typeIndex: number, colorIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setGarmentTypes((prev) =>
      prev.map((t, i) => {
        if (i !== typeIndex) return t;
        return {
          ...t,
          colorVariants: t.colorVariants.map((v, j) => {
            if (j !== colorIndex) return v;
            const photos = [...v.photos];
            const [moved] = photos.splice(fromIndex, 1);
            photos.splice(toIndex, 0, moved);
            return { ...v, photos };
          }),
        };
      })
    );
    setVariantFiles((prev) =>
      prev.map((typeFiles, i) => {
        if (i !== typeIndex) return typeFiles;
        return typeFiles.map((colorFiles, j) => {
          if (j !== colorIndex) return colorFiles;
          const files = [...colorFiles];
          const [moved] = files.splice(fromIndex, 1);
          files.splice(toIndex, 0, moved);
          return files;
        });
      })
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.name.trim()) return;
    setStep('types');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTypes = garmentTypes
      .map((t) => ({
        type: t.type.trim(),
        price: Number(t.price),
        sizes: t.sizesInput.split(',').map((s) => s.trim()).filter(Boolean),
        inStock: t.inStock,
        colorVariants: t.colorVariants.map((v) => ({ ...v, name: v.name.trim() })).filter((v) => v.name),
      }))
      .filter((t) => t.type && t.colorVariants.length > 0);
    if (cleanedTypes.length === 0) return;

    const productData = {
      name: details.name,
      description: details.description,
      garmentTypes: cleanedTypes,
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
            {editingId ? 'Edit Design' : 'Add New Design'}
          </h1>
          <span className="text-xs uppercase tracking-wide text-bm-muted">
            Step {step === 'details' ? '1' : '2'} of 2
          </span>
        </div>

        {step === 'types' && (
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
              placeholder="Design Name (e.g. Bunny)"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
            />
            <textarea
              placeholder="Description"
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              className="w-full border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
              rows={3}
            />
            <p className="text-[11px] text-bm-muted">
              Next you'll add the garment types this design comes in (t-shirt, tank, hoodie, ...), each with its own
              price, sizes, and colors.
            </p>

            <button
              type="submit"
              className="w-full bg-rho-teal text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors"
            >
              Next: Garment Types ›
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
          <form onSubmit={handleSaveProduct} className="space-y-6">
            <datalist id="garment-type-presets">
              {GARMENT_TYPE_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>

            {garmentTypes.map((t, typeIndex) => (
              <div key={typeIndex} className="border border-bm-border bg-bm-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-bm-muted">Garment Type {typeIndex + 1}</span>
                  {garmentTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveType(typeIndex)}
                      className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-rho-rose"
                    >
                      Remove Type
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  list="garment-type-presets"
                  placeholder="Type (e.g. T-Shirt, Hoodie)"
                  value={t.type}
                  onChange={(e) => handleTypeFieldChange(typeIndex, 'type', e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={t.price || ''}
                    onChange={(e) => handleTypeFieldChange(typeIndex, 'price', Number(e.target.value))}
                    className="w-full border border-bm-border bg-bm-bg px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                  />
                  <label className="flex items-center gap-2 text-sm text-bm-text px-3">
                    <input
                      type="checkbox"
                      checked={t.inStock}
                      onChange={(e) => handleTypeFieldChange(typeIndex, 'inStock', e.target.checked)}
                    />
                    In Stock
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Sizes (comma separated)"
                  value={t.sizesInput}
                  onChange={(e) => handleTypeFieldChange(typeIndex, 'sizesInput', e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                />

                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-wide text-bm-muted">Colors</p>
                  {t.colorVariants.map((variant, colorIndex) => (
                    <div key={colorIndex} className="border border-bm-border bg-bm-bg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          placeholder={`Color ${colorIndex + 1} name (e.g. Dusty Rose)`}
                          value={variant.name}
                          onChange={(e) => handleVariantNameChange(typeIndex, colorIndex, e.target.value)}
                          className="flex-1 border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                        />
                        {t.colorVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(typeIndex, colorIndex)}
                            aria-label="Remove color"
                            className="ml-2 w-9 h-9 flex items-center justify-center text-bm-muted hover:text-rho-rose"
                          >
                            ×
                          </button>
                        )}
                      </div>
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
                              setOpenSwatch({ typeIndex, colorIndex });
                            }}
                            style={{ backgroundColor: variant.swatch || colorForName(variant.name || 'default') }}
                            className="w-10 h-10 border border-bm-border shrink-0 cursor-pointer"
                            aria-label="Choose swatch color"
                          />
                          <input
                            type="text"
                            placeholder="#000000"
                            value={variant.swatch}
                            onChange={(e) => handleVariantSwatchChange(typeIndex, colorIndex, e.target.value)}
                            className="flex-1 border border-bm-border bg-bm-card px-3 py-2.5 text-sm focus:outline-none focus:border-rho-teal"
                          />
                        </div>
                        {openSwatch?.typeIndex === typeIndex && openSwatch.colorIndex === colorIndex && (
                          <DraggableColorPicker
                            value={variant.swatch || colorForName(variant.name || 'default')}
                            onChange={(hex) => handleVariantSwatchChange(typeIndex, colorIndex, hex)}
                            onClose={() => setOpenSwatch(null)}
                            anchor={swatchAnchor}
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">Photos</label>
                        {variant.photos.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-2">
                            {variant.photos.map((photo, photoIndex) => {
                              const isDragged =
                                draggedPhoto?.typeIndex === typeIndex &&
                                draggedPhoto.colorIndex === colorIndex &&
                                draggedPhoto.photoIndex === photoIndex;
                              const isOver =
                                dragOverPhoto?.typeIndex === typeIndex &&
                                dragOverPhoto.colorIndex === colorIndex &&
                                dragOverPhoto.photoIndex === photoIndex;
                              return (
                                <div
                                  key={photoIndex}
                                  draggable
                                  onDragStart={() => setDraggedPhoto({ typeIndex, colorIndex, photoIndex })}
                                  onDragEnter={() =>
                                    draggedPhoto?.typeIndex === typeIndex &&
                                    draggedPhoto.colorIndex === colorIndex &&
                                    setDragOverPhoto({ typeIndex, colorIndex, photoIndex })
                                  }
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (
                                      draggedPhoto &&
                                      draggedPhoto.typeIndex === typeIndex &&
                                      draggedPhoto.colorIndex === colorIndex
                                    ) {
                                      handleReorderPhoto(typeIndex, colorIndex, draggedPhoto.photoIndex, photoIndex);
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
                                    onClick={() => handleRemovePhoto(typeIndex, colorIndex, photoIndex)}
                                    aria-label="Remove photo"
                                    className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center bg-bm-bg border border-bm-border text-bm-muted hover:text-rho-rose hover:border-rho-rose text-xs leading-none"
                                  >
                                    ×
                                  </button>
                                  {photoIndex === 0 && (
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
                            handleAddPhotos(typeIndex, colorIndex, e.target.files);
                            e.target.value = '';
                          }}
                          className="w-full text-xs text-bm-muted file:mr-2 file:py-2 file:px-3 file:border file:border-bm-border file:bg-bm-card file:text-[11px] file:uppercase"
                        />
                        <p className="text-[11px] text-bm-muted mt-1">
                          Add as many as you'd like. Drag to reorder — the first is used as the thumbnail.
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddColor(typeIndex)}
                    className="w-full border border-dashed border-bm-border text-bm-muted py-2 text-xs uppercase tracking-wide hover:border-rho-teal hover:text-rho-teal"
                  >
                    + Add Color
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddType}
              className="w-full border border-dashed border-bm-border text-bm-muted py-3 text-xs uppercase tracking-wide hover:border-rho-teal hover:text-rho-teal"
            >
              + Add Garment Type
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-rho-teal text-white py-3 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Design'}
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
