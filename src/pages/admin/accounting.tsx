import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "../../utils/auth";

export default function AdminAccounting() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [margin, setMargin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<string|null>(null);
  const [products, setProducts] = useState<any[]>([]);
  // Dates par défaut : début et fin du mois courant
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${yyyy}-${mm}-01`;
  const defaultEnd = `${yyyy}-${mm}-${String(new Date(yyyy, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  // Charge les produits via l'API Next.js (pour compatibilité prod)
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  // Utilitaire pour obtenir le nom du produit
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    setLoading(true);
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        // On ne garde que les commandes livrées
        const delivered = data.filter((order: any) => (order.status === 'Delivered' || order.status === 'delivered'));
        const filteredOrders = delivered.filter((order: any) => {
          const orderDate = new Date(order.date);
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });
        setOrders(filteredOrders);
        const totalRevenue = filteredOrders.reduce((acc: number, order: any) => acc + (Number(order.total) || 0), 0);
        setRevenue(totalRevenue);
        const totalMargin = filteredOrders.reduce((acc: number, order: any) => {
  if (!order.items) return acc;
  const orderMargin = order.items.reduce((itemAcc: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    if (!product) return itemAcc;
    const price = Number(product.price || 0);
    const purchasePrice = Number(product.productionCost || 0);
    const qty = Number(item.quantity || item.qty || 1);
    return itemAcc + (price - purchasePrice) * qty;
  }, 0);
  return acc + orderMargin;
}, 0);
setMargin(totalMargin);
      })
      .catch(() => setNotif("Erreur lors du chargement des données."))
      .finally(() => setLoading(false));
  }, [authChecked, startDate, endDate]);

  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setNotif(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notif]);

  function exportCSV() {
    if (!orders.length) return setNotif("Aucune commande à exporter.");
    const header = ['Client','Téléphone','Produits','Montant','Date','Livraison/Retrait','Statut','Coût de production'];
    const rows = orders.map(o => [
      o.customerInfo?.name || o.customer || '',
      o.customerInfo?.phone || '',
      (o.items||[]).map((it:any) => `${it.productId ? getProductName(it.productId) : (it.name || it.id || '')} x${it.quantity || it.qty || 1}`).join(' | '),
      o.total,
      o.date,
      o.delivery || o.customerInfo?.deliveryPlace || '',
      o.status,
      (o.items||[]).reduce((acc:number, it:any) => acc + Number(it.purchasePrice || 0) * Number(it.quantity || it.qty || 1), 0)
    ]);
    const csv = [header, ...rows].map(r => r.map(field => '"'+String(field).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrijus-comptabilite-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotif("Export CSV généré !");
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <button
          onClick={() => router.push('/admin')}
          className="self-start mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#FFD580] text-[#357A1A] font-semibold shadow-sm border border-[#e0e0e0] transition"
          type="button"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#357A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour
        </button>
        <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Comptabilité</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8 w-full justify-center items-center">
          <div className="flex flex-col items-start">
            <label htmlFor="start-date" className="text-xs font-semibold text-[#357A1A] mb-1">Début</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-[#F8F9FA] hover:bg-[#FFD580] text-[#357A1A] font-semibold shadow-sm border border-[#e0e0e0] transition p-2 rounded"
            />
          </div>
          <span className="font-bold text-[#357A1A] text-2xl">—</span>
          <div className="flex flex-col items-start">
            <label htmlFor="end-date" className="text-xs font-semibold text-[#357A1A] mb-1">Fin</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-[#F8F9FA] hover:bg-[#FFD580] text-[#357A1A] font-semibold shadow-sm border border-[#e0e0e0] transition p-2 rounded"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 mb-8 w-full justify-center">
          <div className="bg-[#E6F9D5] rounded-xl p-6 flex flex-col items-center min-w-[180px]">
            <div className="text-xl text-gray-500">Chiffre d'affaires</div>
            <div className="text-2xl font-bold text-[#357A1A]">{revenue} FCFA</div>
          </div>
          <div className="bg-[#FFEBC7] rounded-xl p-6 flex flex-col items-center min-w-[180px]">
            <div className="text-xl text-gray-500">Commandes</div>
            <div className="text-2xl font-bold text-[#FF7A00]">{orders.length}</div>
          </div>
          <div className="bg-[#E0E7FF] rounded-xl p-6 flex flex-col items-center min-w-[180px]">
            <div className="text-xl text-gray-500">Bénéfices</div>
            <div className="text-2xl font-bold text-[#4F46E5]">{(() => {
              const deliveryFee = 1000;
              let totalDeliveryFees = 0;
              let totalProductionCost = 0;
              orders.forEach(order => {
                const deliveryType = (order.delivery || order.customerInfo?.deliveryPlace || '').trim().toLowerCase();
                if (deliveryType !== 'retrait') {
                  totalDeliveryFees += deliveryFee;
                }
                totalProductionCost += (order.items||[]).reduce((acc: number, it: any) => {
                  const product = products.find((p: any) => p.id === it.productId);
                  if (!product) return acc;
                  return acc + Number(product.productionCost || 0) * Number(it.quantity || it.qty || 1);
                }, 0);
              });
              const profit = revenue - totalDeliveryFees - totalProductionCost;
              return profit + ' FCFA';
            })()}</div>
          </div>
        </div>
        {/* Bloc infos comptabilité */}
        <div className="mb-8 w-full flex flex-col items-center">
          <div className="bg-[#F8F9FA] border border-[#e0e0e0] rounded-xl p-6 w-full max-w-3xl flex flex-col md:flex-row gap-6 justify-between items-center shadow-sm">
            {/* Calculs */}
            {(() => {
              const deliveryFee = 1000;
              let totalDeliveryFees = 0;
              let nbLivraisons = 0;
              let nbRetraits = 0;
              let totalProductionCost = 0;
              orders.forEach(order => {
                const deliveryType = (order.delivery || order.customerInfo?.deliveryPlace || '').trim().toLowerCase();
                if (deliveryType === 'retrait') {
                  nbRetraits++;
                } else {
                  nbLivraisons++;
                  totalDeliveryFees += deliveryFee;
                }
                totalProductionCost += (order.items||[]).reduce((acc: number, it: any) => {
  const product = products.find((p: any) => p.id === it.productId);
  if (!product) return acc;
  return acc + Number(product.productionCost || 0) * Number(it.quantity || it.qty || 1);
}, 0);
              });
              return (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-lg">Frais de livraison totaux</span>
                    <span className="font-bold text-2xl" style={{color:'#357A1A'}}>{totalDeliveryFees} FCFA</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-lg">Nombre de livraisons</span>
                    <span className="font-bold text-2xl" style={{color:'#FF7A00'}}>{nbLivraisons}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-lg">Nombre de retraits</span>
                    <span className="font-bold text-2xl" style={{color:'#2563eb'}}>{nbRetraits}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-gray-500 text-lg">Coût total de production</span>
                    <span className="font-bold text-2xl" style={{color:'#7c3aed'}}>{totalProductionCost} FCFA</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        <button className="mb-6 bg-[#FF7A00] hover:bg-[#E53935] text-white px-6 py-3 rounded-xl font-bold" onClick={exportCSV}>Exporter en CSV</button>
        {notif && <div className="mb-4 text-center text-white bg-[#357A1A] px-4 py-2 rounded">{notif}</div>}
        {loading ? (
          <div className="text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Client</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Téléphone</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Produits</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Montant</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Date</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Livraison/Retrait</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Statut</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900 font-bold bg-[#F8F9FA]">Coût de production</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-900">{order.customerInfo?.name || order.customer || ''}</td>
                    <td className="py-2 px-4 text-gray-900">{order.customerInfo?.phone || ''}</td>
                    <td className="py-2 px-4 text-gray-900">{(order.items||[]).map((it:any) => `${it.productId ? getProductName(it.productId) : (it.name || it.id || '')} x${it.quantity || it.qty || 1}`).join(", ")}</td>
                    <td className="py-2 px-4 text-gray-900">{order.total} FCFA</td>
                    <td className="py-2 px-4 text-gray-900">{order.date}</td>
                    <td className="py-2 px-4 text-gray-900">{order.delivery || order.customerInfo?.deliveryPlace || ''}</td>
                    <td className="py-2 px-4 text-gray-900">{order.status}</td>
                    <td className="py-2 px-4 text-gray-900">{(order.items||[]).reduce((acc:number, it:any) => acc + Number(it.purchasePrice || 0) * Number(it.quantity || it.qty || 1), 0)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
