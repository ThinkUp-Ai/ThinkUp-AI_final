export const prerender = false; // nicht statisch rendern

import nodemailer from 'nodemailer'; // ESM-Import (nodemailer unterstützt das)
import { consumeRateLimit } from '../../lib/chat/rateLimiter';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'anonymous';
}

function sanitizeText(input: unknown, maxLength: number) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return new Response(JSON.stringify({ ok: false, error: 'Es werden nur JSON-Anfragen akzeptiert.' }), {
        status: 415,
        headers: JSON_HEADERS,
      });
    }

    const rateLimit = consumeRateLimit(`${getClientIdentifier(request)}:send-mail`);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ ok: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es spaeter erneut.' }), {
        status: 429,
        headers: {
          ...JSON_HEADERS,
          'Retry-After': String(Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1)),
        },
      });
    }

    const data = await request.json();
    const name = sanitizeText(data?.name, 120);
    const email = sanitizeText(data?.email, 254);
    const message = sanitizeText(data?.message, 4000);

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'Bitte fuellen Sie alle Pflichtfelder aus.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ ok: false, error: 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (!import.meta.env.GMAIL_USER || !import.meta.env.GMAIL_APP_PASSWORD) {
      return new Response(JSON.stringify({ ok: false, error: 'Der Mailversand ist aktuell nicht verfuegbar.' }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: import.meta.env.GMAIL_USER,
        pass: import.meta.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Kontaktformular" <${import.meta.env.GMAIL_USER}>`,
      to: import.meta.env.MAIL_TO || import.meta.env.GMAIL_USER,
      subject: `Neue Anfrage von ${name}`,
      replyTo: email,
      text: message,
    });

    return new Response(JSON.stringify({ ok: true, id: info.messageId }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Die Nachricht konnte nicht versendet werden.' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
