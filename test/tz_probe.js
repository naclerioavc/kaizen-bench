// Runs analyzeLog under whatever TZ the parent set (grade.js uses America/New_York) and prints
// the parsed span in hours. Log timestamps must parse TZ/DST-independently (fixed UTC decomposition):
// 01:00 -> 04:00 on a US spring-forward day is 3.00h of LOG time, whatever the viewer's zone.
const fs=require("fs"), path=require("path"), u=require("util");
const { JSDOM }=require("jsdom");
const w=new JSDOM(fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8"),{runScripts:"dangerously",url:"https://x.local/"}).window;
w.TextDecoder=u.TextDecoder; w.TextEncoder=u.TextEncoder;
const log=["Error: A # 2026-03-08 01:00:00 # first","Error: A # 2026-03-08 04:00:00 # last"].join("\n");
process.stdout.write(String(w.analyzeLog(log).spanH));
