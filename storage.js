"use strict";
const fs=require("fs");
const path=require("path");
const DATA_DIR=path.resolve(process.env.DATA_DIR||path.join(__dirname,"database"));
const UPLOADS_DIR=path.resolve(process.env.UPLOADS_DIR||path.join(DATA_DIR,"uploads"));
const PROOFS_DIR=path.resolve(process.env.PROOFS_DIR||path.join(UPLOADS_DIR,"proofs"));
function ensure(){fs.mkdirSync(DATA_DIR,{recursive:true});fs.mkdirSync(PROOFS_DIR,{recursive:true});}
ensure();
module.exports={DATA_DIR,UPLOADS_DIR,PROOFS_DIR,ensure};
