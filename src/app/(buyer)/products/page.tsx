"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import GlobalFooter from "@/components/GlobalFooter";
import { alertFailBanner } from "@/lib/alertFailBanner";

type CatalogItem = {
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
};

export default function BuyerProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"latest" | "favorite" | "priceHigh" | "priceLow">(
    parseFilter(searchParams.get("filter"))
  );
  const [pageSize, setPageSize] = useState(12);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setFilter(parseFilter(searchParams.get("filter")));
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, query, filter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/products");
        const data = (await res.json()) as { products?: CatalogItem[]; message?: string };
        if (!res.ok) {
          if (!cancelled) setLoadError(data.message ?? "Gagal memuat produk.");
          if (!cancelled) setItems([]);
          return;
        }
        if (!cancelled) setItems(data.products ?? []);
      } catch {
        if (!cancelled) {
          setLoadError("Tidak dapat terhubung ke server.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let list = items.filter((item) =>
      [item.title, item.description, item.origin].join(" ").toLowerCase().includes(keyword)
    );
    if (filter === "favorite") {
      list = list.filter((item) => item.favorite);
    }

    if (filter === "priceLow") {
      list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }
    if (filter === "priceHigh") {
      list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return list;
  }, [items, query, filter]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );
  const hasMore = visibleCount < filteredProducts.length;
  const remainingCount = filteredProducts.length - visibleCount;

  const loadMoreProducts = () => {
    setVisibleCount((prev) => Math.min(prev + pageSize, filteredProducts.length));
  };

  const applyFilter = (next: "latest" | "favorite" | "priceHigh" | "priceLow") => {
    setFilter(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "latest") {
      params.delete("filter");
    } else {
      params.set("filter", next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <>
      <style>{`
        .product-page {
          min-height: 100vh;
          background: #f4f6fb;
          color: #1f2937;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .product-wrap {
          max-width: var(--content-max-width);
          width: 100%;
          margin: 0 auto;
          padding: 40px var(--content-gutter) 72px;
          animation: productPageIn 0.45s ease-out both;
        }
        .product-title {
          margin: 0 0 6px;
          font-size: 48px;
          line-height: 1.08;
          letter-spacing: -0.7px;
          color: #1f2937;
        }
        .product-subtitle {
          margin: 0 0 26px;
          color: #6b7280;
          font-size: 15px;
        }
        .toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 10px;
          margin-bottom: 22px;
        }
        .search-box {
          height: 42px;
          border-radius: 12px;
          border: 1px solid #d7dde8;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
        }
        .search-box input {
          border: 0;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #374151;
          background: transparent;
        }
        .select {
          height: 42px;
          min-width: 72px;
          border-radius: 12px;
          border: 1px solid #d7dde8;
          background: #ffffff;
          padding: 0 34px 0 14px;
          font-size: 14px;
          color: #374151;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          text-indent: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px 22px;
        }
        .product-card {
          text-decoration: none;
          color: inherit;
          display: block;
          opacity: 0;
          animation: productCardIn 0.4s ease-out forwards;
        }
        .product-image-wrap {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          overflow: hidden;
          background: #e5e7eb;
          margin-bottom: 14px;
        }
        .product-image {
          object-fit: cover;
        }
        .product-name {
          margin: 0 0 8px;
          font-size: 30px;
          line-height: 1.18;
          letter-spacing: -0.45px;
          color: #1f2937;
          font-weight: 700;
        }
        .product-origin {
          margin: 0 0 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .product-desc {
          margin: 0 0 10px;
          font-size: 13px;
          line-height: 1.52;
          color: #4b5563;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 38px;
        }
        .product-price {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.4px;
          color: #000000;
          font-weight: 700;
        }
        @keyframes productPageIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes productCardIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 1320px) {
          .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1080px) {
          .product-wrap { padding: 36px 32px 64px; }
        }
        @media (max-width: 820px) {
          .toolbar {
            grid-template-columns: 1fr;
          }
          .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .product-title { font-size: 34px; }
          .product-name { font-size: 26px; }
          .product-price { font-size: 18px; }
        }
        @media (max-width: 540px) {
          .product-wrap {
            padding: 24px 14px 44px;
          }
          .product-grid { grid-template-columns: 1fr; }
        }
        .load-more-wrap {
          display: flex;
          justify-content: center;
          margin-top: 36px;
        }
        .load-more-btn {
          border: 1px solid #d0deff;
          background: #ffffff;
          color: #0b47b8;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .load-more-btn:hover {
          background: #f7faff;
          border-color: #0b47b8;
        }
        .load-more-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>

      <div className="product-page">
        <main className="product-wrap">
          <h1 className="product-title">All Products</h1>
          <p className="product-subtitle">
            {loading
              ? "Memuat katalog…"
              : loadError
                ? "Katalog tidak dapat dimuat."
                : filter === "latest"
                  ? `Semua produk diurutkan dari yang paling baru (${filteredProducts.length} produk).`
                  : `Discover premium products from our catalog (${filteredProducts.length} products)`}
          </p>

          {!loading && loadError ? (
            <div
              role="alert"
              style={{
                ...alertFailBanner,
                marginBottom: 16,
                alignItems: "flex-start",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>{loadError}</span>
            </div>
          ) : null}

          <div className="toolbar">
            <label className="search-box" aria-label="Search products">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M11 4a7 7 0 015.55 11.27l3.09 3.09-1.41 1.41-3.09-3.09A7 7 0 1111 4z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                disabled={loading}
              />
            </label>

            <select
              className="select"
              value={filter}
              onChange={(event) =>
                applyFilter(
                  event.target.value as "latest" | "favorite" | "priceHigh" | "priceLow"
                )
              }
              aria-label="Filter products"
              disabled={loading}
            >
              <option value="latest">Latest</option>
              <option value="favorite">Favorite</option>
              <option value="priceHigh">Higher Price</option>
              <option value="priceLow">Lower Price</option>
            </select>

            <select
              className="select"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              aria-label="Products per page"
              disabled={loading}
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          {!loading && !loadError && filteredProducts.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "15px", padding: "24px 0" }}>
              Belum ada produk di katalog.
            </p>
          ) : null}

          <section className="product-grid">
            {visibleProducts.map((item, index) => (
              <Link
                key={item.slug}
                className="product-card"
                href={`/products/${item.slug}?from=products`}
                style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
              >
                <div className="product-image-wrap">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="product-image"
                    loading={index === 0 ? "eager" : "lazy"}
                    quality={55}
                    sizes="(max-width: 540px) calc(100vw - 28px), (max-width: 820px) 50vw, (max-width: 1080px) 33vw, 24vw"
                  />
                </div>
                <h2 className="product-name">{item.title}</h2>
                <p className="product-desc">{item.description}</p>
                <p className="product-origin">{item.origin}</p>
                <p className="product-price">{item.price}</p>
              </Link>
            ))}
          </section>

          {!loading && !loadError && hasMore ? (
            <div className="load-more-wrap">
              <button
                type="button"
                className="load-more-btn"
                onClick={loadMoreProducts}
              >
                View more products
                {remainingCount > 0 ? ` (${remainingCount} more)` : ""}
              </button>
            </div>
          ) : null}
        </main>
      </div>
      <GlobalFooter />
    </>
  );
}

function parsePrice(input: string) {
  const numeric = input.replace(/[^\d,]/g, "").replace(",", ".");
  return Number.parseFloat(numeric) || 0;
}

function parseFilter(value: string | null): "latest" | "favorite" | "priceHigh" | "priceLow" {
  if (value === "favorite" || value === "priceHigh" || value === "priceLow" || value === "latest") {
    return value;
  }
  return "latest";
}
