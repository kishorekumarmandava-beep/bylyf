export type TaxMode = "inclusive" | "exclusive";

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: "physical" | "digital";
  
  // Pricing & Tax
  mrp: number;
  sellingPrice: number;
  gstRate: number; // e.g. 18
  hsnSac: string;
  taxMode: TaxMode;
  
  // Inventory & Logistics
  sku: string;
  stock: number;
  weight: number; // in kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  
  // Origin & Compliance
  countryOfOrigin: string;
  manufacturer: string;
  importer?: string;
  
  // Classification
  category: string;
  subcategory?: string;
  brand: string;
  tags: string[];
  images: string[];
  
  // Features
  luckyDrawEligible: boolean;
  
  // Digital Content (only for type: 'digital')
  digitalFileUrl?: string;
  digitalFileName?: string;
  digitalFileSize?: number;

  // Timestamps
  createdAt: any;
  updatedAt: any;

  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku?: string;
}
