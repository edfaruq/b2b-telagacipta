export type ProductItem = {
  title: string;
  slug: string;
  description: string;
  origin: string;
  seller: string;
  price: string;
  unit: string;
  image: string;
  favorite: boolean;
  stock: number;
};

export const productItems: ProductItem[] = [
  {
    title: "Giant Ginger",
    slug: "jahe-gajah",
    description: "Selected fresh rhizomes for seasoning and herbal beverages.",
    origin: "Central Java",
    seller: "Rempah Nusantara Solo",
    price: "Rp 18.600,00",
    unit: "/kg",
    image: "/images/products/jahe-gajah.jpg",
    favorite: true,
    stock: 90,
  },
  {
    title: "Dried Cloves",
    slug: "cengkeh-kering",
    description: "Export-grade cloves with strong aroma for food industry needs.",
    origin: "Maluku",
    seller: "Rempah Nusantara Solo",
    price: "Rp 20.000,00",
    unit: "/kg",
    image: "/images/products/cengkeh.jpg",
    favorite: true,
    stock: 70,
  },
  {
    title: "Fresh Turmeric",
    slug: "kunyit-segar",
    description: "Fresh turmeric with vibrant color for culinary and herbal use.",
    origin: "East Java",
    seller: "Rempah Nusantara Solo",
    price: "Rp 14.000,00",
    unit: "/kg",
    image: "/images/products/kunyit.jpg",
    favorite: false,
    stock: 120,
  },
  {
    title: "Black Pepper",
    slug: "lada-hitam",
    description: "Premium black peppercorns with a bold and distinctive taste.",
    origin: "Lampung",
    seller: "Rempah Nusantara Solo",
    price: "Rp 100.000,00",
    unit: "/kg",
    image: "/images/products/lada-hitam.jpg",
    favorite: true,
    stock: 35,
  },
  {
    title: "Cinnamon",
    slug: "kayu-manis",
    description: "Dried cinnamon sticks with a warm, naturally sweet aroma.",
    origin: "Kerinci",
    seller: "Rempah Nusantara Solo",
    price: "Rp 54.000,00",
    unit: "/kg",
    image: "/images/products/kayu-manis.jpg",
    favorite: false,
    stock: 42,
  },
  {
    title: "Dried Nutmeg",
    slug: "pala-kering",
    description: "Selected dried nutmeg for food and beverage ingredients.",
    origin: "Banda",
    seller: "Rempah Nusantara Solo",
    price: "Rp 88.000,00",
    unit: "/kg",
    image: "/images/products/pala-kering.jpg",
    favorite: true,
    stock: 58,
  },
  {
    title: "Coffee Beans",
    slug: "biji-kopi",
    description: "Selected coffee beans with a balanced and rich flavor profile.",
    origin: "Toraja",
    seller: "Rempah Nusantara Solo",
    price: "Rp 76.000,00",
    unit: "/kg",
    image: "/images/products/biji-kopi.jpg",
    favorite: false,
    stock: 83,
  },
  {
    title: "Cardamom",
    slug: "kapulaga",
    description: "High-quality cardamom for spice blends and beverages.",
    origin: "West Java",
    seller: "Rempah Nusantara Solo",
    price: "Rp 112.000,00",
    unit: "/kg",
    image: "/images/products/kapulaga.jpg",
    favorite: true,
    stock: 26,
  },
];

export function getProductBySlug(slug: string) {
  return productItems.find((item) => item.slug === slug);
}
