(() => {
  if (window.__maltezosLoaderLoaded) return;
  window.__maltezosLoaderLoaded = true;

  const LOADER_ID = 'maltezos-page-loader';
  const internalHost = location.host;
  const bootstrapped = window.__maltezosCoreBoot === true;
  let navigationTimer = 0;

  function ensureLoader(hidden = false) {
    let loader = document.getElementById(LOADER_ID);
    if (loader) return loader;

    loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.className = hidden ? 'maltezos-loader is-hidden' : 'maltezos-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = `
      <div class="maltezos-loader__inner">
        <img class="maltezos-loader__logo" src="assets/icons/IMG_53591-removebg-preview.png" alt="" />
        <div class="maltezos-loader__sub">Autoservice / Transmission</div>
        <div class="maltezos-loader__track"><div class="maltezos-loader__bar"></div></div>
      </div>`;
    document.body.appendChild(loader);
    return loader;
  }

  function showLoader() {
    const loader = ensureLoader(false);
    loader.classList.remove('is-hidden');
    document.documentElement.classList.add('maltezos-is-loading');
  }

  function hideLoader() {
    const loader = ensureLoader(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loader.classList.add('is-hidden');
        document.documentElement.classList.remove('maltezos-is-loading');
      });
    });
  }

  function finishBootContinuation() {
    const continuation = document.getElementById('mz-core-continuation');
    if (!continuation) return;
    continuation.classList.add('is-done');
    window.setTimeout(() => continuation.remove(), 420);
  }

  if (bootstrapped) {
    // The first-paint shell is already covering the page. Keep the normal loader
    // hidden so there is no second loading screen.
    ensureLoader(true);
    const finish = () => window.setTimeout(finishBootContinuation, 120);
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    window.setTimeout(finishBootContinuation, 2800);
  } else {
    showLoader();
    const finishInitialLoad = () => window.setTimeout(hideLoader, 260);
    if (document.readyState === 'complete') finishInitialLoad();
    else window.addEventListener('load', finishInitialLoad, { once: true });
    window.setTimeout(hideLoader, 2800);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    if (url.host !== internalHost || !/^https?:$/.test(url.protocol)) return;

    const samePageHash = url.pathname === location.pathname && url.search === location.search && url.hash;
    if (samePageHash) return;

    event.preventDefault();
    showLoader();
    clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      location.href = url.href;
    }, 180);
  }, true);

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      showLoader();
      window.setTimeout(hideLoader, 180);
    }
  });
})();
