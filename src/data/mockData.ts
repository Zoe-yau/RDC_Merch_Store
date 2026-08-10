export interface ColorVariant {
  name: string;
  photos: string[]; // public Supabase Storage URLs, in display order; first photo is the default/thumbnail
  swatch?: string; // hex code for the shop's color swatch; falls back to a name-derived color when unset
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Tops' | 'Tanks' | 'Outerwear' | 'Accessories' | 'Bottoms';
  description: string;
  sizes: string[];
  colorVariants: ColorVariant[];
  inStock: boolean;
  sortOrder: number; // lower shows first on the shop page; admin-controlled
}

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  buyerName: string;
  referrer: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  paymentProofPath: string; // path within the private "payment-proofs" storage bucket
  status: 'pending' | 'confirmed' | 'fulfilled';
  createdAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SiteSettings {
  maintenanceMode: boolean;
  bannerEnabled: boolean;
  bannerText: string;
  infoTitle: string;
  infoDeadline: string;
  infoVenmo: string;
  infoShipping: string;
  infoGoal: string;
  infoChairName: string;
  infoChairPhone: string;
  infoChairEmail: string;
  infoChairEmail2: string;
}
