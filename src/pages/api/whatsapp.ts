import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const { to, message } = req.body;
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneNumberId) {
        return res.status(500).json({ error: 'WhatsApp API credentials missing.' });
    }

    const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: "individual",
        to: to,
        type: 'text',
        text: {
            preview_url: false,
            body: message
        }
    };

    try {
        const apiRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        console.log("apiRes: ", apiRes)
        const data = await apiRes.json();
        console.log("data: ", data)
        if (!apiRes.ok) return res.status(500).json(data);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : error });
    }
}
