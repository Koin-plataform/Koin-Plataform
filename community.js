"use strict";
const crypto=require("crypto");
const fs=require("fs"),path=require("path");
const dir=path.join(__dirname,"database");
const file=path.join(dir,"community.json");
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({messages:[],offers:[]},null,2));}
function read(){ensure();try{return JSON.parse(fs.readFileSync(file,"utf8"))||{messages:[],offers:[]}}catch{return {messages:[],offers:[]}}}
function write(data){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,file)}
function listMessages(room="general",limit=100){const d=read();return (d.messages||[]).filter(m=>m.room===room).slice(-limit)}
function addMessage({room="general",name="Guest",text}){const d=read();const m={id:crypto.randomUUID(),room:String(room).slice(0,100),name:String(name).slice(0,40),text:String(text).trim().slice(0,1000),createdAt:new Date().toISOString()};d.messages=(d.messages||[]).concat(m).slice(-5000);write(d);return m}
function listOffers(){const d=read();return (d.offers||[]).filter(o=>o.active!==false).slice().reverse()}
function addOffer(data){
 const d=read();
 const offer={
  id:crypto.randomUUID(),
  name:String(data.name||"Guest").trim().slice(0,40)||"Guest",
  side:data.side==="buy"?"buy":"sell",
  currency:String(data.currency||"MZN").slice(0,10),
  price:String(data.price||"").trim().slice(0,30),
  min:String(data.min||"").trim().slice(0,30),
  max:String(data.max||"").trim().slice(0,30),
  payment:String(data.payment||"").trim().slice(0,50),
  contactType:data.contactType==="email"?"email":"private_chat",
  contactValue:String(data.contactValue||"").trim().slice(0,160),
  message:String(data.message||"").trim().slice(0,300),
  createdAt:new Date().toISOString(),
  active:true
 };
 if(!offer.price||!offer.min||!offer.max||!offer.payment) throw new Error("Missing offer fields");
 if(offer.contactType==="email"&&!offer.contactValue) throw new Error("Email is required");
 d.offers=(d.offers||[]).concat(offer).slice(-2000);write(d);return offer;
}
function removeOffer(id){const d=read();const o=(d.offers||[]).find(x=>x.id===id);if(!o)return null;o.active=false;write(d);return o}
module.exports={listMessages,addMessage,listOffers,addOffer,removeOffer};
