import { biteshipRequest } from "@/lib/biteship/client";
import { getBiteshipConfig } from "@/lib/biteship/config";
import {
  extractPostalCodeFromAddress,
  mapExpeditionToBiteshipCourier,
  normalizeIndonesiaPhone,
} from "@/lib/biteship/courier-map";
import { buildRateItemsFromOrder } from "@/lib/biteship/rates";
import type { BiteshipCreateOrderResponse } from "@/lib/biteship/types";

export type CreateBiteshipOrderInput = {
  idInvoice: number;
  invoiceNumber: string;
  expedition: string;
  courierType?: string;
  productName: string;
  quantity: number;
  totalInvoiceIdr: number;
  buyerName: string;
  buyerPhone: string | number;
  buyerEmail: string;
  destinationAddress: string;
  destinationPostalCode?: number | null;
};

export type CreateBiteshipOrderResult = {
  biteshipOrderId: string;
  waybillId: string;
  courierCompany: string;
  courierType: string;
  trackingUrl: string | null;
};

export async function createBiteshipOrder(
  input: CreateBiteshipOrderInput
): Promise<CreateBiteshipOrderResult> {
  const config = getBiteshipConfig();
  const courier = mapExpeditionToBiteshipCourier(input.expedition, input.courierType);

  if (!courier) {
    throw new Error(
      `Courier "${input.expedition}" is not supported for Biteship. Enter a tracking number manually or choose a supported courier (e.g. JNE, SiCepat).`
    );
  }

  const destinationPostal =
    input.destinationPostalCode ??
    extractPostalCodeFromAddress(input.destinationAddress) ??
    config.defaultDestinationPostalCode;

  const items = buildRateItemsFromOrder({
    productName: input.productName,
    quantity: input.quantity,
    valueIdr: input.totalInvoiceIdr,
  });

  const origin = config.origin;
  const destinationPhone = normalizeIndonesiaPhone(input.buyerPhone);

  const data = await biteshipRequest<BiteshipCreateOrderResponse>("/v1/orders", {
    body: {
      shipper_contact_name: origin.contactName,
      shipper_contact_phone: normalizeIndonesiaPhone(origin.contactPhone),
      shipper_contact_email: origin.contactEmail,
      shipper_organization: "PT Telaga Cipta Indonesia",
      origin_contact_name: origin.contactName,
      origin_contact_phone: normalizeIndonesiaPhone(origin.contactPhone),
      origin_contact_email: origin.contactEmail,
      origin_address: origin.address,
      origin_postal_code: origin.postalCode,
      destination_contact_name: input.buyerName.slice(0, 60),
      destination_contact_phone: destinationPhone,
      destination_contact_email: input.buyerEmail.slice(0, 50),
      destination_address: input.destinationAddress.slice(0, 500),
      destination_postal_code: destinationPostal,
      courier_company: courier.company,
      courier_type: courier.type,
      delivery_type: "now",
      reference_id: `inv-${input.idInvoice}`,
      order_note: `Invoice ${input.invoiceNumber}`,
      metadata: {
        invoice_id: input.idInvoice,
        invoice_number: input.invoiceNumber,
      },
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        category: item.category ?? "others",
        value: item.value,
        quantity: item.quantity,
        weight: item.weight,
        height: 10,
        length: 10,
        width: 10,
      })),
    },
  });

  const waybillId = data.courier?.waybill_id?.trim();
  const orderId = data.id?.trim();

  if (!orderId || !waybillId) {
    throw new Error(
      data.message ??
        "Biteship did not return an order id or waybill. Try again or enter tracking manually."
    );
  }

  return {
    biteshipOrderId: orderId,
    waybillId,
    courierCompany: data.courier?.company ?? courier.company,
    courierType: data.courier?.type ?? courier.type,
    trackingUrl: data.courier?.link ?? null,
  };
}
