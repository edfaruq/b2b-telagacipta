export type BiteshipRateItem = {
  name: string;
  description?: string;
  value: number;
  quantity: number;
  weight: number;
  category?: string;
};

export type BiteshipPricingOption = {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  type: string;
  price: number;
  shipping_fee: number;
  duration?: string;
  description?: string;
};

export type BiteshipRatesResponse = {
  success?: boolean;
  pricing?: BiteshipPricingOption[];
  message?: string;
};

export type BiteshipCreateOrderResponse = {
  success?: boolean;
  id?: string;
  message?: string;
  courier?: {
    waybill_id?: string;
    company?: string;
    type?: string;
    link?: string | null;
  };
  status?: string;
};

export type BiteshipTrackingResponse = {
  success?: boolean;
  status?: string;
  message?: string;
  history?: Array<{
    status?: string;
    note?: string;
    updated_at?: string;
  }>;
};
