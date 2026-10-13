import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useShop } from '../context/ShopContext';
import type { Order, Product } from '../data/mockData';

const TABS = ['Orders', 'Products', 'Settings'] as const;
type Tab = (typeof TABS)[number];

export const AdminDashboard: React.FC = () => {
  const {
    orders, products, updateOrderStatus, removeOrder, updateProduct, removeProduct, reorderProducts,
    isMaintenanceMode, toggleMaintenanceMode, siteSettings, updateBanner, updateInfoPage, getPaymentProofSignedUrl,
  } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: Tab } | null)?.tab;
  const [tab, setTab] = useState<Tab>(initialTab && TABS.includes(initialTab) ? initialTab : 'Orders');
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(null);
  const [dragOverProductIndex, setDragOverProductIndex] = useState<number | null>(null);

  const [bannerEnabled, setBannerEnabled] = useState(siteSettings.bannerEnabled);
  const [bannerText, setBannerText] = useState(siteSettings.bannerText);
  const [savingBanner, setSavingBanner] = useState(false);
  const [infoTitle, setInfoTitle] = useState(siteSettings.infoTitle);
  const [infoDeadline, setInfoDeadline] = useState(siteSettings.infoDeadline);
  const [infoVenmo, setInfoVenmo] = useState(siteSettings.infoVenmo);
  const [infoShipping, setInfoShipping] = useState(siteSettings.infoShipping);
  const [infoGoal, setInfoGoal] = useState(siteSettings.infoGoal);
  const [infoChairName, setInfoChairName] = useState(siteSettings.infoChairName);
  const [infoChairPhone, setInfoChairPhone] = useState(siteSettings.infoChairPhone);
  const [infoChairEmail, setInfoChairEmail] = useState(siteSettings.infoChairEmail);
  const [infoChairEmail2, setInfoChairEmail2] = useState(siteSettings.infoChairEmail2);
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    setBannerEnabled(siteSettings.bannerEnabled);
    setBannerText(siteSettings.bannerText);
    setInfoTitle(siteSettings.infoTitle);
    setInfoDeadline(siteSettings.infoDeadline);
    setInfoVenmo(siteSettings.infoVenmo);
    setInfoShipping(siteSettings.infoShipping);
    setInfoGoal(siteSettings.infoGoal);
    setInfoChairName(siteSettings.infoChairName);
    setInfoChairPhone(siteSettings.infoChairPhone);
    setInfoChairEmail(siteSettings.infoChairEmail);
    setInfoChairEmail2(siteSettings.infoChairEmail2);
  }, [siteSettings]);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    try {
      await updateBanner(bannerEnabled, bannerText);
    } catch (err) {
      console.error('Failed to update banner', err);
      window.alert('Could not update banner: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await updateInfoPage({
        infoTitle,
        infoDeadline,
        infoVenmo,
        infoShipping,
        infoGoal,
        infoChairName,
        infoChairPhone,
        infoChairEmail,
        infoChairEmail2,
      });
    } catch (err) {
      console.error('Failed to update info page', err);
      window.alert('Could not update info page: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleToggleAvailability = (product: Product) => {
    const isAvailable = product.garmentTypes.some((t) => t.inStock);
    updateProduct(
      product.id,
      {
        name: product.name,
        description: product.description,
        garmentTypes: product.garmentTypes.map((t) => ({ ...t, inStock: !isAvailable })),
        sortOrder: product.sortOrder,
      },
      product.garmentTypes.map((t) => t.colorVariants.map((v) => v.photos.map(() => undefined)))
    ).catch((err) => {
      console.error('Failed to update product availability', err);
      window.alert('Could not update availability: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleProductDrop = (targetIndex: number) => {
    setDragOverProductIndex(null);
    if (draggedProductIndex === null || draggedProductIndex === targetIndex) {
      setDraggedProductIndex(null);
      return;
    }
    const ids = products.map((p) => p.id);
    const [movedId] = ids.splice(draggedProductIndex, 1);
    ids.splice(targetIndex, 0, movedId);
    setDraggedProductIndex(null);
    reorderProducts(ids).catch((err) => {
      console.error('Failed to reorder products', err);
      window.alert('Could not reorder products: ' + (err instanceof Error ? err.message : String(err)));
    });
  };

  const handleRemoveClick = (productId: string) => {
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
                  <th className="py-2 pr-4"></th>
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Referrer</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Proof</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="border-b border-bm-border cursor-pointer hover:bg-bm-card/50"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="py-3 pr-2 pl-1 text-bm-muted w-4">
                          <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            ▸
                          </span>
                        </td>
                        <td className="py-3 pr-4">{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3 pr-4">{order.buyerName}</td>
                        <td className="py-3 pr-4">{order.email}</td>
                        <td className="py-3 pr-4">{order.phone}</td>
                        <td className="py-3 pr-4">{order.referrer}</td>
                        <td className="py-3 pr-4">${order.total.toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProof(order);
                            }}
                            className="text-rho-teal underline"
                          >
                            View
                          </button>
                        </td>
                        <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOrderClick(order.id);
                            }}
                            className="text-[11px] uppercase tracking-wide text-rho-rose hover:text-rho-rose/70"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-bm-border bg-bm-card/30">
                          <td></td>
                          <td colSpan={8} className="py-3 pr-4">
                            {order.items.length === 0 ? (
                              <p className="text-bm-muted text-xs">No items on this order.</p>
                            ) : (
                              <table className="text-xs w-full max-w-lg">
                                <thead>
                                  <tr className="text-left text-bm-muted uppercase tracking-wide">
                                    <th className="py-1 pr-4 font-normal">Item</th>
                                    <th className="py-1 pr-4 font-normal">Type</th>
                                    <th className="py-1 pr-4 font-normal">Size</th>
                                    <th className="py-1 pr-4 font-normal">Color</th>
                                    <th className="py-1 pr-4 font-normal">Qty</th>
                                    <th className="py-1 pr-4 font-normal">Unit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, idx) => (
                                    <tr key={`${order.id}-${idx}`}>
                                      <td className="py-1 pr-4">{item.productName}</td>
                                      <td className="py-1 pr-4">{item.garmentType}</td>
                                      <td className="py-1 pr-4">{item.size}</td>
                                      <td className="py-1 pr-4">{item.color}</td>
                                      <td className="py-1 pr-4">{item.quantity}</td>
                                      <td className="py-1 pr-4">${item.unitPrice.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {orders.length === 0 && <p className="text-bm-muted py-10">No orders yet.</p>}
          </div>
        )}

        {tab === 'Products' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wide text-bm-muted">Current Products</h2>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard/products/new')}
                className="text-[11px] uppercase tracking-widest text-white bg-rho-teal px-4 py-2 hover:bg-rho-teal/90 transition-colors"
              >
                + Add Product
              </button>
            </div>
            <div>
              <div className="space-y-3">
                {products.map((p, i) => {
                  const prices = p.garmentTypes.map((t) => t.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceLabel = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}–$${maxPrice.toFixed(2)}`;
                  const totalColors = p.garmentTypes.reduce((n, t) => n + t.colorVariants.length, 0);
                  const isAvailable = p.garmentTypes.some((t) => t.inStock);
                  return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedProductIndex(i)}
                    onDragEnter={() => draggedProductIndex !== null && setDragOverProductIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleProductDrop(i);
                    }}
                    onDragEnd={() => {
                      setDraggedProductIndex(null);
                      setDragOverProductIndex(null);
                    }}
                    className={`flex flex-wrap items-center gap-3 border bg-bm-card p-3 transition-colors ${
                      dragOverProductIndex === i ? 'border-rho-teal' : 'border-bm-border'
                    } ${draggedProductIndex === i ? 'opacity-40' : ''}`}
                  >
                    <div
                      className="hidden sm:block shrink-0 cursor-grab active:cursor-grabbing text-bm-muted hover:text-bm-text leading-none px-1 select-none"
                      aria-hidden="true"
                      title="Drag to reorder"
                    >
                      ⠿
                    </div>
                    <div className="w-12 h-14 shrink-0">
                      <PlaceholderImage src={p.garmentTypes[0]?.colorVariants[0]?.photos[0]} className="aspect-auto h-full" />
                    </div>
                    <div className="flex-1 min-w-[9rem]">
                      <p className="text-sm">{p.name}</p>
                      <p className="text-xs text-bm-muted">
                        {priceLabel} · {p.garmentTypes.length} type{p.garmentTypes.length === 1 ? '' : 's'} · {totalColors} color
                        {totalColors === 1 ? '' : 's'}
                      </p>
                      {!isAvailable && (
                        <p className="text-[10px] uppercase tracking-wide text-rho-rose mt-0.5">Unavailable</p>
                      )}
                    </div>
                    <div className="w-full sm:w-auto flex flex-wrap gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide pl-[3.75rem] sm:pl-0">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        className={isAvailable ? 'text-bm-muted hover:text-bm-text' : 'text-rho-teal hover:text-rho-teal/70'}
                      >
                        {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/dashboard/products/${p.id}`)}
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
                  );
                })}
                {products.length === 0 && <p className="text-bm-muted text-sm">No products yet.</p>}
              </div>
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

        {tab === 'Settings' && (
          <form
            onSubmit={handleSaveBanner}
            className="border border-bm-border bg-bm-card p-6 max-w-md mt-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-bm-text">Sale Announcement Banner</p>
                <p className="text-xs text-bm-muted mt-1">
                  Shows as a strip above the header on every page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBannerEnabled((v) => !v)}
                className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${
                  bannerEnabled ? 'bg-rho-rose' : 'bg-bm-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    bannerEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. 20% off all hoodies this week!"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
            />
            <button
              type="submit"
              disabled={savingBanner}
              className="w-full bg-rho-teal text-white py-2.5 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
            >
              {savingBanner ? 'Saving…' : 'Save Banner'}
            </button>
          </form>
        )}

        {tab === 'Settings' && (
          <form
            onSubmit={handleSaveInfo}
            className="border border-bm-border bg-bm-card p-6 max-w-md mt-6 space-y-3"
          >
            <div>
              <p className="text-sm text-bm-text">Information Page</p>
              <p className="text-xs text-bm-muted mt-1">
                Editable content shown on the public "Info" page (linked in the header).
              </p>
            </div>
            <input
              type="text"
              placeholder="Page title"
              value={infoTitle}
              onChange={(e) => setInfoTitle(e.target.value)}
              className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
            />

            <div>
              <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                Payment &amp; Order Form Deadline
              </label>
              <input
                type="text"
                placeholder="e.g. Friday, March 20"
                value={infoDeadline}
                onChange={(e) => setInfoDeadline(e.target.value)}
                className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                Venmo Account
              </label>
              <input
                type="text"
                placeholder="e.g. @RhoDeltaChi-Fundraising"
                value={infoVenmo}
                onChange={(e) => setInfoVenmo(e.target.value)}
                className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                Shipping Note
              </label>
              <textarea
                placeholder="e.g. Orders will be shipped within 2-4 weeks. Items are made to order."
                value={infoShipping}
                onChange={(e) => setInfoShipping(e.target.value)}
                rows={2}
                className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-bm-muted block mb-1">
                Fundraising Goal
              </label>
              <input
                type="text"
                placeholder="e.g. $500"
                value={infoGoal}
                onChange={(e) => setInfoGoal(e.target.value)}
                className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
              />
            </div>

            <div className="pt-1 border-t border-bm-border">
              <p className="text-xs uppercase tracking-wide text-bm-muted mt-3 mb-2">Fundraising Chair Contact</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={infoChairName}
                  onChange={(e) => setInfoChairName(e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  value={infoChairPhone}
                  onChange={(e) => setInfoChairPhone(e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={infoChairEmail}
                  onChange={(e) => setInfoChairEmail(e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                />
                <input
                  type="email"
                  placeholder="Second email (optional)"
                  value={infoChairEmail2}
                  onChange={(e) => setInfoChairEmail2(e.target.value)}
                  className="w-full border border-bm-border bg-bm-bg px-3 py-2 text-sm focus:outline-none focus:border-rho-teal"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingInfo}
              className="w-full bg-rho-teal text-white py-2.5 text-xs uppercase tracking-widest hover:bg-rho-teal/90 transition-colors disabled:opacity-60"
            >
              {savingInfo ? 'Saving…' : 'Save Info Page'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
