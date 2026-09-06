const MARKER = '<!-- MALTEZOS_HEAD_ASSETS_V2 -->';

const headAssets = `${MARKER}
<link rel="stylesheet" href="/assets/maltezos-redesign.css?v=5" data-maltezos-redesign>
<link rel="stylesheet" href="/assets/maltezos-motion.css?v=6" data-maltezos-motion>
<link rel="stylesheet" href="/assets/maltezos-fixes.css?v=3" data-maltezos-fixes>
<link rel="stylesheet" href="/assets/maltezos-shop-final.css?v=1" data-maltezos-shop-final>
<link rel="stylesheet" href="/assets/maltezos-loader.css?v=3" data-maltezos-loader>
<script defer src="/assets/js/maltezos-motion.js?v=5" data-maltezos-motion></script>
<script defer src="/assets/js/maltezos-loader.js?v=4" data-maltezos-loader></script>`;

export default async (_request: Request, context: any) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('text/html')) {
    return response;
  }

  const html = await response.text();
  if (html.includes(MARKER) || !html.includes('</head>')) {
    return new Response(html, response);
  }

  const injected = html.replace('</head>', `${headAssets}\n</head>`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'no-cache, no-store, must-revalidate');

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export const config = {
  path: '/*'
};
