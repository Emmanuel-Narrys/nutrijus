import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isAdminAuthenticated } from "@/utils/auth";

export default function EditProduct() {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState<any>(null);
    const [notif, setNotif] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/login");
            return;
        }
        if (id) {
            fetch(`/api/products`)
                .then(r => r.json())
                .then(data => {
                    const found = Array.isArray(data) ? data.find((p: any) => p.id === id) : data;
                    if (found) {
                        setProduct({
                            ...found,

                            nutrition: found.nutrition && found.nutrition.length ? found.nutrition : [''],
                            ingredients: found.ingredients && found.ingredients.length ? found.ingredients : [{ name: '', icon: '' }],
                        });
                        if (found.image) setImagePreview(found.image);
                    } else {
                        setNotif("Produit non trouvé");
                    }
                })
                .catch(() => setNotif("Erreur lors du chargement du produit."));
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setProduct((prev: any) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    // Dynamic fields handlers
    const handleArrayChange = (field: string, idx: number, value: string) => {
        setProduct((prev: any) => {
            const arr = [...prev[field]];
            if (field === 'ingredients') {
                arr[idx] = { ...arr[idx], name: value };
            } else if (field === 'nutrition') {
                arr[idx] = { ...arr[idx], name: value };
            } else {
                arr[idx] = value;
            }
            return { ...prev, [field]: arr };
        });
    };

    // Nutrition object field handler
    const handleNutritionChange = (idx: number, key: 'name' | 'value', value: string) => {
        setProduct((prev: any) => {
            const arr = [...prev.nutrition];
            arr[idx] = { ...arr[idx], [key]: value };
            return { ...prev, nutrition: arr };
        });
    };

    const handleAddField = (field: string) => {
        setProduct((prev: any) => {
            if (field === 'ingredients') {
                return { ...prev, ingredients: [...prev.ingredients, { name: '', icon: '' }] };
            }
            if (field === 'nutrition') {
                return { ...prev, nutrition: [...prev.nutrition, { name: '', value: '' }] };
            }
            return { ...prev, [field]: [...prev[field], ''] };
        });
    };
    const handleRemoveField = (field: string, idx: number) => {
        setProduct((prev: any) => {
            const arr = [...prev[field]];
            arr.splice(idx, 1);
            return { ...prev, [field]: arr };
        });
    };

    // Ingredient icon upload handler
    const handleIngredientIconChange = async (idx: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', id as string);
        formData.append('ingredient', '1');
        formData.append('ingredientIndex', idx.toString());
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) return;
        const data = await res.json();
        setProduct((prev: any) => {
            const arr = [...prev.ingredients];
            arr[idx] = { ...arr[idx], icon: data.url };
            return { ...prev, ingredients: arr };
        });
    };

    // Image upload handlers
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return product?.image || null;
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('productId', id as string);
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) return product?.image || null;
        const data = await res.json();
        return data.url || product?.image || null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let imageUrl = product.image;
        if (imageFile) {
            const uploaded = await uploadImage();
            if (uploaded) imageUrl = uploaded;
            else {
                setNotif("Erreur lors de l'upload de l'image");
                setLoading(false);
                return;
            }
        }
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, product: { ...product, image: imageUrl } })
        });
        if (res.ok) {
            setNotif('Produit modifié !');
            router.push('/admin/products');
        } else {
            setNotif("Erreur lors de la modification");
        }
        setLoading(false);
    };

    if (!product) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e8ffe3] to-[#fffbe8] flex flex-col items-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center border border-[#e6e6e6]">
                <button
                    onClick={() => router.push('/admin/products')}
                    className="self-start mb-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8F9FA] hover:bg-[#FFD580] text-[#357A1A] font-semibold shadow-sm border border-[#e0e0e0] transition"
                    type="button"
                >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#357A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Retour produits
                </button>
                <h1 className="text-3xl font-bold text-[#357A1A] mb-4">Éditer le produit</h1>
                {notif && <div className="mb-4 text-center text-white bg-[#357A1A] px-4 py-2 rounded">{notif}</div>}
                <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="font-semibold text-[#357A1A]">Nom du produit</label>
                        <input id="name" name="name" value={product.name} onChange={handleChange} required className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="weight" className="font-semibold text-[#357A1A]">Poids</label>
                        <input id="weight" name="weight" value={product.weight} onChange={handleChange} required className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="price" className="font-semibold text-[#357A1A]">Prix de vente (FCFA)</label>
                        <input id="price" name="price" value={product.price} onChange={handleChange} type="number" min="0" required className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="productionCost" className="font-semibold text-[#357A1A]">Prix de production (FCFA)</label>
                        <input id="productionCost" name="productionCost" value={product.productionCost} onChange={handleChange} type="number" min="0" required className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="description" className="font-semibold text-[#357A1A]">Description</label>
                        <textarea id="description" name="description" value={product.description} onChange={handleChange} className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" />
                    </div>

                    {/* Image upload */}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-[#357A1A]">Image du produit</label>
                        {imagePreview && (
                            <img src={imagePreview} alt="Aperçu" className="h-32 object-contain mb-2 rounded" />
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="border border-gray-400 p-2 rounded bg-white" />
                    </div>

                    {/* Dynamic Ingredients */}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-[#357A1A]">Ingrédients</label>
                        {product.ingredients.map((ing: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center w-full">
                                {/* Icon preview */}
                                {ing.icon && (
                                    <img src={ing.icon} alt="icon" className="w-10 h-10 object-contain rounded self-center md:self-auto" />
                                )}
                                <input
                                    type="text"
                                    value={ing.name}
                                    onChange={e => handleArrayChange('ingredients', idx, e.target.value)}
                                    className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white flex-1 min-w-0"
                                    placeholder={`Ingrédient #${idx + 1}`}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files?.[0]) handleIngredientIconChange(idx, e.target.files[0]);
                                    }}
                                    className="border border-gray-400 p-2 rounded bg-white w-full md:w-1/2"
                                    title="Ajouter une icône"
                                />
                                <button type="button" onClick={() => handleRemoveField('ingredients', idx)} disabled={product.ingredients.length === 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 self-center md:self-auto" aria-label="Supprimer l'ingrédient">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8" stroke="#E53935" strokeWidth="2" strokeLinecap="round" /></svg>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => handleAddField('ingredients')} className="text-[#357A1A] underline">Ajouter un ingrédient</button>
                    </div>

                    {/* Dynamic Nutrition */}
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-[#357A1A]">Informations nutritionnelles</label>
                        {product.nutrition.map((nut: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-2 items-stretch md:items-center w-full">
                                <input
                                    type="text"
                                    value={nut.name}
                                    onChange={e => handleNutritionChange(idx, 'name', e.target.value)}
                                    className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white flex-1 min-w-0"
                                    placeholder={`Nom (ex: Énergie, Protéines...)`}
                                    required
                                />
                                <input
                                    type="text"
                                    value={nut.value}
                                    onChange={e => handleNutritionChange(idx, 'value', e.target.value)}
                                    className="border border-gray-400 p-2 rounded outline-none text-gray-900 bg-white flex-1 min-w-0"
                                    placeholder={`Valeur (ex: 40kcal, 2g...)`}
                                    required
                                />
                                <button type="button" onClick={() => handleRemoveField('nutrition', idx)} disabled={product.nutrition.length === 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 self-center md:self-auto" aria-label="Supprimer la nutrition">
                                    <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8" stroke="#E53935" strokeWidth="2" strokeLinecap="round" /></svg>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => handleAddField('nutrition')} className="text-[#357A1A] underline">Ajouter une info nutritionnelle</button>
                    </div>

                    <button type="submit" className="bg-[#4A9800] text-white rounded p-2 font-bold hover:bg-[#357A1A]" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
                </form>
            </div>
        </div>
    );
}
