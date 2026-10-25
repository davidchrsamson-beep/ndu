// TEMPORARY sample data so we can build the look before the database exists.
// Replaced by real vendors and products from Supabase in the next step.

export type MarketProduct = {
  id: string;
  name: string;
  priceKobo: number;
  vendorName: string;
  vendorSlug: string;
  location: string;
  verified: boolean;
};

export const categories = [
  { slug: "fashion", name: "Fashion" },
  { slug: "accessories", name: "Accessories" },
  { slug: "beauty", name: "Beauty Products" },
  { slug: "perfumes", name: "Perfumes" },
  { slug: "wigs", name: "Wigs / Extensions" },
  { slug: "bags", name: "Bags" },
  { slug: "phone-accessories", name: "Phone Accessories" },
  { slug: "kids-baby", name: "Kids & Baby" },
  { slug: "home-living", name: "Home & Living" },
];

const kingof = { vendorName: "Kingof combo", vendorSlug: "kingof-combo", location: "Calabar", verified: true };
const mamaGrace = { vendorName: "Mama Grace Couture", vendorSlug: "mama-grace-couture", location: "Calabar, Nigeria", verified: true };

export const sampleProducts: MarketProduct[] = [
  { id: "p1", name: "Satin", priceKobo: 400000, ...kingof },
  { id: "p2", name: "Ankara dress", priceKobo: 500000, ...kingof },
  { id: "p3", name: "Statement Earrings", priceKobo: 550000, ...mamaGrace },
  { id: "p4", name: "Print Maxi Dress", priceKobo: 1800000, ...mamaGrace },
  { id: "p5", name: "Beaded Clutch Bag", priceKobo: 1200000, ...mamaGrace },
  { id: "p6", name: "Casual Crop Top", priceKobo: 850000, ...mamaGrace },
  { id: "p7", name: "Silk Evening Gown", priceKobo: 4500000, ...mamaGrace },
  { id: "p8", name: "Ankara Two-Piece Set", priceKobo: 2500000, ...mamaGrace },
];