import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import productsData from "../data/products.json";
import cartData from "../data/cart.json";
import ordersData from "../data/orders.json";

export type Product = typeof productsData[number];
export type CartItem = { productId: string; quantity: number };
export type Order = { id: string; items: CartItem[]; total: number; createdAt: string };

interface ShopContextType {
    products: Product[];
    cart: CartItem[];
    orders: Order[];
    addToCart: (productId: string, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    placeOrder: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<Product[]>(productsData);
    const [cart, setCart] = useState<CartItem[]>(cartData);
    const [orders, setOrders] = useState<Order[]>(ordersData);

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

    const placeOrder = () => {
        const total = cart.reduce((sum, item) => {
            const prod = products.find((p) => p.name === item.productId);
            return sum + (prod ? prod.price * item.quantity : 0);
        }, 0);
        const newOrder: Order = {
            id: Date.now().toString(),
            items: cart,
            total,
            createdAt: new Date().toISOString(),
        };
        setOrders((prev) => [...prev, newOrder]);
        clearCart();
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
