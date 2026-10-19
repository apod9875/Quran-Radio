export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Edge caching for audio streams or API calls if needed
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/radio/')) {
      const cache = caches.default;
      let response = await cache.match(request);
      if (!response) {
        response = await fetch(request);
        // Cache response at Cloudflare Edge for 1 hour
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cache-Control', 'public, max-age=3600');
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
        ctx.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    }

    // Default fetch for static assets (Cloudflare Pages bucket)
    return env.ASSETS.fetch(request);
  }
};
