import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import productsData from "../data/products.json"; // On ne garde que les produits, jamais le panier ni les commandes côté client

export type Product = typeof productsData[number];
export type CartItem = { productId: string; quantity: number };
export enum OrderStatus {
    Pending = "Pending",
    Processing = "Processing",
    Delivered = "Delivered",
    Cancelled = "Cancelled"
}

export enum PaymentMode {
    CashOnDelivery = "Cash on delivery",
    MobileMoney = "Mobile Money",
    Card = "Card"
}

export type CustomerInfo = {
    name: string;
    phone: string;
    isWhatsapp: boolean;
    deliveryPlace: string;
};

export type Order = {
    id: string;
    items: CartItem[];
    total: number;
    createdAt: string;
    customerInfo: CustomerInfo;
    status: OrderStatus;
    delivery: string;
    payment: PaymentMode;
    date: string;
};

interface ShopContextType {
    products: Product[];
    cart: CartItem[];
    orders: Order[];
    addToCart: (productId: string, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    placeOrder: (order: Order) => Promise<boolean>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const [products, _setProducts] = useState<Product[]>(productsData);
    // Hydrate cart from localStorage only on first load
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem("cart");
            if (stored) return JSON.parse(stored);
        }
        return [];
    });
    const [orders, _setOrders] = useState<Order[]>(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem("orders");
            if (stored) return JSON.parse(stored);
        }
        return [];
    });

    useEffect(() => {
        // Persist cart and orders to JSON files (simulate API)
        window.localStorage.setItem("cart", JSON.stringify(cart));
        window.localStorage.setItem("orders", JSON.stringify(orders));
    }, [cart, orders]);

    const addToCart = (productId: string, quantity = 1) => {
        setCart((prev) => {
            const exists = prev.find((item) => item.productId === productId);
            if (exists) {
                return prev.map((item) =>
                    item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { productId, quantity }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const clearCart = () => setCart([]);

    const placeOrder = async (order: Order): Promise<boolean> => {
        // Attach a unique id and createdAt to the order
        const newOrder: Order = {
            ...order,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder),
            });
            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
            clearCart();
            return true;
        } catch (e) {
            return false;
        }
    };

    return (
        <ShopContext.Provider value={{ products, cart, orders, addToCart, removeFromCart, clearCart, placeOrder }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const ctx = useContext(ShopContext);
    if (!ctx) throw new Error("useShop must be used within a ShopProvider");
    return ctx;
};
