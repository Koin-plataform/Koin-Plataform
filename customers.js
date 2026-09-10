"use strict";
const fs=require("fs");const storage=require("./storage");const path=require("path");const crypto=require("crypto");
const dir=storage.DATA_DIR;const file=path.join(dir,"customers.json");
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,"{}")}
function read(){ensure();try{return JSON.parse(fs.readFileSync(file,"utf8"))||{}}catch{return{}}}
function write(d){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(d,null,2));fs.renameSync(tmp,file)}
function key(email){return String(email||"").trim().toLowerCase()}
function touch(email,name){const k=key(email);if(!k)return null;const d=read(),now=new Date().toISOString();let c=d[k];if(!c)c={id:"CUS-"+crypto.randomBytes(5).toString("hex").toUpperCase(),email:k,name:String(name||"").trim(),createdAt:now,updatedAt:now,orderCount:0,totalUSDT:0,lastOrderAt:null};else {if(name&&String(name).trim())c.name=String(name).trim();c.updatedAt=now}d[k]=c;write(d);return c}
function recordOrder(email,name,amount,status,createdAt){const c=touch(email,name);if(!c)return null;const d=read(),k=key(email);const x=d[k];x.orderCount=(x.orderCount||0)+1;x.totalUSDT=Number(x.totalUSDT||0)+Number(amount||0);x.lastOrderAt=createdAt||new Date().toISOString();x.lastStatus=status||null;x.updatedAt=new Date().toISOString();d[k]=x;write(d);return x}
function list(orders){const d=read(),map={};Object.values(d).forEach(c=>map[c.email]={...c});for(const o of orders||[]){const k=key(o.customerEmail);if(!k)continue;const c=map[k]||touch(o.customerEmail,o.customerName);if(!c)continue;map[k]={...c,orderCount:Math.max(Number(c.orderCount||0),0),lastOrderAt:c.lastOrderAt||o.createdAt};}
return Object.values(map).sort((a,b)=>new Date(b.lastOrderAt||b.updatedAt)-new Date(a.lastOrderAt||a.updatedAt));}
module.exports={file,key,touch,recordOrder,list};
