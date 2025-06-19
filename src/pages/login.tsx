import React, { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Vérifie si déjà connecté
  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("nutrijus_admin_token")) {
      router.replace("/admin");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tel, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("nutrijus_admin_token", data.id);
      router.push("/admin");
    } else {
      setError(data.error || "Identifiants invalides");
    }
  }

  function handleLogout() {
    localStorage.removeItem("nutrijus_admin_token");
    router.reload();
  }

  // Affiche un bouton de déconnexion si déjà connecté
  if (typeof window !== "undefined" && localStorage.getItem("nutrijus_admin_token")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#357A1A]">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xs flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold text-[#357A1A] mb-2 text-center">Déjà connecté</h1>
          <button
            className="bg-[#E53935] text-white rounded p-2 font-bold hover:bg-[#FF7A00] w-full"
            onClick={handleLogout}
          >Se déconnecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#357A1A]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xs flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h1 className="text-2xl font-bold text-[#357A1A] mb-2 text-center">Connexion Admin</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="tel" className="font-semibold text-[#357A1A]">Téléphone</label>
          <input
            id="tel"
            type="text"
            placeholder="Numéro de téléphone"
            className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400"
            value={tel}
            onChange={e => setTel(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-semibold text-[#357A1A]">Mot de passe</label>
          <input
            id="password"
            type="password"
            placeholder="Mot de passe"
            className="border border-gray-400 focus:border-[#4A9800] focus:ring-2 focus:ring-[#E6F9D5] p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" className="bg-[#357A1A] text-white rounded p-2 font-bold hover:bg-[#4A9800]">Se connecter</button>
      </form>
    </div>
  );
}
