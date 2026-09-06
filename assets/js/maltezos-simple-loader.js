(() => {
  const loader = document.getElementById('mz-simple-loader');
  if (!loader) return;

  const root = document.documentElement;
  let navTimer = 0;

  function showLoader() {
    root.classList.add('mz-simple-loading');
    loader.classList.remove('is-hidden');
  }

  function hideLoader() {
    loader.classList.add('is-hidden');
    root.classList.remove('mz-simple-loading');
  }

  const finishInitialLoad = () => window.setTimeout(hideLoader, 220);
  if (document.readyState === 'complete') finishInitialLoad();
  else window.addEventListener('load', finishInitialLoad, { once: true });

  // Safety fallback so the page can never remain stuck behind the loader.
  window.setTimeout(hideLoader, 3500);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }

    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;

    event.preventDefault();
    showLoader();
    clearTimeout(navTimer);
    navTimer = window.setTimeout(() => {
      location.href = url.href;
    }, 90);
  }, true);

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    showLoader();
    window.setTimeout(hideLoader, 180);
  });
})();
