import fs from 'fs';
import path from 'path';

// Paths
const ORDERS_PATH = path.resolve(__dirname, '../data/orders.json');
const PRODUCTS_PATH = path.resolve(__dirname, '../data/products.json');

// Load products
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

// Load orders
const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf-8'));

// Build name-to-id map
const nameToId: Record<string, string> = {};
products.forEach((p: any) => {
  if (p.name && p.id) nameToId[p.name] = p.id;
});

// Migrate orders
let changed = false;
orders.forEach((order: any) => {
  if (Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      // If productId is a name and we have an id for it, replace
      if (nameToId[item.productId]) {
        // Only change if not already the id
        if (item.productId !== nameToId[item.productId]) {
          item.productId = nameToId[item.productId];
          changed = true;
        }
      }
    });
  }
});

if (changed) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
  console.log('Migration terminée : les productId des commandes sont maintenant uniformisés.');
} else {
  console.log('Aucune modification nécessaire.');
}
