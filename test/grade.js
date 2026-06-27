// Grading harness for SIMPL Bench extraction.
// Loads the shipped index.html in a DOM and runs the extraction functions against
// synthetic .smw/.smft/.dip fixtures with KNOWN ground truth, asserting the tool
// pulls every IP-ID, device, serial port and parameter-IP exactly.
//   npm install && npm test
// No client data here — fixtures are hand-built so the expected numbers are obvious.
const fs=require("fs"), path=require("path");
const { JSDOM }=require("jsdom");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
const w=new JSDOM(html,{runScripts:"dangerously"}).window;

const sg=(h,nm,tp)=>`[\nObjTp=Sg\nH=${h}\nNm=${nm}\nSgTp=${tp}\n]`;
const sm=(h,nm,f)=>`[\nObjTp=Sm\nH=${h}\nNm=${nm}\n${f}\n]`;
// .dip: id 05 duplicated, id 06 blank addr -> 2 distinct IP-IDs
const dip=`[IPTable]\nid0=05\naddr0=192.168.1.10\nid1=06\naddr1=\nid2=05\naddr2=192.168.1.10\n`;
// .smft: 2 Ethernet + 1 Cresnet
const smft=`<Device Model="CP4"><Network Type="Ethernet" Id="02">`+
  `<Device Model="DM-MD8X8" DeviceId="05" Name="Matrix"/>`+
  `<Device Model="TSW-1060" DeviceId="06" Name="Panel"/>`+
  `<Network Type="Cresnet" Id="01"><Device Model="GLS-ODT" DeviceId="03" Name="Occ"/></Network>`+
  `</Network></Device>`;
// .smw: one param IP + one serial comm spec (9600 8N1)
const smw=[ sg(1,"A",""), sg(2,"B","2"), sg(3,"C","4"),
  sm(100,"TCP Client","P1=192.168.1.99\nI1=1"),
  sm(101,"COM 2-Way Serial Driver","DvH=519\nI1=2"),
  `[\nObjTp=Dv\nH=519\nNm=COM 2-Way Serial Driver\nAd=02\nSmH=101\n]`,
  `[\nObjTp=Cm\nH=1\nDvH=519\nPtl=(RS232)\nBRt=9600\nPty=N\nSBt=1\nDBt=8\nhHs=(None)\nsHs=(None)\n]`,
].join("\n");

let pass=0,fail=0;
const ck=(n,got,want)=>{const ok=JSON.stringify(got)===JSON.stringify(want);ok?pass++:fail++;console.log(`  ${ok?"PASS":"FAIL"}  ${n}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);};

const d=w.parseDip(dip);
ck("distinct IP-IDs",d.size,2);
ck("IP-ID 05 -> IP",d.get("05"),"192.168.1.10");
ck("IP-ID 06 -> blank addr",d.get("06"),"");
const devs=w.parseSmft(smft);
ck("devices with ID",devs.filter(x=>x.id).length,3);
ck("Ethernet devices",devs.filter(x=>x.net==="Ethernet").length,2);
ck("Cresnet devices",devs.filter(x=>x.net==="Cresnet").length,1);
ck("distinct param IPs",[...new Set(w.scanProgramIPs(smw).map(h=>h.ip))],["192.168.1.99"]);
const ser=w.scanSerial(smw).filter(x=>x.proto||x.baud);
ck("serial ports",ser.length,1);
ck("serial 9600 8N1 RS232",[ser[0].baud,ser[0].data+ser[0].parity+ser[0].stop,ser[0].proto],["9600","8N1","RS232"]);
const m=w.parseSmw(smw); let D=0,A=0,S=0;
m.sigType.forEach(t=>{const c=({"":"D","1":"D","2":"A","4":"S"})[t]||"D";c==="D"?D++:c==="A"?A++:S++;});
ck("D/A/S split",[D,A,S],[1,1,1]);
console.log(`\n==== ${pass} pass, ${fail} fail ====`);
process.exit(fail?1:0);
