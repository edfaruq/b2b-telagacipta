import { NextResponse } from "next/server";
import { BiteshipApiError } from "@/lib/biteship/client";
import { buildRateItemsFromOrder, fetchShippingRates } from "@/lib/shipping/fetch-rates";
import {
  isLiveBiteshipEnabled,
  isMockShippingEnabled,
} from "@/lib/shipping/shipping-provider";
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
  couriers?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isMockShippingEnabled() && !isLiveBiteshipEnabled()) {
    return NextResponse.json(
      {
        message:
          "Live Biteship is not configured. Set SHIPPING_PROVIDER=mock (default) or BITESHIP_API_KEY with SHIPPING_PROVIDER=biteship.",
      },
      { status: 503 }
    );
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
      couriers: body.couriers,
      items,
    });

    return NextResponse.json({
      rates,
      mock: isMockShippingEnabled(),
      expedition: expedition || null,
      destinationAddress,
      destinationCountry,
    });
  } catch (err) {
    if (err instanceof BiteshipApiError) {
      console.error("[admin/biteship/rates]", err.message, err.details);
      return NextResponse.json({ message: err.message }, { status: err.status >= 400 ? err.status : 502 });
    }
    console.error("[admin/biteship/rates]", err);
    return NextResponse.json({ message: "Could not fetch shipping rates." }, { status: 500 });
  }
}
