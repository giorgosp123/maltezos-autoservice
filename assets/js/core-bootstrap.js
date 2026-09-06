(() => {
  const corePath = document.documentElement.dataset.maltezosCore;
  if (!corePath) return;

  const bootHead = `
<script>window.__maltezosCoreBoot=true;<\/script>
<style>
.mz-core-continuation{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:radial-gradient(circle at 50% 45%,rgba(239,35,60,.14),transparent 32%),#050607;color:#fff;opacity:1;visibility:visible;transition:opacity .34s cubic-bezier(.22,.8,.22,1),visibility .34s ease}.mz-core-continuation.is-done{opacity:0;visibility:hidden;pointer-events:none}.mz-core-continuation__inner{text-align:center;width:min(82vw,420px)}.mz-core-continuation__logo{display:block;width:min(300px,70vw);height:auto;margin:0 auto 18px;filter:drop-shadow(0 18px 42px rgba(0,0,0,.38))}.mz-core-continuation__sub{margin-top:9px;color:rgba(255,255,255,.48);font:800 10px/1.2 Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase}.mz-core-continuation__track{width:min(210px,58vw);height:2px;margin:24px auto 0;background:#25272b;overflow:hidden}.mz-core-continuation__bar{width:38%;height:100%;background:#ef233c;animation:mzCoreLoad 1s ease-in-out infinite}.mz-core-continuation__message{margin-top:16px;color:rgba(255,255,255,.35);font:10px/1.2 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}@keyframes mzCoreLoad{from{transform:translateX(-120%)}to{transform:translateX(360%)}}@media(prefers-reduced-motion:reduce){.mz-core-continuation__bar{animation:none;width:100%}}
</style>`;

  const designAssets = `
<link rel="stylesheet" href="assets/maltezos-redesign.css?v=5" data-maltezos-redesign>
<link rel="stylesheet" href="assets/maltezos-motion.css?v=6" data-maltezos-motion>
<link rel="stylesheet" href="assets/maltezos-fixes.css?v=3" data-maltezos-fixes>
<link rel="stylesheet" href="assets/maltezos-loader.css?v=4" data-maltezos-loader>
<script defer src="assets/js/maltezos-motion.js?v=5" data-maltezos-motion><\/script>
<script defer src="assets/js/maltezos-loader.js?v=5" data-maltezos-loader><\/script>`;

  const continuation = `
<div id="mz-core-continuation" class="mz-core-continuation" aria-hidden="true">
  <div class="mz-core-continuation__inner">
    <img class="mz-core-continuation__logo" src="assets/icons/IMG_53591-removebg-preview.png" alt="" />
    <div class="mz-core-continuation__sub">Autoservice / Transmission</div>
    <div class="mz-core-continuation__track"><div class="mz-core-continuation__bar"></div></div>
    <div class="mz-core-continuation__message">Loading</div>
  </div>
</div>`;

  const fail = () => {
    const message = document.querySelector('.mz-shell-message');
    if (message) message.textContent = 'Πατήστε για επαναφόρτωση';
    document.body.addEventListener('click', () => location.reload(), { once: true });
  };

  fetch(`${corePath}?boot=20260906-4`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((html) => {
      if (!/<head[\s>]/i.test(html) || !/<\/head>/i.test(html) || !/<body[\s>]/i.test(html)) {
        throw new Error('Invalid HTML');
      }

      html = html.replace(/<head([^>]*)>/i, (match) => `${match}${bootHead}`);
      html = html.replace(/<\/head>/i, `${designAssets}</head>`);
      html = html.replace(/<body([^>]*)>/i, (match) => `${match}${continuation}`);

      document.open();
      document.write(html);
      document.close();
    })
    .catch(fail);
})();
