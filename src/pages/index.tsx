import React, { useEffect } from "react";

import { Order, OrderStatus, PaymentMode, useShop } from "../context/ShopContext";

export default function Home() {
  console.log('RENDER/REMOUNT HOME');
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [touchEndX, setTouchEndX] = React.useState<number | null>(null);

  const [quantity, setQuantity] = React.useState(1);
  const [showCart, setShowCart] = React.useState(false);
  // --- Ajout pour pop-up description ---
  const [descModalProduct, setDescModalProduct] = React.useState<string | null>(null);

  // --- Accès produits et panier via le contexte ---
  const { products, addToCart, cart, removeFromCart, placeOrder } = useShop();
  // --- Pour la modale de validation de commande ---
  const [showOrderModal, setShowOrderModal] = React.useState(false);
  const [clientName, setClientName] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [isWhatsapp, setIsWhatsapp] = React.useState(false);
  const [deliveryPlace, setDeliveryPlace] = React.useState("");
  const [orderError, setOrderError] = React.useState("");
  const [orderFeedback, setOrderFeedback] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  // Empêche la fermeture automatique de la pop-up de feedback
  useEffect(() => {
    if (orderFeedback) {
      // Ne ferme jamais automatiquement la pop-up
    }
  }, [orderFeedback]);

  const [orderLoading, setOrderLoading] = React.useState(false);

  // Ferme le feedback et reset les champs
  const handleOrderFeedbackClose = () => {
    setOrderFeedback(null);
    setClientName("");
    setClientPhone("");
    setDeliveryPlace("");
    setIsWhatsapp(false);
    setOrderError("");
    setShowCart(false);
    setShowOrderModal(false); // Ferme la modale de commande seulement après confirmation du feedback
  };

  // Retire 1 unité d’un produit du panier (min 1)
  const removeOneFromCart = (productId: string) => {
    const item = cart.find(i => i.productId === productId);
    if (item && item.quantity > 1) {
      addToCart(productId, -1);
    } else {
      removeFromCart(productId);
    }
  };

  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const nextProduct = () => setCarouselIndex((i) => (i + 1) % products.length);
  const prevProduct = () => setCarouselIndex((i) => (i - 1 + products.length) % products.length);

  return (
    <div className="max-h-screen h-screen w-full flex flex-col items-center justify-between px-0 py-0 bg-[#F5F5E5] relative overflow-x-hidden">
      {/* Feedback commande : TOUJOURS hors du <form> de validation de commande */}
      {orderFeedback != null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full animate-fadeIn">
            {orderFeedback.type === 'success' ? (
              <div className="mb-4">
                <svg className="animate-popIn" width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="32" fill="#4BB543"/>
                  <path d="M18 34L28 44L46 26" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <div className="mb-4">
                <svg className="animate-shake" width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="32" fill="#E53935"/>
                  <path d="M24 24L40 40M40 24L24 40" stroke="#fff" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div className={`text-center text-lg font-bold mb-4 ${orderFeedback.type === 'success' ? 'text-[#388E1B]' : 'text-[#E53935]'}`}>{orderFeedback.message}
              {orderFeedback.type === 'error' && (
                <div className="text-sm font-normal mt-2 text-[#E53935]">Veuillez nous contacter si le problème persiste.</div>
              )}
            </div>
            <button
              type="button"
              className={`mt-2 px-6 py-2 rounded-lg font-semibold shadow transition-colors ${orderFeedback.type === 'success' ? 'bg-[#388E1B] text-white hover:bg-[#2e6b15]' : 'bg-[#E53935] text-white hover:bg-[#b71c1c]'}`}
              onClick={handleOrderFeedbackClose}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Le formulaire de commande reste inchangé, la pop-up n'est plus dans le form */}
      {orderLoading && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs w-full animate-fadeIn">
            <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#FFD600" strokeWidth="6" strokeDasharray="31.4 31.4"/>
              <circle cx="25" cy="25" r="20" fill="none" stroke="#388E1B" strokeWidth="6" strokeDasharray="31.4 31.4" strokeDashoffset="31.4"/>
            </svg>
            <div className="text-[#388E1B] font-bold text-lg">Traitement de la commande...</div>
          </div>
        </div>
      )}
      {/* Header sticky/fixed */}
      <header className="fixed top-0 left-0 w-full z-30 bg-[#F5F5E5] shadow-md flex items-center px-2 sm:px-8 justify-between"
        style={{ height: '56px', minHeight: '56px' }}>
        <div className="flex-1 flex items-center min-w-0">
          <img src={"/logo.png"} alt={'nutrijus'} width={72} height={60} className="z-10 drop-shadow-2xl max-h-12 w-auto" />
        </div>
        <nav className="flex gap-4 sm:gap-10 text-[#388E1B] font-medium text-base">
        </nav>
        <div className="flex items-center gap-2 sm:gap-5">
          <button
            type="button"
            className="relative w-12 h-12 rounded-full bg-[#FF9800]/10 flex items-center justify-center hover:bg-[#FF9800]/20 transition border-2 border-[#FFD600] text-[#388E1B]"
            aria-label="Voir le panier"
            onClick={() => setShowCart(true)}
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M7 7V6a5 5 0 0 1 10 0v1" stroke="#388E1B" strokeWidth="2" fill="none" />
              <rect x="5" y="7" width="14" height="12" rx="3" stroke="#388E1B" strokeWidth="2" fill="none" />
              <circle cx="9" cy="17" r="1.5" fill="#FF9800" />
              <circle cx="15" cy="17" r="1.5" fill="#FF9800" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-[#FF9800] text-[#388E1B] text-xs font-bold rounded-full px-2 py-0.5 shadow-md border-2 border-white">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </button>
        </div>
        {/* Cart Modal & Overlay */}
        {showCart && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
              onClick={() => setShowCart(false)}
              aria-label="Fermer le panier"
            />
            {/* Modal */}
            <aside
              className="fixed top-0 right-0 h-screen w-[400px] max-w-full bg-[#F5F5E5] shadow-2xl z-50 flex flex-col transition-transform duration-300 animate-slideInRight border-l-4 border-[#FFD600]"
              style={{ maxWidth: '100vw' }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#FFD600] bg-[#F5F5E5]">
                <h2 className="text-2xl font-bold text-[#388E1B]">Votre panier</h2>
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-[#FF9800]/10 flex items-center justify-center hover:bg-[#FF9800]/30 transition text-[#388E1B] border-2 border-[#FFD600]"
                  onClick={() => setShowCart(false)}
                  aria-label="Fermer le panier"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="#388E1B" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10">Votre panier est vide.</div>
                ) : (
                  <ul className="space-y-5">
                    {cart.map((item, idx) => {
                      const prod = products.find(p => p.name === item.productId);
                      if (!prod) return null;
                      return (
                        <li key={item.productId} className="flex items-center gap-4 border-b border-gray-100 pb-4">
                          <img src={prod.image} alt={prod.name} className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                          <div className="flex-1">
                            <div className="font-bold text-[#357A1A] text-lg">{prod.name}</div>
                            <div className="text-gray-500 text-sm">{prod.weight}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                className="w-7 h-7 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold text-lg hover:bg-[#FF7A00]/20"
                                onClick={() => {
                                  const item = cart.find(i => i.productId === prod.name);
                                  if (item && item.quantity > 1) {
                                    addToCart(prod.name, -1);
                                  } else {
                                    removeFromCart(prod.name);
                                  }
                                }}
                                aria-label="Diminuer la quantité"
                              >
                                –
                              </button>
                              <span className="font-bold text-gray-700 text-base px-2 select-none" style={{ minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{item.quantity}</span>
                              <button
                                type="button"
                                className="w-7 h-7 rounded-full bg-[#4A9800]/10 text-[#4A9800] flex items-center justify-center font-bold text-lg hover:bg-[#4A9800]/20"
                                onClick={() => addToCart(prod.name, 1)}
                                aria-label="Augmenter la quantité"
                                disabled={item.quantity >= 99}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935]/10 hover:bg-[#E53935]/40 text-[#E53935]"
                              onClick={() => removeFromCart(prod.name)}
                              aria-label="Supprimer l’article"
                            >
                              <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M5 5l8 8M13 5l-8 8" stroke="#E53935" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                            <div className="font-extrabold text-[#E53935] text-xl">{(prod.price * item.quantity).toFixed(0)} FCFA</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-[#357A1A]">
                    {cart.reduce((sum, item) => {
                      const prod = products.find(p => p.name === item.productId);
                      return sum + (prod ? prod.price * item.quantity : 0);
                    }, 0).toFixed(0)} FCFA
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full py-3 rounded-full bg-[#4A9800] text-[#388E1B] font-bold text-lg shadow hover:bg-[#357A1A] transition cursor-pointer"
                  onClick={() => setShowOrderModal(true)}
                >
                  <span className="text-white">Valider la commande</span>
                </button>

                {/* Modal de validation de commande */}
                {showOrderModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <form
                      className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col gap-4 relative"
                      style={{ zIndex: 60 }}
                      onSubmit={async e => {
                            console.log('SUBMIT FORMULAIRE COMMANDE');
                        e.preventDefault();
                        if (!clientName.trim() || !clientPhone.trim() || !deliveryPlace.trim()) {
                          setOrderError("Veuillez remplir tous les champs obligatoires.");
                          return;
                        }
                        // Validation stricte du numéro de téléphone Cameroun
                        const phoneRegex = /^6[986257][0-9]{7}$/;
                        if (!phoneRegex.test(clientPhone)) {
                          setOrderError("Numéro de téléphone invalide. Format attendu : 6XXXXXXXX (Cameroun)");
                          return;
                        }
                        // Calcul du total
                        const totalProducts = cart.reduce((sum, item) => {
                          const prod = products.find(p => p.name === item.productId);
                          return sum + (prod ? prod.price * item.quantity : 0);
                        }, 0);
                        const fraisLivraison = 1000;
                        const total = totalProducts + fraisLivraison;
                        // Format de la commande
                        const order: Order = {
                          id: Date.now().toString(),
                          createdAt: new Date().toISOString(),
                          customerInfo: {
                            name: clientName,
                            phone: clientPhone,
                            isWhatsapp: isWhatsapp,
                            deliveryPlace: deliveryPlace
                          },
                          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                          total,
                          date: new Date().toISOString(),
                          status: OrderStatus.Pending,
                          delivery: deliveryPlace,
                          payment: PaymentMode.CashOnDelivery
                        };
                        // Envoi (utilise l’API existante via placeOrder si possible)
                        if (typeof placeOrder === 'function') {
                          setOrderLoading(true);
                          const ok = await placeOrder(order);
                          setOrderLoading(false);
                          if (ok) {
                            setShowCart(false);
                            setShowOrderModal(false);
                            setOrderError("");
                            setOrderFeedback({ type: 'success', message: 'Commande validée avec succès !' });
                          } else {
                            setShowCart(false);
                            setShowOrderModal(false);
                            setOrderError("");
                            setOrderFeedback({ type: 'error', message: 'Erreur lors de la validation de la commande.' });
                          }
                          // Ne ferme plus la modale ici, attend la confirmation de l'utilisateur
                          // setShowOrderModal(false);
                        }
                      }}
                    >
                      <button type="button" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FF9800]/10 flex items-center justify-center hover:bg-[#FF9800]/30 transition text-[#388E1B] border-2 border-[#FFD600]" onClick={() => setShowOrderModal(false)} aria-label="Fermer">
                        <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M5 5l8 8M13 5l-8 8" stroke="#388E1B" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                      <h3 className="text-xl font-bold text-[#388E1B] mb-2">Finaliser la commande</h3>
                      <label className="font-semibold text-[#357A1A]">Nom complet <span className="text-red-500">*</span></label>
                      <input className="border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD600] placeholder-gray-500 text-gray-900" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Votre nom" required />
                      <label className="font-semibold text-[#357A1A]">Téléphone <span className="text-red-500">*</span></label>
                      <div className="flex gap-2 items-center">
                        <span className="px-2 py-2 rounded-l border border-gray-400 bg-gray-100 text-gray-700 select-none">+237</span>
                        <input
                          className="border border-gray-400 rounded-r px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#FFD600] placeholder-gray-500 text-gray-900"
                          value={clientPhone}
                          onChange={e => {
                            // N'accepte que des chiffres
                            const val = e.target.value.replace(/\D/g, "");
                            setClientPhone(val);
                          }}
                          placeholder="6XXXXXXXX" maxLength={9} required
                          pattern="6[986257][0-9]{7}"
                          inputMode="numeric"
                          autoComplete="tel"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="flex items-center gap-2 text-sm text-[#357A1A] font-semibold break-words">
                          <input type="checkbox" checked={isWhatsapp} onChange={e => setIsWhatsapp(e.target.checked)} className="w-5 h-5" />
                          Ce numéro est-il disponible sur WhatsApp&nbsp;?
                        </label>
                      </div>
                      <label className="font-semibold text-[#357A1A]">Lieu de livraison <span className="text-red-500">*</span></label>
                      <input className="border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD600] placeholder-gray-500 text-gray-900" value={deliveryPlace} onChange={e => setDeliveryPlace(e.target.value)} placeholder="Ex: Pharmacie Emia" required />
                      <div className="text-gray-600 text-sm my-2">Frais de livraison : <span className="font-bold text-[#E53935]">1000 FCFA</span> — Paiement à la livraison</div>
                      <div className="text-lg font-bold text-[#357A1A] mb-2">Total à payer : {(cart.reduce((sum, item) => {
                        const prod = products.find(p => p.name === item.productId);
                        return sum + (prod ? prod.price * item.quantity : 0);
                      }, 0) + 1000).toLocaleString()} FCFA</div>
                      {orderError && <div className="text-red-500 text-sm text-center">{orderError}</div>}
                      <button type="submit" className="w-full py-3 rounded-full bg-[#357A1A] text-white font-bold text-lg shadow hover:bg-[#285f13] transition cursor-pointer mt-2">Confirmer la commande</button>
                    </form>
                  </div>
                )}
              </div>
            </aside>
            <style jsx>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slideInRight {
                animation: slideInRight 0.3s cubic-bezier(.4,0,.2,1);
              }
            `}</style>
          </>
        )}
      </header>
      {/* Carrousel immersif plein écran */}
      <div className="absolute left-0 top-[72px] w-screen" style={{ height: 'calc(100vh - 72px)', background: '#F5F5E5', zIndex: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Flèche gauche */}
        <button
          onClick={prevProduct}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#FF9800] hover:bg-[#388E1B] hover:text-white transition text-2xl text-[#388E1B] font-bold z-30"
          style={{ boxShadow: "0 2px 12px #FFD58033" }}
          aria-label="Produit précédent"
        >
          &#8592;
        </button>
        {/* Carrousel coverflow */}
        <div
          className="relative w-full h-full flex items-center justify-center pb-24"
          onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
          onTouchMove={e => setTouchEndX(e.touches[0].clientX)}
          onTouchEnd={() => {
            if (touchStartX !== null && touchEndX !== null) {
              const diff = touchStartX - touchEndX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) {
                  nextProduct(); // Swipe gauche
                } else {
                  prevProduct(); // Swipe droite
                }
              }
            }
            setTouchStartX(null);
            setTouchEndX(null);
          }}
        >

          {products.map((prod, i) => {
            const prevIdx = (carouselIndex - 1 + products.length) % products.length;
            const nextIdx = (carouselIndex + 1) % products.length;
            if (![prevIdx, carouselIndex, nextIdx].includes(i)) return null;
            let cardClass =
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 flex flex-col items-center justify-center shadow-2xl bg-white rounded-3xl border-4 border-[#FFD580] p-6 overflow-hidden";
            let scale = "scale-100";
            let z = "z-20";
            let opacity = "opacity-100";
            let translate = "";
            if (i === prevIdx) {
              scale = "scale-90";
              z = "z-10";
              opacity = "opacity-80";
              translate = "-translate-x-[60%] -rotate-8";
            } else if (i === nextIdx) {
              scale = "scale-90";
              z = "z-10";
              opacity = "opacity-80";
              translate = "translate-x-[60%] rotate-8";
            }
            return (
              <div
                key={prod.name}
                className={`${cardClass} ${scale} ${z} ${opacity} ${translate} cursor-pointer w-[90vw] max-w-xl h-[90vh] max-h-[88vh] md:max-h-[700px]`}
                onClick={() => setCarouselIndex(i)}
                style={{ boxShadow: i === carouselIndex ? "0 8px 32px #FFD58066" : "0 2px 12px #FFD58033" }}
              >
                {/* Image produit */}
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-40 h-40 md:w-56 md:h-56 object-contain rounded-2xl shadow-lg mb-4 bg-white"
                />
                {/* Nom, poids */}
                <div className="text-3xl font-extrabold text-[#388E1B] mb-1 text-center">{prod.name}</div>

                {/* Description */}
                <div className="text-[#388E1B]/90 text-base mb-1 text-center line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '3.2em' }}>
                  {prod.description}
                </div>
                {prod.description && prod.description.length > 80 && (
                  <div className="mb-4 flex justify-center">
                    <button
                      className="px-3 py-1 bg-white text-[#4A9800] text-sm font-semibold hover:underline rounded-full border border-[#4A9800]/30 shadow-sm"
                      onClick={e => { e.stopPropagation(); setDescModalProduct(prod.name); }}
                    >Lire plus</button>
                  </div>
                )}
                {/* Modal description complète */}
                {descModalProduct === prod.name && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDescModalProduct(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                      <button className="absolute top-2 right-2 text-[#E53935] text-2xl font-bold" onClick={() => setDescModalProduct(null)} aria-label="Fermer">&times;</button>
                      <h2 className="text-xl font-bold mb-4 text-[#357A1A]">Description complète</h2>
                      <div className="text-[#388E1B] text-base whitespace-pre-line">{prod.description}</div>
                    </div>
                  </div>
                )}
                {/* Ingrédients */}
                {prod.ingredients && prod.ingredients.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    {prod.ingredients.map((ing, j) => (
                      <div key={j} className="flex items-center gap-2 bg-white px-3 h-9 rounded-full text-sm font-bold text-[#388E1B] border border-[#FFD600] shadow-sm min-w-[70px]">
                        {ing.icon && <img src={ing.icon} alt={ing.name} className="rounded-full w-7 h-7 object-cover bg-white" />}
                        <span>{ing.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Nutrition */}
                {prod.nutrition && prod.nutrition.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {prod.nutrition.map((nut, k) => (
                      <div key={k} className="bg-white text-[#FF7A00] rounded-2xl px-4 py-2 text-base font-semibold min-w-[90px] text-center border border-[#FFD580] shadow-sm">
                        <div className="text-xs opacity-80">{nut.name}</div>
                        <div className={`text-lg font-bold ${nut.name && nut.name.toLowerCase().includes('énergie') ? 'text-[#E53935]' : ''}`}>{nut.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Prix */}
                <div className="mb-2 flex items-center justify-center">
                  <span className="inline-block px-5 py-2 rounded-full border-2 border-[#4A9800] bg-white text-[#E53935] text-xl font-extrabold min-w-[90px] text-center">
                    {prod.price.toFixed(0)} FCFA
                    {prod.weight && (
                      <span className="text-[#388E1B] text-lg font-semibold ml-2">/ {prod.weight}</span>
                    )}
                  </span>
                </div>
                {/* Quantité + bouton panier (desktop seulement, design original conservé) */}
                <div className="hidden sm:flex items-center gap-4 mt-2">
                  <button
                    className="w-7 h-7 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold text-lg hover:bg-[#FF7A00]/20 transition"
                    onClick={e => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}
                    aria-label="Diminuer la quantité"
                    disabled={quantity <= 1}
                  >-</button>
                  <span className="font-bold text-gray-700 text-base px-2 select-none" style={{ minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{quantity} Litre</span>
                  <button
                    className="w-7 h-7 rounded-full bg-[#4A9800]/10 text-[#4A9800] flex items-center justify-center font-bold text-lg hover:bg-[#4A9800]/20 transition"
                    onClick={e => { e.stopPropagation(); setQuantity(q => Math.min(99, q + 1)); }}
                    aria-label="Augmenter la quantité"
                    disabled={quantity >= 99}
                  >+</button>
                  <button
                    className="ml-4 px-4 py-3 rounded-full bg-[#FF7A00] text-white font-bold shadow hover:bg-[#357A1A] hover:text-white transition text-base flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 cursor-pointer whitespace-nowrap text-sm sm:text-base"
                    style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={e => {
                      e.stopPropagation();
                      addToCart(prod.name, quantity);
                      setShowCart(true);
                      setQuantity(1);
                    }}
                    aria-label="Commander maintenant"
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="mr-1">
                      <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                      <path d="M6 6V4a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                    Commander maintenant
                  </button>
                </div>
                {/* Bouton panier seul : mobile */}
                <div className="flex sm:hidden w-full mt-4">
                  <button
                    className="w-full px-4 py-3 rounded-full bg-[#FF7A00] text-white font-bold shadow hover:bg-[#357A1A] hover:text-white transition text-base flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 cursor-pointer whitespace-nowrap text-sm"
                    style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={e => {
                      e.stopPropagation();
                      addToCart(prod.name, 1);
                      setShowCart(true);
                      setQuantity(1);
                    }}
                    aria-label="Commander maintenant"
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="mr-1">
                      <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                      <path d="M6 6V4a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                    Commander maintenant
                  </button>
                </div>

              </div>
            );
          })}
        </div>
        {/* Flèche droite */}
        <button
          onClick={nextProduct}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#FF9800] hover:bg-[#388E1B] hover:text-white transition text-2xl text-[#388E1B] font-bold z-30"
          style={{ boxShadow: "0 2px 12px #FFD58033" }}
          aria-label="Produit suivant"
        >
          &#8594;
        </button>
        {/* Footer du carrousel, visible mais non fixe */}

      </div>
    </div>
  );
}

