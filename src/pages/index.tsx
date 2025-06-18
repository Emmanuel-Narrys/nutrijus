import React from "react";

import { useShop } from "../context/ShopContext";

export default function Home() {
  const [quantity, setQuantity] = React.useState(1);
  const [showCart, setShowCart] = React.useState(false);
  // --- Fonctions utilitaires pour positionnement dynamique ---
  function getCirclePosition(index: number, total: number, radius: number) {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  }
  function getEllipsePosition(index: number, total: number, rx: number, ry: number) {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  }

  // --- Accès produits et panier via le contexte ---
  const { products, addToCart, cart, removeFromCart, placeOrder } = useShop();
  const [orderConfirmed, setOrderConfirmed] = React.useState(false);
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

  const product = products[carouselIndex];

  // Responsive radius helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const ING_RADIUS = isMobile ? 90 : 170;
  const DEC_RX = isMobile ? 110 : 200;
  const DEC_RY = isMobile ? 60 : 120;

  return (
    <div className="max-h-screen h-screen w-full flex flex-col items-center justify-between px-0 py-0 bg-[#F5F5E5] relative overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-6 px-10 bg-[#F5F5E5] text-[#388E1B]">
        <div className="flex items-center gap-2">
          <img src={"/images/logo.png"} alt={'nutrijus'} width={120} height={100} className="z-10 drop-shadow-2xl" />
        </div>
        <nav className="flex gap-10 text-[#388E1B] font-medium text-base">
          <a href="tel:+237699889182" className="hover:underline">+237699889182</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
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
                                className="w-7 h-7 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold text-lg hover:bg-[#FF7A00]/20"
                                onClick={() => removeOneFromCart(item.productId)}
                                aria-label="Diminuer la quantité"
                              >
                                –
                              </button>
                              <span className="font-bold text-gray-700 text-base px-2 select-none" style={{ minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{item.quantity}</span>
                              <button
                                className="w-7 h-7 rounded-full bg-[#4A9800]/10 text-[#4A9800] flex items-center justify-center font-bold text-lg hover:bg-[#4A9800]/20"
                                onClick={() => addToCart(item.productId, 1)}
                                aria-label="Augmenter la quantité"
                                disabled={item.quantity >= 99}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E53935]/10 hover:bg-[#E53935]/40 text-[#E53935]"
                              onClick={() => removeFromCart(item.productId)}
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
                  className="w-full py-3 rounded-full bg-[#4A9800] text-[#388E1B] font-bold text-lg shadow hover:bg-[#357A1A] transition"
                  onClick={() => {
                    placeOrder();
                    setShowCart(false);
                    setOrderConfirmed(true);
                    setTimeout(() => setOrderConfirmed(false), 2500);
                  }}
                >
                  Valider la commande
                </button>
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
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.5s cubic-bezier(.4,0,.2,1);
              }
            `}</style>
          </>
        )}

      </header>
      {/* Main content split */}
      <div className="relative w-full flex flex-row z-10">
        {/* Left column */}
        <div className="flex flex-col justify-start items-start w-[40%] pl-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#388E1B] leading-tight mb-2">
            {product.name}
            <span className="text-2xl font-semibold text-[#388E1B]/70 ml-2">({product.weight})</span>
          </h1>
          <p className="text-[#388E1B]/90 max-w-md text-base mb-4 mt-2">
            {product.description}
          </p>


          {/* Quantity and cart */}
          <div className="flex items-center gap-4 mt-4">
            <div className="px-5 py-2 rounded-full border-2 border-[#4A9800] bg-white text-[#E53935] text-xl font-extrabold flex items-center min-w-[90px] justify-center">
              {product.price.toFixed(0)} FCFA
            </div>
            <button
              className="w-7 h-7 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center font-bold text-lg hover:bg-[#FF7A00]/20 transition"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
              disabled={quantity <= 1}
            >-</button>
            <span className="font-bold text-gray-700 text-base px-2 select-none" style={{ minWidth: 32, display: 'inline-block', textAlign: 'center' }}>{quantity} Litre</span>
            <button
              className="w-7 h-7 rounded-full bg-[#4A9800]/10 text-[#4A9800] flex items-center justify-center font-bold text-lg hover:bg-[#4A9800]/20 transition"
              onClick={() => setQuantity(q => Math.min(99, q + 1))}
              aria-label="Augmenter la quantité"
              disabled={quantity >= 99}
            >+</button>
            <button
              className="ml-4 px-6 py-3 rounded-full bg-[#FF7A00] text-white font-bold shadow hover:bg-[#357A1A] hover:text-white transition text-base flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 cursor-pointer"
              onClick={() => {
                addToCart(product.name, quantity);
                setShowCart(true);
                setQuantity(1);
              }}
              aria-label="Ajouter au panier"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="mr-1">
                <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                <path d="M6 6V4a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              Ajouter au panier
            </button>
          </div>
        </div>
        {/* Center column - jar and ingredients/decorations */}
        <div className="relative w-[40%] flex flex-col items-center justify-center">
          {/* Pot principal */}
          <div className="relative flex flex-col items-center justify-center h-full">
            <img
              src={product.image}
              alt={product.name}
              className="z-10 drop-shadow-2xl mx-auto w-auto max-h-[40vh] md:max-h-[48vh] min-h-[120px] max-w-full object-contain transition-all duration-300"
            />
            {/* Ingrédients sous le pot */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 mb-2 w-full">
                {product.ingredients.map((ing: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-4 h-10 rounded-full text-base font-bold text-[#388E1B] border border-[#FFD600] shadow-sm min-w-[80px]">
                    {ing.icon && <img src={ing.icon} alt={ing.name} className="rounded-full w-8 h-8 object-cover bg-white" />}
                    <span className="text-base font-bold leading-none flex items-center h-full">{ing.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Right column - nutrition */}
        <div className="flex flex-col items-end justify-start w-[20%] pt-5 pr-8 gap-4">
          {product.nutrition && product.nutrition.length > 0 && product.nutrition.map((nut: any, i: number) => (
            <div key={i} className="bg-white text-[#FF7A00] rounded-2xl px-6 py-4 text-lg font-semibold min-w-[120px] text-right border border-[#FFD580] shadow-sm">
              <div className="text-base opacity-80">{nut.name}</div>
              <div className={`text-xl font-bold ${nut.name && nut.name.toLowerCase().includes('énergie') ? 'text-[#E53935]' : ''}`}>{nut.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Carrousel produits */}
      <div className="mt-14 flex items-center justify-center gap-8 w-full">
        <button onClick={prevProduct} className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#FF9800] hover:bg-[#388E1B] hover:text-white transition text-2xl text-[#388E1B] font-bold cursor-pointer">
          &#8592;
        </button>
        {products.map((prod, i) => (
          <div
            key={prod.name}
            className={`flex items-center gap-2 bg-white rounded-2xl px-5 py-3 border-2 transition cursor-pointer relative h-24 md:h-28 min-w-[140px] ${i === carouselIndex ? "border-[#FFD580] scale-105" : "border-transparent opacity-60"}`}
            onClick={() => setCarouselIndex(i)}
            style={{ minWidth: 140 }}
          >
            <img src={prod.image} alt={prod.name} className="rounded-xl w-16 h-16 md:w-20 md:h-20 object-cover flex-shrink-0" />
            <div className="flex flex-col justify-center h-full">
              <div className="font-bold text-[#FF7A00] text-base">{prod.name}</div>
              <div className="text-sm text-[#FF7A00]/70">{prod.weight}</div>
              <div className="mt-1">
                <span className="inline-block px-3 py-1 rounded-full border border-[#FFD580] bg-white text-[#E53935] text-base font-extrabold min-w-[70px] text-center">
                  {prod.price.toFixed(0)} FCFA
                </span>
              </div>
              {/* Chevron sur la carte de droite */}
              {i === (carouselIndex + 1) % products.length && (
                <button
                  onClick={nextProduct}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white w-8 h-8 rounded-full shadow flex items-center justify-center border border-[#a18cd1]/30 hover:bg-gray-100 transition"
                  aria-label="Next product"
                >
                  <span className="text-2xl text-[#a18cd1] font-bold">→</span>
                </button>
              )}
            </div>
          </div>
        ))}
        <button onClick={nextProduct} className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#FF9800] hover:bg-[#388E1B] hover:text-white transition text-2xl text-[#388E1B] font-bold cursor-pointer">
          &#8594;
        </button>
      </div>
      {/* Footer */}
      <div className="py-2 text-[#388E1B] text-md opacity-80 z-10">Réalisé par @cerantech</div>
    </div>
  );
}

