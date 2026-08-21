const c=window.SITE_CONFIG||{};
const byId=id=>document.getElementById(id);
const txt=(id,value)=>{const el=byId(id);if(el)el.textContent=value||""};

document.title=c.businessName?`${c.businessName} | Cyprus`:"Business Website";
txt("brandName",c.businessName);
txt("heroTitle",c.tagline||c.businessName);
txt("heroDescription",c.description);
txt("heroBadge",c.badge||"LOCAL BUSINESS · CYPRUS");
txt("cardBusinessName",c.businessName);
txt("cardTagline",c.heroNote||c.description);
txt("footerBusinessName",c.businessName);
txt("contactNote",c.heroNote||"");

const waNumber=String(c.whatsapp||"").replace(/\D/g,"");
const wa=`https://wa.me/${waNumber}`;
["whatsappButton","mobileWhatsApp"].forEach(id=>{const el=byId(id);if(el)el.href=wa;});
if(byId("bookButton")) byId("bookButton").href="#booking";

const phone=byId("phoneLink");if(phone){phone.textContent=c.phone||"";phone.href=`tel:${c.phone||""}`;}
const mobileCall=byId("mobileCall");if(mobileCall)mobileCall.href=`tel:${c.phone||""}`;
const email=byId("emailLink");if(email){email.textContent=c.email||"";email.href=`mailto:${c.email||""}`;}
const map=byId("mapLink");if(map){map.textContent=c.address||"View map";map.href=c.mapUrl||"#";}

const heroPhoto=byId("heroPhoto");
if(heroPhoto && c.gallery && c.gallery[0]) heroPhoto.style.backgroundImage=`url('${c.gallery[0]}')`;

const stats=byId("statsStrip");
(c.stats||[]).forEach(([value,label])=>{
  const item=document.createElement("div");item.className="stat";
  item.innerHTML=`<strong>${value}</strong><span>${label}</span>`;
  stats.appendChild(item);
});

const grid=byId("serviceGrid");
(c.services||[]).forEach(s=>{
  const card=document.createElement("article");card.className="service";
  card.innerHTML=`<div class="service-top"><h3>${s.name}</h3><span class="price">${s.price||""}</span></div><p>${s.description||""}</p><a href="#booking" class="service-link" data-service="${s.name}">Book this service →</a>`;
  grid.appendChild(card);
});

const gallery=byId("galleryGrid");
(c.gallery||[]).slice(0,3).forEach((src,index)=>{
  const item=document.createElement("figure");item.className="gallery-item";
  item.innerHTML=`<img src="${src}" alt="${c.businessName||"Barber studio"} gallery image ${index+1}" loading="lazy">`;
  gallery.appendChild(item);
});

const reviews=byId("reviewGrid");
(c.reviews||[]).forEach(r=>{
  const card=document.createElement("article");card.className="review";
  const stars="★".repeat(Math.max(1,Math.min(5,r.rating||5)));
  card.innerHTML=`<div class="stars">${stars}</div><p>“${r.text||""}”</p><strong>${r.name||"Client"}</strong>`;
  reviews.appendChild(card);
});

const hours=byId("hoursList");
(c.hours||[]).forEach(([days,time])=>{
  const row=document.createElement("div");row.className="hours-row";
  row.innerHTML=`<span>${days}</span><strong>${time}</strong>`;hours.appendChild(row);
});

const serviceSelect=byId("bookingService");
(c.services||[]).forEach(s=>{
  const option=document.createElement("option");
  option.value=s.name;option.textContent=`${s.name}${s.price?` · ${s.price}`:""}`;
  serviceSelect.appendChild(option);
});

document.querySelectorAll("[data-service]").forEach(link=>{
  link.addEventListener("click",()=>{if(serviceSelect)serviceSelect.value=link.dataset.service;});
});

const dateInput=byId("bookingDate");
if(dateInput){dateInput.min=new Date().toISOString().split("T")[0];}

const form=byId("bookingForm");
if(form){
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const service=byId("bookingService").value;
    const date=byId("bookingDate").value;
    const time=byId("bookingTime").value;
    const name=byId("bookingName").value.trim();
    const message=`Hello ${c.businessName||""}! My name is ${name}. I would like to book ${service} on ${date} at ${time}. Is this time available?`;
    window.open(`${wa}?text=${encodeURIComponent(message)}`,"_blank","noopener");
  });
}
