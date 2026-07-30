import emailjs from '@emailjs/browser';
import { supabase } from './supabaseClient';
import type { ColorVariant, Member, Order, OrderItem, Product } from '../data/mockData';

// ============================================================================
// Members / member login
// ============================================================================
// checkMember is a low-security allowlist check by design, not a password
// system: it confirms the entered name is on the chapter roster and nothing
// more. The actual name match happens server-side inside the `check_member`
// Postgres function (SECURITY DEFINER), since the `members` table itself has
// no public SELECT policy — this keeps the full roster from being queryable
// from the client.
export async function checkMember(firstName: string, lastName: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_member', {
    p_first_name: firstName,
    p_last_name: lastName,
  });
  if (error) throw error;
  return Boolean(data);
}

export function memberFromName(firstName: string, lastName: string): Member {
  return { id: `${firstName}-${lastName}`.toLowerCase(), firstName, lastName };
}

// ============================================================================
// Admin auth (real Supabase Auth — email/password, restricted to pre-created
// fundraising chair accounts; see supabase/SETUP.md)
// ============================================================================
export async function adminSignIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function adminSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getAdminSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ============================================================================
// Products
// ============================================================================
interface ProductRow {
  id: string;
  name: string;
  price: number;
  category: Product['category'];
  description: string;
  sizes: string[];
  color_variants: ColorVariant[];
  in_stock: boolean;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    description: row.description,
    sizes: row.sizes,
    colorVariants: row.color_variants,
    inStock: row.in_stock,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

// One File per color variant slot, aligned by index with the colorVariants
// array passed alongside it. Undefined means "keep the existing image" (edit)
// or "no image yet" (new product).
export type VariantFiles = Array<{ front?: File; back?: File }>;

async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

async function resolveVariants(
  colorVariants: ColorVariant[],
  variantFiles: VariantFiles
): Promise<ColorVariant[]> {
  return Promise.all(
    colorVariants.map(async (variant, i) => {
      const files = variantFiles[i] ?? {};
      const front = files.front ? await uploadProductImage(files.front) : variant.front;
      const back = files.back ? await uploadProductImage(files.back) : variant.back;
      return { name: variant.name, front, back };
    })
  );
}

export async function addProduct(productData: Omit<Product, 'id'>, variantFiles: VariantFiles): Promise<void> {
  const colorVariants = await resolveVariants(productData.colorVariants, variantFiles);
  const { error } = await supabase.from('products').insert({
    name: productData.name,
    price: productData.price,
    category: productData.category,
    description: productData.description,
    sizes: productData.sizes,
    color_variants: colorVariants,
    in_stock: productData.inStock,
  });
  if (error) throw error;
}

export async function updateProduct(
  productId: string,
  productData: Omit<Product, 'id'>,
  variantFiles: VariantFiles
): Promise<void> {
  const colorVariants = await resolveVariants(productData.colorVariants, variantFiles);
  const { error } = await supabase
    .from('products')
    .update({
      name: productData.name,
      price: productData.price,
      category: productData.category,
      description: productData.description,
      sizes: productData.sizes,
      color_variants: colorVariants,
      in_stock: productData.inStock,
    })
    .eq('id', productId);
  if (error) throw error;
}

export async function removeProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

// ============================================================================
// Orders
// ============================================================================
interface OrderRow {
  id: string;
  buyer_name: string;
  referrer: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  payment_proof_path: string;
  status: Order['status'];
  created_at: string;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    referrer: row.referrer,
    email: row.email,
    phone: row.phone,
    items: row.items,
    total: Number(row.total),
    paymentProofPath: row.payment_proof_path,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Admin-only: orders SELECT is restricted to authenticated users via RLS.
export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(rowToOrder);
}

export type NewOrderData = Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentProofPath'>;

// Anyone can insert (checkout is not authenticated), but only admins can read
// orders back, so we build the confirmed Order client-side rather than
// relying on `.select()` after insert.
export async function submitOrder(orderData: NewOrderData, paymentProofFile: File): Promise<Order> {
  const ext = paymentProofFile.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, paymentProofFile);
  if (uploadError) throw uploadError;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const { error } = await supabase.from('orders').insert({
    id,
    buyer_name: orderData.buyerName,
    referrer: orderData.referrer,
    email: orderData.email,
    phone: orderData.phone,
    items: orderData.items,
    total: orderData.total,
    payment_proof_path: path,
    status: 'pending',
    created_at: createdAt,
  });
  if (error) throw error;

  void sendOrderReceiptEmail(orderData, id);

  return { ...orderData, id, createdAt, status: 'pending', paymentProofPath: path };
}

// Best-effort receipt email — a failure here must never undo or block an
// order that already landed in Supabase, so errors are swallowed and logged.
async function sendOrderReceiptEmail(orderData: NewOrderData, orderId: string): Promise<void> {
  const items = orderData.items
    .map((item) => `${item.productName} (${item.size}, ${item.color}) x${item.quantity}`)
    .join('\n');

  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        buyer_name: orderData.buyerName,
        email: orderData.email,
        items,
        total: orderData.total.toFixed(2),
        order_id: orderId,
      },
      { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
    );
  } catch (err) {
    console.error('Failed to send order receipt email:', err);
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function removeOrder(orderId: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}

// payment-proofs is a private bucket — admins view proofs via a short-lived
// signed URL rather than a public link.
export async function getPaymentProofSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

// ============================================================================
// Site settings (maintenance mode)
// ============================================================================
interface SiteSettingsRow {
  id: string;
  maintenance_mode: boolean;
}

export async function getMaintenanceMode(): Promise<boolean> {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return Boolean((data as SiteSettingsRow | null)?.maintenance_mode);
}

export async function setMaintenanceMode(value: boolean): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error('site_settings row is missing — re-run supabase/schema.sql');

  const { error } = await supabase
    .from('site_settings')
    .update({ maintenance_mode: value })
    .eq('id', (existing as { id: string }).id);
  if (error) throw error;
}
