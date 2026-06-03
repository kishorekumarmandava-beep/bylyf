import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/product";

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, selectedSize, selectedColor) => {
        const items = get().items;
        const existingItem = items.find(
          (item) =>
            item.id === product.id &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id &&
              item.selectedSize === selectedSize &&
              item.selectedColor === selectedColor
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1, selectedSize, selectedColor }] });
        }
      },
      removeItem: (productId, selectedSize, selectedColor) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
              )
          ),
        });
      },
      updateQuantity: (productId, quantity, selectedSize, selectedColor) => {
        set({
          items: get().items.map((item) =>
            item.id === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
              ? { ...item, quantity }
              : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.sellingPrice * item.quantity,
          0
        );
      },
    }),
    {
      name: "bylyf-cart",
    }
  )
);
