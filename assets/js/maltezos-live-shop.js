(() => {
  const ROOT = document.querySelector('#products .products');
  if (!ROOT) return;

  const SUPABASE_URL = 'https://annzsqojhqmxwsascarz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_TFBYQK9-4ejf3SpL4FskLg_-utlA1zo';
  const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  let products = [];
  let timers = [];

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function language() {
    const saved = localStorage.getItem('maltezos-language');
    return ['cy', 'el', 'en'].includes(saved) ? saved : 'cy';
  }

  function copyFor(product, lang) {
    return {
      name: product[`name_${lang}`] || product.name_cy || product.name_el || product.id,
      description: product[`description_${lang}`] || product.description_cy || product.description_el || '',
      order: lang === 'en' ? 'Order' : 'Παραγγελία',
      stock: lang === 'en' ? 'Availability' : 'Διαθεσιμότητα',
      unit: (count) => lang === 'en' ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'κομμάτι' : 'κομμάτια')
    };
  }

  function stockClass(stock) {
    if (stock <= 1) return 'stock-low';
    if (stock <= 2) return 'stock-medium';
    return 'stock-high';
  }

  function fallbackGear() {
    return `<svg class="gear-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="16" fill="#111827"/><circle cx="32" cy="32" r="6" fill="#f8fafc"/><g fill="#d7263d"><rect x="30" y="4" width="4" height="10" rx="2"/><rect x="30" y="50" width="4" height="10" rx="2"/><rect x="4" y="30" width="10" height="4" rx="2"/><rect x="50" y="30" width="10" height="4" rx="2"/></g></svg>`;
  }

  function render() {
    timers.forEach(clearInterval);
    timers = [];
    const lang = language();

    ROOT.innerHTML = products.map((product) => {
      const c = copyFor(product, lang);
      const stock = Number(product.stock || 0);
      const price = Number(product.price_with_trade_in || 0);
      const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
      const first = images[0] || '';
      return `<article class="product" data-item="${escapeHtml(product.id)}" data-stock="${stock}">
        <div class="product-media">
          ${first ? `<img class="product-rotating-image" src="${escapeHtml(first)}" alt="${escapeHtml(c.name)}" style="display:block">` : fallbackGear()}
        </div>
        <div class="product-body">
          <h3 class="product-title">${escapeHtml(c.name)}</h3>
          <p class="product-meta">${escapeHtml(c.description)}</p>
          <p class="product-stock ${stockClass(stock)}"><span class="dot" aria-hidden="true"></span><span class="label">${escapeHtml(c.stock)}</span><span class="value">${stock} ${escapeHtml(c.unit(stock))}</span></p>
          <div class="price-row">
            <span class="price">€${Number.isInteger(price) ? price : price.toFixed(2)}</span>
            <a class="buy-btn" href="product-details.html?item=${encodeURIComponent(product.id)}">${escapeHtml(c.order)}</a>
          </div>
        </div>
      </article>`;
    }).join('');

    products.forEach((product) => {
      const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
      if (images.length < 2) return;
      const card = ROOT.querySelector(`.product[data-item="${CSS.escape(product.id)}"]`);
      const image = card?.querySelector('.product-rotating-image');
      if (!image) return;
      let index = 0;
      const timer = window.setInterval(() => {
        index = (index + 1) % images.length;
        image.src = images[index];
      }, 2200);
      timers.push(timer);
    });
  }

  async function refresh() {
    try {
      const { createClient } = await import(CDN);
      const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { data, error } = await client
        .from('maltezos_products')
        .select('id,name_cy,name_el,name_en,description_cy,description_el,description_en,images,stock,price_with_trade_in,price_without_trade_in,visible,sort_order')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      products = Array.isArray(data) ? data : [];
      render();
    } catch (error) {
      console.warn('Maltezos live shop fallback active:', error?.message || error);
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('.lang-option')) {
      window.setTimeout(() => products.length && render(), 80);
    }
  });

  window.addEventListener('pageshow', () => refresh());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else refresh();
})();
