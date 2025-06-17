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
    <div className="max-h-screen h-screen w-full flex flex-col items-center justify-between px-0 py-0 bg-white relative overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex items-center justify-center py-6 px-10 bg-white text-[#357A1A]">
        <div className="flex items-center gap-2">
          <img src={"/images/logo.png"} alt={'nutrijus'} width={120} height={100} className="z-10 drop-shadow-2xl" />
          <div className="text-sm text-[#357A1A]">+237699889182</div>
        </div>
      </header>
      {/* Main content split */}
      <div className="relative w-full flex flex-col items-center justify-center z-10">
        {/* Image produit */}
        <div className="relative flex flex-col items-center justify-center h-full">
          <img 
            src={product.image} 
            alt={product.name} 
            className="z-10 drop-shadow-2xl mx-auto w-auto max-h-[38vh] md:max-h-[44vh] min-h-[120px] max-w-full object-contain transition-all duration-300"
          />
        </div>
        {/* Ingrédients en badges scroll horizontal */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3 mt-4 overflow-x-auto">
          {product.ingredients && product.ingredients.length > 0 && product.ingredients.map((ing: any, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-white px-4 h-10 rounded-full text-base font-bold text-[#FF7A00] border border-[#FFD580] shadow-sm min-w-[80px]">
              {ing.icon && <img src={ing.icon} alt={ing.name} className="rounded-full w-8 h-8 object-cover" />}
              <span className="text-base font-bold leading-none flex items-center h-full">{ing.name}</span>
            </div>
          ))}
        </div>
        {/* Nutrition en grille 2 colonnes */}
        <div className="w-full grid grid-cols-2 gap-4 mt-4">
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
        <button onClick={prevProduct} className="w-12 h-12 rounded-full bg-[#4A9800] flex items-center justify-center border-2 border-white hover:bg-white/10 transition text-2xl text-white font-bold">
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
              <div className="text-lg font-bold text-[#E53935]">{prod.price.toFixed(0)} FCFA</div>
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
        <button onClick={nextProduct} className="w-12 h-12 rounded-full bg-[#4A9800] flex items-center justify-center border-2 border-white hover:bg-white/10 transition text-2xl text-white font-bold">
          &#8594;
        </button>
      </div>
      {/* Footer */}
      <div className="py-2 text-white text-md opacity-80 z-10">Réalisé par @cerantech</div>
    </div>
  );
}

