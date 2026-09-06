const API='https://annzsqojhqmxwsascarz.supabase.co/functions/v1/maltezos-admin';
const TOKEN_KEY='maltezos-admin-token';
const $=s=>document.querySelector(s);
const loginScreen=$('#loginScreen'),loginForm=$('#loginForm'),loginButton=$('#loginButton'),loginMessage=$('#loginMessage'),app=$('#adminApp'),root=$('#adminProducts'),notice=$('#notice');
let products=[];
let token=localStorage.getItem(TOKEN_KEY)||'';

const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const lines=v=>Array.isArray(v)?v.join('\n'):'';
const arrayFromLines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
const money=v=>{const n=Number(v||0);return Number.isInteger(n)?String(n):n.toFixed(2)};

function message(text,type='error'){loginMessage.textContent=text;loginMessage.className=`login-msg show${type==='ok'?' ok':''}`}
function toast(text,type='ok'){notice.textContent=text;notice.className=`notice show${type==='ok'?' ok':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>notice.className='notice',3200)}
function setBusy(busy){loginButton.disabled=busy;loginButton.textContent=busy?'Checking…':'Sign in'}

async function api(action,payload={},options={}){
  const headers={};
  if(token)headers.Authorization=`Bearer ${token}`;
  let body;
  if(options.form){body=options.form}else{headers['Content-Type']='application/json';body=JSON.stringify({action,...payload})}
  const res=await fetch(API,{method:'POST',headers,body});
  const data=await res.json().catch(()=>({ok:false,error:'Invalid server response'}));
  if(res.status===401){localStorage.removeItem(TOKEN_KEY);token=''}
  if(!res.ok||data?.ok===false)throw new Error(data?.error||`Request failed (${res.status})`);
  return data;
}

function openApp(){loginScreen.style.display='none';app.style.display='block';loadProducts()}
function openLogin(){loginScreen.style.display='grid';app.style.display='none'}

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const username=$('#adminUsername').value.trim().toLowerCase(),password=$('#adminPassword').value;
  loginMessage.className='login-msg';
  if(username!=='admin'){message('Το username δεν είναι σωστό.');return}
  setBusy(true);
  try{
    const data=await api('login',{username,password});
    token=data.token||'';
    if(!token)throw new Error('No session token');
    localStorage.setItem(TOKEN_KEY,token);
    $('#adminPassword').value='';
    openApp();
  }catch(err){message(err.message==='Invalid username or password.'?'Λάθος username ή password.':err.message);console.warn(err)}finally{setBusy(false)}
});

$('#logoutButton').addEventListener('click',async()=>{try{await api('logout')}catch{}localStorage.removeItem(TOKEN_KEY);token='';location.reload()});
$('#refreshButton').addEventListener('click',()=>loadProducts());
$('#addButton').addEventListener('click',()=>addDraft());

async function loadProducts(){
  root.innerHTML='<div class="empty">Loading products…</div>';
  try{const data=await api('list');products=(data.products||[]).map(p=>({...p,_new:false}));renderAll()}catch(err){root.innerHTML='<div class="empty">Δεν μπόρεσα να φορτώσω τα προϊόντα.</div>';toast(err.message,'error');if(!token)openLogin()}
}
function stats(){
  $('#statProducts').textContent=products.length;
  $('#statVisible').textContent=products.filter(p=>p.visible).length;
  $('#statHidden').textContent=products.filter(p=>!p.visible).length;
  $('#statStock').textContent=products.reduce((s,p)=>s+Number(p.stock||0),0);
}
function thumb(p){return p.images?.[0]||'assets/icons/wrench.png'}
function languageBlock(code,label,p){return `<div class="language-block"><div class="language-head"><b>${label}</b><span class="muted">Name · Description · Specs</span></div><div class="language-grid"><div class="field"><label>Name</label><input data-field="name_${code}" value="${esc(p[`name_${code}`]||'')}"></div><div class="field"><label>Description</label><textarea data-field="description_${code}">${esc(p[`description_${code}`]||'')}</textarea></div><div class="field span2"><label>Specs · μία γραμμή το κάθε στοιχείο</label><textarea data-field="specs_${code}">${esc(lines(p[`specs_${code}`]))}</textarea></div></div></div>`}
function imageItem(src,i){return `<div class="image-item" data-image-index="${i}"><img src="${esc(src)}" alt=""><div class="image-controls"><button type="button" data-action="image-left">←</button><button type="button" data-action="image-right">→</button><button type="button" data-action="image-remove">×</button></div></div>`}
function productCard(p,index){
  const images=Array.isArray(p.images)?p.images:[];
  return `<article class="product-card${p.visible?'':' is-hidden'}${p._new?' open':''}" data-index="${index}">
    <div class="product-summary">
      <img class="product-thumb" src="${esc(thumb(p))}" alt="">
      <div class="product-title"><h3>${esc(p.name_cy||p.name_el||p.id||'New product')}</h3><p>${esc(p.id||'unsaved')} · €${money(p.price_with_trade_in)} · stock ${Number(p.stock||0)}</p><div class="badges"><span class="badge ${p.visible?'live':'off'}">${p.visible?'Visible':'Hidden'}</span>${p._new?'<span class="badge">Unsaved</span>':''}</div></div>
      <div class="product-actions"><button class="icon-btn" type="button" data-action="up">↑</button><button class="icon-btn" type="button" data-action="down">↓</button><button class="icon-btn" type="button" data-action="toggle">${p.visible?'◉':'○'}</button><button class="icon-btn" type="button" data-action="edit">✎</button></div>
    </div>
    <div class="editor"><div class="editor-grid">
      <div class="field"><label>Product ID / Slug</label><input data-field="id" value="${esc(p.id||'')}" ${p._new?'':'disabled'}></div>
      <div class="field"><label>Order</label><input data-field="sort_order" type="number" min="1" value="${Number(p.sort_order||index+1)}"></div>
      <div class="field"><label>Stock</label><input data-field="stock" type="number" min="0" step="1" value="${Number(p.stock||0)}"></div>
      <div class="field"><label>Price with trade-in (€)</label><input data-field="price_with_trade_in" type="number" min="0" step="0.01" value="${Number(p.price_with_trade_in||0)}"></div>
      <div class="field"><label>Price without trade-in (€)</label><input data-field="price_without_trade_in" type="number" min="0" step="0.01" value="${Number(p.price_without_trade_in||0)}"></div>
      <label class="check-row"><input data-field="visible" type="checkbox" ${p.visible?'checked':''}><span>Visible στο Shop</span></label>
      ${languageBlock('cy','Κυπριακά',p)}${languageBlock('el','Ελληνικά',p)}${languageBlock('en','English',p)}
      <div class="image-area"><div class="mini-label">Photos · ${images.length}</div><div class="image-list">${images.length?images.map((src,i)=>imageItem(src,i)).join(''):'<div class="muted">Δεν υπάρχουν φωτογραφίες ακόμα.</div>'}</div><div class="upload-box"><div><b style="font-size:11px">Upload photos</b><div class="muted">JPG, PNG ή WEBP · μέχρι 8MB ανά εικόνα.</div></div><input data-upload type="file" accept="image/jpeg,image/png,image/webp" multiple ${p._new?'disabled':''}></div></div>
      <div class="save-row">${p._new?'':'<a class="ghost" target="_blank" rel="noopener" href="product-details.html?item='+encodeURIComponent(p.id)+'">Preview</a>'}<button class="ghost delete-btn" type="button" data-action="delete">Delete</button><button class="ghost save-btn" type="button" data-action="save">Save changes</button></div>
    </div></div>
  </article>`;
}
function renderAll(){root.innerHTML=products.length?products.map(productCard).join(''):'<div class="empty">Δεν υπάρχουν προϊόντα. Πάτησε “Add product”.</div>';stats()}
function addDraft(){const next=(products.reduce((m,p)=>Math.max(m,Number(p.sort_order||0)),0)||0)+1;products.push({id:`product-${Date.now()}`,name_cy:'',name_el:'',name_en:'',description_cy:'',description_el:'',description_en:'',specs_cy:[],specs_el:[],specs_en:[],images:[],stock:0,price_with_trade_in:0,price_without_trade_in:0,visible:false,sort_order:next,_new:true});renderAll();setTimeout(()=>root.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'}),60)}
function cardIndex(target){const card=target.closest('.product-card');return card?Number(card.dataset.index):-1}
function readCard(card,p){
  const get=n=>card.querySelector(`[data-field="${n}"]`),id=(get('id')?.value||p.id||'').trim();
  return {id,name_cy:get('name_cy').value.trim()||id,name_el:get('name_el').value.trim()||get('name_cy').value.trim()||id,name_en:get('name_en').value.trim()||get('name_el').value.trim()||id,description_cy:get('description_cy').value.trim(),description_el:get('description_el').value.trim(),description_en:get('description_en').value.trim(),specs_cy:arrayFromLines(get('specs_cy').value),specs_el:arrayFromLines(get('specs_el').value),specs_en:arrayFromLines(get('specs_en').value),images:[...(p.images||[])],stock:Math.max(0,Number(get('stock').value||0)),price_with_trade_in:Math.max(0,Number(get('price_with_trade_in').value||0)),price_without_trade_in:Math.max(0,Number(get('price_without_trade_in').value||0)),visible:get('visible').checked,sort_order:Math.max(1,Number(get('sort_order').value||1))};
}
async function saveProduct(product){return api('save',{product})}
async function saveAt(index){
  const p=products[index],card=root.querySelector(`.product-card[data-index="${index}"]`);if(!p||!card)return;
  const payload=readCard(card,p);if(!/^[a-z0-9][a-z0-9-]{1,70}$/.test(payload.id)){toast('Το Product ID θέλει μικρά λατινικά, αριθμούς και παύλες.','error');return}
  const btn=card.querySelector('[data-action="save"]');btn.disabled=true;btn.textContent='Saving…';
  try{await saveProduct(payload);toast('Οι αλλαγές αποθηκεύτηκαν live.');await loadProducts()}catch(err){toast(err.message,'error');btn.disabled=false;btn.textContent='Save changes'}
}
async function toggleAt(index){const p=products[index];if(!p||p._new){toast('Αποθήκευσε πρώτα το νέο προϊόν.','error');return}try{await saveProduct({...p,visible:!p.visible});await loadProducts();toast(p.visible?'Το προϊόν κρύφτηκε.':'Το προϊόν εμφανίζεται ξανά.')}catch(err){toast(err.message,'error')}}
async function deleteAt(index){const p=products[index];if(!p)return;if(!confirm(`Διαγραφή προϊόντος “${p.name_cy||p.id}”;`))return;if(p._new){products.splice(index,1);renderAll();return}try{await api('delete',{id:p.id});toast('Το προϊόν διαγράφηκε.');await loadProducts()}catch(err){toast(err.message,'error')}}
async function moveProduct(index,dir){const other=index+dir;if(other<0||other>=products.length)return;const a=products[index],b=products[other];if(a._new||b._new){toast('Αποθήκευσε πρώτα τα νέα προϊόντα.','error');return}const ao=Number(a.sort_order||index+1),bo=Number(b.sort_order||other+1);try{await saveProduct({...a,sort_order:bo});await saveProduct({...b,sort_order:ao});await loadProducts()}catch(err){toast(err.message,'error')}}
async function uploadAt(index,input){
  const p=products[index];if(!p||p._new)return;const files=[...(input.files||[])];if(!files.length)return;input.disabled=true;
  try{
    const images=[...(p.images||[])];
    for(const file of files){if(images.length>=8)break;const form=new FormData();form.append('action','upload');form.append('product_id',p.id);form.append('file',file);const data=await api('',{}, {form});images.push(data.url)}
    await saveProduct({...p,images});toast('Οι φωτογραφίες ανέβηκαν.');await loadProducts();
  }catch(err){toast(err.message,'error')}finally{input.disabled=false;input.value=''}
}
function storagePath(url){const mark='/storage/v1/object/public/maltezos-products/';const i=String(url).indexOf(mark);return i<0?null:decodeURIComponent(String(url).slice(i+mark.length))}
async function changeImage(index,imageIndex,action){
  const p=products[index];if(!p||p._new)return;const arr=[...(p.images||[])];if(!arr[imageIndex])return;
  try{
    if(action==='image-left'&&imageIndex>0)[arr[imageIndex-1],arr[imageIndex]]=[arr[imageIndex],arr[imageIndex-1]];
    if(action==='image-right'&&imageIndex<arr.length-1)[arr[imageIndex+1],arr[imageIndex]]=[arr[imageIndex],arr[imageIndex+1]];
    if(action==='image-remove'){const removed=arr.splice(imageIndex,1)[0],path=storagePath(removed);if(path)await api('remove_storage',{path})}
    await saveProduct({...p,images:arr});await loadProducts();
  }catch(err){toast(err.message,'error')}
}

root.addEventListener('click',async e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const index=cardIndex(btn);if(index<0)return;const action=btn.dataset.action;if(action==='edit'){btn.closest('.product-card').classList.toggle('open');return}if(action==='save')return saveAt(index);if(action==='toggle')return toggleAt(index);if(action==='delete')return deleteAt(index);if(action==='up')return moveProduct(index,-1);if(action==='down')return moveProduct(index,1);if(action.startsWith('image-')){const ii=Number(btn.closest('.image-item')?.dataset.imageIndex);return changeImage(index,ii,action)}});
root.addEventListener('change',e=>{const input=e.target.closest('[data-upload]');if(input)uploadAt(cardIndex(input),input)});

if(token){try{await api('session');openApp()}catch{localStorage.removeItem(TOKEN_KEY);token='';openLogin()}}else openLogin();
