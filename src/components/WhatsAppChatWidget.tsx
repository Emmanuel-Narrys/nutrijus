'use client';
import React, { useState, useEffect } from 'react';

const WhatsAppChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '',
          message
        })
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setSent(true);
      setMessage('');
    } catch (err) {
      setError('Impossible d\'envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999999,
          background: 'red', // DEBUG: couleur très voyante
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: 28,
          cursor: 'pointer',
        }}
        aria-label="Ouvrir le chat WhatsApp"
        title="Support WhatsApp"
      >
        💬
      </button>
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          right: 24,
          zIndex: 9999,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          padding: 16,
          width: 320,
        }}>
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: 8 }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                rows={3}
                style={{ width: '100%', resize: 'none', borderRadius: 8, border: '1px solid #ddd', padding: 8 }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
            {sent && <span style={{ color: '#25D366', marginLeft: 8 }}>✔️ Envoyé</span>}
            {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
          </form>
        </div>
      )}
    </>
  );
};

export default WhatsAppChatWidget;
