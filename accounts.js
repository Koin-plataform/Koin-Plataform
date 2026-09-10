"use strict";
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const dir=path.join(__dirname,"database"),file=path.join(dir,"accounts.json");
const sessions=new Map();
const SESSION_SECRET=process.env.ACCOUNT_SESSION_SECRET||process.env.ADMIN_SESSION_SECRET||"";
function ensure(){if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,"[]","utf8")}
function read(){ensure();try{const x=JSON.parse(fs.readFileSync(file,"utf8")||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function write(x){ensure();const tmp=file+".tmp";fs.writeFileSync(tmp,JSON.stringify(x,null,2));fs.renameSync(tmp,file)}
function id(){return "KAC-"+crypto.randomBytes(6).toString("hex").toUpperCase()}
function hash(password,salt=crypto.randomBytes(16).toString("hex")){return {salt,hash:crypto.scryptSync(password,salt,64).toString("hex")}}
function safe(a){if(!a)return null;return {id:a.id,name:a.name,email:a.email,createdAt:a.createdAt,status:a.status||"ACTIVE",paymentMethods:(a.paymentMethods||[]).map(({id,type,label,brand,last4,market,createdAt})=>({id,type,label,brand,last4,market,createdAt}))}}
async function register({name,email,password}){const all=read();if(all.some(a=>a.email===email))throw Error("An account with this email already exists.");const h=hash(password);const a={id:id(),name,email,passwordHash:h.hash,passwordSalt:h.salt,createdAt:new Date().toISOString(),status:"ACTIVE",paymentMethods:[]};all.push(a);write(all);return safe(a)}
async function authenticate(email,password){const a=read().find(x=>x.email===email);if(!a||a.status==="DISABLED"||!a.passwordSalt||!a.passwordHash)return null;let stored,derived;try{stored=Buffer.from(String(a.passwordHash),"hex");derived=crypto.scryptSync(String(password),String(a.passwordSalt),stored.length||64)}catch{return null}if(!stored.length||derived.length!==stored.length||!crypto.timingSafeEqual(derived,stored))return null;return safe(a)}
function b64(x){return Buffer.from(x).toString("base64url")}
function createToken(accountId){
  if(!SESSION_SECRET) return "";
  const payload=b64(JSON.stringify({a:accountId,e:Date.now()+7*86400000}));
  const sig=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("base64url");
  return payload+"."+sig;
}
async function fromToken(token){
  if(!token||!SESSION_SECRET)return null;
  try{
    const [p,s]=String(token).split(".");
    if(!p||!s)return null;
    const good=crypto.createHmac("sha256",SESSION_SECRET).update(p).digest("base64url");
    if(s.length!==good.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(good)))return null;
    const data=JSON.parse(Buffer.from(p,"base64url").toString());
    if(!data.a||Number(data.e)<=Date.now())return null;
    const a=read().find(x=>x.id===data.a);
    if(!a||a.status==="DISABLED")return null;
    return safe(a);
  }catch{return null}
}
async function addPaymentMethod(accountId,body){const type=String(body.type||"").toUpperCase();const allowed=["CARD","MPESA","BANK_TRANSFER","PAYPAL"];if(!allowed.includes(type))throw Error("Unsupported payment method.");if(type==="CARD"&&body.number)throw Error("Raw card numbers are not stored by KOIN. Use a supported payment provider to tokenize cards.");const all=read(),a=all.find(x=>x.id===accountId);if(!a)throw Error("Account not found.");const m={id:"PM-"+crypto.randomBytes(5).toString("hex"),type,label:String(body.label||type).trim().slice(0,60)||type,brand:String(body.brand||"").trim().slice(0,30),last4:String(body.last4||"").replace(/\D/g,"").slice(-4),market:String(body.market||"").trim().slice(0,8),createdAt:new Date().toISOString()};a.paymentMethods=a.paymentMethods||[];a.paymentMethods.push(m);write(all);return m}
async function removePaymentMethod(accountId,methodId){const all=read(),a=all.find(x=>x.id===accountId);if(!a)return false;const before=(a.paymentMethods||[]).length;a.paymentMethods=(a.paymentMethods||[]).filter(m=>m.id!==methodId);if(a.paymentMethods.length===before)return false;write(all);return true}
function adminList(){return read().map(safe)}
function setStatus(accountId,status){const all=read(),a=all.find(x=>x.id===accountId);if(!a)return null;status=String(status||"").toUpperCase();if(!["ACTIVE","DISABLED"].includes(status))throw Error("Invalid account status.");a.status=status;write(all);return safe(a)}
function tokenFromRequest(req){const auth=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"").trim();if(auth)return auth;const raw=String(req.headers.cookie||"");const m=raw.match(/(?:^|;\s*)koin_account_session=([^;]+)/);return m?decodeURIComponent(m[1]):""}
module.exports={register,authenticate,createToken,fromToken,tokenFromRequest,addPaymentMethod,removePaymentMethod,adminList,setStatus};
