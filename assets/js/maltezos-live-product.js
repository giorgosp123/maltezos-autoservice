(() => {
  if (!document.querySelector('.product-page')) return;
  const URL_BASE='https://annzsqojhqmxwsascarz.supabase.co';
  const KEY='sb_publishable_TFBYQK9-4ejf3SpL4FskLg_-utlA1zo';
  const CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  const item=new URLSearchParams(location.search).get('item')||'';
  let product=null;
  let galleryObserver=null;
  let gallerySyncing=false;

  const lang=()=>['cy','el','en'].includes(localStorage.getItem('maltezos-language'))?localStorage.getItem('maltezos-language'):'cy';
  const money=v=>{const n=Number(v||0);return Number.isInteger(n)?String(n):n.toFixed(2)};
  const stockClass=n=>n<=1?'stock-low':n<=2?'stock-medium':'stock-high';
  const absoluteSrc=src=>{try{return new URL(String(src||''),location.href).href}catch{return String(src||'')}};
  const text=(p,l)=>({
    name:p[`name_${l}`]||p.name_cy||p.name_el||p.id,
    description:p[`description_${l}`]||p.description_cy||p.description_el||'',
    specs:p[`specs_${l}`]||p.specs_cy||p.specs_el||[],
    stock:l==='en'?'Availability':'Διαθεσιμότητα',
    unit:n=>l==='en'?(n===1?'item':'items'):(n===1?'κομμάτι':'κομμάτια'),
    vat:l==='en'?'VAT incl.':'με ΦΠΑ',
    with:l==='en'?'With old gearbox exchange':'Με ανταλλαγή παλιού κιβωτίου',
    without:l==='en'?'Without old gearbox exchange':'Χωρίς ανταλλαγή παλιού κιβωτίου',
    final:l==='en'?'final price':'τελική τιμή'
  });

  function galleryMatches(grid,list){
    const current=[...grid.querySelectorAll('.thumb-btn img')].map(img=>absoluteSrc(img.getAttribute('src')||img.src));
    const expected=list.map(absoluteSrc);
    return current.length===expected.length&&current.every((src,i)=>src===expected[i]);
  }

  function watchGallery(grid){
    if(galleryObserver)galleryObserver.disconnect();
    galleryObserver=new MutationObserver(()=>{
      if(gallerySyncing||!product)return;
      const expected=(Array.isArray(product.images)?product.images.filter(Boolean):[]).slice(0,8);
      if(!galleryMatches(grid,expected)){
        const c=text(product,lang());
        gallery(product.images,c.name);
      }
    });
    galleryObserver.observe(grid,{childList:true,subtree:true});
  }

  function gallery(images,name){
    const list=Array.isArray(images)?[...new Set(images.filter(Boolean))].slice(0,8):[];
    const main=document.getElementById('product-main-image');
    const fallback=document.getElementById('product-fallback-icon');
    const grid=document.getElementById('thumb-grid');
    if(!main||!grid)return;

    if(galleryObserver)galleryObserver.disconnect();
    gallerySyncing=true;
    grid.innerHTML='';
    grid.style.display=list.length?'grid':'none';

    if(!list.length){
      main.style.display='none';
      if(fallback)fallback.style.display='';
      gallerySyncing=false;
      watchGallery(grid);
      return;
    }

    const setMain=(src,btn)=>{
      main.src=src;
      main.alt=name;
      main.style.display='block';
      if(fallback)fallback.style.display='none';
      grid.querySelectorAll('.thumb-btn').forEach(b=>b.classList.remove('active'));
      btn?.classList.add('active');
    };

    list.forEach((src,i)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='thumb-btn'+(i===0?' active':'');
      const im=document.createElement('img');
      im.src=src;
      im.alt=`${name} ${i+1}`;
      b.appendChild(im);
      b.addEventListener('click',()=>setMain(src,b));
      grid.appendChild(b);
    });

    setMain(list[0],grid.querySelector('.thumb-btn'));
    gallerySyncing=false;
    watchGallery(grid);
  }

  function pricing(p,c){
    const select=document.getElementById('tradein-select');
    const display=document.getElementById('price-display');
    const a=Number(p.price_with_trade_in||0),b=Number(p.price_without_trade_in||0);
    if(select){
      const oa=select.querySelector('option[value="with"]'),ob=select.querySelector('option[value="without"]');
      if(oa)oa.textContent=`${c.with} — ${c.final} €${money(a)}`;
      if(ob)ob.textContent=`${c.without} — ${c.final} €${money(b)}`;
      if(!select.dataset.liveBound){select.dataset.liveBound='1';select.addEventListener('change',render)}
    }
    const price=select?.value==='without'?b:a;
    if(display)display.innerHTML=`€${money(price)} <span class="price-vat">${c.vat}</span>`;
  }

  function render(){
    if(!product)return;
    const l=lang(),c=text(product,l),n=Number(product.stock||0);
    document.title=`${c.name} | Maltezos Autoservice`;
    const name=document.getElementById('product-name'),desc=document.getElementById('product-description'),specs=document.getElementById('product-specs'),badge=document.getElementById('stock-display');
    if(name)name.textContent=c.name;
    if(desc)desc.textContent=c.description;
    if(specs){specs.innerHTML='';(Array.isArray(c.specs)?c.specs:[]).forEach(v=>{const li=document.createElement('li');li.textContent=v;specs.appendChild(li)})}
    if(badge){
      badge.classList.remove('stock-low','stock-medium','stock-high');
      badge.classList.add(stockClass(n));
      const label=badge.querySelector('.stock-label'),value=badge.querySelector('.stock-value');
      if(label)label.textContent=c.stock;
      if(value)value.textContent=`${n} ${c.unit(n)}`;
    }
    gallery(product.images,c.name);
    pricing(product,c);
  }

  function unavailable(){
    const page=document.querySelector('.product-page');if(!page)return;
    const en=lang()==='en';
    page.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:50px 20px"><h1>${en?'Product unavailable':'Το προϊόν δεν είναι διαθέσιμο'}</h1><p style="color:#73767c">${en?'This product is hidden or no longer available.':'Το προϊόν είναι προσωρινά κρυμμένο ή δεν είναι πλέον διαθέσιμο.'}</p><a class="btn btn-call" href="shop.html">${en?'Back to shop':'Πίσω στο Shop'}</a></div>`;
  }

  async function load(){
    if(!item)return;
    try{
      const {createClient}=await import(CDN);
      const db=createClient(URL_BASE,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=await db.from('maltezos_products').select('id,name_cy,name_el,name_en,description_cy,description_el,description_en,specs_cy,specs_el,specs_en,images,stock,price_with_trade_in,price_without_trade_in,visible,sort_order').eq('id',item).eq('visible',true).maybeSingle();
      if(error)throw error;
      if(!data){unavailable();return}
      product=data;
      render();
    }catch(e){console.warn('Maltezos live product fallback:',e?.message||e)}
  }

  document.addEventListener('click',e=>{if(e.target.closest('.lang-option'))setTimeout(()=>product&&render(),80)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();