import type { APIRoute } from 'astro';

// Zwischenspeicher (Cache)
let cachedVideo: { id: string; updated: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten
const MIN_VIDEO_DURATION_SECONDS = 120; // Nur Videos länger als 2 Minuten

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

export const GET: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.YOUTUBE_API_KEY;
  const channelId = import.meta.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return new Response(JSON.stringify({ error: 'Missing API key or channel ID' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = Date.now();
  const urlParams = new URL(request.url).searchParams;
  const noCache = urlParams.get('nocache') === 'true';

  if (!noCache && cachedVideo && now - cachedVideo.updated < CACHE_DURATION) {
    return new Response(JSON.stringify({ videoId: cachedVideo.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=25&type=video`;

  try {
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      return new Response(JSON.stringify({ error: `YouTube search failed (${searchRes.status})` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const searchData = await searchRes.json();

    const items: Array<{ id?: { videoId?: string } }> = searchData.items || [];
    const videoIds = items
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Keine Videos gefunden.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Batch-Anfrage: Hole Details aller gefundenen Videos in einer Anfrage
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(',')}&part=contentDetails&fields=items(id,contentDetails(duration))`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) {
      return new Response(JSON.stringify({ error: `YouTube details failed (${detailsRes.status})` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const detailsData = await detailsRes.json();

    const detailsItems: Array<{ id: string; contentDetails?: { duration?: string } }> = detailsData.items || [];

    // Erstelle eine Map von VideoID -> Dauer in Sekunden
    const videoIdToDurationSeconds = new Map<string, number>();
    for (const item of detailsItems) {
      const seconds = parseISO8601Duration(item.contentDetails?.duration || '');
      videoIdToDurationSeconds.set(item.id, seconds);
    }

    // Finde das erste Video aus der Suchliste, das länger als MIN_VIDEO_DURATION_SECONDS ist
    const matchingVideoId = videoIds.find((id) => (videoIdToDurationSeconds.get(id) || 0) > MIN_VIDEO_DURATION_SECONDS);

    if (matchingVideoId) {
      cachedVideo = { id: matchingVideoId, updated: now };
      return new Response(JSON.stringify({ videoId: matchingVideoId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Kein Video > 2 Minuten gefunden.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Interner Fehler', details: e?.message || 'unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
