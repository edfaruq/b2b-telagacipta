"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GlobalFooter from "@/components/GlobalFooter";

type ProductItem = {
  title: string;
  slug: string;
  description: string;
  origin: string;
  price: string;
  image: string;
  favorite: boolean;
};

const productItems: ProductItem[] = [
  {
    title: "Giant Ginger",
    slug: "jahe-gajah",
    description: "Selected fresh rhizomes for seasoning and herbal beverages.",
    origin: "Central Java",
    price: "Rp 18.600,00",
    image: "/images/products/jahe-gajah.jpg",
    favorite: true,
  },
  {
    title: "Dried Cloves",
    slug: "cengkeh-kering",
    description: "Export-grade cloves with strong aroma for food industry needs.",
    origin: "Maluku",
    price: "Rp 20.000,00",
    image: "/images/products/cengkeh.jpg",
    favorite: true,
  },
  {
    title: "Fresh Turmeric",
    slug: "kunyit-segar",
    description: "Fresh turmeric with vibrant color for culinary and herbal use.",
    origin: "East Java",
    price: "Rp 14.000,00",
    image: "/images/products/kunyit.jpg",
    favorite: false,
  },
  {
    title: "Black Pepper",
    slug: "lada-hitam",
    description: "Premium black peppercorns with a bold and distinctive taste.",
    origin: "Lampung",
    price: "Rp 100.000,00",
    image: "/images/products/lada-hitam.jpg",
    favorite: true,
  },
  {
    title: "Cinnamon",
    slug: "kayu-manis",
    description: "Dried cinnamon sticks with a warm, naturally sweet aroma.",
    origin: "Kerinci",
    price: "Rp 54.000,00",
    image: "/images/products/kayu-manis.jpg",
    favorite: false,
  },
  {
    title: "Dried Nutmeg",
    slug: "pala-kering",
    description: "Selected dried nutmeg for food and beverage ingredients.",
    origin: "Banda",
    price: "Rp 88.000,00",
    image: "/images/products/pala-kering.jpg",
    favorite: true,
  },
  {
    title: "Coffee Beans",
    slug: "biji-kopi",
    description: "Selected coffee beans with a balanced and rich flavor profile.",
    origin: "Toraja",
    price: "Rp 76.000,00",
    image: "/images/products/biji-kopi.jpg",
    favorite: false,
  },
  {
    title: "Cardamom",
    slug: "kapulaga",
    description: "High-quality cardamom for spice blends and beverages.",
    origin: "West Java",
    price: "Rp 112.000,00",
    image: "/images/products/kapulaga.jpg",
    favorite: true,
  },
];

export default function BuyerProductsPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"latest" | "favorite" | "priceHigh" | "priceLow">(
    parseFilter(searchParams.get("filter"))
  );

  useEffect(() => {
    setFilter(parseFilter(searchParams.get("filter")));
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    let items = productItems.filter((item) =>
      [item.title, item.description, item.origin].join(" ").toLowerCase().includes(keyword)
    );
    if (filter === "favorite") {
      items = items.filter((item) => item.favorite);
    }

    if (filter === "priceLow") {
      items = [...items].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    }
    if (filter === "priceHigh") {
      items = [...items].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return items;
  }, [query, filter]);

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
          max-width: 1200px;
          margin: 0 auto;
          padding: 34px 24px 64px;
        }
        .product-title {
          margin: 0 0 6px;
          font-size: 42px;
          line-height: 1.08;
          letter-spacing: -0.7px;
          color: #1f2937;
        }
        .product-subtitle {
          margin: 0 0 22px;
          color: #6b7280;
          font-size: 14px;
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
          gap: 24px 16px;
        }
        .product-card {
          text-decoration: none;
          color: inherit;
          display: block;
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
          color: #b45309;
          font-weight: 700;
        }
        @media (max-width: 1080px) {
          .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 820px) {
          .toolbar {
            grid-template-columns: 1fr;
          }
          .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .product-title { font-size: 34px; }
          .product-name { font-size: 26px; }
          .product-price { font-size: 10px; }
        }
        @media (max-width: 540px) {
          .product-wrap {
            padding: 24px 14px 44px;
          }
          .product-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="product-page">
        <main className="product-wrap">
          <h1 className="product-title">All Products</h1>
          <p className="product-subtitle">
            Discover premium products from our catalog ({filteredProducts.length} products)
          </p>

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
              />
            </label>

            <select
              className="select"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "latest" | "favorite" | "priceHigh" | "priceLow")
              }
              aria-label="Filter products"
            >
              <option value="latest">Latest</option>
              <option value="favorite">Favorite</option>
              <option value="priceHigh">Higher Price</option>
              <option value="priceLow">Lower Price</option>
            </select>

            <select className="select" defaultValue="12" aria-label="Products per page">
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </div>

          <section className="product-grid">
            {filteredProducts.map((item, index) => (
              <Link key={item.slug} className="product-card" href={`/products/${item.slug}`}>
                <div className="product-image-wrap">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="product-image"
                    loading={index === 0 ? "eager" : "lazy"}
                    quality={75}
                    sizes="(max-width: 540px) 100vw, (max-width: 820px) 50vw, (max-width: 1080px) 33vw, 25vw"
                  />
                </div>
                <h2 className="product-name">{item.title}</h2>
                <p className="product-desc">{item.description}</p>
                <p className="product-origin">Origin: {item.origin}</p>
                <p className="product-price">{item.price}</p>
              </Link>
            ))}
          </section>
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
