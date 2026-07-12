(() => {
  const STORAGE_KEY = 'maltezos-cookie-consent';

  if (localStorage.getItem(STORAGE_KEY) === 'accepted') {
    return;
  }

  const translations = {
    cy: {
      message: 'Χρησιμοποιούμε απαραίτητα cookies για να λειτουργεί σωστά η σελίδα και για να θυμάται τις ρυθμίσεις σου.',
      accept: 'Αποδοχή',
      privacy: 'Πολιτική προστασίας',
      returns: 'Πολιτική επιστροφών',
      consent: 'Συγκατάθεση'
    },
    el: {
      message: 'Χρησιμοποιούμε απαραίτητα cookies για να λειτουργεί σωστά η σελίδα και για να θυμάται τις ρυθμίσεις σου.',
      accept: 'Αποδοχή',
      privacy: 'Πολιτική προστασίας',
      returns: 'Πολιτική επιστροφών',
      consent: 'Συγκατάθεση'
    },
    en: {
      message: 'We use essential cookies so the site works properly and remembers your preferences.',
      accept: 'Accept',
      privacy: 'Privacy Policy',
      returns: 'Returns Policy',
      consent: 'Consent Policy'
    }
  };

  const language = document.documentElement.lang === 'en' ? 'en' : (document.documentElement.lang === 'cy' ? 'cy' : 'el');
  let copy = translations[language] || translations.el;

  const style = document.createElement('style');
  style.textContent = `
    .cookie-banner {
      position: fixed;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      width: calc(100% - 28px);
      max-width: 820px;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.96);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 18px;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.24);
      backdrop-filter: blur(12px);
      padding: 14px 16px;
    }

    .cookie-banner__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .cookie-banner__text {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.5;
      color: #e2e8f0;
      flex: 1 1 320px;
    }

    .cookie-banner__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cookie-banner__link,
    .cookie-banner__button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 9px 14px;
      font: inherit;
      font-size: 0.84rem;
      font-weight: 700;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.16);
      transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      white-space: nowrap;
    }

    .cookie-banner__link {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.06);
    }

    .cookie-banner__button {
      color: #ffffff;
      background: linear-gradient(135deg, #e11d48 0%, #ef4444 100%);
      cursor: pointer;
    }

    .cookie-banner__link:hover,
    .cookie-banner__button:hover {
      transform: translateY(-1px);
    }

    .cookie-banner__button:hover {
      background: linear-gradient(135deg, #be123c 0%, #dc2626 100%);
    }

    @media (max-width: 640px) {
      .cookie-banner {
        bottom: 12px;
        padding: 12px 12px;
      }

      .cookie-banner__inner {
        gap: 10px;
      }

      .cookie-banner__text {
        font-size: 0.84rem;
      }

      .cookie-banner__link,
      .cookie-banner__button {
        padding: 8px 12px;
        font-size: 0.8rem;
      }
    }
  `;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <div class="cookie-banner__inner">
      <p class="cookie-banner__text"></p>
      <div class="cookie-banner__actions">
        <a class="cookie-banner__link" href="privacy-policy.html"></a>
        <a class="cookie-banner__link" href="returns-policy.html"></a>
        <a class="cookie-banner__link" href="consent.html"></a>
        <button class="cookie-banner__button" type="button"></button>
      </div>
    </div>
  `;

  const messageEl = banner.querySelector('.cookie-banner__text');
  const privacyLink = banner.querySelectorAll('.cookie-banner__link')[0];
  const returnsLink = banner.querySelectorAll('.cookie-banner__link')[1];
  const consentLink = banner.querySelectorAll('.cookie-banner__link')[2];
  const button = banner.querySelector('.cookie-banner__button');

  function syncCopy() {
    const nextLanguage = document.documentElement.lang === 'en' ? 'en' : (document.documentElement.lang === 'cy' ? 'cy' : 'el');
    copy = translations[nextLanguage] || translations.el;
    messageEl.textContent = copy.message;
    privacyLink.textContent = copy.privacy;
    returnsLink.textContent = copy.returns;
    consentLink.textContent = copy.consent;
    button.textContent = copy.accept;
  }

  syncCopy();

  document.head.appendChild(style);
  document.body.appendChild(banner);
  button?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    banner.remove();
  });

  const languageObserver = new MutationObserver(() => {
    if (document.body.contains(banner)) {
      syncCopy();
    }
  });

  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
})();
