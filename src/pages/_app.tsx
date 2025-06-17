import "@/styles/globals.css";
import type { AppProps } from "next/app";

import { ShopProvider } from "../context/ShopContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ShopProvider>
      <Component {...pageProps} />
    </ShopProvider>
  );
}
