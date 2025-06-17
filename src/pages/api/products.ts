import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'products.json');

function readProducts() {
  if (!fs.existsSync(DATA_PATH)) return [];
  const data = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeProducts(products: any[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const products = readProducts();
    return res.status(200).json(products);
  }
  if (req.method === 'POST') {
    const products = readProducts();
    const newProduct = req.body;
    // Générer un ID unique
    newProduct.id = Date.now().toString();
    // S'assurer que productionCost est bien un nombre
    newProduct.productionCost = Number(newProduct.productionCost) || 0;
    products.unshift(newProduct);
    writeProducts(products);
    return res.status(201).json(newProduct);
  }
  if (req.method === 'PUT') {
    const { id, product } = req.body;
    const products = readProducts();
    const idx = products.findIndex((p: any) => p.id === id);
    if (idx === -1) return res.status(400).json({ error: 'Produit non trouvé' });
    products[idx] = { ...products[idx], ...product };
    writeProducts(products);
    return res.status(200).json(products[idx]);
  }
  if (req.method === 'DELETE') {
    const { index } = req.body;
    const products = readProducts();
    if (index < 0 || index >= products.length) return res.status(400).json({ error: 'Invalid index' });
    const deleted = products.splice(index, 1);
    writeProducts(products);
    return res.status(200).json(deleted[0]);
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
