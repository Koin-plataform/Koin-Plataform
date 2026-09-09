"use strict";
const fs=require("fs");const path=require("path");
const dir=path.join(__dirname,"database");const file=path.join(dir,"orders.json");
function ensureDatabase(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,"[]","utf8");}
function readOrders(){ensureDatabase();try{const raw=fs.readFileSync(file,"utf8");const data=JSON.parse(raw||"[]");return Array.isArray(data)?data:[];}catch(e){console.error("Database read error:",e.message);return[];}}
function writeOrders(orders){ensureDatabase();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(orders,null,2),"utf8");fs.renameSync(tmp,file);}
function addOrder(order){const orders=readOrders();orders.unshift(order);writeOrders(orders);return order;}
function getOrder(reference){return readOrders().find(o=>o.reference===reference)||null;}
function updateOrder(reference,patch){const orders=readOrders();const i=orders.findIndex(o=>o.reference===reference);if(i<0)return null;orders[i]={...orders[i],...patch,updatedAt:new Date().toISOString()};writeOrders(orders);return orders[i];}
module.exports={readOrders,writeOrders,addOrder,getOrder,updateOrder,file};
