export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  quantity: number;
  maxStock?: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  mobile_number: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  location: string;
  geo_latitude?: number | null;
  geo_longitude?: number | null;
  order_notes?: string;
}

export interface OrderLineItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type CheckoutStep = 'details' | 'review';
