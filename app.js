"use strict";
const CONFIG={minimumUSDT:50,maximumUSDT:100000,currencies:{MZN:{name:"Mozambique",price:65,flag:"https://flagcdn.com/w80/mz.png"},AOA:{name:"Angola",price:950,flag:"https://flagcdn.com/w80/ao.png"},ZAR:{name:"South Africa",price:18.5,flag:"https://flagcdn.com/w80/za.png"},USD:{name:"International",price:1.02,flag:"https://flagcdn.com/w80/us.png"}},networks:{TRC20:{fee:5},BEP20:{fee:3},ERC20:{fee:5},POLYGON:{fee:3},SOLANA:{fee:3}}};
const $=id=>document.getElementById(id);let selectedOffer=null;const country=$("country"),amount=$("amount"),network=$("network"),wallet=$("wallet"),name=$("customerName"),email=$("customerEmail"),total=$("totalPrice"),unit=$("unitPrice"),fee=$("networkFee"),usdt=$("usdtAmount"),msg=$("message");
function currency(){return CONFIG.currencies[country?.value]||CONFIG.currencies.MZN}
function minimumForNetwork(){const n=network?.value||"TRC20";const mins={TRC20:80,BEP20:200,ERC20:50,POLYGON:120,SOLANA:140};return mins[n]??50}
function update(){const c=currency(),n=CONFIG.networks[network?.value]||CONFIG.networks.TRC20,a=Number(amount?.value)||0,min=minimumForNetwork(),price=selectedOffer&&selectedOffer.currency===country?.value?Number(selectedOffer.price):c.price;usdt&&(usdt.textContent=a.toFixed(2)+" USDT");fee&&(fee.textContent=n.fee.toFixed(2)+" USDT");unit&&(unit.textContent=`1 USDT = ${price.toFixed(2)} ${country.value}${selectedOffer?" • Oferta KOIN":""}`);total&&(total.textContent=((a+n.fee)*price).toFixed(2)+" "+country.value);const mt=$("minimumText");if(mt)mt.textContent=`Minimum: ${min.toFixed(0)} USDT for ${network.value}`;const offerNote=$("selectedOfferNote");if(offerNote)offerNote.textContent=selectedOffer?`Oferta aplicada: ${selectedOffer.title} · ${price.toFixed(4)} ${country.value} / USDT`:""}
function initNetworks(){document.querySelectorAll(".network-card").forEach(card=>card.addEventListener("click",()=>{document.querySelectorAll(".network-card").forEach(x=>x.classList.remove("active"));card.classList.add("active");network.value=card.dataset.network;update()}));if(network)network.value="TRC20"}
async function create(){const token=localStorage.getItem("koinAccountToken")||"";if(!token){show("Create or sign in to your KOIN account before placing an order.");setTimeout(()=>location.href="account.html?return=buy",700);return}const a=Number(amount.value);if(!name.value.trim())return show("Enter your name.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))return show("Enter a valid email.");const min=minimumForNetwork();if(!Number.isFinite(a)||a<min||a>100000)return show(`Minimum for ${network.value} is ${min.toFixed(0)} USDT. Maximum is 100,000 USDT.`);if(!wallet.value.trim())return show("Enter your receiving wallet.");const btn=$("continueBtn");btn.disabled=true;btn.innerHTML="<span>Creating order…</span>";const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},signal:controller.signal,body:JSON.stringify({amountUSDT:a,currency:country.value,network:network.value,walletAddress:wallet.value.trim(),offerId:selectedOffer?.id||null,offerContext:selectedOffer?{country:selectedOffer.country||country.value,offerNeed:(JSON.parse(localStorage.getItem("koinWelcome")||"{}").offerNeed||""),firstTime:(JSON.parse(localStorage.getItem("koinWelcome")||"{}").firstTime||""),useCase:(JSON.parse(localStorage.getItem("koinWelcome")||"{}").useCase||"")}:null})});const d=await r.json();if(r.status===401){localStorage.removeItem("koinAccountToken");return location.href="account.html?return=buy"}if(!r.ok)throw Error(d.message||"Could not create order.");location.href="order.html?reference="+encodeURIComponent(d.order.reference)}catch(e){show(e.name==="AbortError"?"The order request timed out. Please try again.":e.message);btn.disabled=false;btn.innerHTML='<span>Continue</span><span>→</span>'}finally{clearTimeout(timer)}}

async function syncAccount(){const token=localStorage.getItem("koinAccountToken")||"";if(!token)return;try{const r=await fetch("/api/account/me",{headers:{Authorization:"Bearer "+token},cache:"no-store"});if(!r.ok){localStorage.removeItem("koinAccountToken");return}const d=await r.json();if(name){name.value=d.account.name||"";name.readOnly=true}if(email){email.value=d.account.email||"";email.readOnly=true}}catch{}}
function show(t){if(!msg)return;msg.textContent=t;msg.classList.add("show");setTimeout(()=>msg.classList.remove("show"),4000)}
async function escapeHtml(x){return String(x??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
country?.addEventListener("change",()=>{selectedOffer=null;if($("checkoutCurrencyHome"))$("checkoutCurrencyHome").value=country.value;update()});$("checkoutCurrencyHome")?.addEventListener("change",e=>{country.value=e.target.value;selectedOffer=null;update()});amount?.addEventListener("input",update);network?.addEventListener("change",update);$("continueBtn")?.addEventListener("click",create);$("acceptCookies")?.addEventListener("click",()=>{localStorage.setItem("koinCookies","1");$("cookieBanner")?.remove()});$("rejectCookies")?.addEventListener("click",()=>{localStorage.setItem("koinCookies","0");$("cookieBanner")?.remove()});if(localStorage.getItem("koinCookies"))$("cookieBanner")?.remove();initNetworks();if($("checkoutCurrencyHome"))$("checkoutCurrencyHome").value=country?.value||"MZN";update();syncAccount();

const I18N={en:{available:"コイン is available",emailPlaceholder:"Enter your email",multipleCurrencies:"Multiple currencies",multipleNetworks:"Multiple networks",transparent:"Clear pricing",tracking:"Track every order",privacyMatters:"Privacy matters"},pt:{available:"コイン está disponível",emailPlaceholder:"Introduza o seu email",multipleCurrencies:"Várias moedas",multipleNetworks:"Várias redes",transparent:"Preços transparentes",tracking:"Acompanhe cada pedido",privacyMatters:"A sua privacidade importa"}};
function applyLanguage(lang){const d=I18N[lang]||I18N.en;document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(d[k])el.textContent=d[k]});document.querySelectorAll("[data-placeholder]").forEach(el=>{const k=el.dataset.placeholder;if(d[k])el.placeholder=d[k]});document.documentElement.lang=lang;localStorage.setItem("koinLanguage",lang)}
const savedLanguage=localStorage.getItem("koinLanguage")||"en";if($("language")){ $("language").value=savedLanguage; applyLanguage(savedLanguage); $("language").addEventListener("change",e=>applyLanguage(e.target.value));}
// Live platform pricing: rates are controlled server-side by the operator.
async function syncPlatformConfig(showChange=true){try{const r=await fetch("/api/config?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const d=await r.json();if(!d.success||!d.rates)return;const previous=localStorage.getItem("koinRateVersion");Object.keys(d.rates).forEach(k=>{if(CONFIG.currencies[k])CONFIG.currencies[k].price=Number(d.rates[k])});document.querySelectorAll(".rate-card").forEach(card=>{const strong=card.querySelector(".rate"),label=card.querySelector(".rate-label");if(!strong)return;const key=(card.querySelector(".coin strong")?.textContent||"").split("/")[1]?.trim();if(key&&CONFIG.currencies[key]){strong.textContent=Number(CONFIG.currencies[key].price).toFixed(2);if(label)label.textContent=key+" per USDT"}});if(!selectedOffer)update();if(showChange&&previous&&d.rateVersion&&previous!==d.rateVersion)showPriceToast("Price update","KOIN rates are now updated.");if(d.rateVersion)localStorage.setItem("koinRateVersion",d.rateVersion);if(d.nextRateSchedule)localStorage.setItem("koinNextRateSchedule",JSON.stringify(d.nextRateSchedule));else localStorage.removeItem("koinNextRateSchedule")}catch{}}
function showPriceToast(title,text){let box=$("priceToast");if(!box){box=document.createElement("div");box.id="priceToast";box.className="platform-notice price-toast";document.body.appendChild(box)}box.innerHTML='<div class="platform-notice-icon">↻</div><div class="platform-notice-content"><strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(text)+'</p></div><button class="platform-notice-ok" aria-label="OK">OK</button>';box.classList.add("show");const ok=box.querySelector("button");if(ok)ok.onclick=()=>box.classList.remove("show");clearTimeout(window.__koinPriceToastTimer);window.__koinPriceToastTimer=setTimeout(()=>box.classList.remove("show"),5000)}
function showPlatformNotice(title,text,announcementId=null,supportUrl="contact.html"){
 let box=$("announcementModal");
 if(!box){box=document.createElement("div");box.id="announcementModal";box.className="announcement-modal";box.innerHTML='<div class="announcement-backdrop"></div><div class="announcement-card"><div class="announcement-kicker">KOIN</div><div class="announcement-icon">!</div><h3 id="announcementTitle"></h3><p id="announcementText"></p><div class="announcement-actions"><a id="announcementMore" class="secondary-button" target="_self">Saber mais</a><button id="announcementOk" class="primary-button">OK, continuar <span>→</span></button></div></div>';document.body.appendChild(box);}
 $("announcementTitle").textContent=title;$("announcementText").textContent=text;$("announcementMore").href=supportUrl||"contact.html";box.classList.add("show");box.setAttribute("aria-hidden","false");
 const close=()=>{box.classList.remove("show");box.setAttribute("aria-hidden","true")};$("announcementOk").onclick=close;$("announcementMore").onclick=close;$("announcementModal").querySelector(".announcement-backdrop").onclick=close;
}
async function syncAnnouncements(){
 try{
  const r=await fetch('/api/announcements?t='+Date.now(),{cache:'no-store'});if(!r.ok)return;const d=await r.json();
  const now=Date.now();
  const active=(d.announcements||[]).filter(x=>x.id&&Date.parse(x.startAt||x.at||0)<=now&&Date.parse(x.endAt||'2999-01-01')>=now);
  for(const a of active){
   if(a.kind==='instant'){
    if(!localStorage.getItem('koinInstantNotice_'+a.id)){showPlatformNotice('Aviso KOIN',a.text,a.id,a.supportUrl||'contact.html');localStorage.setItem('koinInstantNotice_'+a.id,'1');break;}
    continue;
   }
   const repeat=Math.max(1,Number(a.repeatEveryMinutes)||60)*60000;
   const last=Number(localStorage.getItem('koinNoticeLast_'+a.id)||0);
   if(now-last>=repeat){showPlatformNotice('Aviso KOIN',a.text,a.id,a.supportUrl||'contact.html');localStorage.setItem('koinNoticeLast_'+a.id,String(now));break;}
  }
 }catch{}
}

// Market chart rotation — presentation only; rates remain the platform reference rates.
(function initMarketRotation(){
  const line=$('chartLine'), area=$('chartArea'), value=$('chartCurrencyValue'), market=$('chartMarketValue'), note=$('chartCycleText');
  if(!line || !area || !value || !market) return;
  const markets=[
    {code:'MZN',label:'Metical',price:CONFIG.currencies.MZN.price,path:'M0,138 C35,126 55,151 82,121 S125,112 150,130 S185,91 215,108 S250,77 282,96 S320,85 350,63 S390,72 420,48 S460,54 500,24'},
    {code:'USD',label:'Dollar',price:CONFIG.currencies.USD.price,path:'M0,150 C38,143 62,129 92,139 S132,120 160,128 S198,104 230,116 S270,88 305,98 S345,78 375,84 S418,62 450,72 S475,45 500,52'},
    {code:'AOA',label:'Kwanza',price:CONFIG.currencies.AOA.price,path:'M0,132 C30,148 60,119 90,126 S125,98 155,118 S195,82 225,104 S265,70 300,91 S335,63 370,77 S405,52 438,60 S470,35 500,42'},
    {code:'ZAR',label:'Rand',price:CONFIG.currencies.ZAR.price,path:'M0,145 C30,132 58,141 86,119 S125,126 155,106 S192,113 220,91 S260,99 292,74 S325,90 355,66 S398,79 425,53 S462,64 500,35'}
  ];
  let i=0;
  const apply=()=>{
    const m=markets[i];
    const d=m.path;
    m.price=CONFIG.currencies[m.code]?.price ?? m.price;
    line.setAttribute('d',d);
    area.setAttribute('d',d+' L500,180 L0,180 Z');
    value.textContent=m.price.toFixed(2)+' '+m.code;
    market.textContent='USDT / '+m.code;
    if(note) note.textContent='Reference market • '+m.label;
    i=(i+1)%markets.length;
  };
  apply();
  setInterval(apply,5000);
})();


syncPlatformConfig(false); syncAnnouncements(); syncOfferConfig(); setInterval(()=>syncPlatformConfig(true),2000); setInterval(syncAnnouncements,5000); setInterval(syncOfferConfig,2000);

// Personalized onboarding + offer engine.
(function initWelcome(){
 const overlay=$("welcomeOverlay"),notice=$("welcomeNotice"),quiz=$("welcomeQuiz"),cont=$("welcomeContinue"),nameInput=$("welcomeName"),dots=$("welcomeDots");
 if(!overlay)return; let data={}; try{data=JSON.parse(localStorage.getItem("koinWelcome")||"{}")}catch{}
 const render=(step)=>{document.querySelectorAll(".welcome-step").forEach(x=>x.hidden=Number(x.dataset.step)!==step);if(dots)dots.textContent=[1,2,3,4,5].map(n=>n===step?"●":"○").join(" ")};
 async function finish(){data.name=(nameInput?.value||data.name||"").trim();if(!data.name)return show("Introduza o seu nome.");data.completed=true;data.completedAt=new Date().toISOString();localStorage.setItem("koinWelcome",JSON.stringify(data));await submitOnboarding(data);overlay.classList.remove("show");overlay.setAttribute("aria-hidden","true");setTimeout(()=>overlay.remove(),120);scrollToOffer();}
 function startQuiz(){notice.hidden=true;quiz.hidden=false;render(1);setTimeout(()=>nameInput?.focus(),80)}
 cont?.addEventListener("click",startQuiz);
 document.querySelectorAll(".welcome-options button").forEach(btn=>btn.addEventListener("click",()=>{data[btn.dataset.answer]=btn.dataset.value;if(btn.dataset.answer==="country"&&country){country.value=btn.dataset.value;selectedOffer=null;update()}const step=Number(btn.closest(".welcome-step")?.dataset.step||1);if(step<5)render(step+1);else finish()}));
 document.querySelectorAll(".welcome-next").forEach(btn=>btn.addEventListener("click",()=>{data.name=(nameInput?.value||"").trim();if(!data.name)return show("Introduza o seu nome.");render(2)}));
 nameInput?.addEventListener("keydown",e=>{if(e.key==='Enter'){e.preventDefault();document.querySelector('.welcome-next')?.click()}});
 if(data.completed){overlay.remove();loadRecommendedOffer(data);return} overlay.classList.add("show");overlay.setAttribute("aria-hidden","false");
})();
async function submitOnboarding(data){renderRecommendedLoading(data);try{const r=await fetch('/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(r.ok&&d.success){if(d.offersEnabled!==false)renderRecommendedOffers(d.offers||[],data);else hideRecommendedOffers();return d.offers||[]}}catch{}return loadRecommendedOffer(data)}
async function loadRecommendedOffer(data){try{const seed=Number(localStorage.getItem('koinOfferRefreshSeed')||0);const r=await fetch('/api/offers/recommend?country='+encodeURIComponent(data.country||country?.value||'MZN')+'&offerNeed='+encodeURIComponent(data.offerNeed||'')+'&firstTime='+encodeURIComponent(data.firstTime||'')+'&useCase='+encodeURIComponent(data.useCase||'')+'&seed='+seed,{cache:'no-store'});const d=await r.json();if(d.success){if(d.enabled===false){hideRecommendedOffers();return []}renderRecommendedOffers(d.offers||[],data);return d.offers||[]}}catch{}return []}
function renderRecommendedLoading(data){const sec=$("recommendedOffer"),card=$("recommendedOfferCard");if(!sec||!card)return;card.innerHTML='<div class="recommended-offer"><div class="offer-topline"><span>KOIN</span><span>'+escapeHtml(data.country||'')+'</span></div><h3>A preparar a tua oferta…</h3><p>Estamos a verificar as ofertas disponíveis para o teu perfil.</p></div>';sec.hidden=false;scrollToOffer()}
function hideRecommendedOffers(){const sec=$("recommendedOffer");if(sec)sec.hidden=true}
function scrollToOffer(){const sec=$("recommendedOffer");if(sec&&!sec.hidden)setTimeout(()=>sec.scrollIntoView({behavior:"smooth",block:"center"}),80)}
function applyOffer(o){selectedOffer=o||null;if(selectedOffer){country.value=selectedOffer.currency;if($("checkoutCountry"))$("checkoutCountry").value=selectedOffer.currency;if($("checkoutCurrencyHome"))$("checkoutCurrencyHome").value=selectedOffer.currency;window.scrollTo({top:Math.max(0,$("buy")?.getBoundingClientRect().top+window.scrollY-90),behavior:"smooth"});}update();show("Oferta aplicada ao checkout.")}
function renderRecommendedOffers(list,data){const sec=$("recommendedOffer"),card=$("recommendedOfferCard"),profile=$("offerProfile");if(!sec||!card)return;profile.innerHTML='<span>'+escapeHtml(data.name||'Visitante')+'</span><span>'+escapeHtml(data.country||'')+'</span><span>'+escapeHtml(data.offerNeed||'')+'</span>';const o=list[0];if(!o){card.innerHTML='<div class="recommended-offer"><div class="offer-topline"><span>KOIN</span><span>'+escapeHtml(data.country||'')+'</span></div><h3>Ainda não há uma oferta compatível.</h3><p>Não encontrámos uma oferta KOIN para este perfil agora. Podes consultar a Community para explorar outras opções.</p><a href="p2p.html" class="primary-button">Abrir Community <span>→</span></a></div>';sec.hidden=false;scrollToOffer();return}card.innerHTML='<div class="recommended-offer"><div class="offer-topline"><span>'+escapeHtml(o.label||'Oferta KOIN')+'</span><span>'+escapeHtml(o.country||'')+'</span></div><h3>'+escapeHtml(o.title)+'</h3><div class="offer-price"><strong>'+Number(o.price).toFixed(4)+'</strong><span>'+escapeHtml(o.currency)+' / USDT</span></div>'+(o.network?'<div class="offer-meta">Rede recomendada: '+escapeHtml(o.network)+'</div>':'')+(o.note?'<p>'+escapeHtml(o.note)+'</p>':'')+'<button type="button" class="primary-button use-offer" data-offer-id="'+escapeHtml(o.id)+'">Usar esta oferta <span>→</span></button></div>';sec.hidden=false;const b=card.querySelector('.use-offer');if(b)b.onclick=()=>applyOffer(o);scrollToOffer()}
(function initOfferRotation(){const saved=localStorage.getItem('koinWelcome');if(!saved)return;let data;try{data=JSON.parse(saved)}catch{return}if(!data.completed)return;let seed=Number(localStorage.getItem('koinOfferRefreshSeed')||0);seed++;localStorage.setItem('koinOfferRefreshSeed',String(seed));loadRecommendedOffer(data)})();
let __koinOfferVersion=Number(localStorage.getItem("koinOfferVersion")||0);
async function syncOfferConfig(){try{const r=await fetch("/api/offers/config?t="+Date.now(),{cache:"no-store"}); if(r.status===401||r.status===403)return; const d=await r.json(); const v=Number(d.settings?.version||0); if(v&&__koinOfferVersion&&v!==__koinOfferVersion){const raw=localStorage.getItem("koinWelcome");if(raw){const data=JSON.parse(raw);if(data.completed){localStorage.setItem("koinOfferRefreshSeed",String(Number(localStorage.getItem("koinOfferRefreshSeed")||0)+1));loadRecommendedOffer(data);}}} if(v){__koinOfferVersion=v;localStorage.setItem("koinOfferVersion",String(v));}}catch{}}

// Existing live platform pricing / notices.
