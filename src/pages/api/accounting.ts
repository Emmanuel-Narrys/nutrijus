import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

function readOrders() {
  if (!fs.existsSync(DATA_PATH)) return [];
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function readProducts() {
  const PRODUCTS_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');
  if (!fs.existsSync(PRODUCTS_PATH)) return [];
  const data = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orders = readOrders();
    const products = readProducts();
    const revenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    // Calcul du coût de production total
    let totalProductionCost = 0;
    for (const order of orders) {
      for (const item of order.items || []) {
        const prod = products.find((p: any) => p.name === item.name);
        if (prod && prod.productionCost) {
          totalProductionCost += prod.productionCost * (item.qty || 1);
        }
      }
    }
    const margin = revenue - totalProductionCost;
    return res.status(200).json({ revenue, orders, margin });
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
