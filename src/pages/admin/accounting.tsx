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
    fetch('/api/accounting')
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders || []);
        setRevenue(data.revenue || 0);
        setMargin(data.margin || 0);
      })
      .catch(() => setNotif("Erreur lors du chargement des données."))
      .finally(() => setLoading(false));
  }, [authChecked]);

  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setNotif(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notif]);

  function exportCSV() {
    if (!orders.length) return setNotif("Aucune commande à exporter.");
    const header = ['Client','Produits','Montant','Date','Statut'];
    const rows = orders.map(o => [
      o.customer,
      (o.items||[]).map((it:any) => `${it.name} x${it.qty}`).join(' | '),
      o.total,
      o.date,
      o.status
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
    <div className="min-h-screen bg-gradient-to-br from-[#fffbe8] to-[#e8ffe3] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Comptabilité</h1>
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
            <div className="text-xl text-gray-500">Marge brute</div>
            <div className="text-2xl font-bold text-[#4F46E5]">{margin} FCFA</div>
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
                  <th className="py-3 px-4 border-b text-left">Client</th>
                  <th className="py-3 px-4 border-b text-left">Produits</th>
                  <th className="py-3 px-4 border-b text-left">Montant</th>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{order.customer}</td>
                    <td className="py-2 px-4">{order.items?.map((it:any) => `${it.name} x${it.qty}`).join(", ")}</td>
                    <td className="py-2 px-4">{order.total} FCFA</td>
                    <td className="py-2 px-4">{order.date}</td>
                    <td className="py-2 px-4">{order.status}</td>
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
