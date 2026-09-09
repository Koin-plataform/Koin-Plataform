"use strict";
const fs=require("fs");const path=require("path");
const dir=path.join(__dirname,"database");const file=path.join(dir,"settings.json");
const DEFAULTS={
 maxActiveOrdersPerCustomer:3,maxOrdersPerCustomer24h:5,maxUSDTPerCustomer24h:100000,maxSiteOrders24h:100,maxSameAmountPerCustomer24h:2,orderLimitsEnabled:true,
 blockedCountries:[],requireCountrySelection:false,
 rates:{MZN:65,AOA:950,ZAR:18.5,USD:1.02},
 rateSchedules:[],
 announcements:[]
};
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULTS,null,2));}
function read(){ensure();try{return {...DEFAULTS,...JSON.parse(fs.readFileSync(file,"utf8"))}}catch{return {...DEFAULTS}}}
function write(s){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify({...DEFAULTS,...s},null,2));fs.renameSync(tmp,file)}
function get(){return read()}
function currentRates(at=Date.now()){
 const d=read(), base={...DEFAULTS.rates,...(d.rates||{})};
 const schedules=(d.rateSchedules||[]).filter(x=>x&&x.effectiveAt&&Date.parse(x.effectiveAt)<=at).sort((a,b)=>Date.parse(a.effectiveAt)-Date.parse(b.effectiveAt));
 if(schedules.length) return {...base,...(schedules[schedules.length-1].rates||{})};
 return base;
}
function nextSchedule(at=Date.now()){
 const d=read();
 return (d.rateSchedules||[]).filter(x=>x&&x.effectiveAt&&Date.parse(x.effectiveAt)>at).sort((a,b)=>Date.parse(a.effectiveAt)-Date.parse(b.effectiveAt))[0]||null;
}
function setRates(rates){
 const d=read(); d.rates={...DEFAULTS.rates,...(d.rates||{}),...rates};
 write(d); return d.rates;
}
function addRateSchedule(input){
 const d=read(); const effectiveAt=new Date(input.effectiveAt).toISOString();
 if(Date.parse(effectiveAt)<=Date.now()) throw new Error("Schedule time must be in the future.");
 const rates={...currentRates(),...input.rates};
 for(const k of ["MZN","AOA","ZAR","USD"]){const n=Number(rates[k]);if(!Number.isFinite(n)||n<=0)throw new Error("All rates must be greater than zero.");rates[k]=n}
 const item={id:require("crypto").randomUUID(),effectiveAt,rates,announcement:String(input.announcement||"").trim().slice(0,300),popupDurationMinutes:Math.max(1,Math.min(10080,Number(input.popupDurationMinutes)||1440)),popupRepeatMinutes:Math.max(1,Math.min(10080,Number(input.popupRepeatMinutes)||60)),createdAt:new Date().toISOString()};
 d.rateSchedules=(d.rateSchedules||[]).filter(x=>x.id!==item.id).concat(item).sort((a,b)=>Date.parse(a.effectiveAt)-Date.parse(b.effectiveAt)).slice(-100);
 write(d); return item;
}
function removeRateSchedule(id){const d=read();const before=d.rateSchedules||[];const item=before.find(x=>x.id===id);d.rateSchedules=before.filter(x=>x.id!==id);write(d);return item||null}
function addAnnouncement(text,input={}){
 const d=read();
 const now=new Date();
 const startAt=input.startAt?new Date(input.startAt).toISOString():now.toISOString();
 const endAt=input.endAt?new Date(input.endAt).toISOString():new Date(now.getTime()+24*60*60*1000).toISOString();
 const repeatEveryMinutes=Math.max(1,Math.min(10080,Number(input.repeatEveryMinutes)||60));
 const item={id:require("crypto").randomUUID(),text:String(text||"").trim().slice(0,300),startAt,endAt,repeatEveryMinutes,createdAt:now.toISOString()};
 if(!item.text)throw new Error("Announcement text is required.");
 if(Date.parse(endAt)<=Date.parse(startAt))throw new Error("End time must be after start time.");
 d.announcements=(d.announcements||[]).concat(item).slice(-200);write(d);return item;
}
function update(patch){const next={...read(),...patch};next.maxActiveOrdersPerCustomer=Math.max(0,Math.min(100,Number(next.maxActiveOrdersPerCustomer)||0));next.maxOrdersPerCustomer24h=Math.max(0,Math.min(1000,Number(next.maxOrdersPerCustomer24h)||0));next.maxUSDTPerCustomer24h=Math.max(0,Math.min(10000000,Number(next.maxUSDTPerCustomer24h)||0));next.maxSiteOrders24h=Math.max(0,Math.min(100000,Number(next.maxSiteOrders24h)||0));next.maxSameAmountPerCustomer24h=Math.max(0,Math.min(20,Number(next.maxSameAmountPerCustomer24h)||0));next.orderLimitsEnabled=Boolean(next.orderLimitsEnabled);next.blockedCountries=Array.isArray(next.blockedCountries)?next.blockedCountries.map(x=>String(x).toUpperCase().trim()).filter(Boolean).slice(0,30):[];next.requireCountrySelection=Boolean(next.requireCountrySelection);
 next.rates={...DEFAULTS.rates,...(next.rates||{})};
 next.rateSchedules=Array.isArray(next.rateSchedules)?next.rateSchedules.slice(-100):[];
 next.announcements=Array.isArray(next.announcements)?next.announcements.slice(-200):[];
 write(next);return next}
module.exports={get,update,file,DEFAULTS,currentRates,nextSchedule,setRates,addRateSchedule,removeRateSchedule,addAnnouncement};
