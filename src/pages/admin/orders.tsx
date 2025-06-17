import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "../../utils/auth";

interface Order {
  customer: string;
  items: { name: string; qty: number }[];
  total: number;
  date: string;
  status: string;
}

const emptyOrder: Order = {
  customer: '',
  items: [],
  total: 0,
  date: new Date().toISOString().slice(0, 10),
  status: 'En attente'
};

export default function AdminOrders() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit', index?: number, order: Order } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ index: number, customer: string } | null>(null);
  const [notif, setNotif] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!authChecked) return;
    setLoading(true);
    fetch('/api/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => setNotif("Erreur lors du chargement des commandes."))
      .finally(() => setLoading(false));
  }, [authChecked]);

  // Notification timeout
  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setNotif(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notif]);

  // CRUD handlers
  function handleAdd() {
    setModal({ mode: 'add', order: { ...emptyOrder } });
  }

  function handleEdit(index: number) {
    setModal({ mode: 'edit', index, order: { ...orders[index] } });
  }

  function handleDelete(index: number, customer: string) {
    setConfirmDelete({ index, customer });
  }

  function submitDelete() {
    if (!confirmDelete) return;
    fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: confirmDelete.index })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setOrders(o => o.filter((_, i) => i !== confirmDelete.index));
        setNotif("Commande supprimée avec succès.");
      })
      .catch(() => setNotif("Erreur lors de la suppression."));
    setConfirmDelete(null);
  }

  function handleModalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    const order: Order = {
      customer: data.customer as string,
      items: [{ name: data.product as string, qty: parseInt(data.qty as string) }],
      total: parseFloat(data.total as string),
      date: data.date as string,
      status: data.status as string
    };
    if (modal?.mode === 'add') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(newOrder => {
          setOrders(o => [newOrder, ...o]);
          setNotif("Commande ajoutée !");
          setModal(null);
        })
        .catch(() => setNotif("Erreur lors de l'ajout."));
    } else if (modal?.mode === 'edit' && modal.index !== undefined) {
      fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: modal.index, order })
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(() => {
          setOrders(o => o.map((ord, i) => i === modal.index! ? order : ord));
          setNotif("Commande modifiée !");
          setModal(null);
        })
        .catch(() => setNotif("Erreur lors de la modification."));
    }
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbe8] to-[#e8ffe3] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Gestion des commandes</h1>
        <button className="mb-6 bg-[#FF7A00] hover:bg-[#E53935] text-white px-6 py-3 rounded-xl font-bold" onClick={handleAdd}>Ajouter une commande</button>
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
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{order.customer}</td>
                    <td className="py-2 px-4">{order.items?.map((it: any) => `${it.name} x${it.qty}`).join(", ")}</td>
                    <td className="py-2 px-4">{order.total} FCFA</td>
                    <td className="py-2 px-4">{order.date}</td>
                    <td className="py-2 px-4">{order.status}</td>
                    <td className="py-2 px-4 flex gap-2">
                      <button className="bg-[#FFD580] text-[#357A1A] px-3 py-1 rounded" onClick={() => handleEdit(i)}>Éditer</button>
                      <button className="bg-[#E53935] text-white px-3 py-1 rounded" onClick={() => handleDelete(i, order.customer)}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal ajout/édition */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onSubmit={handleModalSubmit}>
            <button type="button" className="absolute top-3 right-3 text-[#E53935] text-xl" onClick={() => setModal(null)} aria-label="Fermer">×</button>
            <h2 className="text-2xl font-bold text-[#357A1A] mb-2 text-center">{modal.mode === 'add' ? 'Ajouter' : 'Éditer'} une commande</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="customer" className="font-semibold text-[#357A1A]">Client</label>
              <input id="customer" name="customer" defaultValue={modal.order.customer} placeholder="Client" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="product" className="font-semibold text-[#357A1A]">Produit</label>
              <input id="product" name="product" defaultValue={modal.order.items[0]?.name || ''} placeholder="Produit" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="qty" className="font-semibold text-[#357A1A]">Quantité</label>
              <input id="qty" name="qty" defaultValue={modal.order.items[0]?.qty || 1} placeholder="Quantité" type="number" min="1" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="total" className="font-semibold text-[#357A1A]">Montant (FCFA)</label>
              <input id="total" name="total" defaultValue={modal.order.total} placeholder="Montant" type="number" min="0" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="date" className="font-semibold text-[#357A1A]">Date</label>
              <input id="date" name="date" defaultValue={modal.order.date} placeholder="Date" type="date" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="font-semibold text-[#357A1A]">Statut</label>
              <select id="status" name="status" defaultValue={modal.order.status} className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white">
                <option>En attente</option>
                <option>En cours</option>
                <option>Livrée</option>
                <option>Annulée</option>
              </select>
            </div>
            <button type="submit" className="bg-[#FF7A00] text-white rounded p-2 font-bold hover:bg-[#E53935]">{modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'}</button>
          </form>
        </div>
      )}
      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full relative flex flex-col gap-4 items-center">
            <div className="text-xl mb-4 text-[#E53935]">Supprimer la commande de <b className="text-[#E53935]">{confirmDelete.customer}</b> ?</div>
            <div className="flex gap-4">
              <button className="bg-[#E53935] text-white rounded p-2 font-bold" onClick={submitDelete}>Supprimer</button>
              <button className="bg-gray-300 rounded p-2 font-bold" onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
