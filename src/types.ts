export interface Product {
  item_id: string;
  product_url: string;
  title: string;
  discounted_price: string;
  price_min: string;
  price_max: string;
  status: boolean;
}

export interface ProductResponse {
  data: {
    item_id: string;
    product_url: string;
    title: string;
    price_info?: {
      price?: string;
      price_min?: string;
      price_max?: string;
    };
  };
}