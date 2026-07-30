export interface ColorVariant {
  name: string;
  front: string; // public Supabase Storage URL; empty string means no photo uploaded yet
  back: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Tops' | 'Outerwear' | 'Accessories' | 'Bottoms';
  description: string;
  sizes: string[];
  colorVariants: ColorVariant[];
  inStock: boolean;
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
