(() => {
  if (window.__maltezosLoaderLoaded) return;
  window.__maltezosLoaderLoaded = true;

  const LOADER_ID = 'maltezos-page-loader';
  const internalHost = location.host;
  let navigationTimer = 0;

  function ensureLoader() {
    let loader = document.getElementById(LOADER_ID);
    if (loader) return loader;

    loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.className = 'maltezos-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = `
      <div class="maltezos-loader__inner">
        <img class="maltezos-loader__logo" src="assets/icons/IMG_53591-removebg-preview.png" alt="Maltezos Autoservice" />
        <div class="maltezos-loader__sub">Autoservice / Transmission</div>
        <div class="maltezos-loader__track"><div class="maltezos-loader__bar"></div></div>
      </div>`;
    document.body.appendChild(loader);
    return loader;
  }

  function showLoader() {
    ensureLoader().classList.remove('is-hidden');
  }

  function hideLoader() {
    const loader = ensureLoader();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => loader.classList.add('is-hidden'));
    });
  }

  showLoader();

  if (document.readyState === 'complete') {
    window.setTimeout(hideLoader, 180);
  } else {
    window.addEventListener('load', () => window.setTimeout(hideLoader, 180), { once: true });
  }

  window.setTimeout(hideLoader, 3000);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    let url;
    try {
      url = new URL(anchor.href, location.href);
    } catch {
      return;
    }

    if (url.host !== internalHost || !/^https?:$/.test(url.protocol)) return;

    const samePageHash = url.pathname === location.pathname && url.search === location.search && url.hash;
    if (samePageHash) return;

    event.preventDefault();
    showLoader();
    clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      location.href = url.href;
    }, 140);
  }, true);

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) hideLoader();
  });
})();