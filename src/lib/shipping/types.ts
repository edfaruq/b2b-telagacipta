export type NormalizedRate = {
  company: string;
  courierName: string;
  serviceName: string;
  serviceType: string;
  price: number;
  shippingFee: number;
  duration: string;
  description: string;
};

export type TrackingResult = {
  status: string;
  message: string;
  history: Array<{ status: string; note: string; updatedAt: string }>;
  estimatedArrival?: string | null;
};

export type CreateMockShipmentResult = {
  waybillId: string;
  courierCompany: string;
  courierType: string;
};

export type RateItem = {
  name: string;
  description?: string;
  value: number;
  quantity: number;
  weight: number;
  category?: string;
};
