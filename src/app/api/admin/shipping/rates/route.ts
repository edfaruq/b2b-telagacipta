import { NextResponse } from "next/server";
import { buildRateItemsFromOrder, fetchShippingRates } from "@/lib/shipping/fetch-rates";
import { getDbPool } from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";
import {
  loadQuotationRateContext,
  loadShipmentContext,
} from "@/lib/shipping/shipment-context";

type RatesBody = {
  id_permintaan?: number;
  id_pengiriman?: number;
  destination_address?: string;
  destination_country?: string;
  expedition?: string;
  quantity?: number;
  value_idr?: number;
  product_name?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: RatesBody;
  try {
    body = (await request.json()) as RatesBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);

    let destinationAddress = (body.destination_address ?? "").trim();
    let destinationCountry = (body.destination_country ?? "").trim();
    let expedition = (body.expedition ?? "").trim();
    let quantity = Number(body.quantity) || 1;
    let valueIdr = Number(body.value_idr) || 0;
    let productName = (body.product_name ?? "").trim() || "B2B product";

    const idPengiriman = Number(body.id_pengiriman);
    if (Number.isInteger(idPengiriman) && idPengiriman > 0) {
      const ctx = await loadShipmentContext(idPengiriman, pool);
      if (!ctx) {
        return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
      }
      destinationAddress = ctx.alamat_tujuan;
      destinationCountry = ctx.negara || destinationCountry;
      expedition = ctx.ekspedisi || expedition;
      quantity = Number(ctx.jumlah_permintaan) || 1;
      valueIdr = Number(ctx.total_invoice) || 0;
      productName = ctx.nama_produk;
    } else {
      const idPermintaan = Number(body.id_permintaan);
      if (Number.isInteger(idPermintaan) && idPermintaan > 0) {
        const ctx = await loadQuotationRateContext(idPermintaan, pool);
        if (!ctx) {
          return NextResponse.json({ message: "Request not found." }, { status: 404 });
        }
        destinationAddress = ctx.alamat_tujuan;
        destinationCountry = ctx.negara || destinationCountry;
        expedition = ctx.ekspedisi || expedition;
        quantity = Number(ctx.jumlah_permintaan) || 1;
        valueIdr = Math.round(Number(ctx.harga_indikatif) * quantity) || 0;
        productName = ctx.nama_produk;
      }
    }

    if (!destinationAddress) {
      return NextResponse.json(
        { message: "Destination address is required for rate lookup." },
        { status: 400 }
      );
    }

    if (!destinationCountry) {
      destinationCountry = "Indonesia";
    }

    const items = buildRateItemsFromOrder({
      productName,
      quantity,
      valueIdr: valueIdr || 100_000,
    });

    const rates = await fetchShippingRates({
      destinationAddress,
      destinationCountry,
      quantity,
      expedition: expedition || undefined,
      items,
    });

    return NextResponse.json({
      rates,
      mock: true,
      expedition: expedition || null,
      destinationAddress,
      destinationCountry,
    });
  } catch (err) {
    console.error("[admin/shipping/rates]", err);
    return NextResponse.json({ message: "Could not fetch shipping rates." }, { status: 500 });
  }
}
