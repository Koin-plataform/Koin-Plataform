"use strict";
const fs=require("fs");const path=require("path");const storage=require("./storage");const crypto=require("crypto");
const dir=storage.DATA_DIR;const file=path.join(dir,"onboarding.json");
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,"[]")}
function read(){ensure();try{return JSON.parse(fs.readFileSync(file,"utf8"))||[]}catch{return[]}}
function write(d){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(d,null,2));fs.renameSync(tmp,file)}
function clean(v,max=120){return String(v??"").trim().slice(0,max)}
function save(input={}){
 const d=read();const item={id:"VIS-"+crypto.randomBytes(5).toString("hex").toUpperCase(),name:clean(input.name,80),country:clean(input.country,8).toUpperCase(),offerNeeds:Array.isArray(input.offerNeeds)?input.offerNeeds.map(x=>clean(x,40)).slice(0,5):(input.offerNeed?[clean(input.offerNeed,40)]:[]),firstTime:["yes","no"].includes(input.firstTime)?input.firstTime:null,useCase:["personal","arbitrage","commercial"].includes(input.useCase)?input.useCase:null,createdAt:new Date().toISOString()};
 if(!item.name||!item.country)throw new Error("Name and country are required.");
 d.push(item);write(d);return item;
}
function list(){return read().slice().reverse().slice(0,500)}
module.exports={file,save,list};
