"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { RequestQuotationModal } from "@/components/RequestQuotationModal";
import { normalizeQuantityOnBlur, parseQuantityInput } from "@/lib/quantity-input";

type DetailProduct = {
  slug: string;
  title: string;
  description: string;
  origin: string;
  seller: string;
  price: string;
  unit: string;
  image: string;
  favorite: boolean;
  stock: number;
  longDescription: string;
};

type AuthSession = {
  authenticated: boolean;
  role?: "pelanggan" | "admin";
};

export default function BuyerProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const from = searchParams.get("from");
  const backHref = from === "home" ? "/dashboard#view-produk" : "/products";
  const returnPath = `/products/${slug}${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [authHint, setAuthHint] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setProduct(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
        const data = (await res.json()) as { product?: DetailProduct };
        if (cancelled) return;
        if (!res.ok || !data.product) {
          setProduct(null);
          return;
        }
        setProduct(data.product);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setQuantityInput("1");
  }, [product?.slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await res.json()) as AuthSession;
        if (!cancelled) setAuthSession(data);
      } catch {
        if (!cancelled) setAuthSession({ authenticated: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("quotation") !== "1") return;
    if (authSession?.authenticated && authSession.role === "pelanggan") {
      setQuotationOpen(true);
    }
  }, [authSession, searchParams]);

  function redirectToAuth() {
    const sep = returnPath.includes("?") ? "&" : "?";
    const returnTo = `${returnPath}${sep}quotation=1`;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  function handleRequestQuotationClick() {
    if (quantity < 1) return;
    setAuthHint("");
    if (authSession?.authenticated && authSession.role === "admin") {
      setAuthHint("Quotation requests are for buyer accounts. Please sign in as a customer.");
      return;
    }
    if (!authSession?.authenticated || authSession.role !== "pelanggan") {
      redirectToAuth();
      return;
    }
    setQuotationOpen(true);
  }

  const unitPrice = useMemo(
    () => (product ? parsePrice(product.price) : 0),
    [product]
  );
  const totalPrice = useMemo(() => formatRupiah(unitPrice * quantity), [quantity, unitPrice]);
  const longDescriptionParagraphs = useMemo(() => {
    if (!product) return [];
    const longText = product.longDescription?.trim() || buildLongDescription(product);
    return longText.split("\n\n").filter((p) => p.trim().length > 0);
  }, [product]);

  if (!loading && !product) {
    notFound();
    return null;
  }

  if (loading || !product) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - var(--market-nav-height))",
          display: "grid",
          placeItems: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#6b7280",
          background: "#f4f6fb",
        }}
      >
        Memuat produk…
      </div>
    );
  }

  const currentProduct = product;

  function increaseQuantity() {
    setQuantity((current) => {
      const base = current < 1 ? 1 : current;
      const next = Math.min(base + 1, currentProduct.stock);
      setQuantityInput(String(next));
      return next;
    });
  }

  function decreaseQuantity() {
    setQuantity((current) => {
      const base = current < 1 ? 1 : current;
      const next = Math.max(base - 1, 1);
      setQuantityInput(String(next));
      return next;
    });
  }

  function handleQuantityChange(value: string) {
    const next = parseQuantityInput(value, currentProduct.stock);
    if (!next) return;
    setQuantityInput(next.input);
    setQuantity(next.quantity);
  }

  function handleQuantityBlur() {
    const next = normalizeQuantityOnBlur(quantityInput, currentProduct.stock);
    setQuantityInput(next.input);
    setQuantity(next.quantity);
  }

  return (
    <>
      <style>{`
        .detail-shell {
          min-height: calc(100vh - var(--market-nav-height));
          display: flex;
          flex-direction: column;
        }
        .detail-page {
          background: #f4f6fb;
          color: #1f2937;
          font-family: 'Plus Jakarta Sans', sans-serif;
          flex: 1;
        }
        .detail-wrap {
          max-width: var(--content-max-width);
          width: 100%;
          margin: 0 auto;
          padding: 32px var(--content-gutter) 48px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 16px;
          opacity: 0;
          animation: fadeSlideIn 0.35s ease-out forwards;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(420px, 42%);
          gap: 32px;
          align-items: start;
        }
        .preview {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 16px;
          overflow: hidden;
          background: #e5e7eb;
          border: 1px solid #e5e7eb;
          opacity: 0;
          animation: fadeSlideIn 0.45s ease-out 0.08s forwards;
        }
        .preview-image {
          object-fit: cover;
        }
        .media-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .long-desc-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          padding: 22px 24px 24px;
          opacity: 0;
          animation: fadeSlideIn 0.45s ease-out 0.12s forwards;
        }
        .long-desc-title {
          margin: 0 0 12px;
          font-size: 22px;
          line-height: 1.2;
          color: #1f2937;
        }
        .long-desc-text {
          margin: 0 0 10px;
          color: #4b5563;
          line-height: 1.75;
          font-size: 15px;
        }
        .long-desc-text:last-child {
          margin-bottom: 0;
        }
        .meta {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          padding: 28px 26px;
          opacity: 0;
          animation: fadeSlideIn 0.45s ease-out 0.14s forwards;
        }
        .meta h1 {
          margin: 0 0 8px;
          font-size: 52px;
          letter-spacing: -0.6px;
          line-height: 1.05;
          color: #1f2937;
        }
        .price {
          margin: 0;
          color: #000000;
          font-size: 44px;
          line-height: 1.1;
          letter-spacing: -0.6px;
          font-weight: 800;
        }
        .price-decimal {
          font-size: 0.58em;
          letter-spacing: 0;
          vertical-align: baseline;
        }
        .price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 10px;
        }
        .unit {
          color: #6b7280;
          font-size: 20px;
          font-weight: 600;
        }
        .stock-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          background: #0B47B8;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          margin-bottom: 18px;
        }
        .panel {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          padding: 22px 20px 20px;
        }
        .qty-label {
          margin: 0 0 10px;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }
        .qty-control {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .stepper-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #ffffff;
          color: #4b5563;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
        }
        .qty-input {
          width: 56px;
          height: 28px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          text-align: center;
          font-size: 14px;
          color: #374151;
          background: #ffffff;
        }
        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .qty-input[type=number] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        .qty-note {
          margin: 0 0 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .cart-btn {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 999px;
          background: #0B47B8;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .cart-btn:hover {
          background: #1565D8;
        }
        .cart-btn-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 14px 0;
        }
        .total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .total-label {
          margin: 0;
          color: #374151;
          font-weight: 600;
        }
        .total-value {
          margin: 0;
          color: #000000;
          font-size: 38px;
          line-height: 1.1;
          letter-spacing: -0.5px;
          font-weight: 800;
        }
        .description {
          margin: 0 0 10px;
          color: #6b7280;
          line-height: 1.6;
        }
        .detail-shell .global-footer {
          background: #f4f6fb;
          opacity: 0;
          animation: fadeSlideIn 0.35s ease-out 0.2s forwards;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 1100px) {
          .detail-wrap {
            padding: 28px 32px 40px;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 980px) {
          .meta h1 {
            font-size: 36px;
          }
          .total-value {
            font-size: 30px;
          }
        }
      `}</style>

      <div className="detail-shell">
        <div className="detail-page">
          <main className="detail-wrap">
            <Link href={backHref} className="back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 6L9 12L15 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </Link>

            <section className="detail-grid">
              <div className="media-column">
                <div className="preview">
                  <Image
                    src={currentProduct.image}
                    alt={currentProduct.title}
                    fill
                    className="preview-image"
                    priority
                    quality={60}
                    sizes="(max-width: 980px) 100vw, 60vw"
                  />
                </div>
                <article className="long-desc-card">
                  <h2 className="long-desc-title">Product Description</h2>
                  {longDescriptionParagraphs.map((paragraph, idx) => (
                    <p key={idx} className="long-desc-text">
                      {paragraph}
                    </p>
                  ))}
                </article>
              </div>

              <div className="meta">
                <h1>{currentProduct.title}</h1>
                <p className="description">{currentProduct.origin}</p>
                <div className="price-row">
                  <p className="price">{renderPriceWithSmallDecimal(currentProduct.price)}</p>
                  <span className="unit">{currentProduct.unit}</span>
                </div>
                <p className="description">{currentProduct.description}</p>
                <p className="stock-chip">Tersedia ({currentProduct.stock} stok)</p>

                <div className="panel">
                  <p className="qty-label">Jumlah</p>
                  <div className="qty-control">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={decreaseQuantity}
                      aria-label="Kurangi jumlah"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="qty-input"
                      value={quantityInput}
                      onChange={(event) => handleQuantityChange(event.target.value)}
                      onBlur={handleQuantityBlur}
                      aria-label="Jumlah produk"
                      placeholder="1"
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={increaseQuantity}
                      aria-label="Tambah jumlah"
                    >
                      +
                    </button>
                  </div>
                  <p className="qty-note">Maksimal {currentProduct.stock} item</p>
                  {authHint ? (
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#b45309", lineHeight: 1.45 }}>
                      {authHint}
                    </p>
                  ) : null}
                  <button type="button" className="cart-btn" onClick={handleRequestQuotationClick}>
                    <svg className="cart-btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M14 3H8a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V9l-4-6z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 3v6h4M9 13h6M9 17h6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Request Quotation
                  </button>

                  <div className="divider" />
                  <div className="total-row">
                    <p className="total-label">Total:</p>
                    <p className="total-value">{renderPriceWithSmallDecimal(totalPrice)}</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
        <footer className="global-footer">© 2026 PT Telaga Cipta Indonesia</footer>
      </div>

      <RequestQuotationModal
        open={quotationOpen}
        onClose={() => setQuotationOpen(false)}
        productTitle={currentProduct.title}
        productSlug={slug}
        unitLabel={currentProduct.unit}
        maxStock={currentProduct.stock}
        initialQuantity={quantity < 1 ? 1 : quantity}
        unitPriceLabel={currentProduct.price}
        unitPriceAmount={unitPrice}
      />
    </>
  );
}

function parsePrice(input: string) {
  const numeric = input.replace(/[^\d,]/g, "").replace(",", ".");
  return Number.parseFloat(numeric) || 0;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("IDR", "Rp")
    .trim();
}

function renderPriceWithSmallDecimal(value: string) {
  const match = value.match(/^(.*)(,\d{2})$/);
  if (!match) return value;

  return (
    <>
      {match[1]}
      <span className="price-decimal">{match[2]}</span>
    </>
  );
}

function buildLongDescription(product: { title: string; description: string; origin: string; seller: string }) {
  return `${product.description}

Sourced from ${product.origin} and prepared by ${product.seller}, this product is selected with consistent quality standards for B2B trade and export-focused fulfillment.

Suitable for culinary, retail, and processing needs with stable stock availability and trusted handling from origin to delivery.`;
}
