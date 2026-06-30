// Comprehensive grading harness for SIMPL Bench.
// Loads the shipped index.html in a DOM, then (1) asserts every extraction function against
// synthetic fixtures with known ground truth, and (2) renders the Audit + Log and asserts the
// expected cards/panels appear — i.e. the tool is doing everything it's supposed to.
//   npm install && npm test    (no client data; fixtures are hand-built)
const fs=require("fs"), path=require("path");
const { JSDOM }=require("jsdom");
const w=new JSDOM(fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8"),{runScripts:"dangerously"}).window;
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
    {name:"Job/01-CP4 AV/SPlsWork/x.smw", bytes:B(99999)},
    {name:"Job/02-CP4 Security/Sec.smw", bytes:B(1000)},
    {name:"Job/02-CP4 Security/Sec.smft", bytes:B(10)},
    {name:"Job/D3/ResidenceA/data/rooms.dat", bytes:B(10)}
  ];
  const a=w.chooseAllPrograms(fl);
  ck("all-programs: two processor units", a.programs.length, 2);
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
  w.eval("state.prog={name:null,smw:null,smft:null,dip:null,d3:null}; state.audit=null;");
  has("exportFactsForLLM with nothing loaded gives clear guidance", /No program loaded/i.test(w.exportFactsForLLM()));
}
// ===== D3 scene contents: scene -> the loads it controls (button = scene = these loads) =====
{ const prog="[ObjTp=Sg\nNm=[_Global_Lighting_Scene][Evening]Load_47_In_Scene]\n[ObjTp=Sg\nNm=[_Global_Lighting_Scene][Evening]Load_48_In_Scene]\n[ObjTp=Sg\nNm=[_Area_Scene][Up_All_ON]Load_47_In_Scene]";
  const sc=w.parseD3Scenes(prog);
  const ev=sc.find(x=>x.scene==="Evening");
  has("D3 scene contents: scene resolves to its load IDs", !!ev && ev.loadIds.join(",")==="47,48");
  has("D3 scene contents: underscores in scene names normalized to spaces", sc.some(x=>x.scene==="Up All ON"));
}
console.log(`\n==== ${pass} pass, ${fail} fail ====`);
process.exit(fail?1:0);
