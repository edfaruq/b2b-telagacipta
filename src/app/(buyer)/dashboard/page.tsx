"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import GlobalFooter from "@/components/GlobalFooter";
import { HOMEPAGE_LATEST_COUNT } from "@/lib/homepage-latest";

export default function BuyerDashboardPage() {
  type ShowcaseProduct = {
    title: string;
    slug: string;
    price: string;
    origin: string;
    badge: string;
    media: string;
  };

  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ShowcaseProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = (await res.json()) as {
          products?: Array<{
            slug: string;
            title: string;
            origin: string;
            price: string;
            unit: string;
            image: string;
            favorite: boolean;
          }>;
        };
        if (!res.ok || cancelled) return;
        const list = data.products ?? [];
        /* API mengembalikan aktif terurut id_produk DESC — Latest = N terbaru, tanpa flag admin. */
        const latestSlice = list.slice(0, HOMEPAGE_LATEST_COUNT);
        const mapped: ShowcaseProduct[] = latestSlice.map((p) => ({
          title: p.title,
          slug: p.slug,
          price: `${p.price} ${p.unit}`.replace(/\s+/g, " ").trim(),
          origin: p.origin,
          badge: "",
          media: p.image,
        }));
        const favs: ShowcaseProduct[] = list
          .filter((p) => p.favorite)
          .map((p) => ({
            title: p.title,
            slug: p.slug,
            price: `${p.price} ${p.unit}`.replace(/\s+/g, " ").trim(),
            origin: p.origin,
            badge: "",
            media: p.image,
          }));
        setProducts(mapped);
        /* Tanpa fallback: jika tidak ada is_favorite di admin, section Favorite disembunyikan. */
        setFavoriteProducts(favs);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setFavoriteProducts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [activeFavoriteIndex, setActiveFavoriteIndex] = useState(0);
  const [productPhase, setProductPhase] = useState<"idle" | "sliding" | "slidingPrev" | "reset">("idle");
  const [isMobileView, setIsMobileView] = useState(false);
  const [heroParallaxY, setHeroParallaxY] = useState(0);
  const [aboutParallaxY, setAboutParallaxY] = useState(0);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const productsContentRef = useRef<HTMLDivElement | null>(null);
  const favoritesContentRef = useRef<HTMLDivElement | null>(null);
  const aboutSectionRef = useRef<HTMLElement | null>(null);
  const aboutContentRef = useRef<HTMLDivElement | null>(null);
  const officeContentRef = useRef<HTMLDivElement | null>(null);

  const goNextProducts = () => {
    if (products.length === 0) return;
    if (isMobileView) {
      setActiveProductIndex((current) => (current + 1) % products.length);
      return;
    }
    if (productPhase !== "idle") return;
    setProductPhase("sliding");

    window.setTimeout(() => {
      setActiveProductIndex((current) => (current + 1) % products.length);
      setProductPhase("reset");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setProductPhase("idle");
        });
      });
    }, 560);
  };

  const goPrevProducts = () => {
    if (products.length === 0) return;
    if (isMobileView) {
      setActiveProductIndex((current) => (current - 1 + products.length) % products.length);
      return;
    }
    if (productPhase !== "idle") return;
    setProductPhase("slidingPrev");
    window.setTimeout(() => {
      setActiveProductIndex((current) => (current - 1 + products.length) % products.length);
      setProductPhase("reset");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setProductPhase("idle");
        });
      });
    }, 560);
  };

  const goNextFavorites = () => {
    if (favoriteProducts.length === 0) return;
    setActiveFavoriteIndex((current) => (current + 1) % favoriteProducts.length);
  };

  const goPrevFavorites = () => {
    if (favoriteProducts.length === 0) return;
    setActiveFavoriteIndex((current) => (current - 1 + favoriteProducts.length) % favoriteProducts.length);
  };

  useEffect(() => {
    if (products.length === 0) return;
    const intervalId = window.setInterval(() => {
      if (isMobileView || productPhase === "idle") goNextProducts();
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isMobileView, productPhase, products.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");

    const syncViewport = () => {
      setIsMobileView(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const heroTop = heroSectionRef.current?.getBoundingClientRect().top ?? 0;
        const aboutTop = aboutSectionRef.current?.getBoundingClientRect().top ?? 0;

        // Strong, viewport-relative parallax for hero.
        const heroOffset = Math.max(Math.min(-heroTop * 0.32, 260), -260);
        // Keep about parallax subtle to prevent jumpy/cut-off background movement.
        const aboutOffset = Math.max(Math.min(-aboutTop * 0.2, 120), -120);

        setHeroParallaxY(heroOffset);
        setAboutParallaxY(aboutOffset);
        rafId = 0;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const sections = [
      productsContentRef.current,
      favoritesContentRef.current,
      aboutContentRef.current,
      officeContentRef.current,
    ].filter((section): section is HTMLDivElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [favoriteProducts.length]);

  const hasProducts = products.length > 0;
  const n = products.length;
  const ghost: ShowcaseProduct = {
    title: "",
    slug: "",
    price: "",
    origin: "",
    badge: "",
    media: "/images/logo-telagacipta.png",
  };
  const leftProduct = hasProducts ? products[activeProductIndex % n]! : ghost;
  const prevProduct = hasProducts ? products[(activeProductIndex - 1 + n) % n]! : ghost;
  const rightProduct = hasProducts ? products[(activeProductIndex + 1) % n]! : ghost;
  const peekProduct = hasProducts ? products[(activeProductIndex + 2) % n]! : ghost;
  const incomingProduct = hasProducts ? products[(activeProductIndex + 3) % n]! : ghost;
  const activeFavoriteProduct =
    favoriteProducts.length > 0
      ? favoriteProducts[activeFavoriteIndex % favoriteProducts.length]!
      : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f4f6fb;
          overflow-x: hidden;
        }

        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .page {
          min-height: 100vh;
          background: #f4f6fb;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #051C4A;
          position: relative;
        }

        /* Subtle dot grid */
        .page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, #d7dee8 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
        }

        .page-inner {
          position: relative;
          z-index: 1;
          max-width: var(--content-max-width);
          width: 100%;
          margin: 0 auto;
          padding: 0 var(--content-gutter) 0;
          min-height: calc(100vh - var(--market-nav-height));
          display: flex;
          flex-direction: column;
        }
        .reveal-section {
          opacity: 0;
          transform: translateY(18px);
        }
        .reveal-section.is-visible {
          animation: sectionFadeInUp 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .reveal-section.delay-1 { animation-delay: 0.05s; }
        .reveal-section.delay-2 { animation-delay: 0.12s; }
        .reveal-section.delay-3 { animation-delay: 0.18s; }
        .reveal-section.delay-4 { animation-delay: 0.24s; }

        /* ── HERO ── */
        .hero {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 56px;
          min-height: calc(100vh - var(--market-nav-height));
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          overflow: hidden;
          background: #dce9ff;
          padding: 64px 0;
        }
        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url('/images/hero-spice-bg.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
          transform: translate3d(0, var(--hero-parallax-y, 0px), 0) scale(1.12);
          transform-origin: center top;
          will-change: transform;
        }
        .hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1;
        }

        .hero-left {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          padding: 0 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-left .pill,
        .hero-left .hero-title,
        .hero-left .hero-sub,
        .hero-left .hero-cta-row {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-left.is-ready .pill,
        .hero-left.is-ready .hero-title,
        .hero-left.is-ready .hero-sub,
        .hero-left.is-ready .hero-cta-row {
          animation: heroFadeInUp 0.48s ease forwards;
        }
        .hero-left.is-ready .pill { animation-delay: 0s; }
        .hero-left.is-ready .hero-title { animation-delay: 0.08s; }
        .hero-left.is-ready .hero-sub { animation-delay: 0.16s; }
        .hero-left.is-ready .hero-cta-row { animation-delay: 0.24s; }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #D0DEFF;
          background: #fff;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 12.5px;
          color: #6A84B0;
          font-weight: 500;
          margin-bottom: 24px;
          letter-spacing: 0.2px;
        }
        .pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #0B47B8;
          opacity: 0.7;
        }

        .hero-title {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.04;
          letter-spacing: -1px;
          margin-bottom: 22px;
          color: #ffffff;
          text-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
        }
        .hero-title span {
          color: #c8dcff;
        }

        .hero-sub {
          font-size: 18px;
          color: rgba(238, 245, 255, 0.94);
          font-weight: 400;
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 460px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-cta-row {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: #0B47B8;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 14px 26px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(11,71,184,0.32), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.15s, box-shadow 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(11,71,184,0.42); }

        .btn-ghost {
          background: transparent;
          color: #6A84B0;
          border: none;
          padding: 12px 18px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.15s;
        }
        .btn-ghost:hover { color: #0B47B8; }

        /* ── PRODUCTS ── */
        .products-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .products-section {
          padding: 28px 0;
          background: #f4f6fb;
        }
        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #D0DEFF;
          background: #fff;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 11px;
          color: #6A84B0;
          font-weight: 500;
          margin-bottom: 10px;
          letter-spacing: 0.3px;
        }
        .section-title {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #051C4A;
        }

        .btn-outline-pill {
          border: 1.5px solid #D0DEFF;
          background: #fff;
          color: #1A3566;
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-outline-pill:hover { border-color: #8EB0FF; background: #EEF4FF; }

        .products-grid {
          display: flex;
          gap: 0;
          align-items: stretch;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .products-grid-wrap {
          overflow: hidden;
          position: relative;
          background: #f4f6fb;
          border-radius: 12px;
        }
        .favorite-grid-wrap {
          position: relative;
        }
        .favorite-section {
          margin-top: 0;
        }
        .favorite-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .favorite-card {
          position: relative;
          display: block;
          min-height: 280px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #D8E8FF;
          box-shadow: 0 8px 20px rgba(10, 40, 120, 0.12);
          background: #2e507e;
          text-decoration: none;
        }
        .favorite-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.24);
          z-index: 1;
        }
        .favorite-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 14px 16px;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .favorite-title {
          font-size: 28px;
          line-height: 1.14;
          font-weight: 800;
          margin: 0 0 8px;
          text-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .favorite-price {
          font-size: 22px;
          line-height: 1.25;
          font-weight: 700;
          margin: 0;
        }
        .favorite-origin {
          font-size: 13px;
          line-height: 1.35;
          color: rgba(228, 238, 255, 0.9);
          margin: 4px 0 0;
          white-space: nowrap;
        }
        .about-section {
          margin-top: 56px;
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          padding: 64px 0;
          overflow: hidden;
          --about-parallax-y: 0px;
          --about-foreground-y: 0px;
          background: #eaf2ff;
        }
        .about-section::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #eaf2ff;
          z-index: 0;
        }
        .about-section::after {
          content: "";
          position: absolute;
          inset: 0;
          background: transparent;
          z-index: 0;
        }
        .about-inner {
          max-width: none;
          width: 100%;
          margin: 0;
          padding: 0 80px;
          position: relative;
          z-index: 1;
          transform: translate3d(0, var(--about-foreground-y), 0);
          will-change: transform;
        }
        .about-layout {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 20px;
        }
        .about-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(216, 232, 255, 0.95);
          border-radius: 14px;
          padding: 22px 20px;
          backdrop-filter: blur(2px);
        }
        .about-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          border: 1px solid #d0deff;
          background: #fff;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          color: #6a84b0;
          font-weight: 600;
        }
        .about-title {
          font-size: 58px;
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.02;
          color: #1f293b;
          margin: 0 0 4px;
        }
        .about-desc {
          font-size: 17px;
          line-height: 1.78;
          color: #4b5563;
          margin: 0;
          max-width: 100%;
        }
        .about-features {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 16px;
          margin-top: 10px;
        }
        .about-features.compact {
          grid-template-columns: 1fr;
          margin-top: 0;
          gap: 12px;
          height: 100%;
          grid-auto-rows: 1fr;
        }
        .about-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
        }
        .about-feature-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #dbe7ff;
          color: #234c9a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .about-feature-text {
          font-size: 15px;
          line-height: 1.55;
          color: #5f6879;
          margin: 0;
        }
        .about-feature-text strong {
          display: block;
          font-size: 16px;
          color: #2f3645;
          margin-bottom: 2px;
        }
        .about-image-wrap {
          min-height: 340px;
          border-radius: 0;
          border: 0;
          background: transparent;
          backdrop-filter: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .about-feature-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(208, 222, 255, 0.9);
          border-radius: 12px;
          padding: 12px 14px;
          box-shadow: 0 6px 14px rgba(10, 40, 120, 0.08);
          height: 100%;
          display: flex;
          align-items: center;
          transition: background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
        }
        .about-feature-card:hover {
          background: #ffffff;
          border-color: #9dbcf3;
          box-shadow: 0 10px 24px rgba(10, 40, 120, 0.14);
          transform: translateY(-1px);
        }
        .about-feature-card:hover .about-feature-icon {
          background: #c7dbff;
          color: #123c84;
        }
        .office-section {
          margin-top: 0;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          background-image: linear-gradient(rgba(10, 28, 64, 0.48), rgba(10, 28, 64, 0.48)), url('/images/office.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          padding: 52px 0;
        }
        .office-inner {
          max-width: none;
          width: 100%;
          margin: 0;
          padding: 0 80px;
        }
        .office-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 22px;
        }
        .office-heading {
          text-align: center;
        }
        .office-title {
          margin: 0 0 6px;
          font-size: 44px;
          line-height: 1.1;
          color: #f8fbff;
          letter-spacing: -0.8px;
        }
        .office-subtitle {
          margin: 0 auto;
          font-size: 17px;
          color: rgba(238, 246, 255, 0.95);
        }
        .office-pill {
          border: 1px solid rgba(224, 236, 255, 0.8);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.96);
          color: #1d3f76;
          white-space: nowrap;
        }
        .office-layout {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .office-map-wrap {
          position: relative;
          min-height: 420px;
          width: 100%;
          margin: 0;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #c4d8ff;
          box-shadow: 0 14px 34px rgba(9, 47, 122, 0.14);
          background: #dbe8ff;
        }
        .office-map {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .office-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          align-content: start;
          width: 100%;
        }
        .office-item {
          border: 1px solid #c9dcff;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 14px;
          padding: 16px;
        }
        .office-label {
          margin: 0 0 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #7090bf;
        }
        .office-value {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: #1f355d;
        }
        .products-grid-stage {
          position: relative;
        }
        .product-slot {
          min-width: 0;
          overflow: hidden;
          transition: flex-basis 0.56s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .product-slot > .feature-card {
          margin-right: 14px;
        }
        .product-slot.primary {
          flex: 0 0 56%;
        }
        .product-slot.prev {
          flex: 0 0 0%;
        }
        .product-slot.secondary {
          flex: 0 0 42%;
        }
        .product-slot.peek {
          flex: 0 0 20%;
        }
        .product-slot.incoming {
          flex: 0 0 20%;
        }
        .products-grid-stage.is-sliding .product-slot.primary {
          flex-basis: 0%;
        }
        .products-grid-stage.is-sliding .product-slot.secondary {
          flex-basis: 56%;
        }
        .products-grid-stage.is-sliding .product-slot.peek {
          flex-basis: 42%;
        }
        .products-grid-stage.is-sliding .product-slot.incoming {
          flex-basis: 20%;
        }
        .products-grid-stage.is-slidingPrev .product-slot.prev {
          flex-basis: 56%;
        }
        .products-grid-stage.is-slidingPrev .product-slot.primary {
          flex-basis: 42%;
        }
        .products-grid-stage.is-slidingPrev .product-slot.secondary {
          flex-basis: 20%;
        }
        .products-grid-stage.is-slidingPrev .product-slot.peek {
          flex-basis: 0%;
        }
        .products-grid-stage.is-slidingPrev .product-slot.incoming {
          flex-basis: 0%;
        }
        /* Compensate flex-gap jump so slide->reset aligns seamlessly */
        .products-grid-stage.is-sliding {
          transform: translateX(-14px);
        }
        .products-grid-stage.is-reset .product-slot {
          transition: none !important;
        }

        .feature-card {
          position: relative;
          display: block;
          min-height: 360px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #D8E8FF;
          box-shadow: 0 8px 20px rgba(10,40,120,0.12);
          cursor: pointer;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
          background: #2e507e;
          backface-visibility: hidden;
          text-decoration: none;
        }
        .feature-card.secondary {
          min-height: 360px;
        }
        .products-grid-stage.is-sliding .feature-card.primary { transform: translateX(-6px); }
        .products-grid-stage.is-slidingPrev .feature-card.secondary { transform: translateX(6px); }
        .feature-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.24);
          z-index: 1;
        }
        .feature-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .feature-media-image {
          object-fit: cover;
        }
        .feature-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 16px 18px;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .feature-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .feature-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .feature-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(6, 10, 20, 0.56);
          border: 1px solid rgba(255, 255, 255, 0.32);
        }
        .feature-badge {
          font-size: 10px;
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.35);
          white-space: nowrap;
        }
        .feature-body {
          max-width: 92%;
          min-width: 0;
        }
        .feature-title {
          font-size: 44px;
          line-height: 1.16;
          font-weight: 800;
          margin: 0 0 12px;
          padding-bottom: 2px;
          text-shadow: 0 4px 16px rgba(0,0,0,0.35);
          letter-spacing: -0.8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .feature-desc {
          font-size: 30px;
          line-height: 1.3;
          font-weight: 700;
          color: #ffffff;
          margin-top: 2px;
          white-space: nowrap;
        }
        .feature-origin {
          font-size: 16px;
          line-height: 1.4;
          color: rgba(228, 238, 255, 0.9);
          margin-top: 6px;
          white-space: nowrap;
        }
        .feature-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .feature-author {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(233, 241, 255, 0.95);
        }
        .feature-author-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #91b6ff 0%, #4f82d6 100%);
          border: 1px solid rgba(255,255,255,0.55);
        }
        .feature-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.45);
          background: rgba(9, 19, 42, 0.38);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .products-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .slide-circle-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(21, 101, 216, 0.22);
          background: rgba(255, 255, 255, 0.72);
          color: #3569b1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          backdrop-filter: blur(3px);
          transition: all 0.18s ease;
        }
        .slide-circle-btn:hover {
          background: rgba(255, 255, 255, 0.92);
          border-color: rgba(21, 101, 216, 0.4);
          transform: translateY(-50%);
        }
        @keyframes heroFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes sectionFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .feature-next-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
        }
        .feature-next-btn:hover {
          transform: translate(1px, -50%);
        }
        .feature-prev-btn {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
        }
        .feature-prev-btn:hover {
          transform: translate(-1px, -50%);
        }
        .products-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
        }
        .products-nav-btn.prev {
          left: 8px;
        }
        .products-nav-btn.next {
          right: 8px;
        }
        .products-nav-btn:hover {
          transform: translateY(-50%);
        }

        /* ── STATS STRIP ── */
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 48px 0;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #D8E8FF;
          border-radius: 14px;
          padding: 18px 16px;
          transition: box-shadow 0.18s;
        }
        .stat-card:hover { box-shadow: 0 6px 20px rgba(11,71,184,0.08); }
        .stat-label {
          font-size: 12px;
          color: #9CB4D8;
          font-weight: 500;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #0B47B8;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .stat-sub {
          font-size: 11.5px;
          color: #9CB4D8;
          margin-top: 4px;
        }

        @media (max-width: 900px) {
          .hero {
            min-height: calc(100vh - var(--market-nav-height));
            padding: 72px 0 56px;
          }
          .products-grid {
            flex-direction: column;
            gap: 12px;
          }
          .favorite-grid {
            grid-template-columns: 1fr;
          }
          .about-section {
            padding: 36px 0;
            --about-parallax-y: 0px;
            --about-foreground-y: 0px;
          }
          .about-inner {
            padding: 0 16px 0 20px;
          }
          .about-layout {
            grid-template-columns: 1fr;
            gap: 20px;
            align-items: start;
          }
          .about-left {
            padding: 18px 14px;
          }
          .about-left {
            gap: 12px;
          }
          .about-title {
            font-size: 44px;
          }
          .about-desc {
            font-size: 15px;
          }
          .about-image-wrap {
            min-height: 220px;
          }
          .about-features {
            grid-template-columns: 1fr;
          }
          .about-features.compact {
            height: auto;
            grid-auto-rows: auto;
          }
          .office-section {
            margin-top: 0;
            padding: 30px 0;
            background-attachment: scroll;
          }
          .office-inner {
            padding: 0 20px;
          }
          .office-header {
            flex-direction: column;
            align-items: center;
            margin-bottom: 14px;
          }
          .office-title {
            font-size: 30px;
          }
          .office-subtitle {
            font-size: 15px;
          }
          .office-layout {
            gap: 14px;
          }
          .office-map-wrap {
            min-height: 280px;
            width: 100%;
          }
          .office-grid {
            grid-template-columns: 1fr;
          }
          .product-slot.primary,
          .products-grid-stage.is-sliding .product-slot.primary,
          .products-grid-stage.is-slidingPrev .product-slot.primary,
          .products-grid-stage.is-reset .product-slot.primary {
            flex-basis: 100%;
          }
          .product-slot.prev,
          .product-slot.secondary,
          .product-slot.peek,
          .product-slot.incoming,
          .products-grid-stage.is-slidingPrev .product-slot.prev,
          .products-grid-stage.is-slidingPrev .product-slot.secondary,
          .products-grid-stage.is-slidingPrev .product-slot.peek,
          .products-grid-stage.is-slidingPrev .product-slot.incoming,
          .products-grid-stage.is-sliding .product-slot.secondary,
          .products-grid-stage.is-sliding .product-slot.peek,
          .products-grid-stage.is-sliding .product-slot.incoming {
            flex-basis: 0%;
          }
          .product-slot.prev,
          .product-slot.secondary,
          .product-slot.peek,
          .product-slot.incoming {
            display: none;
          }
          .products-grid-stage {
            transform: none !important;
          }
          .stats-strip { grid-template-columns: repeat(2, 1fr); }
          .hero-title { font-size: 44px; }
          .search-input { width: 180px; }
        }
      `}</style>

      <div className="page">
        <div className="page-inner">

          {/* HERO */}
          <section
            ref={heroSectionRef}
            className="hero"
            style={{ "--hero-parallax-y": `${heroParallaxY}px` } as CSSProperties}
          >
            <div className="hero-left is-ready">
              <div className="pill">
                <div className="pill-dot" />
                B2B Marketplace
              </div>
              <h1 className="hero-title">
                Telaga Cipta<br />
                <span>Indonesia</span>
              </h1>
              <p className="hero-sub">
                A provider of the best and finest products from Indonesia for the global market.
              </p>
              <div className="hero-cta-row">
                <Link href="/products?filter=latest" className="btn-primary">
                  Explore Our Products
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

          </section>

          {/* PRODUCTS */}
          <section id="view-produk" className="products-section">
            <div ref={productsContentRef} className="reveal-section delay-2">
            <div className="products-header">
              <div>
                <div className="section-eyebrow">
                  <div className="pill-dot" style={{ width: 5, height: 5 }} />
                  Products
                </div>
                <h2 className="section-title">Latest Products</h2>
              </div>
              <div className="products-actions">
                <Link href="/products?filter=latest" className="btn-outline-pill">
                  View All
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

            {hasProducts ? (
            <div className="products-grid-wrap">
              <button
                className="slide-circle-btn products-nav-btn prev"
                type="button"
                onClick={goPrevProducts}
                aria-label="Previous product"
              >
                ‹
              </button>
              <button
                className="slide-circle-btn products-nav-btn next"
                type="button"
                onClick={goNextProducts}
                aria-label="Next product"
              >
                ›
              </button>
              <div
                className={`products-grid products-grid-stage${
                  productPhase === "sliding"
                    ? " is-sliding"
                    : productPhase === "slidingPrev"
                      ? " is-slidingPrev"
                      : productPhase === "reset"
                        ? " is-reset"
                        : ""
                }`}
              >
                <div className="product-slot prev">
                <article className="feature-card primary">
                  <div className="feature-media">
                    <Image
                      src={prevProduct.media}
                      alt={prevProduct.title}
                      fill
                      className="feature-media-image"
                      quality={45}
                      sizes="(max-width: 900px) 100vw, 34vw"
                    />
                  </div>
                  <div className="feature-content">
                    <div className="feature-top">
                      {prevProduct.badge ? <span className="feature-badge">{prevProduct.badge}</span> : <span />}
                    </div>
                    <div className="feature-body">
                      <h3 className="feature-title">{prevProduct.title}</h3>
                      <p className="feature-desc">{prevProduct.price}</p>
                      <p className="feature-origin">{prevProduct.origin}</p>
                    </div>
                  </div>
                </article>
                </div>

                <div className="product-slot primary">
                <Link href={`/products/${leftProduct.slug}?from=home`} className="feature-card primary">
                  <div className="feature-media">
                    <Image
                      src={leftProduct.media}
                      alt={leftProduct.title}
                      fill
                      loading="eager"
                      className="feature-media-image"
                      quality={50}
                      sizes="(max-width: 900px) 100vw, 48vw"
                    />
                  </div>
                  <div className="feature-content">
                    <div className="feature-top">
                      {leftProduct.badge ? <span className="feature-badge">{leftProduct.badge}</span> : <span />}
                    </div>

                    <div className="feature-body">
                      <h3 className="feature-title">{leftProduct.title}</h3>
                      <p className="feature-desc">{leftProduct.price}</p>
                      <p className="feature-origin">{leftProduct.origin}</p>
                    </div>
                  </div>
                </Link>
                </div>

                <div className="product-slot secondary">
                <Link href={`/products/${rightProduct.slug}?from=home`} className="feature-card secondary">
                  <div className="feature-media">
                    <Image
                      src={rightProduct.media}
                      alt={rightProduct.title}
                      fill
                      className="feature-media-image"
                      quality={45}
                      sizes="(max-width: 900px) 100vw, 38vw"
                    />
                  </div>
                  <div className="feature-content">
                    <div className="feature-top">
                      {rightProduct.badge ? <span className="feature-badge">{rightProduct.badge}</span> : <span />}
                    </div>

                    <div className="feature-body">
                      <h3 className="feature-title">{rightProduct.title}</h3>
                      <p className="feature-desc">{rightProduct.price}</p>
                      <p className="feature-origin">{rightProduct.origin}</p>
                    </div>
                  </div>
                </Link>
                </div>

                <div className="product-slot peek">
                <Link href={`/products/${peekProduct.slug}?from=home`} className="feature-card peek">
                  <div className="feature-media">
                    <Image
                      src={peekProduct.media}
                      alt={peekProduct.title}
                      fill
                      className="feature-media-image"
                      quality={40}
                      sizes="(max-width: 900px) 100vw, 22vw"
                    />
                  </div>
                  <div className="feature-content">
                    <div className="feature-top">
                      {peekProduct.badge ? <span className="feature-badge">{peekProduct.badge}</span> : <span />}
                    </div>

                    <div className="feature-body">
                      <h3 className="feature-title">{peekProduct.title}</h3>
                      <p className="feature-desc">{peekProduct.price}</p>
                      <p className="feature-origin">{peekProduct.origin}</p>
                    </div>
                  </div>
                </Link>
                </div>

                <div className="product-slot incoming">
                <Link href={`/products/${incomingProduct.slug}?from=home`} className="feature-card peek">
                  <div className="feature-media">
                    <Image
                      src={incomingProduct.media}
                      alt={incomingProduct.title}
                      fill
                      className="feature-media-image"
                      quality={40}
                      sizes="(max-width: 900px) 100vw, 22vw"
                    />
                  </div>
                  <div className="feature-content">
                    <div className="feature-top">
                      {incomingProduct.badge ? <span className="feature-badge">{incomingProduct.badge}</span> : <span />}
                    </div>

                    <div className="feature-body">
                      <h3 className="feature-title">{incomingProduct.title}</h3>
                      <p className="feature-desc">{incomingProduct.price}</p>
                      <p className="feature-origin">{incomingProduct.origin}</p>
                    </div>
                  </div>
                </Link>
                </div>
              </div>
            </div>
            ) : (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "15px",
                maxWidth: "560px",
                margin: "0 auto",
                lineHeight: 1.55,
              }}
            >
              Belum ada produk di katalog.
            </div>
            )}
            </div>
          </section>

          {favoriteProducts.length > 0 ? (
          <section className="products-section favorite-section">
            <div ref={favoritesContentRef} className="reveal-section delay-3">
            <div className="products-header">
              <div>
                <div className="section-eyebrow">
                  <div className="pill-dot" style={{ width: 5, height: 5 }} />
                  Curated
                </div>
                <h2 className="section-title">Favorite Products</h2>
              </div>
            </div>

            <div className="favorite-grid-wrap">
              {isMobileView && (
                <>
                  <button
                    className="slide-circle-btn products-nav-btn prev"
                    type="button"
                    onClick={goPrevFavorites}
                    aria-label="Previous favorite product"
                  >
                    ‹
                  </button>
                  <button
                    className="slide-circle-btn products-nav-btn next"
                    type="button"
                    onClick={goNextFavorites}
                    aria-label="Next favorite product"
                  >
                    ›
                  </button>
                </>
              )}
              <div className="favorite-grid">
                {(isMobileView
                  ? activeFavoriteProduct
                    ? [activeFavoriteProduct]
                    : []
                  : favoriteProducts
                ).map((item) => (
                  <Link key={item.slug} href={`/products/${item.slug}?from=home`} className="favorite-card">
                    <div className="feature-media">
                      <Image
                        src={item.media}
                        alt={item.title}
                        fill
                        className="feature-media-image"
                        quality={45}
                        sizes="(max-width: 900px) 100vw, 31vw"
                      />
                    </div>
                    <div className="favorite-content">
                      <h3 className="favorite-title">{item.title}</h3>
                      <p className="favorite-price">{item.price}</p>
                      <p className="favorite-origin">{item.origin}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            </div>
          </section>
          ) : null}

          <section
            ref={aboutSectionRef}
            className="about-section"
            style={{
              "--about-parallax-y": `${aboutParallaxY}px`,
              "--about-foreground-y": `${aboutParallaxY * -0.18}px`,
            } as CSSProperties}
          >
            <div ref={aboutContentRef} className="about-inner reveal-section delay-4">
              <div className="about-layout">
              <div className="about-left">
                <div className="about-eyebrow">
                  <div className="pill-dot" style={{ width: 5, height: 5 }} />
                  About
                </div>
                <h2 className="about-title">
                  PT Telaga Cipta Indonesia
                </h2>
                <p className="about-desc">
                PT Telaga Cipta Indonesia is a company established in 2015 that focuses on the development and trading of products, including in the export-oriented commodities sector. 
                With a commitment to providing professional and reliable services, the company continues to grow as a business partner that bridges market needs with effective and sustainable solutions.
                </p>
                <p className="about-desc">
                Located at Graha Surveyor Indonesia, 15th Floor, Unit 1503, Jl. Jenderal Gatot Subroto Kav. 56, South Jakarta 12950, Jakarta Special Capital Region, Indonesia, 
                PT Telaga Cipta Indonesia strives to build an extensive business network both nationally and internationally.
                </p>
                <p className="about-desc">
                By prioritizing integrity, quality, and innovation, 
                the company is committed to delivering the best value to customers and supporting the growth of the trade industry, 
                particularly in the development of Indonesia’s export markets.
                </p>
              </div>
              <div className="about-image-wrap">
                <div className="about-features compact">
                  <div className="about-feature-card">
                    <div className="about-feature-item">
                      <span className="about-feature-icon">✦</span>
                      <p className="about-feature-text">
                        <strong>Cultural Heritage</strong>
                        Highlighting the historical value of spice routes through handicrafts, cuisine, and unique products.
                      </p>
                    </div>
                  </div>
                  <div className="about-feature-card">
                    <div className="about-feature-item">
                      <span className="about-feature-icon">✦</span>
                      <p className="about-feature-text">
                        <strong>Global Market Reach</strong>
                        Expanding market presence by connecting local products with international demand through strategic distribution networks.
                      </p>
                    </div>
                  </div>
                  <div className="about-feature-card">
                    <div className="about-feature-item">
                      <span className="about-feature-icon">✦</span>
                      <p className="about-feature-text">
                        <strong>Product Excellence</strong>
                        Delivering high-quality products with consistent standards, tailored to meet both domestic and international market expectations.
                      </p>
                    </div>
                  </div>
                  <div className="about-feature-card">
                    <div className="about-feature-item">
                      <span className="about-feature-icon">✦</span>
                      <p className="about-feature-text">
                        <strong>Business Integrity</strong>
                        Upholding transparency and professionalism in every business process to build long-term trust with partners.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>

          <section className="office-section">
            <div ref={officeContentRef} className="office-inner reveal-section delay-4">
              <div className="office-header">
                <div className="office-heading">
                  <h2 className="office-title">Visit Our Office</h2>
                  <p className="office-subtitle">
                    Meet our team and discuss partnership opportunities directly.
                  </p>
                </div>
              </div>
              <div className="office-layout">
                <div className="office-map-wrap">
                  <iframe
                    className="office-map"
                    title="PT Telaga Cipta Indonesia Office Location"
                    src="https://www.google.com/maps?q=Graha%20Surveyor%20Indonesia%2C%20Jl.%20Jenderal%20Gatot%20Subroto%20Kav.%2056%2C%20Jakarta%20Selatan&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </section>

        </div>
        <GlobalFooter />
      </div>
      
    </>
  );
}