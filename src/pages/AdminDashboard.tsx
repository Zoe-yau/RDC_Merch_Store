import React, { useState } from 'react';
import { Header } from '../components/Header';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';
import type { VariantFiles } from '../lib/api';
import type { ColorVariant, Order, Product } from '../data/mockData';
import { colorForName } from '../lib/colorSwatch';
import { DraggableColorPicker } from '../components/DraggableColorPicker';

const TABS = ['Orders', 'Products', 'Settings'] as const;
type Tab = (typeof TABS)[number];

type Step = 'details' | 'photos';

const emptyDetails = {
  name: '',
  price: 0,
  category: 'Tops' as Product['category'],
  description: '',
  sizes: '',
  inStock: true,
};

const emptyVariant = (): ColorVariant => ({ name: '', front: '', back: '', swatch: '' });

export const AdminDashboard: React.FC = () => {
  const {
    orders, products, updateOrderStatus, removeOrder, addProduct, updateProduct, removeProduct,
    isMaintenanceMode, toggleMaintenanceMode, getPaymentProofSignedUrl,
  } = useShop();
  const [tab, setTab] = useState<Tab>('Orders');
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState(emptyDetails);
  const [colorCount, setColorCount] = useState(1);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([emptyVariant()]);
  const [variantFiles, setVariantFiles] = useState<VariantFiles>([{}]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [openSwatchIndex, setOpenSwatchIndex] = useState<number | null>(null);
  const [swatchAnchor, setSwatchAnchor] = useState({ x: 0, y: 0 });

  const resizeVariants = (count: number, current: ColorVariant[]): ColorVariant[] => {
    const next = current.slice(0, count);
    while (next.length < count) next.push(emptyVariant());
    return next;
  };

  const resizeVariantFiles = (count: number, current: VariantFiles): VariantFiles => {
    const next = current.slice(0, count);
    while (next.length < count) next.push({});
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

  const handleVariantPhotoChange = (index: number, slot: 'front' | 'back', file: File | undefined) => {
    if (!file) return;
    setVariantFiles((prev) => prev.map((v, i) => (i === index ? { ...v, [slot]: file } : v)));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setColorVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [slot]: dataUrl } : v)));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setDetails(emptyDetails);
    setColorCount(1);
    setColorVariants([emptyVariant()]);
    setVariantFiles([{}]);
    setStep('details');
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setDetails({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      sizes: product.sizes.join(', '),
      inStock: product.inStock,
    });
    const variants =
      product.colorVariants.length > 0
        ? product.colorVariants.map((v) => ({ ...v, swatch: v.swatch ?? '' }))
        : [emptyVariant()];
    setColorCount(variants.length);
    setColorVariants(variants);
    setVariantFiles(variants.map(() => ({})));
    setStep('details');
  };

  const handleToggleAvailability = (product: Product) => {
    updateProduct(
      product.id,
      {
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        sizes: product.sizes,
        colorVariants: product.colorVariants,
        inStock: !product.inStock,
      },
      product.colorVariants.map(() => ({}))
    ).catch((err) => {
      console.error('Failed to update product availability', err);
      window.alert('Could not update availability: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleRemoveClick = (productId: string) => {
    if (editingId === productId) resetForm();
    removeProduct(productId).catch((err) => {
      console.error('Failed to remove product', err);
      window.alert('Could not remove product: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleRemoveOrderClick = (orderId: string) => {
    if (!window.confirm('Remove this order? This cannot be undone.')) return;
    removeOrder(orderId).catch((err) => {
      console.error('Failed to remove order', err);
      window.alert('Could not remove order: ' + (err instanceof Error ? err.message : String(err)));
    });
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
        await updateProduct(editingId, productData, variantFiles);
      } else {
        await addProduct(productData, variantFiles);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setSaving(false);
    }
  };

  const handleViewProof = async (order: Order) => {
    if (!proofUrls[order.id]) {
      try {
        const url = await getPaymentProofSignedUrl(order.paymentProofPath);
        setProofUrls((prev) => ({ ...prev, [order.id]: url }));
        window.open(url, '_blank', 'noreferrer');
      } catch (err) {
        console.error('Failed to load payment proof', err);
      }
      return;
    }
    window.open(proofUrls[order.id], '_blank', 'noreferrer');
  };

  const statusColor: Record<Order['status'], string> = {
    pending: 'text-rho-rose',
    confirmed: 'text-rho-teal',
    fulfilled: 'text-bm-muted',
  };

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-10 font-sans">
        <h1 className="font-serif text-3xl text-bm-text mb-6">Admin Dashboard</h1>

        <div className="flex gap-6 border-b border-bm-border mb-8 text-xs uppercase tracking-widest">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 border-b-2 ${
                tab === t ? 'border-rho-rose text-bm-text' : 'border-transparent text-bm-muted hover:text-bm-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-bm-muted border-b border-bm-border">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Referrer</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Proof</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-bm-border">
                    <td className="py-3 pr-4">{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 pr-4">{order.buyerName}</td>
                    <td className="py-3 pr-4">{order.phone}</td>
                    <td className="py-3 pr-4">{order.referrer}</td>
                    <td className="py-3 pr-4">${order.total.toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleViewProof(order)}
                        className="text-rho-teal underline"
                      >
                        View
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value as Order['status']).catch((err) =>
                            console.error('Failed to update order status', err)
                          )
                        }
                        className={`border border-bm-border bg-bm-card px-2 py-1 text-xs uppercase ${statusColor[order.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveOrderClick(order.id)}
                        className="text-[11px] uppercase tracking-wide text-rho-rose hover:text-rho-rose/70"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p className="text-bm-muted py-10">No orders yet.</p>}
          </div>
        )}

        {tab === 'Products' && (
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xs uppercase tracking-wide text-bm-muted mb-4">Current Products</h2>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 border border-bm-border bg-bm-card p-3">
                    <div className="w-12 h-14 shrink-0">
                      <PlaceholderImage src={p.colorVariants[0]?.front} className="aspect-auto h-full" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{p.name}</p>
                      <p className="text-xs text-bm-muted">
                        ${p.price.toFixed(2)} · {p.category} · {p.colorVariants.length} color
                        {p.colorVariants.length === 1 ? '' : 's'}
                      </p>
                      {!p.inStock && (
                        <p className="text-[10px] uppercase tracking-wide text-rho-rose mt-0.5">Unavailable</p>
                      )}
                    </div>
                    <div className="flex gap-3 text-[11px] uppercase tracking-wide">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        className={p.inStock ? 'text-bm-muted hover:text-bm-text' : 'text-rho-teal hover:text-rho-teal/70'}
                      >
                        {p.inStock ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => handleEditClick(p)}
                        className="text-rho-teal hover:text-rho-teal/70"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveClick(p.id)}
                        className="text-rho-rose hover:text-rho-rose/70"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-bm-muted text-sm">No products yet.</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase tracking-wide text-bm-muted">
                  {editingId ? 'Edit Product' : 'Add New Product'} · Step {step === 'details' ? '1' : '2'} of 2:{' '}
                  {step === 'details' ? 'Details' : 'Color Photos'}
                </h2>
                {step === 'photos' && (
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-[11px] uppercase tracking-wide text-bm-muted hover:text-bm-text"
                  >
                    ‹ Back
                  </button>
                )}
              </div>

              {step === 'details' ? (
                <form onSubmit={handleNextStep} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={details.name}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                    className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={details.price || ''}
                    onChange={(e) => setDetails({ ...details, price: Number(e.target.value) })}
                    className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                  />
                  <select
                    value={details.category}
                    onChange={(e) => setDetails({ ...details, category: e.target.value as Product['category'] })}
                    className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                  >
                    <option value="Tops">Tops</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                  <textarea
                    placeholder="Description"
                    value={details.description}
                    onChange={(e) => setDetails({ ...details, description: e.target.value })}
                    className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="Sizes (comma separated)"
                    value={details.sizes}
                    onChange={(e) => setDetails({ ...details, sizes: e.target.value })}
                    className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
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
                      className="w-full border border-bm-border bg-bm-card px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                    />
                    <p className="text-[11px] text-bm-muted mt-1">
                      Next you'll name each color and upload a front/back photo for it.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rho-teal text-white py-2.5 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors"
                  >
                    Next: Upload Photos ›
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full border border-bm-border text-bm-text py-2.5 text-xs uppercase tracking-widest hover:border-rho-teal transition-colors"
                    >
                      Cancel
                    </button>
                  )}
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
                        className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
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
                            className="w-9 h-9 border border-bm-border shrink-0 cursor-pointer"
                            aria-label="Choose swatch color"
                          />
                          <input
                            type="text"
                            placeholder="#000000"
                            value={variant.swatch}
                            onChange={(e) => handleVariantSwatchChange(i, e.target.value)}
                            className="flex-1 border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                            Front
                          </label>
                          <div className="w-full mb-2">
                            <PlaceholderImage src={variant.front} label="Front" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleVariantPhotoChange(i, 'front', e.target.files?.[0])}
                            className="w-full text-xs text-bm-muted file:mr-2 file:py-1.5 file:px-3 file:border file:border-bm-border file:bg-bm-bg file:text-[11px] file:uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                            Back
                          </label>
                          <div className="w-full mb-2">
                            <PlaceholderImage src={variant.back} label="Back" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleVariantPhotoChange(i, 'back', e.target.files?.[0])}
                            className="w-full text-xs text-bm-muted file:mr-2 file:py-1.5 file:px-3 file:border file:border-bm-border file:bg-bm-bg file:text-[11px] file:uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-rho-teal text-white py-2.5 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full border border-bm-border text-bm-text py-2.5 text-xs uppercase tracking-widest hover:border-rho-teal transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {tab === 'Settings' && (
          <div className="border border-bm-border bg-bm-card p-6 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-bm-text">Maintenance Mode</p>
                <p className="text-xs text-bm-muted mt-1">
                  Closes the shop to non-admin visitors while you prep the next drop.
                </p>
              </div>
              <button
                onClick={() => toggleMaintenanceMode().catch((err) => console.error('Failed to toggle maintenance mode', err))}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  isMaintenanceMode ? 'bg-rho-rose' : 'bg-bm-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    isMaintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
