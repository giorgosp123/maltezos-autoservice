const c=window.SITE_CONFIG||{};
const byId=id=>document.getElementById(id);
const txt=(id,value)=>{const el=byId(id);if(el)el.textContent=value||""};

document.title=c.businessName?`${c.businessName} | Cyprus`:"Business Website";
txt("brandName",c.businessName);
txt("heroTitle",c.tagline||c.businessName);
txt("heroDescription",c.description);
txt("cardBusinessName",c.businessName);
txt("footerBusinessName",c.businessName);

const wa=`https://wa.me/${String(c.whatsapp||"").replace(/\D/g,"")}`;
["whatsappButton","bookingCta"].forEach(id=>{const el=byId(id);if(el)el.href=wa;});
if(byId("bookButton")) byId("bookButton").href=c.bookingUrl||"#booking";

const phone=byId("phoneLink");if(phone){phone.textContent=c.phone||"";phone.href=`tel:${c.phone||""}`;}
const email=byId("emailLink");if(email){email.textContent=c.email||"";email.href=`mailto:${c.email||""}`;}
const map=byId("mapLink");if(map){map.textContent=c.address||"View map";map.href=c.mapUrl||"#";}

const grid=byId("serviceGrid");
(c.services||[]).forEach(s=>{
  const card=document.createElement("article");card.className="service";
  card.innerHTML=`<div class="service-top"><h3>${s.name}</h3><span class="price">${s.price||""}</span></div><p>${s.description||""}</p>`;
  grid.appendChild(card);
});

const hours=byId("hoursList");
(c.hours||[]).forEach(([days,time])=>{
  const row=document.createElement("div");row.className="hours-row";
  row.innerHTML=`<span>${days}</span><strong>${time}</strong>`;hours.appendChild(row);
});
