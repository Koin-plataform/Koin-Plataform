"use strict";
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const dir=path.join(__dirname,"database");
const file=path.join(dir,"offers.json");
const DEFAULTS={
  enabled:true,
  rotateOnRefresh:true,
  requireOnboarding:true,
  supportUrl:"contact.html",
  version:1,
  offers:[]
};
function seedDefaults(){
 const base=[
  ["MZN","Oferta MZN — Compra rápida",66,"buy","any","any"],["MZN","Oferta MZN — Melhor preço",67,"best_price","any","any"],["MZN","Oferta MZN — Arbitragem",68,"best_price","any","arbitrage"],["MZN","Oferta MZN — Comercial",69,"buy","any","commercial"],
  ["AOA","Oferta AOA — Compra rápida",955,"buy","any","any"],["AOA","Oferta AOA — Melhor preço",960,"best_price","any","any"],["AOA","Oferta AOA — Arbitragem",965,"best_price","any","arbitrage"],["AOA","Oferta AOA — Comercial",970,"buy","any","commercial"],
  ["ZAR","Oferta ZAR — Compra rápida",19,"buy","any","any"],["ZAR","Oferta ZAR — Melhor preço",20,"best_price","any","any"],["ZAR","Oferta ZAR — Arbitragem",21,"best_price","any","arbitrage"],["ZAR","Oferta ZAR — Comercial",19,"buy","any","commercial"],
  ["USD","Oferta USD — Compra rápida",1.03,"buy","any","any"],["USD","Oferta USD — Melhor preço",1.04,"best_price","any","any"],["USD","Oferta USD — Arbitragem",1.05,"best_price","any","arbitrage"],["USD","Oferta USD — Comercial",1.03,"buy","any","commercial"]
 ];
 return base.map((x,i)=>({id:"OFF-DEFAULT-"+(i+1),title:x[1],label:"Oferta KOIN",countries:[x[0]],currency:x[0],price:x[2],unit:"per USDT",offerNeeds:[x[3]],firstTime:x[4],useCase:x[5],network:"",note:"Oferta padrão editável no painel KOIN.",priority:10,active:true,startAt:null,endAt:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}));
}
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file)){const d={...DEFAULTS,version:1,offers:seedDefaults()};fs.writeFileSync(file,JSON.stringify(d,null,2));}}
function read(){ensure();try{const x=JSON.parse(fs.readFileSync(file,"utf8"))||{};const d={...DEFAULTS,...x,offers:Array.isArray(x.offers)&&x.offers.length?x.offers:seedDefaults()};return migrateDefaults(d)}catch{return {...DEFAULTS,offers:seedDefaults()}}}
function write(d){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify({...DEFAULTS,...d,version:Number(d.version||1)},null,2));fs.renameSync(tmp,file)}
function get(){return read()}
function clean(v,max=120){return String(v??"").trim().slice(0,max)}
function normalize(input={}){
 const countries=Array.isArray(input.countries)?input.countries.map(x=>clean(x,8).toUpperCase()).filter(Boolean):[clean(input.country,8).toUpperCase()].filter(Boolean);
 const offerNeeds=Array.isArray(input.offerNeeds)?input.offerNeeds.map(x=>clean(x,40)).filter(Boolean):[clean(input.offerNeed,40)].filter(Boolean);
 return {countries,offerNeeds,firstTime:input.firstTime===true||input.firstTime==="yes"?"yes":input.firstTime===false||input.firstTime==="no"?"no":"any",useCase:["personal","arbitrage","commercial"].includes(input.useCase)?input.useCase:"any"};
}
function isActive(o,now=Date.now()){
 if(!o||o.active===false)return false;
 const start=o.startAt?Date.parse(o.startAt):NaN,end=o.endAt?Date.parse(o.endAt):NaN;
 if(Number.isFinite(start)&&start>now)return false;
 if(Number.isFinite(end)&&end<now)return false;
 return true;
}
function matches(o,a){
 const country=a.countries[0]||"";
 if(Array.isArray(o.countries)&&o.countries.length&& !o.countries.includes("ALL") && !o.countries.includes(country))return false;
 if(Array.isArray(o.offerNeeds)&&o.offerNeeds.length && !o.offerNeeds.includes("ALL") && !a.offerNeeds.some(x=>o.offerNeeds.includes(x)))return false;
 if(o.firstTime&&o.firstTime!=="any"&&o.firstTime!==a.firstTime)return false;
 if(o.useCase&&o.useCase!=="any"&&o.useCase!==a.useCase)return false;
 return true;
}
function listMatching(answers={}){
 const d=read(); if(!d.enabled)return [];
 const a=normalize(answers),now=Date.now();
 return (d.offers||[]).filter(o=>isActive(o,now)&&matches(o,a)).sort((x,y)=>Number(y.priority||0)-Number(x.priority||0));
}
function publicOffer(o){return {id:o.id,title:o.title,country:o.countries?.[0]||"ALL",currency:o.currency,price:Number(o.price||0),unit:o.unit||"per USDT",offerNeed:o.offerNeeds||[],firstTime:o.firstTime||"any",useCase:o.useCase||"any",network:o.network||"",note:o.note||"",label:o.label||"Oferta KOIN",updatedAt:o.updatedAt||o.createdAt||null};}
function recommend(answers={},seed=0){
 const d=read();const list=listMatching(answers).map(publicOffer);if(!list.length)return [];
 if(!d.rotateOnRefresh)return list.slice(0,3);
 const n=Math.max(0,Number(seed)||0);const shift=n%list.length;const rotated=list.slice(shift).concat(list.slice(0,shift));return rotated.slice(0,3);
}
const PRICE_RULES={MZN:{min:65,max:70,step:1},AOA:{min:950,max:1000,step:1},ZAR:{min:18.5,max:22,step:1},USD:{min:1.02,max:1.1,step:0.01}};
function validatePrice(currency,price){const c=String(currency||"MZN").toUpperCase();const r=PRICE_RULES[c];if(!r)return;const n=Number(price);if(!Number.isFinite(n)||n<=r.min||n>=r.max)throw new Error(`Preço ${c} deve ser maior que ${r.min} e menor que ${r.max}.`);const scaled=Math.round((n/r.step))*r.step;if(Math.abs(n-scaled)>1e-9)throw new Error(`Preço ${c} deve usar valores redondos.`);}
function migrateDefaults(d){
 let changed=false;
 const defaults=seedDefaults();
 const existing=new Map((d.offers||[]).map(o=>[o.id,o]));
 for(const def of defaults){
   if(!existing.has(def.id)){ d.offers=(d.offers||[]).concat(def); changed=true; }
 }
 if(changed){ d.version=Number(d.version||1)+1; write(d); }
 return d;
}

function add(input={}){
 const d=read();
 const o={
  id:"OFF-"+crypto.randomBytes(5).toString("hex").toUpperCase(),
  title:clean(input.title,90)||"USDT offer",
  label:clean(input.label,40)||"Oferta KOIN",
  countries:Array.isArray(input.countries)?input.countries.map(x=>clean(x,8).toUpperCase()).filter(Boolean):[clean(input.country,8).toUpperCase()||"ALL"],
  currency:clean(input.currency,8).toUpperCase()||"MZN",
  price:Number(input.price),
  unit:clean(input.unit,30)||"per USDT",
  offerNeeds:Array.isArray(input.offerNeeds)?input.offerNeeds.map(x=>clean(x,40)).filter(Boolean):[clean(input.offerNeed,40)||"ALL"],
  firstTime:["yes","no","any"].includes(input.firstTime)?input.firstTime:"any",
  useCase:["personal","arbitrage","commercial","any"].includes(input.useCase)?input.useCase:"any",
  network:clean(input.network,20),
  note:clean(input.note,180),
  priority:Number.isFinite(Number(input.priority))?Math.max(0,Math.min(100,Number(input.priority))):0,
  active:input.active!==false,
  startAt:input.startAt?new Date(input.startAt).toISOString():null,
  endAt:input.endAt?new Date(input.endAt).toISOString():null,
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
 };
 validatePrice(o.currency,o.price);
 d.offers=(d.offers||[]).concat(o).slice(-300);d.version=Number(d.version||1)+1;write(d);return o;
}
function remove(id){const d=read();const old=d.offers||[];const item=old.find(x=>x.id===id);d.offers=old.filter(x=>x.id!==id);d.version=Number(d.version||1)+1;write(d);return item||null;}
function updateOffer(id,input={}){const d=read();const idx=(d.offers||[]).findIndex(x=>x.id===id);if(idx<0)return null;const old=d.offers[idx];const next={...old,...input,updatedAt:new Date().toISOString()};if(input.price!==undefined){next.price=Number(input.price);validatePrice(next.currency,next.price)}
if(input.currency!==undefined){next.currency=clean(input.currency,8).toUpperCase();validatePrice(next.currency,next.price)}if(input.countries)next.countries=input.countries.map(x=>clean(x,8).toUpperCase()).filter(Boolean);if(input.offerNeeds)next.offerNeeds=input.offerNeeds.map(x=>clean(x,40)).filter(Boolean);if(input.startAt)next.startAt=new Date(input.startAt).toISOString();if(input.endAt)next.endAt=new Date(input.endAt).toISOString();d.offers[idx]=next;d.version=Number(d.version||1)+1;write(d);return next;}
function getOffer(id,answers={}){
 const d=read(); const o=(d.offers||[]).find(x=>x.id===id);
 if(!o||!isActive(o,Date.now())||!matches(o,normalize(answers)))return null;
 return publicOffer(o);
}
function settings(patch={}){const d=read();if(patch.enabled!==undefined)d.enabled=Boolean(patch.enabled);if(patch.rotateOnRefresh!==undefined)d.rotateOnRefresh=Boolean(patch.rotateOnRefresh);if(patch.requireOnboarding!==undefined)d.requireOnboarding=Boolean(patch.requireOnboarding);if(patch.supportUrl!==undefined)d.supportUrl=clean(patch.supportUrl,200)||"contact.html";d.version=Number(d.version||1)+1;write(d);return d;}
module.exports={file,get,settings,add,remove,updateOffer,recommend,listMatching,publicOffer,getOffer};
