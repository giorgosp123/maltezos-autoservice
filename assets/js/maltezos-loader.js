(() => {
  if (window.__maltezosLoaderLoaded) return;
  window.__maltezosLoaderLoaded = true;

  // Safety cleanup from the old loader experiments.
  document.documentElement.classList.remove('mz-preboot', 'mz-simple-loading', 'maltezos-is-loading');
  document.getElementById('mz-core-continuation')?.remove();

  const LOADER_ID = 'maltezos-page-loader';
  const TRANSITION_KEY = 'maltezos-internal-transition';
  const internalHost = location.host;
  let navigationTimer = 0;

  // If the previous Maltezos page already showed the loader before navigation,
  // do not start it a second time on the destination page.
  const arrivedFromInternalTransition = sessionStorage.getItem(TRANSITION_KEY) === '1';
  if (arrivedFromInternalTransition) {
    sessionStorage.removeItem(TRANSITION_KEY);
  }

  function ensureLoader(hidden = false) {
    let loader = document.getElementById(LOADER_ID);
    if (loader) return loader;

    loader = document.createElement('div');
    loader.id = LOADER_ID;
    loader.className = hidden ? 'maltezos-loader is-hidden' : 'maltezos-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = `
      <div class="maltezos-loader__inner">
        <img class="maltezos-loader__logo" src="assets/icons/IMG_53591-removebg-preview.png" alt="Maltezos Autoservice" />
        <div class="maltezos-loader__track"><div class="maltezos-loader__bar"></div></div>
      </div>`;
    document.body.appendChild(loader);
    return loader;
  }

  function showLoader() {
    ensureLoader(false).classList.remove('is-hidden');
  }

  function hideLoader() {
    const loader = ensureLoader(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => loader.classList.add('is-hidden'));
    });
  }

  if (arrivedFromInternalTransition) {
    // The outgoing page already displayed the transition loader.
    // Start this page with the loader hidden so the animation is not repeated.
    ensureLoader(true);
  } else {
    showLoader();

    if (document.readyState === 'complete') {
      window.setTimeout(hideLoader, 160);
    } else {
      window.addEventListener('load', () => window.setTimeout(hideLoader, 160), { once: true });
    }

    // Failsafe: never leave the visitor trapped behind the loader.
    window.setTimeout(hideLoader, 2500);
  }

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
    sessionStorage.setItem(TRANSITION_KEY, '1');
    showLoader();
    clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      location.href = url.href;
    }, 120);
  }, true);

  window.addEventListener('pageshow', (event) => {
    document.documentElement.classList.remove('mz-preboot', 'mz-simple-loading', 'maltezos-is-loading');
    if (event.persisted) {
      sessionStorage.removeItem(TRANSITION_KEY);
      hideLoader();
    }
  });
})();