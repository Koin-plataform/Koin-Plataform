"use strict";
const fs=require("fs");const path=require("path");
const dir=path.join(__dirname,"database");const file=path.join(dir,"settings.json");
const DEFAULTS={maxActiveOrdersPerCustomer:3,maxOrdersPerCustomer24h:5,maxUSDTPerCustomer24h:100000,maxSiteOrders24h:100,maxSameAmountPerCustomer24h:2,blockedCountries:[],requireCountrySelection:false};
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULTS,null,2));}
function read(){ensure();try{return {...DEFAULTS,...JSON.parse(fs.readFileSync(file,"utf8"))}}catch{return {...DEFAULTS}}}
function write(s){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify({...DEFAULTS,...s},null,2));fs.renameSync(tmp,file)}
function get(){return read()}
function update(patch){const next={...read(),...patch};next.maxActiveOrdersPerCustomer=Math.max(0,Math.min(100,Number(next.maxActiveOrdersPerCustomer)||0));next.maxOrdersPerCustomer24h=Math.max(0,Math.min(1000,Number(next.maxOrdersPerCustomer24h)||0));next.maxUSDTPerCustomer24h=Math.max(0,Math.min(10000000,Number(next.maxUSDTPerCustomer24h)||0));next.maxSiteOrders24h=Math.max(0,Math.min(100000,Number(next.maxSiteOrders24h)||0));next.maxSameAmountPerCustomer24h=Math.max(0,Math.min(20,Number(next.maxSameAmountPerCustomer24h)||0));next.blockedCountries=Array.isArray(next.blockedCountries)?next.blockedCountries.map(x=>String(x).toUpperCase().trim()).filter(Boolean).slice(0,30):[];next.requireCountrySelection=Boolean(next.requireCountrySelection);write(next);return next}
module.exports={get,update,file,DEFAULTS};
