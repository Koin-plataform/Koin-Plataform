"use strict";
const fs=require("fs");
const path=require("path");
const DATA_DIR=path.resolve(process.env.DATA_DIR||path.join(__dirname,"database"));
const UPLOADS_DIR=path.join(DATA_DIR,"uploads");
const PROOFS_DIR=path.join(UPLOADS_DIR,"proofs");
function ensureDir(dir){fs.mkdirSync(dir,{recursive:true});return dir;}
ensureDir(DATA_DIR);ensureDir(PROOFS_DIR);
module.exports={DATA_DIR,UPLOADS_DIR,PROOFS_DIR,ensureDir};
