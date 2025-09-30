import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    stripePriceId: string;
    quantity: number;
    image_url?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Omit<CartItem, 'quantity'>) => void;
    removeItem: (productId: string) => void;
    updateItemQuantity: (productId: string, quantity: number) => void; // NOWA FUNKCJA
    clearCart: () => void;
}

export const useCartStore = create(
    persist<CartState>(
        (set) => ({
            items: [],
            addItem: (product) =>
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === product.id);
                    if (existingItem) {
                        const updatedItems = state.items.map((item) =>
                            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                        );
                        return { items: updatedItems };
                    }
                    return { items: [...state.items, { ...product, quantity: 1 }] };
                }),
            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                })),
            updateItemQuantity: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId ? { ...item, quantity: quantity } : item
                    ),
                })),
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage',
        }
    )
);