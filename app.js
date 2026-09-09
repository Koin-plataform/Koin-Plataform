"use strict";
const CONFIG={minimumUSDT:50,maximumUSDT:100000,currencies:{MZN:{name:"Mozambique",price:65,flag:"https://flagcdn.com/w80/mz.png"},AOA:{name:"Angola",price:950,flag:"https://flagcdn.com/w80/ao.png"},ZAR:{name:"South Africa",price:18.5,flag:"https://flagcdn.com/w80/za.png"},USD:{name:"International",price:1.02,flag:"https://flagcdn.com/w80/us.png"}},networks:{TRC20:{fee:1},BEP20:{fee:.5},ERC20:{fee:5},POLYGON:{fee:.3},SOLANA:{fee:.2}}};
const $=id=>document.getElementById(id);const country=$("country"),amount=$("amount"),network=$("network"),wallet=$("wallet"),name=$("customerName"),email=$("customerEmail"),total=$("totalPrice"),unit=$("unitPrice"),fee=$("networkFee"),usdt=$("usdtAmount"),msg=$("message");
function currency(){return CONFIG.currencies[country?.value]||CONFIG.currencies.MZN}
function minimumForNetwork(){const n=network?.value||"TRC20";const mins={TRC20:80,BEP20:200,ERC20:50,POLYGON:120,SOLANA:140};return mins[n]??50}
function update(){const c=currency(),n=CONFIG.networks[network?.value]||CONFIG.networks.TRC20,a=Number(amount?.value)||0,min=minimumForNetwork();usdt&&(usdt.textContent=a.toFixed(2)+" USDT");fee&&(fee.textContent=n.fee.toFixed(2)+" USDT");unit&&(unit.textContent=`1 USDT = ${c.price.toFixed(2)} ${country.value}`);total&&(total.textContent=((a+n.fee)*c.price).toFixed(2)+" "+country.value);const mt=$("minimumText");if(mt)mt.textContent=`Minimum: ${min.toFixed(0)} USDT for ${network.value}`}
function initNetworks(){document.querySelectorAll(".network-card").forEach(card=>card.addEventListener("click",()=>{document.querySelectorAll(".network-card").forEach(x=>x.classList.remove("active"));card.classList.add("active");network.value=card.dataset.network;update()}));if(network)network.value="TRC20"}
function getHistory(){try{return JSON.parse(localStorage.getItem("koinOrderHistory")||"[]")}catch{return[]}}
function saveHistory(reference){const list=getHistory().filter(x=>x!==reference);list.unshift(reference);localStorage.setItem("koinOrderHistory",JSON.stringify(list.slice(0,20)));localStorage.setItem("koinOrderReference",reference)}
async function create(){const a=Number(amount.value);if(!name.value.trim())return show("Enter your name.");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))return show("Enter a valid email.");const min=minimumForNetwork();if(!Number.isFinite(a)||a<min||a>100000)return show(`Minimum for ${network.value} is ${min.toFixed(0)} USDT. Maximum is 100,000 USDT.`);if(!wallet.value.trim())return show("Enter your receiving wallet.");const btn=$("continueBtn");btn.disabled=true;btn.innerHTML="<span>Creating order…</span>";try{const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerName:name.value.trim(),customerEmail:email.value.trim(),amountUSDT:a,currency:country.value,network:network.value,walletAddress:wallet.value.trim()})});const d=await r.json();if(!r.ok)throw Error(d.message||"Could not create order.");saveHistory(d.order.reference);location.href="order.html?reference="+encodeURIComponent(d.order.reference)}catch(e){show(e.message);btn.disabled=false;btn.innerHTML='<span>Continue</span><span>→</span>'}}
function show(t){if(!msg)return;msg.textContent=t;msg.classList.add("show");setTimeout(()=>msg.classList.remove("show"),4000)}
async function openOrderCenter(){const modal=$("orderCenter");if(!modal)return;modal.classList.add("show");modal.setAttribute("aria-hidden","false");renderHistory()}
function closeOrderCenter(){const modal=$("orderCenter");if(!modal)return;modal.classList.remove("show");modal.setAttribute("aria-hidden","true")}
function renderHistory(){const box=$("orderHistory");if(!box)return;const refs=getHistory();if(!refs.length){box.innerHTML='<div class="history-empty">No orders saved in this browser yet. Create an order and it will appear here.</div>';return}box.innerHTML=refs.map(r=>`<div class="history-item"><div><strong>${escapeHtml(r)}</strong><span>Saved order reference</span></div><a class="history-open" href="status.html?reference=${encodeURIComponent(r)}">Open status →</a></div>`).join("")}
function escapeHtml(x){return String(x??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
function trackReference(){const r=$("trackReference")?.value.trim();if(!r)return show("Enter an order reference.");saveHistory(r);location.href="status.html?reference="+encodeURIComponent(r)}
country?.addEventListener("change",update);amount?.addEventListener("input",update);network?.addEventListener("change",update);$("continueBtn")?.addEventListener("click",create);$("myOrdersBtn")?.addEventListener("click",openOrderCenter);$("trackHomeBtn")?.addEventListener("click",openOrderCenter);$("closeOrderCenter")?.addEventListener("click",closeOrderCenter);$("orderCenterBackdrop")?.addEventListener("click",closeOrderCenter);$("trackReferenceBtn")?.addEventListener("click",trackReference);$("trackReference")?.addEventListener("keydown",e=>{if(e.key==="Enter")trackReference()});$("acceptCookies")?.addEventListener("click",()=>{localStorage.setItem("koinCookies","1");$("cookieBanner")?.remove()});$("rejectCookies")?.addEventListener("click",()=>{localStorage.setItem("koinCookies","0");$("cookieBanner")?.remove()});if(localStorage.getItem("koinCookies"))$("cookieBanner")?.remove();initNetworks();update();

const I18N={en:{available:"コイン is available",emailPlaceholder:"Enter your email",multipleCurrencies:"Multiple currencies",multipleNetworks:"Multiple networks",transparent:"Clear pricing",tracking:"Track every order",privacyMatters:"Privacy matters"},pt:{available:"コイン está disponível",emailPlaceholder:"Introduza o seu email",multipleCurrencies:"Várias moedas",multipleNetworks:"Várias redes",transparent:"Preços transparentes",tracking:"Acompanhe cada pedido",privacyMatters:"A sua privacidade importa"}};
function applyLanguage(lang){const d=I18N[lang]||I18N.en;document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(d[k])el.textContent=d[k]});document.querySelectorAll("[data-placeholder]").forEach(el=>{const k=el.dataset.placeholder;if(d[k])el.placeholder=d[k]});document.documentElement.lang=lang;localStorage.setItem("koinLanguage",lang)}
const savedLanguage=localStorage.getItem("koinLanguage")||"en";if($("language")){ $("language").value=savedLanguage; applyLanguage(savedLanguage); $("language").addEventListener("change",e=>applyLanguage(e.target.value));}
// Market chart rotation — presentation only; rates remain the platform reference rates.
(function initMarketRotation(){
  const line=$('chartLine'), area=$('chartArea'), value=$('chartCurrencyValue'), market=$('chartMarketValue'), note=$('chartCycleText');
  if(!line || !area || !value || !market) return;
  const markets=[
    {code:'MZN',label:'Metical',price:65.00,path:'M0,138 C35,126 55,151 82,121 S125,112 150,130 S185,91 215,108 S250,77 282,96 S320,85 350,63 S390,72 420,48 S460,54 500,24'},
    {code:'USD',label:'Dollar',price:1.02,path:'M0,150 C38,143 62,129 92,139 S132,120 160,128 S198,104 230,116 S270,88 305,98 S345,78 375,84 S418,62 450,72 S475,45 500,52'},
    {code:'AOA',label:'Kwanza',price:950.00,path:'M0,132 C30,148 60,119 90,126 S125,98 155,118 S195,82 225,104 S265,70 300,91 S335,63 370,77 S405,52 438,60 S470,35 500,42'},
    {code:'ZAR',label:'Rand',price:18.50,path:'M0,145 C30,132 58,141 86,119 S125,126 155,106 S192,113 220,91 S260,99 292,74 S325,90 355,66 S398,79 425,53 S462,64 500,35'}
  ];
  let i=0;
  const apply=()=>{
    const m=markets[i];
    const d=m.path;
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


// Lightweight onboarding: answers are stored locally and can affect the selected market / guidance.
(function initWelcome(){
 const overlay=$("welcomeOverlay"), dots=$("welcomeDots"), skip=$("welcomeSkip"); if(!overlay)return;
 let data={}; try{data=JSON.parse(localStorage.getItem("koinWelcome")||"{}")}catch{}
 if(data.completed){overlay.remove();return;}
 overlay.classList.add("show"); overlay.setAttribute("aria-hidden","false"); let step=1;
 const render=()=>{document.querySelectorAll(".welcome-step").forEach(x=>x.hidden=Number(x.dataset.step)!==step); if(dots)dots.textContent=step===1?"● ○ ○":step===2?"○ ● ○":"○ ○ ●"};
 document.querySelectorAll(".welcome-options button").forEach(btn=>btn.addEventListener("click",()=>{data[btn.dataset.answer]=btn.dataset.value;if(btn.dataset.answer==="market"&&country){country.value=btn.dataset.value;update();} if(step<3){step++;render();}else{data.completed=true;data.completedAt=new Date().toISOString();localStorage.setItem("koinWelcome",JSON.stringify(data));overlay.classList.remove("show");overlay.setAttribute("aria-hidden","true");setTimeout(()=>overlay.remove(),220);}}));
 skip?.addEventListener("click",()=>{data.completed=true;data.skipped=true;localStorage.setItem("koinWelcome",JSON.stringify(data));overlay.remove();}); render();
})();
