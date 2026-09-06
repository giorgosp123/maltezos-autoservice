const fs = require('fs');

const files = [
  'index.html',
  'shop.html',
  'product-details.html',
  'privacy-policy.html',
  'returns-policy.html',
  'consent.html',
  'terms-of-use.html'
];

const marker = '<!-- MALTEZOS_CRITICAL_BOOT_V1 -->';
const block = `${marker}
<script>document.documentElement.classList.add('mz-preboot');</script>
<style>
  html.mz-preboot{background:#050607!important;overflow:hidden!important}
  html.mz-preboot body{visibility:hidden!important}
  html.mz-preboot::before{content:"";position:fixed;inset:0;z-index:2147483646;background:radial-gradient(circle at 50% 48%,rgba(239,35,60,.12),transparent 30%),#050607;visibility:visible!important;pointer-events:none}
  html.mz-preboot::after{content:"MALTEZOS\\A AUTOSERVICE / TRANSMISSION";white-space:pre;position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:88vw;text-align:center;color:#fff;visibility:visible!important;font:800 clamp(34px,9vw,72px)/.9 Arial,sans-serif;letter-spacing:-.055em;text-shadow:0 18px 50px rgba(0,0,0,.45);pointer-events:none}
</style>
<link rel="stylesheet" href="assets/maltezos-redesign.css?v=3" data-maltezos-redesign>
<link rel="stylesheet" href="assets/maltezos-motion.css?v=4" data-maltezos-motion>
<link rel="stylesheet" href="assets/maltezos-fixes.css?v=1" data-maltezos-fixes>
<link rel="stylesheet" href="assets/maltezos-loader.css?v=2" data-maltezos-loader>
<script defer src="assets/js/maltezos-motion.js?v=3" data-maltezos-motion></script>
<script defer src="assets/js/maltezos-loader.js?v=2" data-maltezos-loader></script>`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(marker)) continue;
  if (!html.includes('<head>')) throw new Error(`${file}: missing <head>`);
  html = html.replace('<head>', `<head>\n${block}`);
  fs.writeFileSync(file, html);
  console.log(`patched ${file}`);
}
