import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as api from '../lib/api';
import type { NewOrderData, VariantFiles } from '../lib/api';
import type { Product, Order, Member } from '../data/mockData';

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface ShopContextType {
  products: Product[];
  orders: Order[];
  lastOrder: Order | null;
  cart: CartItem[];
  currentUser: Member | null;
  isAdminLoggedIn: boolean;
  isMaintenanceMode: boolean;
  productsLoading: boolean;
  addToCart: (product: Product, size: string, color: string, quantity: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  checkMember: (firstName: string, lastName: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleMaintenanceMode: () => Promise<void>;
  submitOrder: (order: NewOrderData, paymentProofFile: File) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>, variantFiles: VariantFiles) => Promise<void>;
  updateProduct: (productId: string, product: Omit<Product, 'id'>, variantFiles: VariantFiles) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
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
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setProductsLoading(false));

    api.getMaintenanceMode().catch((err) => console.error('Failed to load site settings', err));
    api.getMaintenanceMode().then(setIsMaintenanceMode).catch(() => {});

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

  const addToCart = (product: Product, size: string, color: string, quantity: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && item.color === color
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, size, color, quantity }];
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size && item.color === color)));
  };

  const updateCartQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, size, color);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size && item.color === color ? { ...item, quantity } : item
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
    const next = !isMaintenanceMode;
    await api.setMaintenanceMode(next);
    setIsMaintenanceMode(next);
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

  const addProduct = async (productData: Omit<Product, 'id'>, variantFiles: VariantFiles) => {
    await api.addProduct(productData, variantFiles);
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

  return (
    <ShopContext.Provider
      value={{
        products, orders, lastOrder, cart, currentUser, isAdminLoggedIn, isMaintenanceMode, productsLoading,
        addToCart, removeFromCart, updateCartQuantity, clearCart, checkMember,
        adminLogin, logout, toggleMaintenanceMode, submitOrder, updateOrderStatus, addProduct,
        updateProduct, removeProduct, getPaymentProofSignedUrl: api.getPaymentProofSignedUrl,
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
