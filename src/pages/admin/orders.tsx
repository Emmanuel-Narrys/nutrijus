import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "../../utils/auth";

interface CustomerInfo {
  name: string;
  phone: string;
  isWhatsapp: boolean;
  deliveryPlace: string;
}

import { OrderStatus } from "../../context/ShopContext";

interface Order {
  id: string;
  items: { productId: string; quantity: number }[];
  total: number;
  createdAt: string;
  customerInfo: CustomerInfo;
  status: OrderStatus;
  delivery: string;
  payment: string;
  date: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "En attente",
  [OrderStatus.Processing]: "En cours",
  [OrderStatus.Delivered]: "Livrée",
  [OrderStatus.Cancelled]: "Annulée"
};

const emptyOrder: Order = {
  id: '',
  items: [],
  total: 0,
  createdAt: '',
  customerInfo: { name: '', phone: '', isWhatsapp: false, deliveryPlace: '' },
  status: OrderStatus.Pending,
  delivery: '',
  payment: '',
  date: new Date().toISOString().slice(0, 10),
};

// Retourne la classe bg selon le statut de la commande
function getRowBgColor(status: OrderStatus | string): { backgroundColor: string } | undefined {
  // Normalize to lower-case string for robust matching
  const norm = typeof status === 'string' ? status.toLowerCase() : status;
  switch (norm) {
    case OrderStatus.Pending:
    case 'pending':
      return { backgroundColor: '#FFF9C4' };
    case OrderStatus.Processing:
    case 'processing':
      return { backgroundColor: '#BBDEFB' };
    case OrderStatus.Delivered:
    case 'delivered':
      return { backgroundColor: '#C8E6C9' };
    case OrderStatus.Cancelled:
    case 'cancelled':
      return { backgroundColor: '#FFCDD2' };
    default:
      return undefined;
  }
}

export default function AdminOrders() {
  // Ajout état pour le modal de création en masse
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkProductId, setBulkProductId] = useState<string>("");
  const [bulkTotal, setBulkTotal] = useState<number>(1);
  const [bulkPerOrder, setBulkPerOrder] = useState<number>(1);

  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkWithDeliveryFee, setBulkWithDeliveryFee] = useState(true);

  // Génère des commandes en masse
  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true);
    const product = products.find(p => p.id === (bulkProductId || products[0]?.id)) || products[0];
    const nbCmd = Math.ceil(bulkTotal / bulkPerOrder);
    const ordersToAdd = Array.from({ length: nbCmd }).map((_, i) => {
      const qty = i === nbCmd - 1 ? bulkTotal - bulkPerOrder * (nbCmd - 1) || bulkPerOrder : bulkPerOrder;
      const total = product.price * qty + (bulkWithDeliveryFee ? deliveryFee : 0);
      const deliveryType = bulkWithDeliveryFee ? "Livraison" : "Retrait";
      return {
        id: Date.now().toString() + '-' + i + '-' + Math.floor(Math.random() * 10000),
        items: [{
          productId: product.id as string,
          quantity: qty,
          price: product.price,
          purchasePrice: product.productionCost
        }],
        total,
        createdAt: new Date().toISOString(),
        customerInfo: { name: 'Vente boutique', phone: '', isWhatsapp: false, deliveryPlace: deliveryType },
        status: OrderStatus.Delivered,
        delivery: deliveryType,
        payment: '',
        date: new Date().toISOString().slice(0, 10),
      };
    });
    // Ajout côté backend
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToAdd, bulk: true })
      });
      if (!res.ok) throw new Error('Erreur API');
      setOrders(o => [...ordersToAdd, ...o]);
      setNotif(nbCmd + ' commandes créées !');
      setBulkModal(false);
    } catch {
      setNotif("Erreur lors de la création en masse");
    } finally {
      setBulkLoading(false);
    }
  };

  // ...
  const [includeDeliveryFee, setIncludeDeliveryFee] = useState<boolean>(true);
  const deliveryFee = 1000;
  const [selectedStatus, setSelectedStatus] = useState<string>("pending");
  const [modal, setModal] = useState<{ mode: 'add' | 'edit', index?: number, order: Order } | null>(null);

  useEffect(() => {
    setSelectedStatus(modal?.order?.status || "pending");
  }, [modal]);
  // ...
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ index: number, customer: string } | null>(null);
  const [notif, setNotif] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  // Liste des produits (chargée depuis products.json)
  // Import Product interface from products.tsx or redefine if not exported
  interface Product {
    id?: string;
    name: string;
    weight: string;
    price: number;
    productionCost: number;
    image: string;
    description?: string;
    labels?: any[];
    nutrition?: any[];
    ingredients?: any[];
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [itemsState, setItemsState] = useState<{ productId: string; quantity: number }[]>([]);

  // Filtres
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "">("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  // Date interval filter states
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Load products for selects and display
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then((data) => {
        // Support both {products: [...]}, or array directly
        const arr = Array.isArray(data) ? data : data.products;
        setProducts(arr);
      });
  }, []);

  // Set default filter interval to current month
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const lastDate = new Date(yyyy, now.getMonth() + 1, 0);
    const lastDay = `${yyyy}-${mm}-${String(lastDate.getDate()).padStart(2, '0')}`;
    const firstDay = `${yyyy}-${mm}-01`;
    setFilterStartDate(firstDay);
    setFilterEndDate(lastDay);
  }, []);

  // Liste de tous les produits pour le filtre
  const productOptions = products.map(p => ({ id: p.id, name: p.name }));

  // Filtrage dynamique
  const filteredOrders = orders.filter(order => {
    const statusOk = !filterStatus || order.status === filterStatus;
    const productOk = !filterProduct || order.items.some(it => {
      // Accept match if productId matches the filter, or if the product name matches (for legacy/front orders)
      const prod = products.find(p => p.id === it.productId || p.name === it.productId);
      return it.productId === filterProduct || prod?.id === filterProduct || prod?.name === filterProduct;
    });
    let dateOk = true;
    if (filterStartDate) {
      dateOk = dateOk && order.date >= filterStartDate;
    }
    if (filterEndDate) {
      dateOk = dateOk && order.date <= filterEndDate;
    }
    return statusOk && productOk && dateOk;
  });

  // Utilitaire pour afficher le nom d'un produit à partir de son id
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  // Composant amélioré pour gérer dynamiquement les lignes produit/quantité avec meilleure UX/UI
  function ProductItemsFields({ items, onChange }: { items: { productId: string; quantity: number }[], onChange: (items: { productId: string; quantity: number }[]) => void }) {
    // Validation: empty product or quantity < 1
    const getError = (item: { productId: string; quantity: number }) => {
      if (!item.productId) return "Sélectionnez un produit";
      if (!item.quantity || item.quantity < 1) return "Quantité invalide";
      return null;
    };
    const handleChange = (idx: number, field: 'productId' | 'quantity', value: string) => {
      const updated = [...items];
      if (field === 'quantity') {
        updated[idx][field] = Math.max(1, parseInt(value) || 1);
      } else {
        updated[idx][field] = value;
      }
      onChange(updated);
    };
    const handleAdd = () => onChange([...items, { productId: products[0]?.id || '', quantity: 1 }]);
    const handleRemove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
    const productListIsEmpty = !products || products.length === 0;
    return (
      <div className="flex flex-col gap-3 mt-2">
        <label className="font-semibold text-[#357A1A] mb-1">Produits</label>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {productListIsEmpty && (
            <div className="text-xs text-red-500 bg-[#FFF6F6] border border-red-200 rounded p-2 mb-2">
              Aucun produit disponible. Veuillez d'abord créer des produits dans le catalogue.
            </div>
          )}
          {items.length === 0 && !productListIsEmpty && (
            <div className="text-xs text-gray-500 italic">Ajoutez au moins un produit à la commande.</div>
          )}
          {items.map((item, idx) => {
            const error = getError(item);
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-[#F7FAF3] border border-[#E6F9D5] rounded-lg px-2 py-2 min-h-[92px] flex-wrap"
              >
                <div className="flex-1 flex flex-col min-w-[120px]">
                  <label className="text-xs font-semibold text-[#357A1A] mb-1" htmlFor={`product-${idx}`}>Produit</label>
                  <select
                    id={`product-${idx}`}
                    name={`product-${idx}`}
                    value={item.productId}
                    onChange={e => handleChange(idx, 'productId', e.target.value)}
                    className={`border-2 rounded-lg px-2 py-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition ${!item.productId ? 'border-red-400' : 'border-[#357A1A]'}`}
                    required
                    disabled={productListIsEmpty}
                  >
                    <option value="">{productListIsEmpty ? 'Aucun produit' : 'Sélectionnez...'}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="w-full sm:w-[110px] flex flex-col min-w-[90px]">
                  <label className="text-xs font-semibold text-[#357A1A] mb-1" htmlFor={`qty-${idx}`}>Quantité</label>
                  <input
                    id={`qty-${idx}`}
                    name={`qty-${idx}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleChange(idx, 'quantity', e.target.value)}
                    className={`border-2 rounded-lg px-2 py-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition ${(!item.quantity || item.quantity < 1) ? 'border-red-400' : 'border-[#357A1A]'}`}
                    required
                    disabled={productListIsEmpty}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="sm:ml-2 mt-2 sm:mt-6 h-8 w-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label="Supprimer la ligne"
                  tabIndex={0}
                  disabled={productListIsEmpty}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2" /></svg>
                </button>
                {/* Always reserve space for error below */}
                <div className="min-h-[18px] mt-1">
                  {error && (
                    <span className="text-xs text-red-500 ">{error}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { if (!productListIsEmpty) handleAdd(); }}
          className={`mt-2 self-start font-semibold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 ${productListIsEmpty ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#4A9800] hover:bg-[#357A1A] text-white'}`}
          disabled={productListIsEmpty}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 5v14m7-7H5" stroke="#fff" strokeWidth="2" /></svg>
          Ajouter un produit
        </button>
      </div>
    );
  }

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
    setItemsState([]);
    setModal({ mode: 'add', order: { ...emptyOrder } });
  }

  function handleEdit(index: number) {
    const order = orders[index];
    setModal({ mode: 'edit', index, order: { ...order } });
    // L'initialisation de itemsState sera faite dans un useEffect ci-dessous
  }

  useEffect(() => {
    // Synchronise itemsState avec les items de la commande éditée, en mappant les productId legacy (nom) vers l'id réel
    if (modal?.mode === 'edit' && products.length > 0) {
      setItemsState(
        modal.order.items.map(it => {
          const prod = products.find(p => p.id === it.productId || p.name === it.productId);
          return {
            ...it,
            productId: prod?.id || it.productId
          };
        })
      );
      setManualTotal(modal.order.total);
    } else if (modal?.mode === 'add') {
      setItemsState([]);
      setManualTotal(null);
    }
    if (!modal) {
      setItemsState([]);
      setManualTotal(null);
    }
  }, [modal, products]);

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
    const data = new FormData(form);
    // Utilise directement itemsState comme source des items
    const items = itemsState;
    // Ajoute price et purchasePrice à chaque item
    const itemsWithPrices = items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        ...it,
        price: prod?.price ?? 0,
        purchasePrice: prod?.productionCost ?? 0
      };
    });
    const order: Order = {
      id: modal?.mode === 'edit' && modal?.order?.id ? modal.order.id : Date.now().toString(),
      items: itemsWithPrices,
      total: manualTotal !== null ? manualTotal : itemsWithPrices.reduce((sum, it) => sum + (it.price ? it.price * it.quantity : 0), 0),
      createdAt: modal?.mode === 'edit' && modal?.order?.createdAt ? modal.order.createdAt : new Date().toISOString(),
      customerInfo: {
        name: String(data.get('customerName') || ''),
        phone: String(data.get('customerPhone') || ''),
        isWhatsapp: String(data.get('isWhatsapp')) === 'true',
        deliveryPlace: String(data.get('deliveryPlace') || ''),
      },
      status: selectedStatus as OrderStatus || OrderStatus.Pending,
      delivery: String(data.get('deliveryPlace') || ''),
      payment: String(data.get('payment') || ''),
      date: String(data.get('date') || ''),
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
          setItemsState([]);
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
          setItemsState([]);
        })
        .catch(() => setNotif("Erreur lors de la modification."));
    }
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbe8] to-[#e8ffe3] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <button
          onClick={() => router.push('/admin')}
          className="self-start mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#FFD580] text-[#357A1A] font-semibold shadow-sm border border-[#e0e0e0] transition"
          type="button"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#357A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Retour
        </button>
        <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Gestion des commandes</h1>
        <div className="flex gap-4 mb-6">
          <button className="bg-[#FF7A00] hover:bg-[#E53935] text-white px-6 py-3 rounded-xl font-bold" onClick={handleAdd}>Ajouter une commande</button>
          <button
            className="bg-[#357A1A] hover:bg-[#4A9800] text-white px-6 py-3 rounded-xl font-bold"
            onClick={() => setBulkModal(true)}
            type="button"
          >Créer en masse</button>
        </div>
        {bulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form onSubmit={handleBulkCreate} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 min-w-[320px]">
              <h2 className="text-2xl font-extrabold mb-4 text-[#357A1A] text-center">Création de commandes en masse</h2>
              <label className="flex flex-col font-semibold text-[#222] text-sm mb-1">Produit
                <select
                  value={bulkProductId || products[0]?.id || ''}
                  onChange={e => setBulkProductId(e.target.value)}
                  className="border border-[#357A1A] rounded-lg p-2 mt-1 bg-white text-[#222] text-base focus:outline-none focus:ring-2 focus:ring-[#FFD580]"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col font-semibold text-[#222] text-sm mb-1">Quantité totale
                <input
                  type="number"
                  min={1}
                  value={bulkTotal}
                  onChange={e => setBulkTotal(Number(e.target.value))}
                  className="border border-[#357A1A] rounded-lg p-2 mt-1 bg-white text-[#222] text-base focus:outline-none focus:ring-2 focus:ring-[#FFD580] placeholder:text-gray-400"
                  placeholder="Quantité totale"
                />
              </label>
              <label className="flex flex-col font-semibold text-[#222] text-sm mb-1">Quantité par commande
                <input
                  type="number"
                  min={1}
                  value={bulkPerOrder}
                  onChange={e => setBulkPerOrder(Number(e.target.value))}
                  className="border border-[#357A1A] rounded-lg p-2 mt-1 bg-white text-[#222] text-base focus:outline-none focus:ring-2 focus:ring-[#FFD580] placeholder:text-gray-400"
                  placeholder="Quantité par commande"
                />
              </label>

              <label className="flex items-center gap-2 font-semibold text-[#222] text-sm mb-1">
                <input
                  type="checkbox"
                  checked={bulkWithDeliveryFee}
                  onChange={e => setBulkWithDeliveryFee(e.target.checked)}
                  className="accent-[#357A1A] w-4 h-4"
                />
                <span>Ajouter le frais de livraison (<span className="font-bold">{deliveryFee} FCFA</span>) à chaque commande</span>
              </label>
              <div className="flex gap-2 mt-2">
                <button type="submit" disabled={bulkLoading} className="bg-[#357A1A] text-white px-4 py-2 rounded font-semibold hover:bg-[#4A9800]">Valider</button>
                <button type="button" onClick={() => setBulkModal(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
              </div>
              {bulkLoading && <div className="text-xs text-gray-500">Création en cours...</div>}
            </form>
          </div>
        )
        }

        {notif && <div className="mb-4 text-center text-white bg-[#357A1A] px-4 py-2 rounded">{notif}</div>}
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-6 w-full bg-[#F8F9FA] rounded-xl p-4 shadow-sm border border-[#e0e0e0] items-end">
          {/* Champs du filtre en responsive + bouton reset */}
          {/* Champs du filtre en responsive */}
          <div className="flex flex-col w-full sm:min-w-[150px] sm:w-auto sm:flex-1">
            <label className="block text-xs mb-2 font-semibold text-[#357A1A] flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="#357A1A" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-13h2v6h-2V7Zm0 8h2v2h-2v-2Z" /></svg>
              Statut
            </label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as OrderStatus | "")} className="border-2 border-[#357A1A] rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition">
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-full sm:min-w-[180px] sm:w-auto sm:flex-1">
            <label className="block text-xs mb-2 font-semibold text-[#357A1A] flex items-center gap-1">
              Produit
            </label>
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="border-2 border-[#357A1A] rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition">
              <option value="">Tous</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-full sm:min-w-[160px] sm:w-auto sm:flex-1">
            <label className="block text-xs mb-2 font-semibold text-[#357A1A] flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="#357A1A" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z" /></svg>
              Date de début
            </label>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="border-2 border-[#357A1A] rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition" />
          </div>
          <div className="flex flex-col w-full sm:min-w-[160px] sm:w-auto sm:flex-1">
            <label className="block text-xs mb-2 font-semibold text-[#357A1A] flex items-center gap-1">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="#357A1A" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z" /></svg>
              Date de fin
            </label>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="border-2 border-[#357A1A] rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD580] transition" />
          </div>
          <button
            type="button"
            className="w-full sm:w-auto sm:ml-auto bg-[#357A1A] hover:bg-[#285e15] text-white font-semibold px-6 py-2 rounded-lg transition"
            onClick={() => {
              const now = new Date();
              const yyyy = now.getFullYear();
              const mm = String(now.getMonth() + 1).padStart(2, '0');
              const lastDate = new Date(yyyy, now.getMonth() + 1, 0);
              const lastDay = `${yyyy}-${mm}-${String(lastDate.getDate()).padStart(2, '0')}`;
              const firstDay = `${yyyy}-${mm}-01`;
              setFilterStatus("");
              setFilterProduct("");
              setFilterStartDate(firstDay);
              setFilterEndDate(lastDay);
            }}
          >
            Réinitialiser le filtre
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white rounded-xl shadow text-gray-900">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Détails</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Client</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Téléphone</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Livraison</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Produits</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Montant</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Date</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Statut</th>
                  <th className="py-3 px-4 border-b text-left text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => {
                  const rowStyle = getRowBgColor(order.status);
                  return (
                    <tr key={order.id} className="border-b text-sm" style={rowStyle}>
                      <td className="py-2 px-4">
                        <button className="bg-[#4A9800] text-white px-2 py-1 rounded text-xs" onClick={() => setDetailOrder(order)}>Détails</button>
                      </td>
                      <td className="py-2 px-4 font-bold">{order.customerInfo?.name || ''}</td>
                      <td className="py-2 px-4">{order.customerInfo?.phone || ''}</td>
                      <td className="py-2 px-4">{order.customerInfo?.deliveryPlace || order.delivery}</td>
                      <td className="py-2 px-4 font-bold">{order.items.map(it => `${getProductName(it.productId)} x${it.quantity}`).join(', ')}</td>
                      <td className="py-2 px-4 font-bold">{order.total} FCFA</td>
                      <td className="py-2 px-4">{order.date ? order.date.slice(0, 10) : ''}</td>
                      <td className="py-2 px-4">{
                        STATUS_LABELS[
                        (typeof order.status === 'string'
                          ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase())
                          : order.status) as OrderStatus
                        ] || order.status
                      }</td>
                      <td className="py-2 px-4 flex gap-2">
                        <button
                          className={`bg-[#FFD580] text-[#357A1A] px-3 py-1 rounded ${typeof order.status === 'string' && order.status.toLowerCase() === 'delivered' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleEdit(orders.findIndex(o => o.id === order.id))}
                          disabled={typeof order.status === 'string' && order.status.toLowerCase() === 'delivered'}
                        >
                          Éditer
                        </button>
                        <button
                          className={`bg-[#E53935] text-white px-3 py-1 rounded ${typeof order.status === 'string' && order.status.toLowerCase() === 'delivered' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleDelete(orders.findIndex(o => o.id === order.id), order.customerInfo?.name || '')}
                          disabled={typeof order.status === 'string' && order.status.toLowerCase() === 'delivered'}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal détail commande */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8 relative overflow-y-auto max-h-[90vh] text-gray-900">
            <button type="button" className="absolute top-3 right-3 text-[#E53935] text-xl" onClick={() => setDetailOrder(null)} aria-label="Fermer">×</button>
            <h2 className="text-2xl font-bold text-[#357A1A] mb-4 text-gray-900">Détails de la commande</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">ID Commande :</span> {detailOrder.id}</div>
              <div><span className="font-semibold">Statut :</span> {detailOrder.status}</div>
              <div><span className="font-semibold">Date :</span> {detailOrder.date ? detailOrder.date.slice(0, 10) : ''}</div>
              <div><span className="font-semibold">Créée le :</span> {detailOrder.createdAt ? detailOrder.createdAt.slice(0, 19).replace('T', ' ') : ''}</div>
              <div><span className="font-semibold">Client :</span> {detailOrder.customerInfo?.name}</div>
              <div><span className="font-semibold">Téléphone :</span> {detailOrder.customerInfo?.phone}</div>
              <div><span className="font-semibold">WhatsApp :</span> {detailOrder.customerInfo?.isWhatsapp ? 'Oui' : 'Non'}</div>
              <div><span className="font-semibold">Lieu de livraison :</span> {detailOrder.customerInfo?.deliveryPlace || detailOrder.delivery}</div>
              <div><span className="font-semibold">Paiement :</span> {detailOrder.payment}</div>
            </div>
            <div className="mt-4">
              <div className="font-semibold mb-2">Produits :</div>
              <ul className="list-disc ml-6">
                {detailOrder.items.map((it, idx) => (
                  <li key={idx}>{getProductName(it.productId)} x{it.quantity}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 text-lg font-bold text-[#357A1A]">Total : {detailOrder.total} FCFA</div>
          </div>
        </div>
      )}
      {/* Modal ajout/édition */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onSubmit={handleModalSubmit}>
            <button type="button" className="absolute top-3 right-3 text-[#E53935] text-xl" onClick={() => setModal(null)} aria-label="Fermer">×</button>
            <h2 className="text-2xl font-bold text-[#357A1A] mb-2 text-center">{modal.mode === 'add' ? 'Ajouter' : 'Éditer'} une commande</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="customerName" className="font-semibold text-[#357A1A]">Client</label>
              <input id="customerName" name="customerName" defaultValue={modal.order.customerInfo?.name} placeholder="Client" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="customerPhone" className="font-semibold text-[#357A1A]">Téléphone</label>
              <input id="customerPhone" name="customerPhone" defaultValue={modal.order.customerInfo?.phone} placeholder="Téléphone" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="isWhatsapp" className="font-semibold text-[#357A1A]">WhatsApp</label>
              <select id="isWhatsapp" name="isWhatsapp" defaultValue={modal.order.customerInfo?.isWhatsapp ? 'true' : 'false'} className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white">
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="deliveryPlace" className="font-semibold text-[#357A1A]">Lieu de livraison</label>
              <input id="deliveryPlace" name="deliveryPlace" defaultValue={modal.order.customerInfo?.deliveryPlace} placeholder="Lieu de livraison" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <ProductItemsFields key={(modal?.order?.id || '') + '-' + modal?.mode} items={itemsState} onChange={setItemsState} />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeDeliveryFee"
                checked={includeDeliveryFee}
                onChange={e => setIncludeDeliveryFee(e.target.checked)}
              />
              <label htmlFor="includeDeliveryFee" className="font-semibold text-[#357A1A]">
                Ajouter les frais de livraison au montant total
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="total" className="font-semibold text-[#357A1A]">Montant (FCFA)</label>
              <input
                id="total"
                name="total"
                value={itemsState.reduce((sum, it) => {
                  const prod = products.find(p => p.id === it.productId);
                  return sum + (prod && prod.price ? prod.price * it.quantity : 0);
                }, 0) + (includeDeliveryFee ? deliveryFee : 0)}
                placeholder="Montant"
                type="number"
                min="0"
                className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400"
                readOnly
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="date" className="font-semibold text-[#357A1A]">Date</label>
              <input id="date" name="date" defaultValue={modal.order.date ? modal.order.date.slice(0, 10) : ''} placeholder="Date" type="date" required className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="font-semibold text-[#357A1A]">Statut</label>
              <select
                id="status"
                name="status"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white"
              >
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
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
