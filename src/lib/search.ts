import { Index } from "flexsearch";

export interface SearchProduct {
  id: string;
  title: string;
  sku: string;
  category: string;
  brand: string;
  tags: string[];
  description: string;
}

// Initialize FlexSearch index
const index = new Index({
  preset: "match",
  tokenize: "forward",
  resolution: 9,
  cache: true,
});

export const indexProducts = (products: SearchProduct[]) => {
  products.forEach((product) => {
    // Index multiple fields as a single string for simplicity in basic search
    const content = `${product.title} ${product.sku} ${product.category} ${product.brand} ${product.tags.join(" ")} ${product.description}`;
    index.add(product.id, content);
  });
};

export const searchProducts = (query: string): string[] => {
  if (!query) return [];
  return index.search(query, {
    limit: 10,
    suggest: true,
  }) as string[];
};
