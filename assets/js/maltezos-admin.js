const SUPABASE_URL='https://annzsqojhqmxwsascarz.supabase.co';
const SUPABASE_KEY='sb_publishable_TFBYQK9-4ejf3SpL4FskLg_-utlA1zo';
const ADMIN_EMAIL='giorgosprodromou1822+maltezos@gmail.com';
const BUCKET='maltezos-products';
const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
const db=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

const $=s=>document.querySelector(s);
const loginScreen=$('#loginScreen'),loginForm=$('#loginForm'),loginButton=$('#loginButton'),loginMessage=$('#loginMessage'),app=$('#adminApp'),root=$('#adminProducts'),notice=$('#notice');
let products=[];

const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const lines=v=>Array.isArray(v)?v.join('\n'):'';
const arrayFromLines=v=>String(v||'').split('\n').map(x=>x.trim()).filter(Boolean);
const money=v=>{const n=Number(v||0);return Number.isInteger(n)?String(n):n.toFixed(2)};
const slug=v=>String(v||'product').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,56)||`product-${Date.now()}`;

function message(text,type='error'){
  loginMessage.textContent=text;loginMessage.className=`login-msg show${type==='ok'?' ok':''}`;
}
function toast(text,type='ok'){
  notice.textContent=text;notice.className=`notice show${type==='ok'?' ok':''}`;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>notice.className='notice',3200);
}
function setBusy(busy){loginButton.disabled=busy;loginButton.textContent=busy?'Checking…':'Sign in'}

async function isAdmin(user){
  if(!user)return false;
  const {data,error}=await db.from('maltezos_admin_members').select('user_id').eq('user_id',user.id).maybeSingle();
  return !error&&!!data;
}

async function openApp(session){
  if(!session?.user||!(await isAdmin(session.user))){
    await db.auth.signOut();
    loginScreen.style.display='grid';app.style.display='none';
    message('Ο λογαριασμός δεν έχει δικαιώματα Maltezos Admin.');return;
  }
  loginScreen.style.display='none';app.style.display='block';
  await loadProducts();
}

loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const username=$('#adminUsername').value.trim().toLowerCase();
  const password=$('#adminPassword').value;
  loginMessage.className='login-msg';
  if(username!=='admin'){message('Το username δεν είναι σωστό.');return}
  if(password.length<8){message('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');return}
  setBusy(true);
  try{
    let result=await db.auth.signInWithPassword({email:ADMIN_EMAIL,password});
    if(result.error){
      const signup=await db.auth.signUp({email:ADMIN_EMAIL,password,options:{emailRedirectTo:`${location.origin}/admin.html`}});
      if(signup.error)throw result.error;
      if(!signup.data.session){message('Σου στάλθηκε email επιβεβαίωσης. Άνοιξέ το και μετά επέστρεψε εδώ για Sign in.','ok');return}
      result=signup;
    }
    if(!result.data.session)throw new Error('Δεν δημιουργήθηκε ασφαλής συνεδρία.');
    await openApp(result.data.session);
  }catch(err){message('Δεν έγινε σύνδεση. Έλεγξε τον κωδικό ή το email επιβεβαίωσης.');console.warn(err)}finally{setBusy(false)}
});

$('#logoutButton').addEventListener('click',async()=>{await db.auth.signOut();location.reload()});
$('#refreshButton').addEventListener('click',()=>loadProducts());
$('#addButton').addEventListener('click',()=>addDraft());

async function loadProducts(){
  root.innerHTML='<div class="empty">Loading products…</div>';
  const {data,error}=await db.from('maltezos_products').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
  if(error){root.innerHTML='<div class="empty">Δεν μπόρεσα να φορτώσω τα προϊόντα.</div>';toast(error.message,'error');return}
  products=(data||[]).map(p=>({...p,_new:false}));
  renderAll();
}

function stats(){
  $('#statProducts').textContent=products.filter(p=>!p._deleted).length;
  $('#statVisible').textContent=products.filter(p=>p.visible&&!p._deleted).length;
  $('#statHidden').textContent=products.filter(p=>!p.visible&&!p._deleted).length;
  $('#statStock').textContent=products.reduce((sum,p)=>sum+Number(p.stock||0),0);
}

function thumb(p){return p.images?.[0]||'assets/icons/wrench.png'}
function productCard(p,index){
  const images=Array.isArray(p.images)?p.images:[];
  return `<article class="product-card${p.visible?'':' is-hidden'}${p._new?' open':''}" data-index="${index}">
    <div class="product-summary">
      <img class="product-thumb" src="${esc(thumb(p))}" alt="">
      <div class="product-title"><h3>${esc(p.name_cy||p.name_el||p.id||'New product')}</h3><p>${esc(p.id||'unsaved')} · €${money(p.price_with_trade_in)} · stock ${Number(p.stock||0)}</p><div class="badges"><span class="badge ${p.visible?'live':'off'}">${p.visible?'Visible':'Hidden'}</span>${p._new?'<span class="badge">Unsaved</span>':''}</div></div>
      <div class="product-actions">
        <button class="icon-btn" type="button" data-action="up" title="Move up">↑</button>
        <button class="icon-btn" type="button" data-action="down" title="Move down">↓</button>
        <button class="icon-btn" type="button" data-action="toggle" title="Hide / Show">${p.visible?'◉':'○'}</button>
        <button class="icon-btn" type="button" data-action="edit" title="Edit">✎</button>
      </div>
    </div>
    <div class="editor">
      <div class="editor-grid">
        <div class="field"><label>Product ID / Slug</label><input data-field="id" value="${esc(p.id||'')}" ${p._new?'':'disabled'}></div>
        <div class="field"><label>Order</label><input data-field="sort_order" type="number" min="1" value="${Number(p.sort_order||index+1)}"></div>
        <div class="field"><label>Stock</label><input data-field="stock" type="number" min="0" step="1" value="${Number(p.stock||0)}"></div>
        <div class="field"><label>Price with trade-in (€)</label><input data-field="price_with_trade_in" type="number" min="0" step="0.01" value="${Number(p.price_with_trade_in||0)}"></div>
        <div class="field"><label>Price without trade-in (€)</label><input data-field="price_without_trade_in" type="number" min="0" step="0.01" value="${Number(p.price_without_trade_in||0)}"></div>
        <label class="check-row"><input data-field="visible" type="checkbox" ${p.visible?'checked':''}><span>Visible στο Shop</span></label>

        ${languageBlock('cy','Κυπριακά',p)}
        ${languageBlock('el','Ελληνικά',p)}
        ${languageBlock('en','English',p)}

        <div class="image-area">
          <div class="mini-label">Photos · ${images.length}</div>
          <div class="image-list">${images.length?images.map((src,i)=>imageItem(src,i)).join(''):'<div class="muted">Δεν υπάρχουν φωτογραφίες ακόμα.</div>'}</div>
          <div class="upload-box"><div><b style="font-size:11px">Upload photos</b><div class="muted">JPG, PNG ή WEBP. Μπορείς να επιλέξεις πολλές μαζί.</div></div><input data-upload type="file" accept="image/jpeg,image/png,image/webp" multiple ${p._new?'disabled':''}></div>
        </div>

        <div class="save-row">
          ${p._new?'':'<a class="ghost" target="_blank" rel="noopener" href="product-details.html?item='+encodeURIComponent(p.id)+'">Preview</a>'}
          <button class="ghost delete-btn" type="button" data-action="delete">Delete</button>
          <button class="ghost save-btn" type="button" data-action="save">Save changes</button>
        </div>
      </div>
    </div>
  </article>`;
}

function languageBlock(code,label,p){
  return `<div class="language-block"><div class="language-head"><b>${label}</b><span class="muted">Name · Description · Specs</span></div><div class="language-grid"><div class="field"><label>Name</label><input data-field="name_${code}" value="${esc(p[`name_${code}`]||'')}"></div><div class="field"><label>Description</label><textarea data-field="description_${code}">${esc(p[`description_${code}`]||'')}</textarea></div><div class="field span2"><label>Specs · μία γραμμή το κάθε στοιχείο</label><textarea data-field="specs_${code}">${esc(lines(p[`specs_${code}`]))}</textarea></div></div></div>`;
}
function imageItem(src,i){
  return `<div class="image-item" data-image-index="${i}"><img src="${esc(src)}" alt=""><div class="image-controls"><button type="button" data-action="image-left">←</button><button type="button" data-action="image-right">→</button><button type="button" data-action="image-remove">×</button></div></div>`;
}
function renderAll(){root.innerHTML=products.length?products.map(productCard).join(''):'<div class="empty">Δεν υπάρχουν προϊόντα. Πάτησε “Add product”.</div>';stats()}

function addDraft(){
  const next=(products.reduce((m,p)=>Math.max(m,Number(p.sort_order||0)),0)||0)+1;
  products.push({id:`product-${Date.now()}`,name_cy:'',name_el:'',name_en:'',description_cy:'',description_el:'',description_en:'',specs_cy:[],specs_el:[],specs_en:[],images:[],stock:0,price_with_trade_in:0,price_without_trade_in:0,visible:false,sort_order:next,_new:true});
  renderAll();setTimeout(()=>root.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'}),60);
}

function cardIndex(target){const card=target.closest('.product-card');return card?Number(card.dataset.index):-1}
function readCard(card,p){
  const get=n=>card.querySelector(`[data-field="${n}"]`);
  const id=(get('id')?.value||p.id||'').trim();
  return {id,name_cy:get('name_cy').value.trim()||id,name_el:get('name_el').value.trim()||get('name_cy').value.trim()||id,name_en:get('name_en').value.trim()||get('name_el').value.trim()||id,description_cy:get('description_cy').value.trim(),description_el:get('description_el').value.trim(),description_en:get('description_en').value.trim(),specs_cy:arrayFromLines(get('specs_cy').value),specs_el:arrayFromLines(get('specs_el').value),specs_en:arrayFromLines(get('specs_en').value),images:Array.isArray(p.images)?p.images:[],stock:Math.max(0,Number(get('stock').value||0)),price_with_trade_in:Math.max(0,Number(get('price_with_trade_in').value||0)),price_without_trade_in:Math.max(0,Number(get('price_without_trade_in').value||0)),visible:get('visible').checked,sort_order:Math.max(1,Number(get('sort_order').value||1))};
}

async function saveAt(index){
  const p=products[index],card=root.querySelector(`.product-card[data-index="${index}"]`);if(!p||!card)return;
  const payload=readCard(card,p);
  if(!/^[a-z0-9][a-z0-9-]{1,70}$/.test(payload.id)){toast('Το Product ID πρέπει να έχει μικρά λατινικά, αριθμούς και παύλες.','error');return}
  const btn=card.querySelector('[data-action="save"]');btn.disabled=true;btn.textContent='Saving…';
  let error;
  if(p._new)({error}=await db.from('maltezos_products').insert(payload));
  else({error}=await db.from('maltezos_products').update(payload).eq('id',p.id));
  if(error){toast(error.message,'error');btn.disabled=false;btn.textContent='Save changes';return}
  toast('Οι αλλαγές αποθηκεύτηκαν live.');await loadProducts();
}

async function toggleAt(index){
  const p=products[index];if(!p||p._new){toast('Αποθήκευσε πρώτα το νέο προϊόν.','error');return}
  const {error}=await db.from('maltezos_products').update({visible:!p.visible}).eq('id',p.id);if(error){toast(error.message,'error');return}await loadProducts();toast(p.visible?'Το προϊόν κρύφτηκε.':'Το προϊόν εμφανίζεται ξανά.');
}
async function deleteAt(index){
  const p=products[index];if(!p)return;
  if(!confirm(`Διαγραφή προϊόντος “${p.name_cy||p.id}”;`))return;
  if(p._new){products.splice(index,1);renderAll();return}
  const {error}=await db.from('maltezos_products').delete().eq('id',p.id);if(error){toast(error.message,'error');return}toast('Το προϊόν διαγράφηκε.');await loadProducts();
}
async function moveProduct(index,dir){
  const other=index+dir;if(other<0||other>=products.length)return;
  if(products[index]._new||products[other]._new){toast('Αποθήκευσε πρώτα τα νέα προϊόντα.','error');return}
  const a=products[index],b=products[other],ao=Number(a.sort_order||index+1),bo=Number(b.sort_order||other+1);
  const [ra,rb]=await Promise.all([db.from('maltezos_products').update({sort_order:bo}).eq('id',a.id),db.from('maltezos_products').update({sort_order:ao}).eq('id',b.id)]);
  if(ra.error||rb.error){toast((ra.error||rb.error).message,'error');return}await loadProducts();
}

async function uploadAt(index,input){
  const p=products[index];if(!p||p._new)return;
  const files=[...(input.files||[])];if(!files.length)return;
  input.disabled=true;toast('Ανεβαίνουν οι φωτογραφίες…');
  const urls=[...(p.images||[])];
  try{
    for(const file of files){
      if(urls.length>=8)break;
      const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      const path=`${p.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const {error}=await db.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(error)throw error;
      const {data}=db.storage.from(BUCKET).getPublicUrl(path);if(data?.publicUrl)urls.push(data.publicUrl);
    }
    const {error}=await db.from('maltezos_products').update({images:urls}).eq('id',p.id);if(error)throw error;
    toast('Οι φωτογραφίες ανέβηκαν.');await loadProducts();
  }catch(err){toast(err.message||'Upload failed','error')}finally{input.disabled=false;input.value=''}
}

function storagePath(url){const mark='/storage/v1/object/public/maltezos-products/';const i=String(url).indexOf(mark);return i<0?null:decodeURIComponent(String(url).slice(i+mark.length))}
async function changeImage(index,imageIndex,action){
  const p=products[index];if(!p||p._new)return;const arr=[...(p.images||[])];if(!arr[imageIndex])return;
  if(action==='image-left'&&imageIndex>0)[arr[imageIndex-1],arr[imageIndex]]=[arr[imageIndex],arr[imageIndex-1]];
  if(action==='image-right'&&imageIndex<arr.length-1)[arr[imageIndex+1],arr[imageIndex]]=[arr[imageIndex],arr[imageIndex+1]];
  if(action==='image-remove'){
    const removed=arr.splice(imageIndex,1)[0],path=storagePath(removed);if(path)await db.storage.from(BUCKET).remove([path]);
  }
  const {error}=await db.from('maltezos_products').update({images:arr}).eq('id',p.id);if(error){toast(error.message,'error');return}await loadProducts();
}

root.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-action]');if(!btn)return;const index=cardIndex(btn);if(index<0)return;const action=btn.dataset.action;
  if(action==='edit'){btn.closest('.product-card').classList.toggle('open');return}
  if(action==='save')return saveAt(index);
  if(action==='toggle')return toggleAt(index);
  if(action==='delete')return deleteAt(index);
  if(action==='up')return moveProduct(index,-1);
  if(action==='down')return moveProduct(index,1);
  if(action.startsWith('image-')){const imageIndex=Number(btn.closest('.image-item')?.dataset.imageIndex);return changeImage(index,imageIndex,action)}
});
root.addEventListener('change',e=>{const input=e.target.closest('[data-upload]');if(input){const index=cardIndex(input);uploadAt(index,input)}});

const {data:{session}}=await db.auth.getSession();
if(session)await openApp(session);
