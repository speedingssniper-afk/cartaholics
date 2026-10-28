export type ProductType = "archive" | "handmade";
export type Condition = "unworn" | "excellent" | "good" | "worn in";
export type Fulfilment = "pickup" | "ship";

export type ProductImage = {
  id: number;
  product_id: number;
  path: string;
  sort: number;
};

export type ProductSize = {
  id: number;
  product_id: number;
  size: string;
  stock: number;
};

export type Product = {
  id: number;
  slug: string;
  title: string;
  short_line: string;
  story: string;
  type: ProductType;
  condition: Condition;
  fabric: string;
  colour: string;
  price_cents: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  sizes: ProductSize[];
};

export type CartItem = {
  productId: number;
  slug: string;
  title: string;
  size: string;
  qty: number;
  priceCents: number;
  image: string;
  type: ProductType;
};

export type Order = {
  id: number;
  created_at: string;
  fulfilment: Fulfilment;
  status: string;
  customer_name: string;
  phone: string;
  email: string;
  street: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  shipping_cents: number;
  subtotal_cents: number;
  total_cents: number;
  paypal_id: string | null;
  rehearsal: number;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  title: string;
  size: string;
  qty: number;
  price_cents: number;
};

export type OrderWithItems = Order & { items: OrderItem[] };

export type ArchiveFilters = {
  size?: string;
  condition?: string;
  type?: string;
  availability?: string;
  price?: string;
};
