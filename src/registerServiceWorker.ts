// Ce fichier enregistre le service worker pour le PWA
export default function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          // SW registered
        })
        .catch(error => {
          // SW registration failed
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}
