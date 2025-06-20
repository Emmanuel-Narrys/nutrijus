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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orders = readOrders();
    return res.status(200).json(orders);
  }
  if (req.method === 'POST') {
    const orders = readOrders();
    if (req.body && req.body.bulk && Array.isArray(req.body.orders)) {
      // Création en masse : ajoute chaque commande individuellement
      for (const order of req.body.orders) {
        orders.unshift(order);
      }
      writeOrders(orders);
      return res.status(201).json({ success: true, count: req.body.orders.length });
    } else {
      const newOrder = req.body;
      orders.unshift(newOrder);
      writeOrders(orders);
      // --- Envoi WhatsApp à l'admin ---
      try {
        const adminNumber = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN;
        if (adminNumber) {
          await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminNumber,
              message: `Nouvelle commande reçue :\n${JSON.stringify(newOrder, null, 2)}`
            })
          });
        }
        // --- Envoi WhatsApp au client ---
        if (newOrder.customerInfo && newOrder.customerInfo.phone) {
          await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: newOrder.customerInfo.phone,
              message: `Merci pour votre commande ! Voici le récapitulatif :\n${JSON.stringify(newOrder, null, 2)}`
            })
          });
        }
      } catch (e) {
        // Optionnel: log l'erreur
        console.error('Erreur lors de l\'envoi WhatsApp:', e);
      }
      return res.status(201).json(newOrder);
    }
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
