const MARKER = '<!-- MALTEZOS_SERVER_BOOT_V1 -->';

const criticalBoot = `${MARKER}
<script>document.documentElement.classList.add('mz-preboot');</script>
<style>
html.mz-preboot{background:#050607!important;overflow:hidden!important}
html.mz-preboot body{visibility:hidden!important}
html.mz-preboot::before{content:"";position:fixed;inset:0;z-index:2147483646;background:radial-gradient(circle at 50% 48%,rgba(239,35,60,.14),transparent 30%),#050607;visibility:visible!important;pointer-events:none}
html.mz-preboot::after{content:"MALTEZOS\\A AUTOSERVICE / TRANSMISSION";white-space:pre;position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:88vw;text-align:center;color:#fff;visibility:visible!important;font:800 clamp(34px,9vw,72px)/.9 Arial,sans-serif;letter-spacing:-.055em;text-shadow:0 18px 50px rgba(0,0,0,.45);pointer-events:none}
</style>
<link rel="stylesheet" href="/assets/maltezos-redesign.css?v=4" data-maltezos-redesign>
<link rel="stylesheet" href="/assets/maltezos-motion.css?v=5" data-maltezos-motion>
<link rel="stylesheet" href="/assets/maltezos-fixes.css?v=2" data-maltezos-fixes>
<link rel="stylesheet" href="/assets/maltezos-loader.css?v=3" data-maltezos-loader>
<script defer src="/assets/js/maltezos-motion.js?v=4" data-maltezos-motion></script>
<script defer src="/assets/js/maltezos-loader.js?v=3" data-maltezos-loader></script>`;

export default async (request: Request, context: any) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('text/html')) {
    return response;
  }

  const html = await response.text();
  if (html.includes(MARKER) || !html.includes('<head>')) {
    return new Response(html, response);
  }

  const injected = html.replace('<head>', `<head>\n${criticalBoot}`);
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
