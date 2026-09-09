"use strict";
const crypto=require("crypto");
const fs=require("fs"),path=require("path");
const dir=path.join(__dirname,"database");
const file=path.join(dir,"community.json");
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({messages:[]},null,2));}
function read(){ensure();try{return JSON.parse(fs.readFileSync(file,"utf8"))||{messages:[]}}catch{return {messages:[]}}}
function write(data){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,file)}
function listMessages(room="general",limit=100){const d=read();return (d.messages||[]).filter(m=>m.room===room).slice(-limit)}
function addMessage({room="general",name="Guest",text}){const d=read();const m={id:crypto.randomUUID(),room,name:String(name).slice(0,40),text:String(text).trim().slice(0,1000),createdAt:new Date().toISOString()};d.messages=(d.messages||[]).concat(m).slice(-5000);write(d);return m}
module.exports={listMessages,addMessage};
