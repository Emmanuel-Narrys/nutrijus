import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Utilitaires d'authentification simples (stockage local)
function isAdminAuthenticated() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("nutrijus_admin_token");
}

export default function AdminDashboard() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });

    useEffect(() => {
        // Vérifie l'authentification à l'arrivée sur la page
        if (!isAdminAuthenticated()) {
            router.replace("/login");
        } else {
            setAuthChecked(true);
        }
    }, []);

    useEffect(() => {
        fetch('/api/products').then(r => r.json()).then(data => setStats(s => ({ ...s, products: data.length })));
        // TODO: fetch /api/orders, /api/accounting pour compléter
    }, []);

    if (!authChecked) return null; // Évite le flash de contenu non autorisé

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full flex flex-col items-center border border-[#e6e6e6]">
                <h1 className="text-4xl font-extrabold text-[#357A1A] mb-2 tracking-tight">Nutrijus Admin</h1>
                <p className="text-lg text-gray-700 mb-8 text-center">Bienvenue sur le dashboard administrateur de Nutrijus !</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
                    <div className="bg-[#4A9800]/10 rounded-xl p-6 flex flex-col items-center">
                        <span className="text-2xl font-bold text-[#4A9800]">{stats.products}</span>
                        <span className="text-gray-600 mt-2">Produits</span>
                    </div>
                    <div className="bg-[#FF7A00]/10 rounded-xl p-6 flex flex-col items-center">
                        <span className="text-2xl font-bold text-[#FF7A00]">{stats.orders}</span>
                        <span className="text-gray-600 mt-2">Commandes</span>
                    </div>
                    <div className="bg-[#357A1A]/10 rounded-xl p-6 flex flex-col items-center">
                        <span className="text-2xl font-bold text-[#357A1A]">{stats.revenue} FCFA</span>
                        <span className="text-gray-600 mt-2">Chiffre d'affaires</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                    <a href="/admin/products" className="flex-1 bg-[#4A9800] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#357A1A] transition flex flex-col items-center">
                        <span className="text-lg">Gérer les produits</span>
                    </a>
                    <a href="/admin/orders" className="flex-1 bg-[#FF7A00] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#E53935] transition flex flex-col items-center">
                        <span className="text-lg">Gérer les commandes</span>
                    </a>
                    <a href="/admin/accounting" className="flex-1 bg-[#357A1A] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#4A9800] transition flex flex-col items-center">
                        <span className="text-lg">Voir la comptabilité</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
