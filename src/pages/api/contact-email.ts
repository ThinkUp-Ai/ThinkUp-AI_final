import type { APIRoute } from "astro";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const GET: APIRoute = async () => {
  const configuredEmail = import.meta.env.CONTACT_EMAIL?.trim();

  if (!configuredEmail) {
    return new Response(
      JSON.stringify({
        error: "Kontakt-E-Mail ist auf dem Server nicht konfiguriert.",
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }

  return new Response(
    JSON.stringify({
      email: configuredEmail,
    }),
    {
      status: 200,
      headers: JSON_HEADERS,
    }
  );
};

export const ALL: APIRoute = async () =>
  new Response(JSON.stringify({ error: "Methode nicht erlaubt." }), {
    status: 405,
    headers: JSON_HEADERS,
  });
