import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "@/utils/auth";

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [notif, setNotif] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<any|null>(null);
  const [form, setForm] = useState<any>({ name: '', tel: '', statut: '', password: '' });

  useEffect(() => {
    if (!isAdminAuthenticated()) router.replace("/login");
    fetch('/api/users').then(r => r.json()).then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.tel || !form.statut || (!editUser && !form.password)) {
      setNotif('Tous les champs sont requis');
      return;
    }
    setLoading(true);
    const method = editUser ? 'PUT' : 'POST';
    const body = editUser ? { ...editUser, ...form } : form;
    const res = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      setNotif(data.error || 'Erreur');
    } else {
      setNotif(editUser ? 'Utilisateur modifié' : 'Utilisateur ajouté');
      setForm({ name: '', tel: '', statut: '', password: '' });
      setEditUser(null);
      fetch('/api/users').then(r => r.json()).then(setUsers);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    setLoading(true);
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setNotif('Utilisateur supprimé');
      fetch('/api/users').then(r => r.json()).then(setUsers);
    } else {
      const data = await res.json();
      setNotif(data.error || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-5xl w-full flex flex-col items-center border border-[#e6e6e6]">
        <div className="w-full flex justify-start mb-4">
  <a href="/admin" className="inline-block bg-[#357A1A] text-white font-bold px-5 py-2 rounded-xl shadow hover:bg-green-800 transition-colors">
    ← Retour au dashboard
  </a>
</div>
<h1 className="text-4xl font-extrabold text-[#357A1A] mb-6 drop-shadow">Gestion des utilisateurs</h1>
        {notif && <div className="mb-4 text-center text-white bg-[#357A1A] px-4 py-2 rounded">{notif}</div>}
        <form className="flex flex-col gap-5 w-full mb-8" onSubmit={handleSubmit}>
  <label className="font-semibold text-gray-800">Nom
    <input className="border border-[#357A1A] rounded-xl py-3 px-4 w-full mt-1 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#357A1A]" name="name" placeholder="Nom" value={form.name} onChange={handleChange} />
  </label>
  <label className="font-semibold text-gray-800">Téléphone
    <input className="border border-[#357A1A] rounded-xl py-3 px-4 w-full mt-1 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#357A1A]" name="tel" placeholder="Téléphone" value={form.tel} onChange={handleChange} />
  </label>
  <label className="font-semibold text-gray-800">Statut
    <input className="border border-[#357A1A] rounded-xl py-3 px-4 w-full mt-1 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#357A1A]" name="statut" placeholder="Statut" value={form.statut} onChange={handleChange} />
  </label>
  <label className="font-semibold text-gray-800">Mot de passe
    <input className="border border-[#357A1A] rounded-xl py-3 px-4 w-full mt-1 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#357A1A]" name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} autoComplete="new-password" />
  </label>
  <button className="bg-[#357A1A] text-white px-6 py-3 rounded-xl font-bold text-lg shadow hover:bg-green-800 transition-colors" type="submit" disabled={loading}>
    {editUser ? 'Modifier' : 'Ajouter'} utilisateur
  </button>
  {editUser && <button type="button" className="text-sm text-blue-600 underline mt-2" onClick={() => { setEditUser(null); setForm({ name: '', tel: '', statut: '', password: '' }); }}>Annuler édition</button>}
</form>
        <table className="w-full border text-base">
          <thead>
            <tr className="bg-[#357A1A] text-white">
              <th className="py-3 px-4 font-bold tracking-wide rounded-tl-2xl">Nom</th>
              <th className="py-3 px-4 font-bold tracking-wide">Téléphone</th>
              <th className="py-3 px-4 font-bold tracking-wide">Statut</th>
              <th className="py-3 px-4 font-bold tracking-wide rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-[#e8ffe3] transition-colors">
                <td className="py-3 px-4 break-all text-gray-800 font-semibold">{u.name}</td>
                <td className="py-3 px-4 break-all text-gray-800">{u.tel}</td>
                <td className="py-3 px-4 break-all text-[#357A1A] font-bold">{u.statut}</td>
                <td className="py-3 px-4 flex gap-2">
                  {!u.protected && <>
                    <button className="text-blue-700 font-semibold underline hover:text-blue-900 transition-colors" onClick={() => { setEditUser(u); setForm({ name: u.name, tel: u.tel, statut: u.statut, password: '' }); }}>Éditer</button>
                    <button className="text-red-600 font-semibold underline hover:text-red-800 transition-colors" onClick={() => handleDelete(u.id)}>Supprimer</button>
                  </>}
                  {u.protected && <span className="text-gray-400 font-semibold">Compte protégé</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
