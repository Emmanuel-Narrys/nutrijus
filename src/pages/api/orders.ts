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

function writeOrders(orders: any[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orders = readOrders();
    return res.status(200).json(orders);
  }
  if (req.method === 'POST') {
    const orders = readOrders();
    const newOrder = req.body;
    orders.unshift(newOrder);
    writeOrders(orders);
    return res.status(201).json(newOrder);
  }
  if (req.method === 'PUT') {
    const { index, order } = req.body;
    const orders = readOrders();
    if (index < 0 || index >= orders.length) return res.status(400).json({ error: 'Invalid index' });
    orders[index] = order;
    writeOrders(orders);
    return res.status(200).json(order);
  }
  if (req.method === 'DELETE') {
    const { index } = req.body;
    const orders = readOrders();
    if (index < 0 || index >= orders.length) return res.status(400).json({ error: 'Invalid index' });
    const deleted = orders.splice(index, 1);
    writeOrders(orders);
    return res.status(200).json(deleted[0]);
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
