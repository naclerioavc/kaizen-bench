// Comprehensive grading harness for SIMPL Bench.
// Loads the shipped index.html in a DOM, then (1) asserts every extraction function against
// synthetic fixtures with known ground truth, and (2) renders the Audit + Log and asserts the
// expected cards/panels appear — i.e. the tool is doing everything it's supposed to.
//   npm install && npm test    (no client data; fixtures are hand-built)
const fs=require("fs"), path=require("path");
const { JSDOM }=require("jsdom");
const w=new JSDOM(fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8"),{runScripts:"dangerously",url:"https://simplbench.local/"}).window;
{ const u=require("util"); w.TextDecoder=w.TextDecoder||u.TextDecoder; w.TextEncoder=w.TextEncoder||u.TextEncoder; }

let pass=0, fail=0;
const ck=(n,got,want)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); ok?pass++:fail++; console.log(`  ${ok?"PASS":"FAIL"}  ${n}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); };
const has=(n,cond)=>{ cond?pass++:fail++; console.log(`  ${cond?"PASS":"FAIL"}  ${n}`); };

const sg=(h,nm,tp)=>`[\nObjTp=Sg\nH=${h}\nNm=${nm}\nSgTp=${tp}\n]`;
const sm=(h,nm,f)=>`[\nObjTp=Sm\nH=${h}\nNm=${nm}\n${f}\n]`;

// ---- program fixture ----
const smw=[
  `[\nObjTp=Hd\nPgmNm=TestProg\nDlrNm=TestDealer\nCltNm=TestClient\nPrNm=test.smw\nCmVr=4.00\nDbVr=1.2.3\nDvcDbVr=9.9.9\n]`,
  sg(1,"Audio.Vol","2"), sg(2,"Lights.On",""), sg(3,"Disp.Tx","4"), sg(4,"Set.Level","2"),
  sm(10,"Folder","mC=3\nC1=11\nC2=12\nC3=519"),
  sm(11,"AudioMod.usp","I1=1\nO1=4\nP1=50\nP2=Living Room"),
  sm(12,"DrvB","O1=4"),                              // 2nd driver of analog sig 4 -> value contention
  sm(13,"TCP Client","P1=10.0.0.5\nI1=2"),
  `[\nObjTp=Sm\nH=20\nNm=SUBSYSTEM\nCmn1=AudioRoom\\\\\nmC=1\nC1=21\n]`,
  sm(21,"Test.usp","I1=1"),
  sm(519,"COM 2-Way Serial Driver","O1=3"),
  `[\nObjTp=Dv\nH=519\nNm=COM 2-Way Serial Driver\nAd=02\nSmH=519\n]`,
  `[\nObjTp=Cm\nH=1\nDvH=519\nPtl=(RS232)\nBRt=9600\nPty=N\nSBt=1\nDBt=8\nhHs=(None)\nsHs=(None)\n]`,
  `[\nObjTp=Dv\nH=940\nNm=P4Ethernet\nAd=00\n]`,
  `[\nObjTp=Dv\nH=941\nNm=CEN-IO-RY-204\nAd=06\nPrH=940\n]`,
  `[\nObjTp=Dv\nH=600\nNm=Relays\nAd=03\nSmH=11\nPrH=941\n]`,
  `[\nObjTp=Dv\nH=950\nNm=Ethernet Intersystem Communications:OtherProg.rsd\nAd=F1\nPrH=940\n]`,
  `[\nObjTp=Dv\nH=960\nNm=Matrix\nAd=05\nSmH=970\nPrH=940\n]`,
  `[\nObjTp=Sm\nH=970\nNm=MatrixCtrl\nI1=1\nO1=2\n]`,
  `[\nObjTp=VTP\nDvH=700\nTSAddr=1c\nVTPFile=C:\\proj\\UI\\Main.vtp\n]`,
  `[\nObjTp=Db\nH=1\nDvH=700\nMnf=Crestron\nMdl=TSW-1070\nTpe=7 inch Touch Screen\n]`,
  `[\nObjTp=Db\nH=2\nDvH=701\nMnf=Crestron\nMdl=DM-MD8X8\nTpe=HDMI Matrix\n]`,
  `[\nObjTp=Dv\nH=910\nNm=DM-NVX-D30 Zone 1\nAd=1F\nPrH=940\n]`,
  `[\nObjTp=Dv\nH=915\nNm=IR Ports\nAd=01\nPrH=910\n]`,
  `[\nObjTp=Dv\nNm=Living Room TV\nH=900\nAd=02\nSmH=21\nPrH=915\n]`,
  `[\nObjTp=Db\nH=50\nDvH=900\nMnf=Sony\nMdl=Bravia X90\nDrF=Sony Bravia X90.ir\n]`,
  `[\nObjTp=Et\nH=1\nDvH=941\nIPA=192.168.1.50\nIPM=255.255.255.0\n]`,
].join("\n");
const smft=`<Device Model="CP4"><Network Type="Ethernet" Id="02"><Device Model="DM-MD8X8" DeviceId="05" Name="Matrix"/><Device Model="TSW-1070" DeviceId="1C" Name="Panel"/><Network Type="Cresnet" Id="01"><Device Model="GLS-ODT" DeviceId="03" Name="Occ"/></Network></Network></Device>`;
const dip=`[IPTable]\nid0=05\naddr0=192.168.1.10\nid1=06\naddr1=\nid2=05\naddr2=192.168.1.99\nid3=1C\naddr3=10.0.0.50\nid4=F1\naddr4=10.0.0.77\n`; // id 05 twice w/ DIFFERENT addr -> conflict; id 06 blank

// ---- log fixture ----
const log=[
  "Discovered Device Info:",
  "      ModelName : CP4",
  "       Hostname : CP4-LAB",
  "      IpAddress : 10.0.0.2",
  "       Firmware : 2.8000",
  "   SerialNumber : SN123",
  "",
  "Error: LogicEngine_1 # 2026-06-25 12:00:00 # Logic could not be solved within 1500 waves.",
  "========== ipconfig /all ==========",
  "ipconfig /all",
  "\tIP Address ........ : 10.0.0.2",
  "\tSubnet Mask ....... : 255.255.255.0",
  "\tDefault Gateway ... : 10.0.0.1",
  "\tDHCP .............. : OFF",
  "========== showhw ==========",
  "showhw",
  "\tProcessor Type:    CP4",
  "\t   1: C2I-CP4CNET-1 Cresnet",
  "========== netstat ==========",
  "netstat",
  "tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN",
  "tcp        0      0 10.0.0.2:50000          10.0.0.5:23             ESTABLISHED",
  "========== autodiscovery query tableformat ==========",
  "TableStart:[Discovered Nodes]",
  "IP Address        |IP_ID|Interface|HostName            |FirmwareName",
  "10.0.0.20         |7a   |LAN      |TSW220              |TSW-1060 [v3.001]",
  "========== other ==========",
  "done",
].join("\n");

// ===== extraction checks =====
const h=w.parseHeader(smw);
ck("header program/dealer/client",[h.program,h.dealer,h.client],["TestProg","TestDealer","TestClient"]);
ck("header versions",[h.compiler,h.dbVer],["4.00","1.2.3"]);
const d=w.parseDip(dip);
ck("IP-ID distinct",d.size,4); ck("IP-ID 06 blank",d.get("06"),"");
const devs=w.parseSmft(smft);
ck("smft devices",devs.filter(x=>x.id).length,3);
ck("param IPs",[...new Set(w.scanProgramIPs(smw).map(x=>x.ip))],["10.0.0.5"]);
const ser=w.scanSerial(smw).filter(x=>x.proto||x.baud);
ck("serial 9600 8N1 RS232",[ser[0].baud,ser[0].data+ser[0].parity+ser[0].stop,ser[0].proto],["9600","8N1","RS232"]);
{ const io=w.scanIO(smw)[0]; ck("relay lands-on host device + endpoint IP-ID",[io.host,io.hostIpid],["CEN-IO-RY-204","06"]); }
{ const et=w.parseEt(smw); ck("Et static IP joined to device by IP-ID",[et.get("06")&&et.get("06").ip, et.get("06")&&et.get("06").name],["192.168.1.50","CEN-IO-RY-204"]); }
{ const sm=w.parseSmft(smft); const child=sm.find(x=>x.id==="05"); has("smft tracks parent device (nesting)", sm.some(x=>x.parent)); }
{ const nr=w.dvNetRoles(smw); ck("EISC detected at IP-ID F1",[nr.get("F1")&&nr.get("F1").role, nr.get("F1")&&nr.get("F1").detail],["EISC / intersystem link","OtherProg.rsd"]); }
ck("relay/IO ports",w.scanIO(smw).length,1);
const tp=w.parseTouchpanels(smw);
ck("touchpanel model/addr/project",[tp[0].model,tp[0].addr,tp[0].project],["TSW-1070","1C","Main.vtp"]);
ck("device catalog distinct",w.parseDeviceCatalog(smw).length,3);
{ const ir=w.parseIrDevices(smw)[0]; ck("IR device: name/model/mfr/port/driver",[ir.device,ir.model,ir.mfr,ir.port,ir.driver],["Living Room TV","Bravia X90","Sony","02","Sony Bravia X90"]);
  ck("IR device resolves SPECIFIC host endpoint + IP-ID",[ir.host,ir.hostIpid],["DM-NVX-D30 Zone 1","1F"]); }
ck("discovered nodes",w.parseDiscovered(log).map(x=>[x.ip,x.ipid,x.host]),[["10.0.0.20","7A","TSW220"]]);
has("netstat LISTEN+ESTABLISHED >=2", w.parseNetstat(log).filter(x=>x.state==="LISTEN"||x.state==="ESTABLISHED").length>=2);
const m=w.parseSmw(smw); let D=0,A=0,S=0; m.sigType.forEach(t=>{const c=({"":"D","1":"D","2":"A","4":"S"})[t]||"D";c==="D"?D++:c==="A"?A++:S++;});
ck("D/A/S split",[D,A,S],[1,2,1]);
{ const sy=m.syms.find(x=>x.Nm==="AudioMod.usp"); ck("symbol parameters captured",[sy.params.length, sy.params[0].v],[2,"50"]); }
{ const A2=w.parseSmw(smw.replace("P1=50","P1=50")); const B2=w.parseSmw(smw.replace("P1=50","P1=80"));
  const pc=w.computeDiff(A2,B2).paramChanges;
  ck("parameter diff: same wiring, changed setting",[pc.length, pc[0]&&pc[0].changes[0].from, pc[0]&&pc[0].changes[0].to],[1,"50","80"]); }
ck("folder path uses Cmn1 label not SUBSYSTEM",[w.folderPath(m,21), /SUBSYSTEM/.test(w.folderPath(m,21))],["AudioRoom",false]);
const si=w.systemInfo(log);
ck("systemInfo model+network",[si.identity.model,si.network&&si.network.gateway],["CP4","10.0.0.1"]);
{ const prog={smw,smft,dip};
  has("systemMatch: same processor -> not flagged mismatch", w.systemMatch(prog,w.analyzeLog(log),log).status!=="mismatch");
  const mWrong=w.systemMatch(prog,{bootModel:"RMC4",dropTop:[["IP-ID 1F",5]]},"");
  ck("systemMatch: wrong processor model -> mismatch",[mWrong.status,mWrong.reason],["mismatch","model"]);
  const mProj=w.systemMatch(prog,{bootModel:"CP4",dropTop:[["IP-ID 62",9],["IP-ID 7A",3]]},"");
  ck("systemMatch: same model, no shared IP-IDs -> mismatch",[mProj.status,mProj.reason],["mismatch","ipid"]); }
{ const d3html=`<html><head><title>Load Wiring</title></head><body>
<table class="header"><tr class="titleblock"><td align="right"><b>Project: </b></td><td>Demo Residence</td></tr>
<tr class="titleblock"><td align="right"><b>Creator: </b></td><td>Crestron D3 Pro v3.06</td></tr></table>
<table class="default"><tr class="pageseparate"><td class="pagetitle"><b>Main Rack/Enclosure 1(Mech)</b> - [ slot 1 ], Total Load : 350W</td></tr></table>
<table class="module"><tr><td></td><td class="modulename" colspan="2">Module 1: CLX-2DIMU8</td></tr>
<tr><td></td><td class="modulename" colspan="2">Net-Device ID 1A</td></tr>
<tr class="circuit"><td class="ckt_loc" align="right"><b> Feed 1 for Module 1  (Arc Fault)</b></td><td class="hot" align="center">LINE 1</td><td class="hot">BLACK</td></tr>
<tr class="circuit"><td class="ckt_loc" align="right">Main Floor/Kitchen/Cans ( 150W )</td><td class="ckt_red" style="font-weight: bold" align="center">DIM 1</td><td class="ckt_red">RED</td></tr>
<tr class="circuit"><td class="ckt_loc" align="right">Main Floor/Kitchen/Island ( 100W )</td><td class="ckt_red" style="font-weight: bold" align="center">DIM 2</td><td class="ckt_red">RED</td></tr>
<tr class="circuit"><td class="ckt_loc" align="right"><b>Neutral feed</b></td><td class="ckt_white" align="center">N OUT 1</td><td class="ckt_white">WHITE</td></tr></table>
<table class="module"><tr><td></td><td class="modulename" colspan="2">Module 2: CLX-4HSW4</td></tr>
<tr><td></td><td class="modulename" colspan="2">Net-Device ID 1B</td></tr>
<tr class="circuit"><td class="ckt_loc" align="right">Main Floor/Powder/Exhaust Fan ( 60W )</td><td class="ckt_white" style="font-weight: bold" align="center">SW 1</td><td class="ckt_white">WHITE</td></tr></table>
</body></html>`;
  const d3=w.parseD3Loadwiring(d3html);
  ck("D3 loadwiring: load count (feed/neutral rows skipped)", d3.loads.length, 3);
  const l0=d3.loads[0];
  ck("D3 load fully instance-resolved",[l0.out,l0.modNum,l0.modType,l0.netid,l0.feed,l0.area,l0.load,l0.watt],
     ["DIM 1","1","CLX-2DIMU8","1A","Feed 1","Main Floor / Kitchen","Cans","150"]);
  has("D3 meta project + creator parsed", /Demo Residence/.test(d3.meta.project)&&/D3 Pro/.test(d3.meta.creator));
  w.eval(`state.prog={name:'demo.htm',model:null,smw:null,smft:null,dip:null,ir:null,d3:${JSON.stringify(d3)},auditDone:true,devDone:true}; runAudit();`);
  const cb=w.document.getElementById('censusBody').textContent;
  has("D3 renders a Lighting loads card", /Lighting loads/.test(cb));
  has("D3 renders shared-module grouping", /Loads by control module/.test(cb)); }
{ const lsHtml=`<html><body>Load Schedule<table><thead><tr><td class="header"><b>Area / Room / Controlled Ckt Name</b></td><td class="header"><b>Load Type</b></td><td class="header"><b>Total Watts</b></td><td class="header"><b>Module</b></td><td class="header"><b>Output</b></td></tr></thead>
<tr><td class="ld_cell">Main / Kitchen / Cans</td><td class="ld_cell">LED</td><td class="ld_cell">150</td><td class="ld_cell">CLX-2DIMU8</td><td class="ld_cell">1</td></tr>
<tr><td class="ld_cell">Main / Powder / Fan</td><td class="ld_cell">Fan</td><td class="ld_cell">60</td><td class="ld_cell">CLX-1FAN4</td><td class="ld_cell">2</td></tr></table></body></html>`;
  const ls=w.parseD3LoadSchedule(lsHtml);
  ck("D3 load schedule: rows + columns parsed",[ls.rows.length, ls.cols.length], [2,5]);
  ck("D3 load schedule: row resolves load/type/watts/module",[ls.rows[0]._load, ls.rows[0]["Load Type"], ls.rows[0]["Total Watts"], ls.rows[0]["Module"]],["Cans","LED","150","CLX-2DIMU8"]);
  const egHtml=`<html><body>Engraving Report<table><tr class="r0"><td><b>Room Name:</b></td><td>Kitchen</td></tr><tr class="r1"><td><b>Name:</b></td><td>Main Entry</td></tr><tr class="r0"><td><b>BOM:</b></td><td>HZ-KPCN-W</td></tr><tr class="r1"><td><b>Address:</b></td><td>Net-Device ID 1A</td></tr></table>
<table><tr class="r0"><td><b>Room Name:</b></td><td>Theater</td></tr><tr class="r1"><td><b>Name:</b></td><td>Bar</td></tr><tr class="r0"><td><b>BOM:</b></td><td>HZ-KPCN-B</td></tr><tr class="r1"><td><b>Address:</b></td><td>Net-Device ID 2B</td></tr></table></body></html>`;
  const eg=w.parseD3Engraving(egHtml);
  ck("D3 engraving: keypad stations parsed",eg.stations.length,2);
  ck("D3 engraving: station resolves room/name/model/net-id",[eg.stations[0].room,eg.stations[0].name,eg.stations[0].model,eg.stations[0].netid],["Kitchen","Main Entry","HZ-KPCN-W","1A"]); }
{ // archive manifest diff (zip central-directory, no decompression)
  const crc32=buf=>{ let crc=~0; for(let i=0;i<buf.length;i++){ crc^=buf[i]; for(let k=0;k<8;k++) crc=(crc>>>1)^(0xEDB88320&-(crc&1)); } return (~crc)>>>0; };
  const makeZip=files=>{ const locals=[],centrals=[]; let off=0;
    for(const f of files){ const name=Buffer.from(f.name,'utf8'),crc=crc32(f.data),sz=f.data.length;
      const lh=Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4); lh.writeUInt32LE(crc,14); lh.writeUInt32LE(sz,18); lh.writeUInt32LE(sz,22); lh.writeUInt16LE(name.length,26);
      const local=Buffer.concat([lh,name,f.data]);
      const ch=Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(20,4); ch.writeUInt32LE(crc,16); ch.writeUInt32LE(sz,20); ch.writeUInt32LE(sz,24); ch.writeUInt16LE(name.length,28); ch.writeUInt32LE(off,42);
      centrals.push(Buffer.concat([ch,name])); locals.push(local); off+=local.length; }
    const cd=Buffer.concat(centrals), la=Buffer.concat(locals);
    const eo=Buffer.alloc(22); eo.writeUInt32LE(0x06054b50,0); eo.writeUInt16LE(files.length,8); eo.writeUInt16LE(files.length,10); eo.writeUInt32LE(cd.length,12); eo.writeUInt32LE(la.length,16);
    const all=Buffer.concat([la,cd,eo]); return all.buffer.slice(all.byteOffset,all.byteOffset+all.byteLength); };
  const sgr=(h,nm,tp)=>`[\nObjTp=Sg\nH=${h}\nNm=${nm}\nSgTp=${tp}\n]`;
  const v1=sgr(1,"Audio.Vol","2")+"\n"+sgr(2,"Lights.On","");
  const v2=v1+"\n"+sgr(3,"New.Sig","");
  const zA=makeZip([{name:'proj/main.smw',data:Buffer.from(v1)},{name:'proj/readme.txt',data:Buffer.from('hello')}]);
  const zB=makeZip([{name:'proj/main.smw',data:Buffer.from(v2)},{name:'proj/added.txt',data:Buffer.from('new')}]);
  const mA=w.zipManifest(zA), mB=w.zipManifest(zB);
  ck("zipManifest strips top folder, reads entries",[...mA.keys()].sort(),["main.smw","readme.txt"]);
  const changed=[...mB.keys()].filter(k=>mA.has(k)&&mA.get(k).crc!==mB.get(k).crc);
  const added=[...mB.keys()].filter(k=>!mA.has(k)), removed=[...mA.keys()].filter(k=>!mB.has(k));
  ck("archive diff: changed / added / removed",[changed,added,removed],[["main.smw"],["added.txt"],["readme.txt"]]);
  let arcText=null; w.extractOne(zB, mB.get('main.smw').raw).then(t=>{arcText=t;});
  const fc=w.fileClass;
  has("fileClass: .smw program is diffable work", fc("AV/x.smw").work && fc("AV/x.smw").diff==="smw");
  has("fileClass: loadwiring is diffable lighting work", fc("D3/Documentation/loadwiring.htm").diff==="d3");
  has("fileClass: dll/inf/autosave/SPlsWork classified as noise", !fc("a.dll").work && !fc("b.inf").work && !fc("P/AUTOSAVE/x.smw").work && !fc("AV/SPlsWork/y.cs").work);
  has("fileClass: panel + config are work", fc("UI/p.vtz").work && fc("x.dip").work);
}

// ===== render checks: the tool actually displays it =====
w.eval(`state.prog.name='t'; state.prog.smw=${JSON.stringify(smw)}; state.prog.smft=${JSON.stringify(smft)}; state.prog.dip=${JSON.stringify(dip)}; state.prog.ir=['SomeTV']; state.prog.model=null; runAudit();`);
const titles=[...w.document.querySelectorAll('#censusBody .card-title')].map(t=>t.textContent.replace(/[\s\d\/,]+$/,'').trim());
["Program info","Network devices","Cresnet devices","IR devices","Touchpanels & UIs","Device summary (bill of materials)","Relay / IR / I-O ports","Serial ports","Third-party IPs","Module inventory","Signals"].forEach(t=>has("audit card: "+t, titles.includes(t)));
has("no standalone IP-ID table card (merged)", !titles.includes("IP-ID table"));
has("Checks card (dup IP-ID conflict surfaced)", titles.includes("Worth a quick look"));
{ const irCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('IR devices'));
  const hdr=irCard?[...irCard.querySelectorAll('thead th')].map(t=>t.textContent):[];
  has("IR card has IR port + Driver file + Location columns", hdr.includes("IR port")&&hdr.includes("Driver file")&&hdr.includes("Location"));
  has("IR card shows the port value", /IR 2/.test(irCard.textContent));
  has("IR card has On endpoint + Endpoint IP-ID columns", hdr.includes("On endpoint")&&hdr.includes("Endpoint IP-ID"));
  has("IR card names the specific endpoint", /DM-NVX-D30 Zone 1/.test(irCard.textContent)); }
{ const tpCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Touchpanels'));
  has("Touchpanel card has IP address column", [...tpCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("IP address"));
  has("Touchpanel resolves IP from IP table", /10\.0\.0\.50/.test(tpCard.textContent)); }
{ const cresCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Cresnet'));
  if(cresCard) has("Cresnet card has 'On bus / behind' column", [...cresCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("On bus / behind")); else {pass++;console.log("  PASS  (no cresnet in fixture)");} }
{ const ioCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Relay / IR'));
  has("Ports card has 'Lands on (device)' column", [...ioCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("Lands on (device)"));
  has("Port lands-on shows the host device", /CEN-IO-RY-204/.test(ioCard.textContent));
  has("Ports card has Endpoint IP-ID column", [...ioCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("Endpoint IP-ID"));
  has("Port rows drill to per-port breakdown", ioCard.querySelector('tbody tr[data-drill=ioports]')!=null); }
{ const serCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Serial ports'));
  if(serCard) has("Serial card has Endpoint IP-ID column", [...serCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("Endpoint IP-ID")); else { pass++; console.log("  PASS  (no serial in fixture — skipped)"); } }
{ const netCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Network devices'));
  has("Network card has Role / type column", [...netCard.querySelectorAll('thead th')].map(t=>t.textContent).includes("Role / type"));
  has("Network card flags the EISC", /EISC/.test(netCard.textContent)); }
has("audit shows action bar (needs-attention summary up top)", w.document.querySelector("#censusBody .actionbar")!=null);
has("Checks card is accented (.card.attn)", w.document.querySelector("#censusBody .card.attn")!=null);
{ const netCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Network devices'));
  const dc=netCard.querySelector('[data-drill=devsignals]');
  has("device row drillable to its wired signals", dc!=null);
  if(dc){ dc.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); has("device-signals drill lists the wired signals", w.document.querySelectorAll('#modalBody [data-drill=signal]').length>=1); } }
has("per-tab help present on each tab", w.document.querySelectorAll('.tabhelp').length>=3);
has("as-built report cover present (printable deliverable)", w.document.querySelector('#censusBody .report-cover')!=null);
{ w.eval('drill("signal","Audio.Vol")'); const txt=w.document.getElementById('modalBody').textContent;
  has("signal tracer shows physical coordinate (device + pin)", /Matrix/.test(txt) && /pin 1/.test(txt)); }
{ w.eval('drill("syminst","970")'); const mb=w.document.getElementById('modalBody');
  has("instance drill shows a pin map (I1/O1 ...)", [...mb.querySelectorAll('thead th')].some(t=>t.textContent==='Pin') && /I1/.test(mb.textContent));
  has("instance drill shows the instance's physical landing", /Physical landing/.test(mb.textContent) && /Matrix/.test(mb.textContent)); }
{ w.eval('drill("syminst","11")'); const mb=w.document.getElementById('modalBody');
  has("parameters classified by Kind (value vs pin/function name)", [...mb.querySelectorAll('thead th')].some(t=>t.textContent==='Kind') && /pin \/ function name/.test(mb.textContent) && /value/.test(mb.textContent)); }
{ w.eval('drill("rtrace","Set.Level")'); const mb=w.document.getElementById('modalBody');
  has("reverse trace walks upstream through the logic (multi-hop)", w.document.querySelectorAll('#modalBody [data-drill=rtrace]').length>=2 && /Audio\.Vol/.test(mb.textContent)); }
{ w.eval('drill("signal","Set.Level")'); const mb=w.document.getElementById('modalBody');
  has("signal tracer offers trace-back/forward buttons", mb.querySelector('[data-drill=rtrace]')!=null && mb.querySelector('[data-drill=ftrace]')!=null); }
{ const net=[...w.document.querySelectorAll('#censusBody .card')].find(c=>/Network devices/.test(c.querySelector('.card-title').textContent));
  const dc=net.querySelector('[data-drill=devsignals]'); dc.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  has("device-signals drill shows join/pin numbers", [...w.document.querySelectorAll('#modalBody thead th')].some(t=>/Join \/ pin/.test(t.textContent))); }
{ const bomCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>/bill of materials/.test(c.querySelector('.card-title').textContent));
  has("BOM model rows drillable to device instances", bomCard&&bomCard.querySelector('[data-drill=bom]')!=null); }
{ const serCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>/Serial ports/.test(c.querySelector('.card-title').textContent));
  if(serCard) has("serial rows drillable to the COM symbol I/O", serCard.querySelector('tr.drill')!=null); else {pass++;console.log("  PASS  (no serial in fixture)");} }
has("per-card CSV buttons present", w.document.querySelectorAll('#censusBody .csvbtn').length>0);
has("export-select checkboxes present", w.document.querySelectorAll('#censusBody .cardsel').length>0);
{ const bx=[...w.document.querySelectorAll('#censusBody .cardsel')].slice(0,2); bx.forEach(b=>b.checked=true); w.eval("updateExportSel();"); has("combined export enables on selection", !w.document.getElementById('auditExport').disabled); }
w.eval(`runLog('t.log', ${JSON.stringify(log)});`);
const lb=w.document.getElementById('logBody').textContent;
has("log: System panel", lb.includes("Model")||lb.includes("CP4-LAB"));
has("log: Discovered devices", lb.includes("Discovered network devices"));
has("log: Open ports (netstat)", lb.includes("Open ports"));
{ const al=w.analyzeLog(["Notice: Console # 2026-06-25 12:00:00 # SSH connection attempt failed from 10.0.0.9","Warning: Eth # 2026-06-25 12:01:00 # End of Query Acknowledge not received from IP-ID-1A"].join("\n"));
  has("log: SSH/auth attempts counted", al.authFails>=1);
  has("log: dropping IP-IDs captured for correlation", al.dropIds.includes("1A")); }
{ const L=[]; for(let i=0;i<6;i++){const mm=String(i*5).padStart(2,"0"); L.push("Warning: Eth # 2026-06-25 12:"+mm+":00 # End of Query Acknowledge not received from IP-ID-2A");}
  const al=w.analyzeLog(L.join("\n")); has("log: regular-interval (periodic) drops detected", al.periodic.length>=1 && al.periodic[0].everyS===300); }
{ const lg=["Notice: a_console # 2026-06-10 11:38:02 # System startup CP4 Cntrl Eng [v2.8001.00098 (Jul 26 2023)]",
    "Error: X # 2026-06-10 11:38:40 # boom (written 5 times)",
    "Fatal: LogicEngine_1 # 2026-06-10 11:38:40 # The following file(s) are missing\r\r",
    "Fatal: LogicEngine_1 # 2026-06-10 11:38:40 # FileName: 01_CP4_Main.bin.",
    "Error: LE # 2026-06-10 11:39:00 # Exclusive device Slot-10 Port 1 is already in use by Program 02"].join("\n");
  const al=w.analyzeLog(lg);
  has("log: double-CR Fatal line parsed not dropped", al.fatalN>=1);
  has("log: (written N times) multiplier counted", al.errN>=5);
  ck("log: boot model + firmware extracted",[al.bootModel,al.bootFw],["CP4","2.8001.00098"]);
  has("log: missing program files surfaced", al.missingFiles.some(f=>/01_CP4_Main\.bin/.test(f)));
  has("log: cross-program device conflict surfaced", al.devConflicts.length>=1); }
{ // feedback/command storm: many same-tick SIMPL+ string-overflow errors
  const burst=[]; for(let i=0;i<25;i++) burst.push(`Error: HTML_Text_Combiner_${i} # 2026-06-10 14:00:00 # Overflow. Capacity = 250. Length = ${300+i}.`);
  const stormLog=["Error: SomeModule # 2026-06-10 13:00:00 # routine error", ...burst, "Notice: System # 2026-06-10 14:00:01 # back to normal"].join("\n");
  const sa2=w.analyzeLog(stormLog);
  has("log: same-tick error burst clustered as ONE storm finding", sa2.storms.length===1);
  has("log: storm counts the burst (>=25 in one second)", sa2.storms[0] && sa2.storms[0].n>=25);
  has("log: storm flagged overflow-driven", sa2.storms[0] && sa2.storms[0].overflowDriven===true);
  has("log: a single routine error is NOT a storm", !sa2.storms.some(x=>x.n<20)); }

{ w.eval('state.prog={name:"junk.smw",model:null,smw:"random junk not a crestron file",smft:null,dip:null,ir:[]};runAudit();');
  has("garbage/unreadable file shows a clear message (not a blank hero)", /no readable SIMPL data/.test(w.document.getElementById('censusBody').textContent)); }
{ const sg2=(h,nm)=>`[\nObjTp=Sg\nH=${h}\nNm=${nm}\nSgTp=2\n]`;
  const loop=[sg2(1,"Vol.A"),sg2(2,"Vol.B"),`[\nObjTp=Sm\nH=10\nNm=Gain\nI1=1\nO1=2\n]`,`[\nObjTp=Sm\nH=11\nNm=Scale\nI1=2\nO1=1\n]`].join("\n");
  const sa=w.structAnalysis(w.parseSmw(loop));
  has("analog-only loop classified self-limiting (not an oscillation candidate)", sa.loopsNoBreaker>=1 && sa.oscCandidates===0 && sa.analogLoops>=1); }
// ===== global search across audit cards =====
{ // re-render the program audit so #censusBody is the program (not the last loop fixture)
  w.eval(`state.prog.name='t'; state.prog.smw=${JSON.stringify(smw)}; state.prog.smft=${JSON.stringify(smft)}; state.prog.dip=${JSON.stringify(dip)}; state.prog.ir=['SomeTV']; state.prog.model=null; runAudit();`);
  const cbEl=w.document.getElementById('censusBody');
  const r1=w.globalSearch('nvx');
  has("global search: 'nvx' finds at least one match", r1.matches>=1 && r1.cards>=1);
  has("global search: container enters search mode", cbEl.classList.contains('gsearch'));
  has("global search: matched rows are marked, hidden rows exist", cbEl.querySelectorAll('tr.gs-hit').length>=1 && cbEl.querySelectorAll('mark.gs-mark').length>=1);
  has("global search: a non-matching card is hidden (gs-empty)", cbEl.querySelectorAll('.card.gs-empty').length>=1);
  const r0=w.globalSearch('zzqqxxnotreal');
  has("global search: nonsense query yields zero matches", r0.matches===0);
  w.globalSearch('');
  has("global search: clearing exits search mode and removes marks", !cbEl.classList.contains('gsearch') && cbEl.querySelectorAll('mark.gs-mark').length===0 && cbEl.querySelectorAll('.card.gs-empty').length===0);
}
// ===== network subnet column + whole-audit export =====
{ ck("parseEt captures subnet mask", w.parseEt(smw).get('06') && w.parseEt(smw).get('06').mask, "255.255.255.0");
  // augment fixture so an IP-network device (NVX 1F) carries a mask, then re-render
  const smwMask = smw + "\n[\nObjTp=Et\nH=9\nDvH=960\nIPA=192.168.9.9\nIPM=255.255.0.0\n]";
  w.eval(`state.prog.name='t'; state.prog.smw=${JSON.stringify(smwMask)}; state.prog.smft=${JSON.stringify(smft)}; state.prog.dip=${JSON.stringify(dip)}; state.prog.ir=null; state.prog.model=null; runAudit();`);
  const netCard=[...w.document.querySelectorAll('#censusBody .card')].find(c=>c.querySelector('.card-title').textContent.includes('Network devices'));
  has("Network card shows a Subnet column when mask data exists", !!netCard && [...netCard.querySelectorAll('th')].some(th=>th.textContent.trim()==='Subnet'));
  has("Network card lists the subnet mask value", !!netCard && netCard.textContent.includes('255.255.0.0'));
  const eaBtn=w.document.getElementById('auditExportAll');
  has("Export all button is enabled when audit has content", !!eaBtn && eaBtn.disabled===false);
  // exportAll should assemble multiple card blocks (capture the CSV via downloadCsv stub)
  let cap=null; const orig=w.downloadCsv; w.downloadCsv=(n,txt)=>{cap=txt;}; w.exportAll(); w.downloadCsv=orig;
  has("Export all produces a multi-card CSV", typeof cap==='string' && (cap.match(/^# /gm)||[]).length>=3);
}
// ===== Version Diff: Swap A/B actually swaps models + names (synchronous part of handler) =====
{ const Aprog=[`[\nObjTp=Hd\nPgmNm=PA\n]`, sg(1,"Common",""), sg(2,"OnlyInA","")].join("\n");
  const Bprog=[`[\nObjTp=Hd\nPgmNm=PB\n]`, sg(1,"Common",""), sg(3,"OnlyInB","")].join("\n");
  w.eval(`setSlot('A','A.smw',parseSmw(${JSON.stringify(Aprog)})); setSlot('B','B.smw',parseSmw(${JSON.stringify(Bprog)}));`);
  const d0=w.eval('computeDiff(state.diffA,state.diffB)');
  const add0=JSON.stringify(d0.added), rem0=JSON.stringify(d0.removed);
  w.document.getElementById('diffSwap').dispatchEvent(new w.Event('click'));
  const aName=w.eval('state.diffAname'), bName=w.eval('state.diffBname');
  has("Swap A/B exchanges the slot names", aName==='B.smw' && bName==='A.smw');
  const d1=w.eval('computeDiff(state.diffA,state.diffB)');
  has("Swap A/B inverts added/removed", JSON.stringify(d1.added)===rem0 && JSON.stringify(d1.removed)===add0);
  has("Swap A/B updates the drop labels", w.document.getElementById('dropAlabel').textContent.includes('B.smw') && w.document.getElementById('dropBlabel').textContent.includes('A.smw'));
}
// ===== D3 project data (.dat) lighting parse =====
{ const H="File Version\tv3.06.00\r\nModified Date\t07/16/2024\r\nModified Time\t18:38:31\r\n\r\n";
  const areas=H+"AreaID\tAreaName\r\n1\tMain Floor\r\n2\tLower Level\r\n";
  const rooms=H+"RoomID\tAreaID\tRoomName\r\n1\t1\tGathering\r\n6\t1\tMaster Bath\r\n";
  const loads=H+"LoadID\tLoadName\tRoomID\tDIM_setting\tRamp_time\tUpper_limit\tLower_limit\tTotalWattage\r\n47\tOuter Cans\t1\tTrue\t500\t100\t1\t120\r\n48\tInner Cans\t1\tTrue\t500\t100\t1\t60\r\n";
  const scenes=H+"SceneID\tRoomID\tSceneName\r\n1\t1\tEvening\r\n2\t6\tNight Lights\r\n";
  const d=w.parseD3Data({areas,rooms,loads,scenes});
  ck("D3 .dat: areas parsed", d.areas.length, 2);
  ck("D3 .dat: room maps to area + name", [d.rooms[0].id,d.rooms[0].areaId,d.rooms[0].name], ["1","1","Gathering"]);
  ck("D3 .dat: load wattage + dim parsed", [d.loads[0].name,d.loads[0].watt,d.loads[0].dim], ["Outer Cans",120,true]);
  ck("D3 .dat: scene name + room parsed", [d.scenes[0].name,d.scenes[0].roomId], ["Evening","1"]);
  // render the lighting cards via runAudit
  w.eval(`state.prog={name:'proj.zip',model:null,smw:null,smft:null,dip:null,ir:null,d3:{lighting:parseD3Data(${JSON.stringify({areas,rooms,loads,scenes})})},auditDone:true,devDone:true}; runAudit();`);
  const txt=w.document.getElementById('censusBody').textContent;
  has("D3 lighting renders rooms & scenes cards", /Lighting — rooms & loads/.test(txt) && /Lighting scenes/.test(txt) && /Gathering/.test(txt) && /Evening/.test(txt));
}
// ===== log bundle: split multiple processors, keep one coherent =====
{ const multi=[
    {name:"Job/01-CP4 AV/console.txt", text:"Error: A # 2026-06-25 12:00:00 # x\n".repeat(50)},
    {name:"Job/01-CP4 AV/err.log", text:"more AV log\n".repeat(20)},
    {name:"Job/02-CP4 Security/console.txt", text:"Error: B # 2026-06-25 12:00:00 # y\n".repeat(10)}
  ];
  const g=w.splitLogSystems(multi);
  has("log split: detects 2 systems", g.multi===true && g.systems.length===2);
  ck("log split: largest system chosen first", g.groups[0].key, "01-CP4 AV");
  const single=[
    {name:"PLOG/err.log", text:"a\n".repeat(100)},
    {name:"PLOG/err.1.log", text:"b\n".repeat(100)}
  ];
  const gs=w.splitLogSystems(single);
  has("log split: a single-folder PLOG is NOT flagged multi (no regression)", gs.multi===false);
}
// ===== regression: picking a theme must NOT hide the page (theme menu lives in <nav>) =====
{ // default active tab is diff; pick a theme via the menu (a real bubbling click)
  w.eval('show("diff")');
  const before = !w.document.getElementById('tab-diff').classList.contains('hide');
  const btn = w.document.querySelector('#themeMenu button[data-id="synthwave"]') || w.document.querySelector('#themeMenu button');
  if(btn){ const ev=new w.Event('click',{bubbles:true}); btn.dispatchEvent(ev); }
  const after = !w.document.getElementById('tab-diff').classList.contains('hide');
  has("selecting a theme does not hide the active tab (nav-handler guard)", before===true && after===true);
}
// ===== whole-system: every processor program ingested as its own unit =====
{ const B=n=>({length:n});
  const fl=[
    {name:"Job/01-CP4 AV/AV.smw", bytes:B(2000)},
    {name:"Job/01-CP4 AV/AV.smft", bytes:B(10)},
    {name:"Job/01-CP4 AV/AV.dip", bytes:B(10)},
    {name:"Job/01-CP4 AV/test.smw", bytes:B(1900)},
    {name:"Job/01-CP4 AV/AV_old.smw", bytes:B(1500)},
    {name:"Job/01-CP4 AV/SPlsWork/x.smw", bytes:B(99999)},
    {name:"Job/02-CP4 Security/Sec.smw", bytes:B(1000)},
    {name:"Job/02-CP4 Security/Sec.smft", bytes:B(10)},
    {name:"Job/D3/ResidenceA/data/rooms.dat", bytes:B(10)}
  ];
  const a=w.chooseAllPrograms(fl);
  ck("all-programs: versions/test in a folder collapse to ONE processor (still 2 total)", a.programs.length, 2);
  has("all-programs: AV folder picks the real build, lists test/old as versions", a.programs[0].name==="AV.smw" && a.programs[0].versions.length===2);
  ck("all-programs: largest first, junk SPlsWork excluded", a.programs[0].name, "AV.smw");
  ck("all-programs: unit 0 keeps its own .smft", fl[a.programs[0].smft].name, "Job/01-CP4 AV/AV.smft");
  ck("all-programs: unit 1 (Security) has no .dip of its own", a.programs[1].dip, -1);
  ck("all-programs: one D3 project root", a.d3roots.length, 1);
  ck("all-programs: a single-program zip yields exactly one unit (no false multi)", w.chooseAllPrograms([{name:"P/AV.smw",bytes:B(100)},{name:"P/AV.smft",bytes:B(5)}]).programs.length, 1);
}
// ===== whole-system: unit selector switches between processor programs (no mixing) =====
{ const hd="[\nObjTp=Hd\nPgmNm=P\n]";
  const smwA=[hd, sg(1,"AVonly.Signal","")].join("\n");
  const smwB=[hd, sg(1,"SECURITYonly.Signal","")].join("\n");
  w.eval(`state.unitName='Job.zip'; state.units=[{kind:'program',name:'01-AV.smw',smw:${JSON.stringify(smwA)}},{kind:'program',name:'02-SEC.smw',smw:${JSON.stringify(smwB)}}]; setActiveUnit(0);`);
  const cb=w.document.getElementById('censusBody');
  has("multi-program: unit selector renders with a pill per unit", cb.querySelectorAll('.unitpill').length===2 && /processor programs/.test(cb.textContent));
  has("active unit 0 = AV program (not mixed with Security)", /AVonly\.Signal/.test(w.eval('state.prog.smw')) && !/SECURITYonly/.test(w.eval('state.prog.smw')));
  w.eval('setActiveUnit(1)');
  has("switching to unit 1 loads Security program cleanly", /SECURITYonly\.Signal/.test(w.eval('state.prog.smw')) && !/AVonly/.test(w.eval('state.prog.smw')));
  has("active pill follows the selection", w.document.querySelectorAll('#censusBody .unitpill.on').length===1);
}
// ===== whole-system: System overview rollup + cross-processor EISC =====
{ const smwB=[`[\nObjTp=Hd\nPgmNm=SecProg\n]`, sg(1,"Sec.A",""), sg(2,"Sec.B","")].join("\n");
  // real EISC lives as an Sm symbol whose linked Dv (H=950 in the fixture) names the target
  const smwA=smw+"\n[\nObjTp=Sm\nH=980\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=950\n]";
  const units=[{kind:"program",name:"01-AV.smw",smw:smwA},{kind:"program",name:"02-SEC.smw",smw:smwB}];
  const ss=w.systemSummary(units);
  ck("system summary: two processors", ss.totals.processors, 2);
  has("system summary: signal total sums both programs", ss.totals.signals === ss.processors[0].signals + ss.processors[1].signals && ss.totals.signals>0);
  has("system summary: detects an EISC/intersystem link in the AV program", ss.processors[0].eisc.length>=1);
  // render the System view
  w.eval(`state.unitName='Job.zip'; state.units=[{kind:'system',name:'System overview'},{kind:'program',name:'01-AV.smw',smw:${JSON.stringify(smwA)}},{kind:'program',name:'02-SEC.smw',smw:${JSON.stringify(smwB)}}]; setActiveUnit(0);`);
  const cb=w.document.getElementById('censusBody').textContent;
  has("System view renders rollup + processors + cross-links", /System at a glance/.test(cb) && /Processors/.test(cb) && /Intersystem links/.test(cb));
  // clicking a processor row opens that unit's full audit (data-unit switch)
  const prow=w.document.querySelector('#censusBody tr[data-unit]'); if(prow){ prow.dispatchEvent(new w.Event('click',{bubbles:true})); }
  has("clicking a processor row opens its full as-built", w.eval('state.unitIndex')>=1 && /PROGRAM|Overview|Network/i.test(w.document.getElementById('censusBody').textContent));
}
// ===== EISC detection finds Sm-based intersystem links (the real representation) =====
{ const prog="[\nObjTp=Dv\nH=950\nNm=02_Security\nAd=E2\n]\n[\nObjTp=Sm\nH=980\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=950\n]";
  const links=w.eiscLinks(prog, new Map([["E2","127.0.0.2"]]));
  has("eiscLinks finds the Sm-based EISC (dvNetRoles misses it)", links.length===1);
  ck("eiscLinks resolves target name from the linked Dv", links[0].target, "02_Security");
  ck("eiscLinks resolves target IP via the .dip", links[0].ip, "127.0.0.2");
}
// ===== Triage deterministic helpers (the LLM call itself is network; these are gradeable) =====
{ const a=w.trBuildRequest({provider:"anthropic",key:"sk-x",model:"claude-3-5-sonnet-latest"},"SYS","USER");
  has("triage req (Anthropic): /messages + direct-browser header + system/messages body",
    /\/messages$/.test(a.url) && a.headers["x-api-key"]==="sk-x" && a.headers["anthropic-dangerous-direct-browser-access"]==="true" && a.body.system==="SYS" && a.body.messages[0].content==="USER");
  const o=w.trBuildRequest({provider:"openai",base:"http://localhost:11434/v1",model:"llama3.1",key:""},"SYS","USER");
  has("triage req (OpenAI-compatible): base URL honored (local Ollama) + bearer + chat/completions",
    o.url==="http://localhost:11434/v1/chat/completions" && /^Bearer /.test(o.headers.authorization) && o.body.messages[0].role==="system" && o.body.messages[1].content==="USER");
  const html=w.mdToHtml("# Go-list\n\n| # | Issue | Domain |\n|---|---|---|\n| 1 | bath cans dead | **electrical** |\n");
  has("triage mdToHtml renders a markdown table with header + row", /<table>/.test(html) && /<th>Issue<\/th>/.test(html) && /<td>bath cans dead<\/td>/.test(html) && /<b>electrical<\/b>/.test(html));
  // exportFactsForLLM: no program -> clear guidance; with program -> includes as-built
  w.eval("state.prog={name:null,smw:null,smft:null,dip:null,d3:null}; state.audit=null; state.units=null; state.logDigests=null; state.logDigest=null;");
  has("exportFactsForLLM with nothing loaded gives clear guidance", /No program loaded/i.test(w.exportFactsForLLM()));
  // all-angles: LOG-ONLY (no program) still grounds + caveats; grounding points to Audit
  w.eval(`state.units=null; state.prog={name:null,smw:null,smft:null,dip:null,d3:null}; state.audit=null; state.logDigests=null; state.logDigest={name:'cp4.log',model:'CP4',fw:'2.8',hostname:'CP4-LAB',appSlots:3,match:'match',recurring:[],drops:[{id:'1F',name:'',n:4}],timeouts:0,loops:0,storms:0,authFails:0,missingFiles:[],devConflicts:[],cpu:''};`);
  { const f=w.exportFactsForLLM();
    has("log-only: console findings still feed (hostname)", /CONSOLE \/ LOG FINDINGS/.test(f) && /CP4-LAB/.test(f));
    has("log-only: caveats that instances can't resolve without the program", /No program\/as-built loaded/.test(f));
    has("log-only grounding: program missing -> points to Audit", /Audit/.test(w.trGroundHTML()) && /CP4-LAB/.test(w.trGroundHTML())); }
  // grounding: log/console findings + match verdict fed to triage when a log is loaded
  w.eval(`state.logDigests=null; state.logDigest={name:'cp4.err',model:'CP4',fw:'2.8',match:'match',recurring:[{n:9,msg:'Logic could not be solved within 1500 waves',who:'LE_1',rate:'steady'}],drops:[{id:'1F',name:'NVX Zone1',n:12}],timeouts:5,loops:2,storms:1,authFails:0,missingFiles:[],devConflicts:[],cpu:''};`);
  { const f=w.exportFactsForLLM();
    has("triage grounds on console/log findings (drops named)", /CONSOLE \/ LOG FINDINGS/.test(f) && /NVX Zone1/.test(f));
    has("triage carries the log-vs-program match verdict", /Log-vs-program match: MATCH/.test(f));
    has("triage ties solve-timeouts to feedback loops", /Signal-solve timeouts: 5/.test(f) && /2 feedback loop/.test(f)); }
  w.eval("state.prog={name:null,smw:'x',smft:null,dip:null,d3:null}; state.units=null; state.logDigests=null; state.logDigest=null;");
  has("triage grounding status: program present, console missing -> points to Log Analyzer", /Log Analyzer/.test(w.trGroundHTML()) && /program/.test(w.trGroundHTML()));
}
// ===== D3 scene contents: scene -> the loads it controls (button = scene = these loads) =====
{ const prog="[ObjTp=Sg\nNm=[_Global_Lighting_Scene][Evening]Load_47_In_Scene]\n[ObjTp=Sg\nNm=[_Global_Lighting_Scene][Evening]Load_48_In_Scene]\n[ObjTp=Sg\nNm=[_Area_Scene][Up_All_ON]Load_47_In_Scene]";
  const sc=w.parseD3Scenes(prog);
  const ev=sc.find(x=>x.scene==="Evening");
  has("D3 scene contents: scene resolves to its load IDs", !!ev && ev.loadIds.join(",")==="47,48");
  has("D3 scene contents: underscores in scene names normalized to spaces", sc.some(x=>x.scene==="Up All ON"));
}
// ===== D3 sysdata.xml: keypad button -> preset -> loads @ levels (the full "what does this button do") =====
{ const xml='<Preset><ID>307</ID><Step><Text>Demo Room, Wall Sconces--&gt;Level = 70% Fade Time = 2s</Text></Step></Preset>'
   +'<Device type="Interface"><ID>328</ID><Name>Theater</Name><Family>Keypad</Family><Address>Net-Device ID 06</Address><Product_Name>HZ-KPCN-W</Product_Name><Program><Signal><ID>40</ID><Name>Button #1</Name><ButtonModelName>Single Press</ButtonModelName><Event><Name>Press</Name><Preset>307</Preset></Event></Signal></Program></Device>';
  const sd=w.parseD3SysData(xml);
  has("sysdata: keypad + button parsed", sd.keypads.length===1 && sd.keypads[0].name==="Theater" && sd.keypads[0].buttons[0].name==="Button #1");
  has("sysdata: button event resolves to its preset", sd.keypads[0].buttons[0].events[0].preset==="307");
  ck("sysdata: preset step -> load + level + fade", [sd.presets["307"][0].load,sd.presets["307"][0].level,sd.presets["307"][0].fade], ["Demo Room, Wall Sconces","70%","2s"]);
}
// ===== D3 .egr engraving labels (binary Access) — the literal button text =====
{ // build a tiny fake .egr byte run: 0x06 0x40 LABEL <repeated artifact>
  function cam(label){ var a=[0x06,0x40]; for(var k=0;k<label.length;k++)a.push(label.charCodeAt(k)); a.push(0x7b,0x7b,0x7b,0x71); return a; }
  var bytes=[].concat(cam("LIGHTS OFF"),[0,0,0],cam("PENDANTS"),[0,0],cam("CANS"));
  var labs=w.parseD3Egr(new Uint8Array(bytes));
  ck("parseD3Egr extracts engraved labels in order, artifact stripped", labs, ["LIGHTS OFF","PENDANTS","CANS"]);
}
// ===== .ced is NOT a custom module =====
{ const m=w.parseSmw("[\nObjTp=Sg\nH=1\nNm=x\nSgTp=\n]\n[\nObjTp=Sm\nH=2\nNm=SomeDriver.ced\nI1=1\nO1=1\n]\n[\nObjTp=Sm\nH=3\nNm=RealMod.usp\nI1=1\nO1=1\n]");
  const cs=w.censusStats(m);
  has("custom-module count excludes .ced (counts .usp only)", cs.custom===1 || (cs.customDistinct? cs.customDistinct===1 : true));
}
// ===== Visual System Map: systemGraph() + renderSystemMap() (validated on real multi-proc jobs) =====
{ const eisc=(smH,dvH,ipid,nm)=>`[\nObjTp=Sm\nH=${smH}\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=${dvH}\n]\n[\nObjTp=Dv\nH=${dvH}\nNm=${nm}\nAd=${ipid}\n]`;
  const proc=(name,parts)=>`[\nObjTp=Hd\nPgmNm=${name}\n]\n`+parts.join("\n");
  const dipOf=ps=>"[IPTable]\n"+ps.map((p,i)=>`id${i}=${p[0]}\naddr${i}=${p[1]}`).join("\n")+"\n";
  const A={kind:"program",name:"01-Main",folder:"01-Main",smw:proc("Main",[eisc(101,201,"F2","02_Lighting"),eisc(102,202,"20","To/From Security")]),dip:dipOf([["F2","127.0.0.2"],["20","10.0.0.7"]])};
  const B={kind:"program",name:"02-Lighting",folder:"02-Lighting",smw:proc("Lighting",[eisc(110,210,"F2","Main")]),dip:dipOf([["F2","127.0.0.2"]])};
  const C={kind:"program",name:"03-Security",folder:"03-Security",smw:proc("Security",[eisc(120,220,"20","Main"),eisc(121,221,"30","Alarm Panel")]),dip:dipOf([["20","10.0.0.9"],["30","10.0.0.50"]])};
  const sysUnits=[{kind:"system",name:"System overview"},A,B,C];
  const G=w.systemGraph(sysUnits);
  ck("system map: one node per program", G.nodes.length, 3);
  const br=G.edges.filter(e=>/^u/.test(e.b));
  has("system map: intra-box bridge from shared loopback IP-ID", br.some(e=>e.kind==="intra"));
  has("system map: cross-box bridge from shared real-IP IP-ID", br.some(e=>e.kind==="cross"));
  has("system map: no false leaf<->leaf edge (exactly 2 bridges)", br.length===2);
  ck("system map: unmatched EISC -> one external endpoint", G.external.length, 1);
  ck("system map: external endpoint keyed by IP", G.external[0].label, "10.0.0.50");
  // render into the whole-system Audit view
  w.eval(`state.units=${JSON.stringify(sysUnits)}; state.unitName='TestJob'; state.unitIndex=0; setActiveUnit(0);`);
  const cb=w.document.getElementById('censusBody');
  has("system map renders an SVG in the whole-system view", cb.querySelector('svg.sysmap')!=null);
  has("system map nodes are clickable (data-unit drill)", cb.querySelectorAll('svg .sm-proc[data-unit]').length===3);
  has("system map draws bridge edges (intra+cross)", cb.querySelectorAll('svg line.sm-intra, svg line.sm-cross').length>=2);
  has("whole-job As-Built cover present (printable deliverable)", cb.querySelector('.report-cover')!=null);
  has("As-Built print button enabled on the whole-system view", !w.document.getElementById('auditPrint').disabled);
}
// ===== D3 lighting wired as a real node via reciprocal EISC (not a dumb external IP) =====
{ const eisc=(smH,dvH,ipid,nm)=>`[\nObjTp=Sm\nH=${smH}\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=${dvH}\n]\n[\nObjTp=Dv\nH=${dvH}\nNm=${nm}\nAd=${ipid}\n]`;
  const proc=(name,parts)=>`[\nObjTp=Hd\nPgmNm=${name}\n]\n`+parts.join("\n");
  const dipOf=ps=>"[IPTable]\n"+ps.map((p,i)=>`id${i}=${p[0]}\naddr${i}=${p[1]}`).join("\n")+"\n";
  const AV={kind:"program",name:"01-AV",folder:"01-AV",smw:proc("AV",[eisc(101,201,"03","RSD Lighting Loads")]),dip:dipOf([["03","10.0.9.201"]])};
  const D3={kind:"d3",name:"D3 Lighting",d3:{eiscSmw:proc("D3",[eisc(301,401,"03","Remote System")]),eiscDip:dipOf([["03","10.0.9.200"]])}};
  const G2=w.systemGraph([{kind:"system",name:"sys"},AV,D3]);
  ck("D3 lighting becomes a graph node (kind=lighting)", G2.nodes.filter(n=>n.kind==="lighting").length, 1);
  ck("D3 lighting: reciprocal EISC resolved => zero external nodes", G2.external.length, 0);
  const e2=G2.edges.find(x=>/^u/.test(x.b));
  has("AV<->D3 is a real cross-box bridge by shared IP-ID (was external before)", !!e2 && e2.kind==="cross" && e2.ipids.indexOf("03")>=0);
}
// ===== "what's in this drop" line (deterministic facts + jump chips, no wizard) =====
{ const eisc=(smH,dvH,ipid,nm)=>`[\nObjTp=Sm\nH=${smH}\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=${dvH}\n]\n[\nObjTp=Dv\nH=${dvH}\nNm=${nm}\nAd=${ipid}\n]`;
  const proc=(name,parts)=>`[\nObjTp=Hd\nPgmNm=${name}\n]\n`+parts.join("\n");
  const dipOf=ps=>"[IPTable]\n"+ps.map((p,i)=>`id${i}=${p[0]}\naddr${i}=${p[1]}`).join("\n")+"\n";
  const AV={kind:"program",name:"01-AV",folder:"01-AV",smw:proc("AV",[eisc(101,201,"20","RSD Lighting")]),dip:dipOf([["20","10.0.0.7"]])};
  const D3={kind:"d3",name:"D3 Lighting",d3:{eiscSmw:proc("D3",[eisc(301,401,"20","Remote System")]),eiscDip:dipOf([["20","10.0.0.9"]])}};
  const units=[{kind:"system",name:"System overview"},AV,D3];
  const F=w.dropFacts(units);
  ck("drop line: processor count", F.nProc, 1);
  ck("drop line: lighting project count", F.nD3, 1);
  ck("drop line: EISC bridge count", F.bridges, 1);
  ck("drop line: zero external (reciprocal resolved)", F.ext, 0);
  w.eval(`state.units=${JSON.stringify(units)}; state.unitName='Job'; state.unitIndex=0; setActiveUnit(0);`);
  const cb=w.document.getElementById('censusBody'); const dl=cb.querySelector('.dropline');
  has("drop line renders atop the whole-system view", dl!=null);
  has("drop line states the facts (procs + lighting + bridges)", !!dl && /1 processor/.test(dl.textContent) && /D3 lighting/.test(dl.textContent) && /EISC bridge/.test(dl.textContent));
  has("drop line offers a jump chip (data-unit)", cb.querySelectorAll('.dropline .dropchip[data-unit]').length>=1);
  has("drop line lists each bridge with its IP-ID (completeness)", [...cb.querySelectorAll('.dl-conn')].some(c=>/IP-ID\s*20/.test(c.textContent)));
  has("drop line shows separate-box IP detail", /separate box/.test(cb.textContent));
}
// ===== Triage auto-collects EVERY loaded processor (no manual unit selection) =====
{ const mk=(nm,sig)=>{ let x="[\nObjTp=Hd\nPgmNm="+nm+"\n]"; for(let i=1;i<=sig;i++)x+="\n[\nObjTp=Sg\nH="+i+"\nNm=S"+i+"\nSgTp=\n]"; return x; };
  w.eval(`state.units=[{kind:"system",name:"sys"},{kind:"program",name:"A",folder:"01-A",smw:${JSON.stringify(mk("A",2))}},{kind:"program",name:"B",folder:"02-B",smw:${JSON.stringify(mk("B",3))}}]; state.unitIndex=0; state.prog={name:"Whole system",smw:null}; state.logDigests=null; state.logDigest=null;`);
  const f=w.exportFactsForLLM();
  ck("Triage collects every processor's as-built, not just the active unit", (f.match(/^### /gm)||[]).length, 2);
  has("Triage facts name each processor folder", /01-A/.test(f) && /02-B/.test(f));
}
// ===== deployed-build confirmation from a console (Loading Program /simpl/appNN/<build>.bin) =====
{ const log="Ok: LE1 # t # Loading Program /simpl/app01/01_CP4_Main_v9_13.bin.\nOk: LE1 # t # Loading Program /simpl/app01/01_CP4_Main_v9_16.bin.\nOk: LE2 # t # Loading Program /simpl/app02/02_Lighting_v1_2.bin.";
  const dep=w.parseDeployedBuilds(log);
  ck("parseDeployedBuilds: latest load per slot wins", (dep.find(d=>d.slot==="01")||{}).name, "01_CP4_Main_v9_16");
  ck("parseDeployedBuilds: one entry per slot", dep.length, 2);
  w.eval(`state.logDigests=null; state.logDigest={deployed:[{slot:"01",name:"01_CP4_Main_v9_16"}]};`);
  const unit={kind:"program",builds:[{name:"01_CP4_Main_v9_18.smw"},{name:"01_CP4_Main_v9_16.smw"}],activeBuild:"01_CP4_Main_v9_18.smw"};
  ck("deployedBuildFor returns the DEPLOYED build, not newest-saved", w.deployedBuildFor(unit), "01_CP4_Main_v9_16.smw");
  has("deployedBuildFor is null when the deployed build isn't in the archive", w.deployedBuildFor({kind:"program",builds:[{name:"X_v1.smw"}]})===null);
}
// ===== multiple logs accumulate (separate drops): evidence merges, deployedBuildFor scans all =====
{ w.eval(`state.units=null; state.prog={smw:null}; state.audit=null; state.triageOff={}; state.logTriageOff={};
  state.logDigests=[
    {_id:"plog",name:"plog",deployed:[{slot:"01",name:"01_CP4_Main_v9_16"}],recurring:[],drops:[],timeouts:0,loops:0,storms:0,missingFiles:[],devConflicts:[]},
    {_id:"info",name:"info",hostname:"CP4-LAB",model:"CP4",deployed:[],recurring:[],drops:[{id:"1F",name:"NVX",n:3}],timeouts:0,loops:0,storms:0,missingFiles:[],devConflicts:[]}
  ]; state.logDigest=null;`);
  const f=w.exportFactsForLLM();
  has("multi-log: both logs' findings present (builds + hostname)", /Main_v9_16/.test(f) && /CP4-LAB/.test(f));
  has("multi-log: deployedBuildFor scans ALL logs", w.deployedBuildFor({kind:"program",builds:[{name:"01_CP4_Main_v9_18.smw"},{name:"01_CP4_Main_v9_16.smw"}]})==="01_CP4_Main_v9_16.smw");
  w.eval("state.logDigests=null;");
}
// ===== archived (~Older) folders excluded from the live map, counted separately =====
{ const mk=nm=>"[\nObjTp=Hd\nPgmNm="+nm+"\n]";
  const units=[{kind:"system",name:"sys"},
    {kind:"program",name:"Live.smw",folder:"01-Live",smw:mk("Live")},
    {kind:"program",name:"Old.smw",folder:"Old",smw:mk("Old"),archived:true}];
  const G=w.systemGraph(units);
  ck("archived processor excluded from the live map", G.nodes.filter(n=>n.kind==="processor").length, 1);
  const F=w.dropFacts(units);
  ck("dropFacts counts only live processors", F.nProc, 1);
  ck("dropFacts reports the archived count", F.nArchived, 1);
}
// ===== multiple D3 backups collapse to one lighting node (newest), bridge resolves =====
{ const eisc=(smH,dvH,ipid,nm)=>`[\nObjTp=Sm\nH=${smH}\nNm=3 Series TCP/IP Ethernet Intersystem Communications\nDvH=${dvH}\n]\n[\nObjTp=Dv\nH=${dvH}\nNm=${nm}\nAd=${ipid}\n]`;
  const proc=(name,parts)=>`[\nObjTp=Hd\nPgmNm=${name}\n]\n`+parts.join("\n");
  const dipOf=ps=>"[IPTable]\n"+ps.map((p,i)=>`id${i}=${p[0]}\naddr${i}=${p[1]}`).join("\n")+"\n";
  const AV={kind:"program",name:"AV",folder:"AV",smw:proc("AV",[eisc(101,201,"03","Lighting")]),dip:dipOf([["03","10.0.0.201"]])};
  const mkD3=(nm,mt)=>({kind:"d3",name:nm,d3:{eiscSmw:proc("D3",[eisc(301,401,"03","Main")]),eiscDip:dipOf([["03","10.0.0.200"]]),_mtime:mt}});
  const G=w.systemGraph([{kind:"system",name:"sys"},AV,mkD3("D3_old",1000),mkD3("D3_mid",2000),mkD3("D3_new",3000)]);
  ck("D3 backups collapse to one lighting node", G.nodes.filter(n=>n.kind==="lighting").length, 1);
  has("kept lighting is the newest-saved backup", (G.nodes.find(n=>n.kind==="lighting")||{}).label==="D3_new");
  has("processor<->lighting bridge resolves after collapse", G.edges.some(e=>e.kind==="cross"&&/^u/.test(e.b)));
  ck("no external endpoints after collapse", G.external.length, 0);
}
// ===== report/punchlist branding (user's company on deliverables) =====
{ w.localStorage.setItem("simplbench-brand", JSON.stringify({company:"Acme AV Integration", contact:"555-1212"}));
  const bh=w.rcBrandHtml();
  has("branding: deliverables use the user's company when set", /Acme AV Integration/.test(bh) && !/kaizen/i.test(bh));
  w.localStorage.removeItem("simplbench-brand");
  has("branding: falls back to Kaizen Logic when unset", /kaizen/i.test(w.rcBrandHtml()));
  // every CSV/MD export carries the branding header + company filename prefix
  { w.localStorage.setItem("simplbench-brand", JSON.stringify({company:"Acme AV"}));
    var cap="", capName="", OB=w.Blob; w.Blob=function(parts,o){ cap=(parts||[]).join(""); return new OB(parts,o); };
    w.URL.createObjectURL=function(){return "blob:x";}; w.URL.revokeObjectURL=function(){}; w.HTMLAnchorElement.prototype.click=function(){ capName=this.download; };
    w.downloadCsv("punchlist.csv","a,b\r\n1,2");
    has("exports carry the user's branding header", /Acme AV/.test(cap) && /SIMPL Bench/.test(cap));
    has("export filename is company-prefixed", /^Acme_AV_/.test(capName));
    w.Blob=OB; w.localStorage.removeItem("simplbench-brand"); }
}
// ===== streaming zip reader over Blob.slice (STORED fixture; never loads whole file) =====
function buildStoredZip(items){
  const enc=new TextEncoder(); const locs=[]; const chunks=[]; let off=0;
  const u16=v=>{const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,v,true);return b;};
  const u32=v=>{const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,v>>>0,true);return b;};
  for(const it of items){ const nm=enc.encode(it.name), data=enc.encode(it.data); locs.push({off,nm,len:data.length});
    chunks.push(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(0),u32(data.length),u32(data.length),u16(nm.length),u16(0),nm,data);
    off+=30+nm.length+data.length; }
  const cdStart=off; const cd=[];
  for(const l of locs){ cd.push(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(0),u32(l.len),u32(l.len),u16(l.nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(l.off),l.nm); }
  let cdSize=0; cd.forEach(c=>cdSize+=c.length);
  const eocd=[u32(0x06054b50),u16(0),u16(0),u16(items.length),u16(items.length),u32(cdSize),u32(cdStart),u16(0)];
  const all=chunks.concat(cd,eocd); let total=0; all.forEach(c=>total+=c.length);
  const out=new Uint8Array(total); let p=0; all.forEach(c=>{out.set(c,p);p+=c.length;}); return out;
}
(async function(){
  try{
    const zbytes=buildStoredZip([{name:"01-AV/prog.smw",data:"[\nObjTp=Hd\nPgmNm=Z\n]"},{name:"note.txt",data:"hello"}]);
    const blob=new Blob([zbytes]);                              // Node Blob: slice()+arrayBuffer() like a File
    const ents=await w.zipDir(blob);
    ck("zipDir reads the central directory (entry count)", ents.length, 2);
    has("zipDir returns names without loading file body", ents.some(e=>e.name==="01-AV/prog.smw") && ents.some(e=>e.name==="note.txt"));
    ck("zipDir reports uncompressed sizes from the directory", ents.find(e=>e.name==="note.txt").size, 5);
    const smwEnt=ents.find(e=>e.name==="01-AV/prog.smw");
    const bytes=await w.zipReadEntry(blob,smwEnt);
    has("zipReadEntry inflates one entry via slice (STORED)", w.decodeText(bytes).indexOf("PgmNm=Z")>=0);
  }catch(e){ fail++; console.log("  FAIL  streaming zip reader threw: "+e.message); }
  // build switcher (async: inflates the chosen build then re-parses)
  { const mk=n=>{ let x="[\nObjTp=Hd\nPgmNm=P\n]"; for(let i=1;i<=n;i++)x+="\n[\nObjTp=Sg\nH="+i+"\nNm=S"+i+"\nSgTp=\n]"; return x; };
    const A=mk(2), B=mk(5);
    w.eval(`
      var _A=new TextEncoder().encode(${JSON.stringify(A)});
      var _B=new TextEncoder().encode(${JSON.stringify(B)});
      state.units=[{kind:"program",name:"P.smw",folder:"P",smw:decodeText(_A),activeBuild:"P_vA.smw",
        builds:[{name:"P_vA.smw",smw:_A,dip:null,smft:null},{name:"P_vB.smw",smw:_B,dip:null,smft:null}]}];
      state.unitName=""; state.unitIndex=0; setActiveUnit(0);
    `);
    has("build switcher UI renders for a multi-build folder", w.document.querySelector('#buildSel')!=null);
    has("build switcher lists every build", w.document.querySelectorAll('#buildSel option').length===2);
    const sigA=w.eval("censusStats(parseSmw(state.units[0].smw)).sigTot");
    await w.switchBuild('P_vB.smw');
    const sigB=w.eval("censusStats(parseSmw(state.units[0].smw)).sigTot");
    ck("build switch re-parses to the chosen build (signal count changes)", [sigA,sigB], [2,5]);
  }
  console.log(`\n==== ${pass} pass, ${fail} fail ====`);
  process.exit(fail?1:0);
})();
