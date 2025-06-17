import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "../../utils/auth";

interface Ingredient {
  name: string;
  icon?: string;
}

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
  ingredients?: Ingredient[];
}

const emptyProduct: Product = {
  name: '',
  weight: '',
  price: 0,
  productionCost: 0,
  image: '',
  description: '',
  labels: [],
  nutrition: [],
  ingredients: []
};

export default function AdminProducts() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);



  const [confirmDelete, setConfirmDelete] = useState<{ index: number, name: string } | null>(null);
  const [notif, setNotif] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    if (!authChecked) return;
    setLoading(true);
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setNotif("Erreur lors du chargement des produits."))
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


  function handleDelete(index: number, name: string) {
    setConfirmDelete({ index, name });
  }

  function submitDelete() {
    if (!confirmDelete) return;
    fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: confirmDelete.index })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setProducts(p => p.filter((_, i) => i !== confirmDelete.index));
        setNotif("Produit supprimé avec succès.");
      })
      .catch(() => setNotif("Erreur lors de la suppression."));
    setConfirmDelete(null);
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Gestion des produits</h1>
        <a href="/admin/products/new" className="mb-6 bg-[#4A9800] hover:bg-[#357A1A] text-white px-6 py-3 rounded-xl font-bold text-center">Ajouter un produit</a>
        {notif && <div className="mb-4 text-center text-white bg-[#357A1A] px-4 py-2 rounded">{notif}</div>}
        {loading ? (
          <div className="text-gray-500">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {products.map((prod, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3 border hover:border-[#FFD580]">
                <img src={prod.image} alt={prod.name} className="w-32 h-32 object-cover mx-auto rounded-xl" />
                <div className="font-bold text-[#357A1A] text-xl text-center">{prod.name}</div>
                <div className="text-sm text-gray-500 text-center">{prod.weight}</div>
                <div className="text-lg font-bold text-[#E53935] text-center">{prod.price} FCFA</div>
                <div className="text-sm text-gray-500 text-center">Coût production : {prod.productionCost} FCFA</div>
                {prod.ingredients && prod.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {prod.ingredients.map((ing, idx) => (
                      <span key={idx} className="flex items-center gap-1 bg-[#f6fff3] px-2 py-1 rounded-full border border-[#e6e6e6]">
                        {ing.icon && <img src={ing.icon} alt={ing.name} className="w-5 h-5 object-contain rounded-full" />}
                        <span className="text-xs text-[#357A1A]">{ing.name}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2 justify-center">
                  <a href={`/admin/products/${prod.id}/edit`} className="bg-[#FFD580] text-[#357A1A] px-3 py-1 rounded text-center">Éditer</a>
                  <button className="bg-[#E53935] text-white px-3 py-1 rounded" onClick={() => handleDelete(i, prod.name)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl max-w-md w-full relative flex flex-col gap-4 items-center">
            <div className="text-xl mb-4 text-[#E53935]">Supprimer le produit <b className="text-[#E53935]">{confirmDelete.name}</b> ?</div>
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
