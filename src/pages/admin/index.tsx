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
    const [productsCount, setProductsCount] = useState(0);
    const [usersCount, setUsersCount] = useState(0);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Filtres date (par défaut : mois courant)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const defaultStart = `${yyyy}-${mm}-01`;
    const defaultEnd = `${yyyy}-${mm}-${String(new Date(yyyy, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    const [filterStart, setFilterStart] = useState<string>(defaultStart);
    const [filterEnd, setFilterEnd] = useState<string>(defaultEnd);

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/login");
        } else {
            setAuthChecked(true);
        }
    }, []);

    useEffect(() => {
        fetch('/api/products').then(r => r.json()).then(data => setProductsCount(data.length));
        fetch('/api/users').then(r => r.json()).then(data => setUsersCount(data.length));
    }, []);

    useEffect(() => {
        if (!authChecked) return;
        setLoading(true);
        fetch('/api/orders')
            .then(r => r.json())
            .then(setOrders)
            .finally(() => setLoading(false));
    }, [authChecked]);

    // Filtrage par date
    const filteredOrders = orders.filter(order => {
        if (!order.date) return false;
        return order.date >= filterStart && order.date <= filterEnd;
    });

    // Compteurs par statut
    const statusCounts = {
        Pending: 0,
        Processing: 0,
        Delivered: 0,
        Cancelled: 0
    };
    let revenue = 0;
    filteredOrders.forEach(order => {
        const status = (order.status || '').toString().toLowerCase();
        if (status === 'pending') statusCounts.Pending++;
        else if (status === 'processing') statusCounts.Processing++;
        else if (status === 'delivered') statusCounts.Delivered++;
        else if (status === 'cancelled') statusCounts.Cancelled++;
        revenue += Number(order.total) || 0;
    });

    if (!authChecked) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center justify-center p-6 relative">
            {/* Bouton de déconnexion */}
            <button
                onClick={() => {
                    localStorage.removeItem('nutrijus_admin_token');
                    router.replace('/login');
                }}
                className="absolute top-6 right-6 bg-[#E53935] hover:bg-[#FF7A00] text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-colors duration-200 z-10"
            >Se déconnecter</button>
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-4xl w-full flex flex-col items-center border border-[#e6e6e6]">
                <h1 className="text-4xl font-extrabold text-[#357A1A] mb-2 tracking-tight">Nutrijus Admin</h1>
                <p className="text-lg text-gray-700 mb-8 text-center">Bienvenue sur le dashboard administrateur de Nutrijus !</p>
                {/* Filtres date */}
                <form className="flex flex-col md:flex-row gap-4 mb-10 w-full items-center justify-center bg-[#f8fafc] rounded-xl shadow-inner p-4 border border-[#e6e6e6]">
                    <div className="flex flex-col">
                        <label htmlFor="start" className="text-xs font-semibold text-[#357A1A]">Début</label>
                        <input type="date" id="start" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="border-2 border-[#FFD580] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#4A9800] bg-white text-gray-900 font-semibold" />
                    </div>
                    <span className="font-bold text-[#357A1A] text-2xl">—</span>
                    <div className="flex flex-col">
                        <label htmlFor="end" className="text-xs font-semibold text-[#357A1A]">Fin</label>
                        <input type="date" id="end" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="border-2 border-[#FFD580] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#4A9800] bg-white text-gray-900 font-semibold" />
                    </div>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 w-full">
                    <div className="bg-gradient-to-br from-[#eaffed] to-[#c9f7e9] rounded-2xl p-8 flex flex-col items-center shadow-lg group transition-transform hover:scale-105 cursor-pointer">
                        <span className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-[#4A9800]/20">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" stroke="#4A9800" strokeWidth="2" /><path d="M8 14l2-2 4 4" stroke="#4A9800" strokeWidth="2" /></svg>
                        </span>
                        <span className="text-3xl font-extrabold text-[#4A9800] transition-all duration-300 animate-pulse">{productsCount}</span>
                        <span className="text-gray-700 mt-2 font-medium">Produits</span>
                    </div>
                    <div className="bg-gradient-to-br from-[#fff5e6] to-[#ffe0cc] rounded-2xl p-8 flex flex-col items-center shadow-lg group transition-transform hover:scale-105 cursor-pointer">
                        <span className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-[#FF7A00]/20">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="#FF7A00" strokeWidth="2" /></svg>
                        </span>
                        <span className="text-3xl font-extrabold text-[#FF7A00] transition-all duration-300 animate-pulse">{filteredOrders.length}</span>
                        <span className="text-gray-700 mt-2 font-medium">Commandes</span>
                    </div>
                    <div className="bg-gradient-to-br from-[#e6ffe6] to-[#e0ffe0] rounded-2xl p-8 flex flex-col items-center shadow-lg group transition-transform hover:scale-105 cursor-pointer">
                        <span className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-[#357A1A]/20">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 8v8m0 0l3-3m-3 3l-3-3" stroke="#357A1A" strokeWidth="2" /></svg>
                        </span>
                        <span className="text-3xl font-extrabold text-[#357A1A] transition-all duration-300 animate-pulse">{revenue} FCFA</span>
                        <span className="text-gray-700 mt-2 font-medium">Chiffre d'affaires</span>
                    </div>
                    <div className="bg-gradient-to-br from-[#e3f0ff] to-[#d0eaff] rounded-2xl p-8 flex flex-col items-center shadow-lg group transition-transform hover:scale-105 cursor-pointer">
                        <span className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-[#357A1A]/20">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" stroke="#357A1A" strokeWidth="2" /></svg>
                        </span>
                        <span className="text-3xl font-extrabold text-[#357A1A] transition-all duration-300 animate-pulse">{usersCount}</span>
                        <span className="text-gray-700 mt-2 font-medium">Utilisateurs</span>
                    </div>
                </div>
                <div className="flex w-full justify-center mb-10">
                    <div className="bg-gradient-to-br from-[#fffbe6] to-[#fff2cc] rounded-2xl p-8 flex flex-col items-center shadow-lg group transition-transform hover:scale-105 cursor-pointer gap-3 w-full md:w-2/3 lg:w-1/2 text-xl md:text-2xl">
                        <span className="text-2xl md:text-3xl font-extrabold text-[#357A1A] mb-3 flex items-center gap-2">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="10" cy="10" r="8" stroke="#FFD580" strokeWidth="2" /><path d="M8 12l2-2 2 2" stroke="#357A1A" strokeWidth="2" /></svg>
                            États
                        </span>
                        <span className="flex items-center gap-2 text-base md:text-lg text-[#888]">En attente <span className="inline-block w-3 h-3 rounded-full bg-[#E6B800]" /> <b className="ml-1 text-[#E6B800]">{statusCounts.Pending}</b></span>
                        <span className="flex items-center gap-2 text-base md:text-lg text-[#888]">En cours <span className="inline-block w-3 h-3 rounded-full bg-[#2196F3]" /> <b className="ml-1 text-[#2196F3]">{statusCounts.Processing}</b></span>
                        <span className="flex items-center gap-2 text-base md:text-lg text-[#888]">Livrées <span className="inline-block w-3 h-3 rounded-full bg-[#4A9800]" /> <b className="ml-1 text-[#4A9800]">{statusCounts.Delivered}</b></span>
                        <span className="flex items-center gap-2 text-base md:text-lg text-[#888]">Annulées <span className="inline-block w-3 h-3 rounded-full bg-[#E53935]" /> <b className="ml-1 text-[#E53935]">{statusCounts.Cancelled}</b></span>
                    </div>
                </div>
                <hr className="w-full border-t-2 border-[#e6e6e6] mb-8" />
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
                    <a href="/admin/products" className="flex-1 bg-[#4A9800] text-white px-6 py-5 rounded-2xl font-bold hover:bg-[#357A1A] transition-all duration-300 shadow-md text-center text-lg tracking-wide">
                        <span className="inline-flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 2l4 4-4 4-4-4 4-4zm0 8v12" stroke="#fff" strokeWidth="2" /></svg> Gérer les produits</span>
                    </a>
                    <a href="/admin/orders" className="flex-1 bg-[#FF7A00] text-white px-6 py-5 rounded-2xl font-bold hover:bg-[#E53935] transition-all duration-300 shadow-md text-center text-lg tracking-wide">
                        <span className="inline-flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" strokeWidth="2" /></svg> Gérer les commandes</span>
                    </a>
                    <a href="/admin/accounting" className="flex-1 bg-[#357A1A] text-white px-6 py-5 rounded-2xl font-bold hover:bg-[#4A9800] transition-all duration-300 shadow-md text-center text-lg tracking-wide">
                        <span className="inline-flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 8v8m0 0l3-3m-3 3l-3-3" stroke="#fff" strokeWidth="2" /></svg> Voir la comptabilité</span>
                    </a>
                    <a href="/admin/users" className="flex-1 bg-[#357A1A] text-white px-6 py-5 rounded-2xl font-bold hover:bg-[#4A9800] transition-all duration-300 shadow-md text-center text-lg tracking-wide">
                        <span className="inline-flex items-center gap-2"><svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" stroke="#fff" strokeWidth="2" /></svg> Gérer les utilisateurs</span>
                    </a>
                </div>
            </div>
        </div>
    );
}