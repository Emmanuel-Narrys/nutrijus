import type { NextApiRequest, NextApiResponse } from 'next';

// Pour la vérification du webhook WhatsApp (GET)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Meta (Facebook) webhook verification
    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden');
    }
  }

  if (req.method === 'POST') {
    // Traitement des messages reçus
    const data = req.body;
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          const messages = value.messages || [];
          for (const msg of messages) {
            if (msg.type === 'text') {
              const from = msg.from; // numéro de l'expéditeur
              const text = msg.text.body;
              // --- LOGIQUE BOT ---
              let reply = "";
              if (/bonjour|salut|hello/i.test(text)) {
                reply = "Bonjour ! Comment puis-je vous aider ?";
              } else if (/commande/i.test(text)) {
                reply = "Pour passer une commande, rendez-vous sur https://nutrijus.com ou dites-moi ce que vous souhaitez !";
              } else {
                reply = "Merci pour votre message ! Un conseiller vous répondra bientôt.";
              }
              // --- RÉPONDRE VIA L'API ---
              const token = process.env.WHATSAPP_TOKEN;
              const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
              const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
              await fetch(url, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: from,
                  type: 'text',
                  text: { body: reply }
                })
              });
            }
          }
        }
      }
    }
    res.status(200).json({ received: true });
  } else {
    res.status(405).end();
  }
}
