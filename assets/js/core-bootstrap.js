(() => {
  const corePath = document.documentElement.dataset.maltezosCore;
  if (!corePath) return;

  const criticalBoot = `
<script>document.documentElement.classList.add('mz-preboot');<\/script>
<style>
html.mz-preboot{background:#050607!important;overflow:hidden!important}
html.mz-preboot body{visibility:hidden!important}
html.mz-preboot::before{content:"";position:fixed;inset:0;z-index:2147483646;background:radial-gradient(circle at 50% 48%,rgba(239,35,60,.14),transparent 30%),#050607;visibility:visible!important;pointer-events:none}
html.mz-preboot::after{content:"MALTEZOS\\A AUTOSERVICE / TRANSMISSION";white-space:pre;position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:88vw;text-align:center;color:#fff;visibility:visible!important;font:800 clamp(34px,9vw,72px)/.9 Arial,sans-serif;letter-spacing:-.055em;text-shadow:0 18px 50px rgba(0,0,0,.45);pointer-events:none}
</style>`;

  const designAssets = `
<link rel="stylesheet" href="assets/maltezos-redesign.css?v=5" data-maltezos-redesign>
<link rel="stylesheet" href="assets/maltezos-motion.css?v=6" data-maltezos-motion>
<link rel="stylesheet" href="assets/maltezos-fixes.css?v=3" data-maltezos-fixes>
<link rel="stylesheet" href="assets/maltezos-loader.css?v=4" data-maltezos-loader>
<script defer src="assets/js/maltezos-motion.js?v=5" data-maltezos-motion><\/script>
<script defer src="assets/js/maltezos-loader.js?v=4" data-maltezos-loader><\/script>`;

  const fail = () => {
    const message = document.querySelector('.mz-shell-message');
    if (message) message.textContent = 'Πατήστε για επαναφόρτωση';
    document.body.addEventListener('click', () => location.reload(), { once: true });
  };

  fetch(`${corePath}?boot=20260906-2`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((html) => {
      if (!/<head[\s>]/i.test(html) || !/<\/head>/i.test(html)) throw new Error('Invalid HTML');

      html = html.replace(/<head([^>]*)>/i, (match) => `${match}${criticalBoot}`);
      html = html.replace(/<\/head>/i, `${designAssets}</head>`);

      document.open();
      document.write(html);
      document.close();
    })
    .catch(fail);
})();
