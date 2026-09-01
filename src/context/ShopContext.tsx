import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as api from '../lib/api';
import type { NewOrderData, VariantFiles } from '../lib/api';
import type { Product, Order, Member, SiteSettings } from '../data/mockData';

export interface CartItem {
  product: Product;
  garmentType: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

interface ShopContextType {
  products: Product[];
  orders: Order[];
  lastOrder: Order | null;
  cart: CartItem[];
  currentUser: Member | null;
  isAdminLoggedIn: boolean;
  isMaintenanceMode: boolean;
  siteSettings: SiteSettings;
  productsLoading: boolean;
  addToCart: (product: Product, garmentType: string, size: string, color: string, quantity: number) => void;
  removeFromCart: (productId: string, garmentType: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, garmentType: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  checkMember: (firstName: string, lastName: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleMaintenanceMode: () => Promise<void>;
  updateBanner: (enabled: boolean, text: string) => Promise<void>;
  updateInfoPage: (info: Omit<SiteSettings, 'maintenanceMode' | 'bannerEnabled' | 'bannerText'>) => Promise<void>;
  submitOrder: (order: NewOrderData, paymentProofFile: File) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  removeOrder: (orderId: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'sortOrder'>, variantFiles: VariantFiles) => Promise<void>;
  updateProduct: (productId: string, product: Omit<Product, 'id'>, variantFiles: VariantFiles) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  reorderProducts: (orderedIds: string[]) => Promise<void>;
  getPaymentProofSignedUrl: (path: string) => Promise<string>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    maintenanceMode: false,
    bannerEnabled: false,
    bannerText: '',
    infoTitle: 'Fundraiser Info',
    infoDeadline: '',
    infoVenmo: '',
    infoShipping: '',
    infoGoal: '',
    infoChairName: '',
    infoChairPhone: '',
    infoChairEmail: '',
    infoChairEmail2: '',
  });

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setProductsLoading(false));

    api.getSiteSettings().then(setSiteSettings).catch((err) => console.error('Failed to load site settings', err));

    api.getAdminSession().then((session) => setIsAdminLoggedIn(Boolean(session)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    api
      .getOrders()
      .then(setOrders)
      .catch((err) => console.error('Failed to load orders', err));
  }, [isAdminLoggedIn]);

  const addToCart = (product: Product, garmentType: string, size: string, color: string, quantity: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.garmentType === garmentType &&
          item.size === size &&
          item.color === color
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      const unitPrice = product.garmentTypes.find((t) => t.type === garmentType)?.price ?? 0;
      return [...prev, { product, garmentType, size, color, quantity, unitPrice }];
    });
  };

  const removeFromCart = (productId: string, garmentType: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.garmentType === garmentType && item.size === size && item.color === color)
      )
    );
  };

  const updateCartQuantity = (productId: string, garmentType: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, garmentType, size, color);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.garmentType === garmentType && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const checkMember = async (firstName: string, lastName: string): Promise<boolean> => {
    const isMatch = await api.checkMember(firstName, lastName);
    if (isMatch) setCurrentUser(api.memberFromName(firstName.trim(), lastName.trim()));
    return isMatch;
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    await api.adminSignIn(email, password);
    setCurrentUser({ id: 'admin', firstName: 'Admin', lastName: 'User' });
    return true;
  };

  const logout = async () => {
    await api.adminSignOut();
    setCurrentUser(null);
  };

  const toggleMaintenanceMode = async () => {
    const next = !siteSettings.maintenanceMode;
    await api.updateSiteSettings({ maintenance_mode: next });
    setSiteSettings((prev) => ({ ...prev, maintenanceMode: next }));
  };

  const updateBanner = async (enabled: boolean, text: string) => {
    await api.updateSiteSettings({ banner_enabled: enabled, banner_text: text });
    setSiteSettings((prev) => ({ ...prev, bannerEnabled: enabled, bannerText: text }));
  };

  const updateInfoPage = async (info: Omit<SiteSettings, 'maintenanceMode' | 'bannerEnabled' | 'bannerText'>) => {
    await api.updateSiteSettings({
      info_title: info.infoTitle,
      info_deadline: info.infoDeadline,
      info_venmo: info.infoVenmo,
      info_shipping: info.infoShipping,
      info_goal: info.infoGoal,
      info_chair_name: info.infoChairName,
      info_chair_phone: info.infoChairPhone,
      info_chair_email: info.infoChairEmail,
      info_chair_email_2: info.infoChairEmail2,
    });
    setSiteSettings((prev) => ({ ...prev, ...info }));
  };

  const submitOrder = async (orderData: NewOrderData, paymentProofFile: File) => {
    const order = await api.submitOrder(orderData, paymentProofFile);
    setLastOrder(order);
    clearCart();
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await api.updateOrderStatus(orderId, status);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const removeOrder = async (orderId: string) => {
    await api.removeOrder(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'sortOrder'>, variantFiles: VariantFiles) => {
    const sortOrder = products.length ? Math.max(...products.map((p) => p.sortOrder)) + 1 : 0;
    await api.addProduct({ ...productData, sortOrder }, variantFiles);
    setProducts(await api.getProducts());
  };

  const updateProduct = async (productId: string, productData: Omit<Product, 'id'>, variantFiles: VariantFiles) => {
    await api.updateProduct(productId, productData, variantFiles);
    setProducts(await api.getProducts());
  };

  const removeProduct = async (productId: string) => {
    await api.removeProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const reorderProducts = async (orderedIds: string[]) => {
    const byId = new Map(products.map((p) => [p.id, p]));
    setProducts(orderedIds.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })));
    await api.reorderProducts(orderedIds);
  };

  return (
    <ShopContext.Provider
      value={{
        products, orders, lastOrder, cart, currentUser, isAdminLoggedIn,
        isMaintenanceMode: siteSettings.maintenanceMode, siteSettings, productsLoading,
        addToCart, removeFromCart, updateCartQuantity, clearCart, checkMember,
        adminLogin, logout, toggleMaintenanceMode, updateBanner, updateInfoPage,
        submitOrder, updateOrderStatus, removeOrder, addProduct,
        updateProduct, removeProduct, reorderProducts, getPaymentProofSignedUrl: api.getPaymentProofSignedUrl,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
};
