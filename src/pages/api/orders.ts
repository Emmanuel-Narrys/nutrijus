import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'orders.json');

// Helper to format WhatsApp order message
function formatOrderForWhatsApp(order: any): string {
  const productList = (order.items || [])
    .map((item: any) => `- ${item.name} x${item.quantity} (${item.price * item.quantity} FCFA)`)
    .join('\n') || "-";

  return `
Merci pour votre commande chez NutriJus ! 🥤

🧾 Détails de la commande :
- Numéro de commande : ${order.orderNumber || '-'}
- Date : ${order.orderDate || new Date().toLocaleDateString('fr-FR')}

👤 Informations client :
- Nom : ${order.customerInfo?.name || '-'}
- Téléphone : ${order.customerInfo?.phone || '-'}
- Adresse : ${order.customerInfo?.address || '-'}

📦 Produits commandés :
${productList}

💵 Total à payer : ${order.total || '-'} FCFA

Nous vous contacterons bientôt pour la livraison.
Merci de votre confiance ! 🙏
`.trim();
}

// Helper to format WhatsApp order status update
function formatOrderStatusForWhatsApp(order: any): string {
  return `Bonjour ${order.customerInfo?.name || ''},\n\nLe statut de votre commande chez NutriJus a été mis à jour :\n\n🧾 Numéro de commande : ${order.orderNumber || '-'}\nStatut actuel : ${order.status || '-'}\n\nMerci pour votre confiance ! 🙏`;
}

// Helper to format WhatsApp order deletion message
function formatOrderDeleteForWhatsApp(order: any): string {
  return `Bonjour ${order.customerInfo?.name || ''},\n\nVotre commande chez NutriJus a été annulée.\n\n🧾 Numéro de commande : ${order.orderNumber || '-'}\n\nSi vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.\n\nMerci et à bientôt !`;
}

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
              message: formatOrderForWhatsApp(newOrder)
            })
          });
        }
        // --- Envoi WhatsApp au client ---
        if (newOrder.customerInfo && newOrder.customerInfo.phone) {
          await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: `237${newOrder.customerInfo.phone}`,
              message: formatOrderForWhatsApp(newOrder)
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

    const oldOrder = orders[index];
    const oldStatus = oldOrder.status;
    const newStatus = order.status;

    // Compare old and new order excluding status
    const { status: oldStatusOmitted, ...oldOrderRest } = oldOrder || {};
    const { status: newStatusOmitted, ...newOrderRest } = order || {};
    const isStatusChanged = oldStatus !== newStatus;
    const isOtherFieldsChanged = JSON.stringify(oldOrderRest) !== JSON.stringify(newOrderRest);

    orders[index] = {...order, payment: oldOrder.payment};
    writeOrders(orders);

    // WhatsApp notification logic
    if (order.customerInfo && order.customerInfo.phone) {
      try {
        if (isStatusChanged && !isOtherFieldsChanged) {
          // Only status changed
          const statusMessage = formatOrderStatusForWhatsApp(order);
          await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: `237${order.customerInfo.phone}`,
              message: statusMessage
            })
          });
        } else if (isOtherFieldsChanged) {
          // Other fields changed (send order info message)
          const infoMessage = formatOrderForWhatsApp(order);
          await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: `237${order.customerInfo.phone}`,
              message: infoMessage
            })
          });
          // If status also changed, send status message too
          if (isStatusChanged) {
            const statusMessage = formatOrderStatusForWhatsApp(order);
            await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: `237${order.customerInfo.phone}`,
                message: statusMessage
              })
            });
          }
        }
      } catch (e) {
        console.error('Erreur lors de l\'envoi WhatsApp (mise à jour commande):', e);
      }
    }
    return res.status(200).json(order);
  }
  if (req.method === 'DELETE') {
    const { index } = req.body;
    const orders = readOrders();
    if (index < 0 || index >= orders.length) return res.status(400).json({ error: 'Invalid index' });
    const deleted = orders.splice(index, 1);
    writeOrders(orders);

    // Send WhatsApp deletion message to customer
    const deletedOrder = deleted[0];
    if (deletedOrder && deletedOrder.customerInfo && deletedOrder.customerInfo.phone) {
      try {
        const deleteMessage = formatOrderDeleteForWhatsApp(deletedOrder);
        await fetch(`${req.headers.origin || ''}/api/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: `237${deletedOrder.customerInfo.phone}`,
            message: deleteMessage
          })
        });
      } catch (e) {
        console.error('Erreur lors de l\'envoi WhatsApp (suppression commande):', e);
      }
    }
    return res.status(200).json(deletedOrder);
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
