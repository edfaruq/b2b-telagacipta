import type { Pool, PoolConnection } from "mysql2/promise";
import { BiteshipApiError } from "@/lib/biteship/client";
import { createBiteshipOrder } from "@/lib/biteship/create-order";
import { mapExpeditionToBiteshipCourier } from "@/lib/biteship/courier-map";
import { createMockShipment } from "@/lib/shipping/mock-shipment";
import { loadShipmentContext } from "@/lib/shipping/shipment-context";
import { canAutoCreateShipment, isMockShippingEnabled } from "@/lib/shipping/shipping-provider";

type Queryable = Pool | PoolConnection;

export type MarkShippedInput = {
  idPengiriman: number;
  idAdmin: number;
  nomorResi?: string;
  useBiteship?: boolean;
  courierType?: string;
};

export type MarkShippedResult = {
  nomorResi: string;
  viaBiteship: boolean;
  biteshipOrderId: string | null;
  courierCompany: string | null;
  message: string;
};

export async function markShipmentAsShipped(
  input: MarkShippedInput,
  db: Queryable
): Promise<MarkShippedResult> {
  const ctx = await loadShipmentContext(input.idPengiriman, db);
  if (!ctx) {
    throw new Error("Shipment not found or invoice is not paid.");
  }
  if (ctx.status_pengiriman !== "diproses") {
    throw new Error("Shipment is not in processing status.");
  }

  const manualResi = (input.nomorResi ?? "").trim();
  const expedition = (ctx.ekspedisi ?? "").trim();

  let nomorResi = manualResi;
  let viaBiteship = false;
  let biteshipOrderId: string | null = null;
  let biteshipCourierCode: string | null = null;
  let biteshipCourierType: string | null = null;

  if (!nomorResi) {
    const shouldAutoShip = input.useBiteship !== false && canAutoCreateShipment();
    if (!shouldAutoShip) {
      throw new Error(
        "Enter a tracking number, or enable mock shipping / configure BITESHIP_API_KEY for auto AWB."
      );
    }
    if (!expedition) {
      throw new Error("Courier is missing on this order. Set expedition on the quotation first.");
    }

    try {
      const created = isMockShippingEnabled()
        ? await createMockShipment({
            idInvoice: ctx.id_invoice,
            invoiceNumber: ctx.nomor_invoice,
            expedition,
            courierType: input.courierType,
          })
        : await createBiteshipOrder({
            idInvoice: ctx.id_invoice,
            invoiceNumber: ctx.nomor_invoice,
            expedition,
            courierType: input.courierType,
            productName: ctx.nama_produk,
            quantity: Number(ctx.jumlah_permintaan) || 1,
            totalInvoiceIdr: Number(ctx.total_invoice) || 0,
            buyerName: ctx.nama,
            buyerPhone: ctx.no_telepon,
            buyerEmail: ctx.email,
            destinationAddress: ctx.alamat_tujuan,
          });

      nomorResi = created.waybillId;
      viaBiteship = true;
      biteshipOrderId = created.biteshipOrderId;
      biteshipCourierCode = created.courierCompany;
      biteshipCourierType = created.courierType;
    } catch (err) {
      if (err instanceof BiteshipApiError) {
        throw new Error(err.message);
      }
      throw err;
    }
  } else if (nomorResi.length > 100) {
    throw new Error("Tracking number must be at most 100 characters.");
  } else if (expedition) {
    const mapped = mapExpeditionToBiteshipCourier(expedition, input.courierType);
    if (mapped) {
      biteshipCourierCode = mapped.company;
      biteshipCourierType = mapped.type;
    }
  }

  const [upd] = await db.query(
    `UPDATE pengiriman
     SET status_pengiriman = 'dikirim',
         nomor_resi = ?,
         tanggal_pengiriman = NOW(),
         id_admin = ?,
         biteship_order_id = COALESCE(?, biteship_order_id),
         biteship_courier_code = COALESCE(?, biteship_courier_code),
         biteship_courier_type = COALESCE(?, biteship_courier_type)
     WHERE id_pengiriman = ?
       AND status_pengiriman = 'diproses'`,
    [
      nomorResi,
      input.idAdmin,
      biteshipOrderId,
      biteshipCourierCode,
      biteshipCourierType,
      input.idPengiriman,
    ]
  );

  if ((upd as { affectedRows: number }).affectedRows === 0) {
    throw new Error("Shipment could not be updated. It may have already been shipped.");
  }

  const message = viaBiteship
    ? isMockShippingEnabled()
      ? `Shipped (mock). AWB: ${nomorResi}`
      : `Shipped via Biteship. AWB: ${nomorResi}`
    : "Marked as shipped. The buyer can track and confirm delivery.";

  return {
    nomorResi,
    viaBiteship,
    biteshipOrderId,
    courierCompany: biteshipCourierCode,
    message,
  };
}
