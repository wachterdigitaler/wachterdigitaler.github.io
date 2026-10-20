// inapp-actions (NordSturm 20.10 00:08 «работа в АПП должна быть в АПП»): what used to need the chat — the next part, the
// review with answers, editing places / city details, ✍️ rewrite, 🧠 check, 🔊, dictionary actions, «Готово — пишем часть»,
// the questionnaire after a reset — runs HERE. The app sends the same /start payloads and buttons the chat has to the edge
// (op act, signed initData); the BOT plays them through its own chat handlers (same SRS, stories, queue, QA) and writes
// what it would send to the chat as ops; this screen shows them as cards with the bot's own buttons and an answer field.
// No learning logic here: a button = the bot's callback, a typed answer = a chat message. One story at a time per learner.
(function(){
const ACTS={};let SEQ=0;
const rid=()=>{const a=new Uint8Array(12);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*256|0);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")};
// Telegram HTML subset only (b i u s code pre blockquote a→text); everything else becomes text — the bot's messages are HTML for Telegram
const OK={B:"b",STRONG:"b",I:"i",EM:"i",U:"u",INS:"u",S:"s",STRIKE:"s",DEL:"s",CODE:"code",PRE:"pre",BLOCKQUOTE:"blockquote",BR:"br","TG-SPOILER":"span"};
function clean(html){const t=document.createElement("template");t.innerHTML=String(html||"");const out=document.createElement("div");
 const walk=(n,to)=>{for(const c of [...n.childNodes]){if(c.nodeType===3){to.appendChild(document.createTextNode(c.nodeValue));continue}
  if(c.nodeType!==1)continue;const k=OK[c.tagName];if(k){const e=document.createElement(k);to.appendChild(e);walk(c,e)}else walk(c,to)}};
 walk(t.content,out);return out.innerHTML}
window.actClean=clean;
function S(){return HV&&HV.a&&ACTS[HV.a]}
// open (or come back to) an in-app bot screen for a /start payload of the chat
window.act=function(title,data){const key="start:"+data,old=ACTS[key];
 if(old&&old.live())return to("act",()=>{HV={a:key}});
 const s=ACTS[key]={key,title,data,msgs:[],live(){return this.reqs.some(r=>!r.end)},reqs:[],aw:"",story:false,err:"",slow:false,ho:false,note:"",cancel:false};
 to("act",()=>{HV={a:key}});send(s,"start",data)};
// PM #359 #361: a request is NEVER closed by poll errors — the app keeps asking (with pauses) and «🔄 Ещё раз» first asks
// again about the SAME request (same id); a new request only if the bot answered error / not found, and a request whose
// «act» got no answer is re-sent with the SAME idem (the server answers dup). #364: a request the edge did not accept
// (old edge, no migration, the bot does not take app requests = 'off') → an explicit «💬 Сделать это в чате».
async function actCall(b){try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:tg&&tg.initData,...b})});
 let j=null;try{j=await r.json()}catch(e){}return {s:r.status,j}}catch(e){return {s:0,j:null}}}
async function send(s,kind,data,msg,idem){const R={kind,data,msg,idem:idem||rid(),n:0,end:false,t0:Date.now(),okt:Date.now(),fails:0,eps0:((D&&D.episodes)||[]).length};s.reqs.push(R);s.err="";s.ho=false;s.note="";s.slow=false;draw();
 const {s:code,j:r}=await actCall({op:"act",kind,data,msg_id:msg||undefined,idem:R.idem});
 if(!r||!r.id){R.end=true;
  if(r&&r.error==="too_many")s.err="Слишком много нажатий подряд — подожди минутку.";
  else if(!code)s.err="Не получилось связаться с ботом — проверь сеть.";                       // no answer at all: retry (same idem)
  else{s.ho=true;s.err=r&&r.error==="off"?"Бот сейчас не делает это в приложении.":"Не получилось сделать это в приложении.";   // #364
   if(r&&r.error==="off"){if(D)D.app_actions=false;if(tab==="act"&&S()===s)return handoff(s)}}   // Tester #379 / PM: flag 0 → the explicit handoff at once
  return draw()}
 R.id=r.id;if(r.busy)s.story=true;poll(s,R)}
const sleep=ms=>new Promise(f=>setTimeout(f,ms));
async function poll(s,R){if(R.loop)return;R.loop=true;   // one polling loop per request
 while(!R.end){await sleep(R.lost?20000:R.fails?Math.min(5000,700*2**R.fails):Date.now()-R.t0>20000?1500:700);
  if(!R.end)await pollOnce(s,R)}
 R.loop=false}
async function pollOnce(s,R){if(R.busy||R.end)return;R.busy=true;let r=null;
 try{r=await api({op:"act_poll",id:R.id,from:R.n})}catch(e){r=null}
 R.busy=false;if(R.end)return;
 if(r&&r.error==="not_found"){R.end=true;R.failed=true;s.err="Бот не нашёл этот запрос.";return draw()}
 if(!r||(r.error&&!r.status)){R.fails++;   // Tester #379: a CLOSED request answers {status:"error", error:…} — that is an answer, not a lost poll
const lost=Date.now()-R.okt>60000;
  if(Date.now()-R.okt>20*60000){R.end=true;R.lost=true;return draw()}                            // 20 min without contact: stop asking
  if(lost!==!!R.lost||R.fails===2){R.lost=lost;draw()}return}
 const was=R.fails||R.lost;R.fails=0;R.lost=false;R.okt=Date.now();
 (r.ops||[]).forEach(o=>apply(s,o));R.n+= (r.ops||[]).length;
 if(r.status==="queued"&&!R.n&&Date.now()-R.t0>30000&&!s.slow){s.slow=true}
 if(r.status==="done"||r.status==="error"){R.end=true;if(r.status==="error"){R.failed=true;R.closed=r.error;s.ho=true;s.chk=true;s.err=CLOSED[r.error]||CLOSED.other;checkFlag(s)}
  if(s.story||R.kind!=="cb"||/^(tp|kl|nb|rwg|rwy|ws|wss|cws|cwss|rv|rva|eq|eqg|ce|wm|ob|mw):/.test(R.data))refresh()}
 if(was||(r.ops||[]).length||R.end||s.slow)draw()}
// Tester #379 (PM): a request the bot closed is said honestly (never «бот доделает»); «💬 Сделать это в чате» always,
// «🔄 Ещё раз» (a NEW request, new idem) only while the bot takes app requests; flag 0 → the explicit handoff screen at once
const CLOSED={interrupted:"Бот перезапустился, пока это делал. Если часть успела дописаться — она появится в «Главах».",   // #391: the truth either way
 expired:"Бот не взял этот запрос — сейчас он не отвечает, запрос закрыт.",cancelled:"Запрос отменён — бот его не выполнит.",
 other:"Бот не смог это сделать — запрос закрыт."};
// Tester #390: the handoff NEVER opens the chat by itself (no toChat / tg.close without a tap) — 'new' (the questionnaire
// after a reset) gets its own handoff screen with one explicit «💬 …» button, like every other key
function handoff(s){const p=s.data,n=HIST.length;if(D)D.app_actions=false;p==="city"?chat("city","city"):p==="new"?chat("new","new"):go(p);
 if(HIST.length===n+1&&HIST[n]&&HIST[n].tab==="act"){HIST.splice(n,1);render()}}   // the handoff REPLACES the act screen: «Назад» goes where the user came from
// Tester #390: «🔄» is drawn only after checkFlag answered (s.chk) — no flash of a stale «🔄» before the handoff
async function checkFlag(s){try{const d=await api({});if(d&&!d.error&&d.words)D=d}catch(e){}s.chk=false;
 if(D&&D.app_actions!==true&&tab==="act"&&S()===s)return handoff(s);draw()}
function find(s,id){return s.msgs.find(m=>m.id===id)}
function apply(s,o){const m=o.id!=null&&find(s,o.id);
 if(o.op==="msg"||(o.op==="edit"&&!m)){s.msgs.push({id:o.id,html:o.html||"",b:o.b||null,q:o.q||null});s.aw=""}
 else if(o.op==="edit"){m.html=o.html||"";m.b=o.b||null;m.wait=false}
 else if(o.op==="kb"&&m){m.b=o.b||null;m.wait=false}
 else if(o.op==="del"){s.msgs=s.msgs.filter(x=>x.id!==o.id)}
 else if(o.op==="voice"||o.op==="doc"){s.msgs.push({id:o.id,html:o.html||"",blob:o.blob,kind:o.op,name:o.name||""})}
 else if(o.op==="toast"){toast(o.text)}
 else if(o.op==="busy"){s.story=true}
 else if(o.op==="await"){s.aw=o.kind||"text"}}
let RT=null;function refresh(){clearTimeout(RT);RT=setTimeout(async()=>{try{const d=await api({});if(d&&!d.error&&d.words){D=d;if(tab!=="act")render()}}catch(e){}},400)}
function draw(){if(tab!=="act")return;const y=scrollY,atEnd=innerHeight+y>=document.documentElement.scrollHeight-40;render();
 if(atEnd)scrollTo(0,document.documentElement.scrollHeight);else scrollTo(0,y)}
// PM #359 #365: the bot's main menu inside the app would duplicate the tabs and «⬅️ Назад» — its card folds to «🏠 На главную»,
// and the bot's menu buttons are the app's own tabs (one menu, no duplicates)
const TABS={"mn:episodes":"eps","eps:0":"eps","mn:dict":"dict","mn:city":"city"};
const isMenu=m=>!m.mine&&!m.kind&&((m.b||[]).flat().filter(b=>/^mn:/.test(b.d||"")).length>=2||/^\s*(🏙 <b>Главное меню|📖 <b>MemCity)/.test(m.html||""));
window.actTap=function(mid,ri,bi){const s=S();if(!s)return;const m=find(s,mid);const b=m&&m.b&&m.b[ri]&&m.b[ri][bi];if(!b)return;
 if(b.app||b.d==="go:home")return nav("home");          // «🏠 Меню» / «📱 Открыть приложение»: the app IS the menu
 if(TABS[b.d])return navTab(TABS[b.d]);                  // #365: «📚 Мои истории» / «📖 Словарь» / «🏙 Мой город» = the tabs
 if(BACKS.includes(b.d))return goBack();                 // #365: the bot's «⬅️ Назад» = this screen's «⬅️ Назад» (not drawn)
 if(b.d==="mn:topics"||b.d==="ch:toc")return go("topic");   // the book's chapters = «Главы» here
 if(b.u){try{/^https:\/\/t\.me\//.test(b.u)?tg.openTelegramLink(b.u):tg.openLink(b.u)}catch(e){}return}   // the bot's link buttons (share)
 if(b.d==="noop")return;
 try{tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("light")}catch(e){}
 m.wait=true;send(s,"cb",b.d,mid)};
window.actSend=function(){const s=S(),el=document.getElementById("actin");if(!s||!el)return;const t=el.value.trim();if(!t)return;
 const id=Date.now()*10+(SEQ++%10);s.msgs.push({id,html:esc(t),mine:true});el.value="";s.aw="";send(s,"text",t,id)};
// #391 (blocker): «🔄» after 'interrupted' first asks about the SAME request (its handler may have finished — the server
// takes its late result) and checks «Главы»; only when no part came does it send a new request — and the server shows a
// part it already wrote for this intent instead of writing a second one (no second −10 either way)
async function recheck(s,R){R.rechk=true;s.err="";s.chk=true;draw();let r=null;
 try{r=await api({op:"act_poll",id:R.id,from:R.n})}catch(e){r=null}
 if(r&&!r.error&&r.status)(r.ops||[]).forEach(o=>apply(s,o)),R.n+=(r.ops||[]).length;
 if(r&&(r.status==="done"||r.status==="running"||r.status==="queued")){s.chk=false;R.end=false;R.failed=false;R.closed="";
  if(r.status==="done"){R.end=true;refresh()}else poll(s,R);return draw()}
 try{const d=await api({});if(d&&!d.error&&d.words)D=d}catch(e){}
 s.chk=false;
 if(((D&&D.episodes)||[]).length>R.eps0){const e=lastEp();s.note="✅ Часть успела дописаться — она уже в «Главах».";s.open=e&&e.id;return draw()}
 send(s,R.kind,R.data,R.msg)}
window.actRetry=function(){const s=S();if(!s)return;const R=s.reqs[s.reqs.length-1];if(!R)return;s.note="";s.open=null;
 if(R.id&&R.failed&&R.closed==="interrupted"&&!R.rechk)return recheck(s,R);
 if(R.id&&!R.failed){s.err="";R.lost=false;R.fails=0;R.okt=Date.now();          // #361: ask about the SAME request first
  if(R.end){R.end=false;poll(s,R)}pollOnce(s,R);return draw()}
 if(!R.id)return send(s,R.kind,R.data,R.msg,R.idem);   // «act» never confirmed: the same idem → the server answers dup, never twice
 send(s,R.kind,R.data,R.msg)};                         // the bot answered error / not found: nothing runs — a new request
// #362: «💬 Открыть в чате вместо этого» — first cancel this screen's queued request(s) (edge act_cancel); the chat opens
// only if nothing of it will run later; a request the bot already took stays here (no second part / second −10)
window.actChat=async function(){const s=S();if(!s||s.cancel)return;const live=s.reqs.filter(r=>!r.end&&r.id);s.cancel=true;s.note="";draw();let ok=true,run=false;
 for(const R of live){let r=null;try{r=await api({op:"act_cancel",id:R.id})}catch(e){r=null}
  if(r&&(r.ok||r.error==="not_found")){R.end=true;R.failed=true}else{ok=false;if(r&&(r.status==="running"||r.status==="done"))run=true}}
 s.cancel=false;
 if(ok){s.slow=false;s.err="";draw();return toChat(s.data)}
 s.slow=false;s.note=run?"Бот уже взял запрос — ответ появится здесь.":"Не получилось отменить запрос — он ждёт бота здесь. Попробуй через минуту.";
 live.filter(R=>!R.end).forEach(R=>pollOnce(s,R));draw()};
window.actToChat=function(){const s=S();if(s&&!s.reqs.some(r=>!r.end&&r.id))toChat(s.data)};   // #364: nothing was accepted
window.actPlay=async function(mid){const s=S(),m=s&&find(s,mid);if(!m||!m.blob)return;
 try{if(!m.url){const r=await api({op:"act_blob",id:m.blob});if(!r||!r.b64)return toast("Файл уже недоступен");
   const bin=atob(r.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);m.url=URL.createObjectURL(new Blob([u],{type:r.mime}));m.mime=r.mime}
  if(m.kind==="voice"){if(window.player)player.pause();window.player=new Audio(m.url);player.play().catch(()=>toast("Не получилось воспроизвести"))}
  else{const a=document.createElement("a");a.href=m.url;a.download=m.name||"file";document.body.appendChild(a);a.click();a.remove()}}catch(e){toast("Не получилось открыть файл")}};
// #365: the bot's own «⬅️ Назад» (bk / mn:back) is not drawn — this screen's «⬅️ Назад» is the one way back (no duplicates)
const BACKS=["bk","mn:back"];
const btns=m=>{const rows=(m.b||[]).map((row,ri)=>row.map((b,bi)=>BACKS.includes(b.d)?"":`<a onclick="actTap(${m.id},${ri},${bi})">${esc(b.t)}</a>`).join("")).filter(x=>x);
 return rows.length?`<div class="abtn${m.wait?" wait":""}">${rows.map(r=>`<div class="arow">${r}</div>`).join("")}</div>`:""};
const msg=m=>isMenu(m)?`<div class="card amsg amenu"><a class="link" onclick="nav('home')">🏠 На главную</a></div>`:m.mine?`<div class="amine">${m.html}</div>`:m.kind?`<div class="card amsg"><a class="aplay" onclick="actPlay(${m.id})">${m.kind==="voice"?"▶️ Слушать":"📄 "+esc(m.name||"Файл")}</a>${m.html?`<div class="atxt">${clean(m.html)}</div>`:""}</div>`
 :`<div class="card amsg" id="am${m.id}"><div class="atxt">${clean(m.html)}</div>${btns(m)}</div>`;
V.act=function(){const s=S();if(!s)return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="empty">Экран закрыт.</div>`;
 const run=s.live(),last=s.reqs[s.reqs.length-1],lost=s.reqs.some(r=>!r.end&&r.lost),weak=s.reqs.some(r=>!r.end&&r.fails>=2);
 const status=lost?`<div class="card awarn">😕 Связь с ботом пропала — запрос не потерян, бот его доделает. <a class="link" onclick="actRetry()">🔄 Ещё раз</a></div>`
  :run?(s.slow?`<div class="card awarn">⏳ Бот сейчас не берёт запрос — он перезапускается или очень занят. Запрос в очереди, можно подождать здесь.
<a class="link" onclick="actChat()">${s.cancel?"⏳ Отменяю запрос…":"💬 Открыть в чате вместо этого"}</a></div>`
  :`<div class="await">⏳ ${weak?"Нет связи — жду бота…":s.story?"Бот пишет — можно уйти с этого экрана, готовая часть появится в «Главах»":"Бот отвечает…"}</div>`):"";
 const lostEnd=!run&&last&&last.lost&&!last.failed;
 const err=s.err&&!run?`<div class="card awarn">😕 ${esc(s.err)}${s.ho?` <a class="link" onclick="actToChat()">💬 Сделать это в чате</a>`:""}${last&&!s.chk&&(!s.ho||ACT_ON())?` <a class="link" onclick="actRetry()">🔄 Ещё раз</a>`:""}</div>`
  :lostEnd?`<div class="card awarn">😕 Связь с ботом пропала. <a class="link" onclick="actRetry()">🔄 Ещё раз</a></div>`:"";
 const note=s.note?`<div class="card awarn">${esc(s.note)}${s.open?` <a class="link" onclick="openEp('${esc(s.open)}')">📖 Открыть</a>`:""}</div>`:"";
 const ph=s.aw==="onboarding"?"Ответ на вопрос…":s.aw?"Напиши ответ…":"Написать боту…";
 return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">${esc(s.title)}</div>
<div class="alist">${s.msgs.map(msg).join("")}</div>${status}${err}${note}
<div class="ain${s.aw?" on":""}"><textarea id="actin" rows="1" placeholder="${ph}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();actSend()}"></textarea><a onclick="actSend()">➤</a></div>`};
})();
