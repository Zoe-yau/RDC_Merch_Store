import { supabase } from './supabaseClient';
import type { ColorVariant, Member, Order, OrderItem, Product, SiteSettings } from '../data/mockData';

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
interface ColorVariantRow {
  name: string;
  front: string;
  back: string;
  detail?: string;
  swatch?: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  category: Product['category'];
  description: string;
  sizes: string[];
  color_variants: ColorVariantRow[];
  in_stock: boolean;
  sort_order: number;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    description: row.description,
    sizes: row.sizes,
    colorVariants: row.color_variants.map((v) => ({ ...v, detail: v.detail ?? '' })),
    inStock: row.in_stock,
    sortOrder: row.sort_order,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

// Bulk-updates sort_order to match the given id order (index 0 shows first).
export async function reorderProducts(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from('products').update({ sort_order: i }).eq('id', id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// One File per color variant slot, aligned by index with the colorVariants
// array passed alongside it. Undefined means "keep the existing image" (edit)
// or "no image yet" (new product).
export type VariantFiles = Array<{ front?: File; back?: File; detail?: File }>;

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
      const detail = files.detail ? await uploadProductImage(files.detail) : variant.detail;
      return { name: variant.name, front, back, detail, swatch: variant.swatch || undefined };
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
    sort_order: productData.sortOrder,
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
      sort_order: productData.sortOrder,
    })
    .eq('id', productId);
  if (error) throw error;
}

export async function removeProduct(productId: string): Promise<void> {
  const { data, error } = await supabase.from('products').delete().eq('id', productId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Product was not deleted — it may no longer exist or you may lack permission.');
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
    const { error } = await supabase.functions.invoke('send-order-receipt', {
      body: {
        buyerName: orderData.buyerName,
        email: orderData.email,
        items,
        total: orderData.total.toFixed(2),
        orderId,
      },
    });
    if (error) throw error;
  } catch (err) {
    console.error('Failed to send order receipt email:', err);
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function removeOrder(orderId: string): Promise<void> {
  const { data, error } = await supabase.from('orders').delete().eq('id', orderId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Order was not deleted — it may no longer exist or you may lack permission.');
}

// payment-proofs is a private bucket — admins view proofs via a short-lived
// signed URL rather than a public link.
export async function getPaymentProofSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

// ============================================================================
// Site settings (maintenance mode, sale banner, info page — all admin-editable)
// ============================================================================
interface SiteSettingsRow {
  id: string;
  maintenance_mode: boolean;
  banner_enabled: boolean;
  banner_text: string;
  info_title: string;
  info_deadline: string;
  info_venmo: string;
  info_shipping: string;
  info_goal: string;
  info_chair_name: string;
  info_chair_phone: string;
  info_chair_email: string;
  info_chair_email_2: string;
}

function rowToSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    maintenanceMode: row.maintenance_mode,
    bannerEnabled: row.banner_enabled,
    bannerText: row.banner_text,
    infoTitle: row.info_title,
    infoDeadline: row.info_deadline,
    infoVenmo: row.info_venmo,
    infoShipping: row.info_shipping,
    infoGoal: row.info_goal,
    infoChairName: row.info_chair_name,
    infoChairPhone: row.info_chair_phone,
    infoChairEmail: row.info_chair_email,
    infoChairEmail2: row.info_chair_email_2,
  };
}

const defaultSiteSettingsRow: SiteSettingsRow = {
  id: '',
  maintenance_mode: false,
  banner_enabled: false,
  banner_text: '',
  info_title: 'Fundraiser Info',
  info_deadline: '',
  info_venmo: '',
  info_shipping: 'Orders will be shipped within 2-4 weeks. Items are made to order.',
  info_goal: '',
  info_chair_name: '',
  info_chair_phone: '',
  info_chair_email: '',
  info_chair_email_2: '',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return rowToSiteSettings((data as SiteSettingsRow | null) ?? defaultSiteSettingsRow);
}

type SiteSettingsPatch = Partial<{
  maintenance_mode: boolean;
  banner_enabled: boolean;
  banner_text: string;
  info_title: string;
  info_deadline: string;
  info_venmo: string;
  info_shipping: string;
  info_goal: string;
  info_chair_name: string;
  info_chair_phone: string;
  info_chair_email: string;
  info_chair_email_2: string;
}>;

export async function updateSiteSettings(patch: SiteSettingsPatch): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error('site_settings row is missing — re-run supabase/schema.sql');

  const { error } = await supabase
    .from('site_settings')
    .update(patch)
    .eq('id', (existing as { id: string }).id);
  if (error) throw error;
}
