import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { ShopProvider } from "../context/ShopContext";

import PWAInstallButton from "../components/PWAInstallButton";
import { useEffect } from "react";
import registerServiceWorker from "../registerServiceWorker";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ShopProvider>
      <Component {...pageProps} />
      <PWAInstallButton />
    </ShopProvider>
  );
}
