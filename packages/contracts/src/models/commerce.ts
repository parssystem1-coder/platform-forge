export type CustomerStatus = 'guest' | 'active' | 'blocked';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'canceled' | 'refunded';
export type CartStatus = 'active' | 'converted' | 'abandoned';

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  emailVerifiedAt: Date | null;
  phone: string | null;
  displayName: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  priceMinor: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  totalMinor: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderLine {
  id: string;
  tenantId: string;
  orderId: string;
  variantId: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  title: string;
  sku: string;
}

export interface Cart {
  id: string;
  tenantId: string;
  customerId: string | null;
  guestSessionId: string | null;
  status: CartStatus;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
