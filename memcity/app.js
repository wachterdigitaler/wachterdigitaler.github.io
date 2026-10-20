const API="https://wbrpcvbpipeejdnsymdz.supabase.co/functions/v1/memcity-app", BOT="fixDeutsch_bot";
// APP_VERSION — single source for cache-bust ?v= and the label; tools/bump_version.sh updates these + index.html
const APP_VERSION="3.8.2", APP_BUILT="20.10 21:56";
const verLabel=()=>`<div class="ver">Версия ${esc(APP_VERSION)}</div>`;
const tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0b0b0f");tg.setBackgroundColor("#0b0b0f")}catch(e){}}
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// oldlook (NordSturm 17.10): the look of 924d475 (#134) back — dark cards, colour tiles per place, 5 tabs, the big word card —
// with the r23 data on top: human place names (placename.js), the gender zone label, no technical zone codes, bold story words.
// oldlook: r23 extras over the old look are switches, so the PM can keep or drop each one. Override: ?r23=-status,card2 (a «+» in a URL is a space, so «on» = the bare name)
// or window.MC_R23={card2:true}. Always on (not switches): human place names, gender zone label, no technical zone codes, no names in the URL.
const R23=(()=>{const f={status:false,readnext:true,kl:true,map:true,nextpart:true,card2:false,boldsnd:true,legend:true};
 try{Object.assign(f,window.MC_R23||{})}catch(e){}
 String(new URLSearchParams(location.search).get("r23")||"").split(",").forEach(t=>{t=t.trim();if(/^[+-]?\w+$/.test(t))f[t.replace(/^[+-]/,"")]=t[0]!=="-"});return f})();
let D=null, wl=[], wi=0, prev="home", tab="home", epId=null, q="", homeTab="zones", HV=null, BCID=null;
const ZK={der:["🔵","der","#2d6cff,#1a3d99"],die:["🔴","die","#ff5d8a,#a3244c"],das:["🟢","das","#22c58b,#0e7a55"],verb:["🟡","глаголы","#f5c542,#b07d00"]};
// #442: the learner's own word (payload «own») — its district for grouping, never «das» by default, no gender colour, label «своё»
const isOwn=w=>!!(w&&(w.own||w.source==="learner-own"||(Array.isArray(w.flags)&&w.flags.includes("own")))),ownTr=w=>w.translation?"твой перевод: "+w.translation:"своё слово, без перевода",trOf=w=>isOwn(w)?ownTr(w):w.translation;
const kindOf=w=>w.pos==="verb"?"verb":(w.article||w.zone_kind||(isOwn(w)?"verb":"das"));
const isDue=w=>w.due_at&&Date.parse(w.due_at)<=Date.now();
const sparts=a=>(Array.isArray(a)?a:[a]).flatMap(s=>String(s??"").split("+")).map(s=>s.trim()).filter(Boolean); // #134: «халат+усы» → «халат» + «усы»
const qs=a=>sparts(a).map(s=>"<b class=\"snd\">"+esc(s)+"</b>").join(" + ");   // PM #249: sound-alikes bold
const sounds=w=>qs(Array.isArray(w.sounds)?w.sounds:[]);
const plr=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m===1?a:m>=2&&m<=4?b:c};
const dayDiff=d=>{const a=new Date(d),b=new Date();a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.round((a-b)/864e5)};
// #134: one consistent state line: «повторено 2 раза · следующее через 3 дня» / «новое слово · первое повторение завтра» / «повторить сегодня 🔁»
function repLine(w){const n=w.reps||0,due=w.due_at?new Date(w.due_at):null,real=due&&due.getFullYear()<2090;
 const done=n?`повторено ${n} ${plr(n,"раз","раза","раз")}`:"новое слово";
 if(!real)return n?done:"ещё не повторялось";
 if(isDue(w))return `${done} · повторить сегодня 🔁`;
 const k=dayDiff(due),when=k<=0?"сегодня":k===1?"завтра":k===2?"послезавтра":`через ${k} ${plr(k,"день","дня","дней")}`;
 return `${done} · ${n?"следующее":"первое повторение"} ${when}`}
// oldlook: no red dots / due badges — a short clear status: «🔁 сегодня» (repeat today) · «через 3 дн.» · «✅ выучено» · «новое»
function stat(w){const due=w.due_at?new Date(w.due_at):null,real=due&&due.getFullYear()<2090;
 if(isDue(w))return ["now","🔁 сегодня"];if(w.learned)return ["ok","✅ выучено"];if(!real)return ["new","новое"];
 const k=dayDiff(due);return ["soon",k<=0?"сегодня позже":k===1?"завтра":`через ${k} дн.`]}
const stl=w=>{const s=stat(w);return R23.status?`<span class="rs ${s[0]}">${s[1]}</span>`:""};
const revRow=ws=>{const n=ws.filter(isDue).length;return n?`<div class="card rv" onclick="go('review')"><b>🔁 Повторить: ${n} ${plr(n,"слово","слова","слов")}</b><span>›</span></div>`:""};
const emptyCTA=(t,h)=>`<div class="empty"><div style="font-size:34px">🏙</div><b style="display:block;color:var(--txt);margin:8px 0 4px">${t}</b>${h}<button class="btn" style="margin-top:14px" onclick="go('next')">▶️ Читать дальше</button></div>`;
// miniapp-inapp-nav (NordSturm 19.10 22:56): inside the app every button stays in the app and switches screens here.
// inapp-actions (NordSturm 20.10 00:08): what only the bot does now runs HERE too — act(title, payload) (act.js) asks the bot
// through the edge; the bot plays the same /start payload of the chat and its answers (cards, buttons, progress) come back
// into the app. go(p) keeps every old payload (review|topic|city|next|ce_z_…|st_…|go_…|new). The chat opens only from the
// explicit «💬 Открыть в чате вместо этого» while the bot does not take requests (restart / outage) — toChat.
const toChat=p=>{ if(tg&&tg.openTelegramLink){tg.openTelegramLink(`https://t.me/${BOT}?start=${p}`);setTimeout(()=>tg.close(),300)} else location.href=`https://t.me/${BOT}?start=${p}` };
const ST_ACT={check:["🧠 Проверить себя","eq_"],rw:["✏️ Переписать часть","rw_"],tts:["🔊 Озвучить","st_"]};
// PM #359 #362/#364: the bot's screens run here only while the bot takes app requests — the payload says so (app_actions:
// APP_ACTIONS=1 and the bot beats; false / missing = old edge, no migration, flag 0). Otherwise the explicit handoff
// screens of 3.7.0 (V.chat, «💬 … в чате») at once — never a 30 s wait.
const ACT_ON=()=>!!(D&&D.app_actions===true)&&typeof window.act==="function";
function go(p,a){p=String(p||"");const on=ACT_ON();
 if(p==="topic")return openTopics();
 if(p==="mywords")return on?act("🎒 Свои слова и профессии","mywords"):chat("mywords","mywords");   // #356: «Ещё → 🎒 Свои слова и профессии»
 if(p==="city")return tab==="city"?(on?act("✏️ Детали города","city"):chat("city","city")):nav("city");   // header chip → the in-app city; its ✏️ card → the bot's city editing, here
 if(p==="next")return (D.episodes||[]).length||D.next?(on?act("▶️ Следующая часть","next"):chat("next","next")):openTopics();
 if(p==="review")return on?act("🔁 Повторение","review"):chat("review","review");
 if(/^ce_[zp]_/.test(p))return on?act("✏️ Правка места",p):chat("city",p);
 if(/^st_/.test(p)){if(!on)return chat(a||"st",p);const x=ST_ACT[a];return x?act(x[0],x[1]+p.slice(3)):act("📖 Часть",p)}
 if(/^go_/.test(p))return on?act("▶️ Пишем часть",p):chat("start",p);
 if(p==="new"){if(!D.reset)return nav("home");   // #365: a set-up learner has no questionnaire — the bot would show its menu
  return on?act("📝 Анкета",p):toChat(p)}        // the questionnaire after a reset: the bot's own questions, answered here
 return on?act("💬 Бот",p):chat("other",p)}
// QA-152 #263: a technical zone label (article/letter/actions code, also the edge-cut form) is no place → "" and the caller shows zname(kind)
function placeOf(raw,lab){if(lab&&MP.isTech(lab))lab="";if(lab&&typeof raw!=="object"){const p0=placeOf0(raw);return {t:lab,c:p0.t!==lab?p0.c:p0.c}}return placeOf0(raw)}
function placeOf0(raw){let s=String(raw||"").trim();if(!s)return {t:"",c:""};
 if(MP.isTech(s))return {t:"",c:""};s=MP.clean(s).replace(/^zona\s+\S+,\s*/i,"").replace(/\s*\(без рода\)/i,"");if(!s||MP.isTech(s))return {t:"",c:""};
 let ctx="";const ci=s.indexOf(":");if(ci>0){ctx=s.slice(0,ci);s=s.slice(ci+1)}else{const p=s.split(/,\s*/);if(p.length>1){s=p.pop();if(/^где\s/i.test(s)&&p.length>1)s=p.pop();ctx=p.join(", ")}}
 const fix=x=>x.replace(/^(я\s+)?(жил|жила|живу)\s+в\s+/i,"").replace(/^(второе|третье|первое)\s+место\s+(это\s+)?/i,"").replace(/^пускай\s+это\s+будет\s+/i,"").replace(/\s+я\s+буду.*$/i,"")
  .replace(/^(\S+)\s+был[аио]?\s+не\s*большой/i,"небольшой $1").replace(/с\s+парой\s+качель/i,"с качелями").replace(/^(\\S+)ой\\s+квартире/i,"$1ая квартира").replace(/^(\S+)ой\s+квартире/i,"$1ая квартира").replace(/^заходили\s+в\s+/i,"").trim();
 const cut=x=>x.length>42?x.slice(0,40).replace(/\s+\S*$/,"")+"…":x, cap=x=>x?x[0].toUpperCase()+x.slice(1):x;
 const t=cap(cut(fix(s))),c=cut(fix(ctx));return {t:MP.isTech(t)?"":t,c:MP.isTech(c)?"":c}}
const ptxt=w=>placeOf(w.place,w.place_label).t||zname(kindOf(w));
const word=w=>`<div class="w" onclick="openWord('${w.user_word_id}')">${isOwn(w)?`<span class="art own">своё</span>`:`<span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span>`}<div class="t"><b>${isOwn(w)?"🎒 ":""}${esc(w.syllables||w.lemma)}</b><small><span class="tr">${esc(trOf(w))}</span>${sounds(w)?" · "+sounds(w):""}${" · 📍 "+esc(ptxt(w))}</small></div>${stl(w)}</div>`;
function tt(t){return String(t||"").replace(/^\s*\u0421\u0435\u0440\u0438\u044f\s+(\d+):\s*(.+)$/i,"«$2» · часть $1")}
function nounGold(s,ws){/* r22d #178: 🟡 = verbs only */const nn=new Set((ws||[]).filter(w=>w.article).map(w=>String(w.lemma||"").toLowerCase()));return String(s||"").replace(/🟡\s?(\*\*([^*]+)\*\*|[^\s.,!?;:]+)/g,(m,t,b)=>{const k=(b||t).replace(/^(der|die|das|den|dem|des)\s+/i,"").toLowerCase();return nn.has(k)?t:m})}
function md(s,ws){s=MP.noPlan(s);s=MP.road(s);s=syncKey(s,ws);if(MP.keyLegend)s=MP.keyLegend(s,znames()).replace(/^(Места: .*)$/mu,m=>m.replace(/🟡/gu,"\uE000"));return boldAssoc(esc(nounGold(s,ws)),ws).replace(/🟡\s?\*\*(.+?)\*\*/g,"<b class=\"v\">$1</b>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/🟡\s?([^\s.,!?;:]+)/g,"<b class=\"v\">$1</b>").split(/\n{2,}/).map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("").replace(/\uE000/g,"🟡")}
// r23: sound-alikes («баня», «хохот») bold inside the chapter text — any Russian ending (stem match).
// fix-assoc-sync (NordSturm 19.10): ONE source — the 🔑 line shows the word's card sound-alikes; in a paragraph only the
// associations of ITS word are bold (never «тесто» of die Toilette in the kitchen); real word forms only (лето ≠ летели) —
// the same rules as the bot (core/assoc_check.py, core/assoc_bold.py)
const A_NOM="а я о е ы и у ю ь й ой ей ий ый ая яя ое ее ые ие ом ем ам ям ах ях ами ями ов ев ую юю ого его ому ему ым им ых их ою ею".split(" ").sort((a,b)=>b.length-a.length);
const A_VERB="ть ти чь ться тся ешь ет ем ете ут ют ит ат ят ишь им ите у ю юсь усь ется ится ал ала али ало ла ли ло л ял яла яли яло ел ела ели ело ил ила или ило ась ось ись ся сь й йте и ите ая ую ющий ящий вший".split(" ").sort((a,b)=>b.length-a.length);
const A_STOP=new Set("это быть был была было были есть весь все всё так там тут вот уже ещё еще очень один одна одно свой своя мой моя наш его её они она оно что как кто где когда делать сделать мочь иметь человек время место вещь часть новый большой маленький хороший день раз год дело идти стать сказать который".split(" "));
const aNorm=t=>String(t||"").toLowerCase().replace(/ё/g,"е");
const aVerb=t=>/(ть|ти|чь)(ся|сь)?$/.test(aNorm(t));
function aStem(t){const w=aNorm(t),keep=w.length<=4?2:3;for(const e of(aVerb(w)?A_VERB:A_NOM))if(w.endsWith(e)&&w.length-e.length>=keep)return w.slice(0,-e.length);return w}
const aEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function aTermRx(t){const st=aEsc(aStem(t)).replace(/е/g,"[её]");return st+(aVerb(t)?"(?:"+A_VERB.map(aEsc).join("|")+")?":"(?:(?:н|ск)?(?:"+A_NOM.map(aEsc).join("|")+"))?")}
function aTerms(w){const out=[];sparts(w&&w.sounds).forEach(x=>(String(x).match(/[А-Яа-яЁё]{3,}/g)||[]).forEach(t=>{const k=aNorm(t);if(!A_STOP.has(k)&&!out.includes(k))out.push(k)}));return out}
function aBold(p,terms){if(!terms.length)return p;const rx=new RegExp("(^|[^А-Яа-яЁёA-Za-z>*])("+terms.map(aTermRx).sort((a,b)=>b.length-a.length).join("|")+")(?![А-Яа-яЁёA-Za-z*])","gi");
 return p.split(/(<[^>]+>|\*\*[^*\n]+\*\*|\([^()\n]*\))/).map(x=>/^(<|\*\*|\()/.test(x)?x:x.replace(rx,"$1<b>$2</b>")).join("")}
const aWord=w=>((w&&w.article?w.article+" ":"")+String((w&&w.lemma)||"")).trim();
function aOwns(par,w){const p=aNorm(par),wd=aNorm(aWord(w)),lem=aNorm(String((w&&w.lemma)||""));if(!lem)return 0;
 if(p.includes("**"+wd+"**")||new RegExp("\\*\\*[^*]*(^|[^a-zäöüß])"+aEsc(lem)+"(?=[^a-zäöüß]|$)[^*]*\\*\\*").test(p))return 2;
 return new RegExp("(^|[^a-zäöüß])"+aEsc(lem)+"(?=[^a-zäöüß]|$)").test(p)?1:0}
function boldAssoc(h,ws){ws=(ws||[]).filter(w=>w&&w.lemma!=null||w&&w.sounds);if(!ws.length)return h;
 const ch=String(h).split(/(\n\s*\n)/),paras=ch.filter((_,i)=>i%2===0);
 const own=paras.map(()=>[]);
 ws.forEach(w=>{const sc=paras.map(p=>aOwns(p,w)),best=Math.max(0,...sc);if(best)sc.forEach((v,i)=>{if(v===best)own[i].push(w)})});
 const out=paras.map((p,i)=>{const lines=p.split("\n");
  if(lines.some(l=>/\*\*[^*]+\*\* — .* · /.test(l)))return lines.map(l=>{const m=l.match(/\*\*([^*]+)\*\*/);const w=m&&ws.find(x=>aNorm(aWord(x))===aNorm(m[1].trim()));return w&&l.includes(" · ")?aBold(l,aTerms(w)):l}).join("\n");
  const ts=[...new Set((own[i].length?own[i]:(ws.length===1?ws:[])).flatMap(aTerms))];return aBold(p,ts)});
 return ch.map((c,i)=>i%2===0?out[i/2]:c).join("")}
function syncKey(s,ws){/* fix-assoc-sync: the 🔑 line = the card (display only, the stored text is not touched) */
 const by={};(ws||[]).forEach(w=>{const k=aNorm(aWord(w));const sn=Array.isArray(w.sounds)?w.sounds:(w.sounds?[w.sounds]:[]);if(k&&sn.length)by[k]=sn});
 const i=String(s||"").indexOf("🔑");if(i<0)return s;
 return s.slice(0,i)+s.slice(i).split("\n").map(l=>{const m=l.match(/\*\*([^*]+)\*\*/);if(!m||!l.includes(" · "))return l;const sn=by[aNorm(m[1].trim())];if(!sn)return l;const pt=l.split(" · ");if(pt.length<2||!pt[1].includes("«"))return l;pt[1]=sn.map(x=>"«"+x+"»").join(" + ");return pt.join(" · ")}).join("\n")}
// PM-124 #194 / PM-128 #213: ONE place name for the learner = the bot's (payload place_names ← memory.place_names); the rule = placename.js
// (generated from core/placename_rules.json); a technical zones.name (zona + article + letter) is never shown; a minimal stand-in if it failed to load
const MP=window.MCPlace||{road:t=>String(t||"").replace(/[Дд]орога между (?:зонами|местами|районами)/g,"Дорога между местами").replace(/между (?:зонами|районами)/g,"между местами"),isTech:n=>/^\s*зона\s+(?:[a-dxа-гх]|der|die|das|verb|глагол[а-яё]*|действий)(?![а-яёa-z])/i.test(String(n||"")),clean:t=>String(t||"").replace(/^\s*зона\s+(?:[a-dxа-гх]|der|die|das|verb|глагол[а-яё]*)(?![а-яёa-z])(?:\s*\([^)]*\))?\s*[,:—-]\s*/i,"").replace(/между зонами/gi,"между местами").trim(),fallback:k=>({der:"Мой дом",die:"Моя улица",das:"Любимое место",verb:"Двор у дома"})[k]||"Двор у дома",ofZone:z=>z&&z.name&&!/^\s*зона(?![а-яё])/i.test(z.name)?z.name:(({der:"Мой дом",die:"Моя улица",das:"Любимое место",verb:"Двор у дома"})[z&&z.kind]||"Двор у дома"),noPlan:b=>String(b||"").replace(/\n\n🗺 План:[\s\S]*?(?=\n\n🔑 Ключ:|$)/u,"")};
const zname=k=>{const pn=(D.place_names||{})[k];if(pn&&!MP.isTech(pn))return pn;const z=(D.zones||[]).find(x=>x.kind===k);return z?MP.ofZone(z):MP.fallback(k,"")};
// zonehint (NordSturm 17.10): the gender zone next to the human name — the SAME label as the bot (placename_rules.json role_hint)
const roleOf=k=>MP.role?MP.role(k):"",withRole=(k,n)=>MP.withRole?MP.withRole(k,n):n,znames=()=>({der:zname("der"),die:zname("die"),das:zname("das"),verb:zname("verb")});
const artLbl=k=>withRole(k,zname(k));
const zid=k=>{const z=(D.zones||[]).find(x=>x.kind===k);return z?z.id:""};
const zhead=k=>`${ZK[k][0]} ${esc(withRole(k,zname(k)))}`;   // «🔵 Мой дом (мужская зона, der)»
function zoneTiles(){const g={};D.words.forEach(w=>{const k=kindOf(w);(g[k]=g[k]||[]).push(w)});
 return `<div class="grid">${Object.keys(ZK).map(k=>{const ws=g[k]||[],z=ZK[k],dn=ws.filter(isDue).length;const pct=ws.length?Math.round(100*ws.filter(w=>!isDue(w)).length/ws.length):0;
 return `<div class="tile ${k==="verb"?"tv":""}" onclick="openZone('${k}')" style="background:linear-gradient(150deg,${z[2]})"><div style="font-size:24px">${z[0]} ${z[1]}</div><div><b>${esc(zname(k))}</b><span class="k">${esc(roleOf(k)||(k==="verb"?"ГЛАГОЛЫ":k.toUpperCase()))}</span><small>${ws.length} ${plr(ws.length,"слово","слова","слов")}${dn?" · 🔁 "+dn+" сегодня":""}</small><div class="bar"><i style="width:${pct}%"></i></div></div></div>`}).join("")}</div>`}
function epCard(e,i){const dn=e.words.filter(isDue).length;return `<div class="card ep" onclick="openEp('${e.id}')"><div class="ic">🎬</div><div class="t" style="flex:1"><b>${esc(tt(e.title||e.topic))}</b><small style="display:block;color:var(--mut)">${e.words.length} ${plr(e.words.length,"слово","слова","слов")}${dn?" · 🔁 "+dn+" повторить сегодня":""}</small></div>›</div>`}
const eps=()=>D.episodes.slice().reverse().map(epCard).join("")||emptyCTA("Глав пока нет","Выбери тему — и твой город оживёт в первой главе.");
const V={
book(){if(D.reset)return rsEmpty();const s=D.stats,due=D.words.filter(isDue);return `<div class="top"><div class="av">${esc((D.name||"?")[0])}</div><div class="chip" onclick="go('city')" title="Изменить город">📍 ${esc(D.city)} · ${esc(D.level)} ✏️</div>${verLabel()}</div>
<div class="hero"><small>Слов в твоём городе</small><div class="big">${s.words} <span>${plr(s.words,"слово","слова","слов")}</span></div><div class="stats"><div class="st"><b>${s.due}</b><i>🔁 к повторению</i></div><div class="st"><b>${s.streak} 🔥</b><i>дней подряд</i></div><div class="st"><b>${s.learned}</b><i>✅ выучено</i></div></div></div>
<div class="acts">${R23.readnext?`<div class="a p" onclick="go('next')"><div>▶️</div>Читать дальше</div>`:`<div class="a p" onclick="go('topic')"><div>▶️</div>Новая глава</div>`}<div class="a" onclick="go('review')"><div>🔁</div>Повторить</div><div class="a" onclick="nav('eps')"><div>📚</div>Мои главы</div><div class="a" onclick="nav('dict')"><div>📖</div>Словарь</div></div>
${R23.readnext&&D.next?`<div class="card nx" onclick="openCur()"><small>Сейчас читаешь</small><b>📖 ${esc(nxTitle())}</b></div>`:""}
${due.length?`<div class="card"><h3 class="rvh" onclick="go('review')">🔁 Повторить: ${due.length} ${plr(due.length,"слово","слова","слов")}<span>›</span></h3>${due.slice(0,4).map(word).join("")}<button class="btn" onclick="${due[0].story_id?`openEp('${due[0].story_id}')`:"go('review')"}">📖 Перечитать главу и проверить себя</button></div>`:D.words.length?`<div class="card promo"><div class="e">✨</div><div><b>На сегодня всё повторено</b><p>Самое время читать дальше</p></div></div>`:`<div class="card promo" onclick="go('topic')"><div class="e">📖</div><div><b>Начни первую главу</b><p>Выбери тему — и твой город оживёт в первой главе</p></div></div>`}
<div class="tabs"><div class="tab ${homeTab==="zones"?"on":""}" onclick="homeTab='zones';render()">Город</div><div class="tab ${homeTab==="eps"?"on":""}" onclick="homeTab='eps';render()">Главы</div></div>
${homeTab==="zones"?zoneTiles():eps()}`},
city(){if(D.reset)return rsEmpty();return `<div class="top"><b style="font-size:24px">${esc(D.city)}</b><div class="chip">${D.words.length} ${plr(D.words.length,"слово","слова","слов")}</div>${verLabel()}</div>${zoneTiles()}
<div style="margin-top:12px">${revRow(D.words)}</div>
<div class="card" onclick="go('city')"><div class="w"><div class="t"><b>✏️ Добавить или поправить детали</b><small>места, названия, забытые подробности — без анкеты</small></div>›</div></div>
${Object.keys(ZK).map(k=>{const ws=D.words.filter(w=>kindOf(w)===k).sort((a,b)=>(a.chain_order??0)-(b.chain_order??0));return ws.length?`<div class="card" id="z-${k}" style="margin-top:12px"><h3 class="zh">${zhead(k)}${zid(k)?`<span class="chip" onclick="event.stopPropagation();go('ce_z_${zid(k)}')">✏️ Править</span>`:""}</h3>${ws.map(word).join("")}</div>`:""}).join("")}
${R23.legend&&R23.status?`<p class="legend"><span class="rs now">🔁 сегодня</span> повторить сегодня · <span class="rs soon">через 3 дн.</span> · <span class="rs ok">✅ выучено</span></p>`:""}`},
eps(){return `<div class="top"><b style="font-size:24px">Мои главы</b><div class="chip" onclick="go('next')">▶️ Читать дальше</div></div>${eps()}`},
ep(){const e=D.episodes.find(x=>x.id===epId);if(!e)return V.eps();return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="goBack()">‹</div><b>${esc(tt(e.title))}</b><div></div></div>
<div class="card story read">${md(e.body,e.words)}</div>
${R23.map?`<details class="card map"><summary>🗺 Карта главы · ${e.words.length} ${plr(e.words.length,"слово","слова","слов")}</summary>${e.words.map(w=>`<div>${isDue(w)?"🔁 ":""}📍 ${esc(ptxt(w))} — <b onclick="openWord('${w.user_word_id}')" style="text-decoration:underline dotted">${isOwn(w)?"🎒 ":""}${esc((w.article?w.article+" ":"")+w.lemma)}</b> (${esc(isOwn(w)?(w.translation||"своё слово"):w.translation)}) · ${esc(w.syllables||w.lemma)}${sounds(w)?" → "+sounds(w):""}</div>`).join("")}</details>`:""}
<div class="seg"><span class="chip" onclick="go('st_${e.id}','check')">🧠 Проверить себя</span><span class="chip" onclick="go('st_${e.id}','rw')">✏️ Переписать часть</span><span class="chip" onclick="go('st_${e.id}','tts')">🔊 Озвучить</span></div>
${R23.nextpart?`<button class="btn" onclick="go('next')">▶️ Следующая часть</button><a class="link" onclick="go('st_${e.id}','check')">Проверить себя</a>`:`<button class="btn" onclick="go('review')">🔁 Повторить слова этой главы</button>`}`},
dict(){const ws=D.words.filter(w=>!q||(w.lemma+" "+w.translation).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
 return `<div class="top"><b style="font-size:24px">Словарь</b><div class="chip">${D.words.length}</div></div>
${R23.kl?`<div class="card kc" onclick="openKl()"><div class="w"><div class="t"><b>☑ Что уже знаешь?</b><small>отметь знакомые слова следующей части — книга не будет тратить на них страницы</small></div>›</div></div>`:""}${revRow(D.words)}${!D.words.length?"":`<input class="srch" placeholder="Поиск: слово или перевод" value="${esc(q)}" oninput="q=this.value;const c=this.selectionStart;render();const i=$('.srch');i.focus();i.setSelectionRange(c,c)">`}
${!D.words.length?emptyCTA("Тут появятся слова твоей первой главы","Каждое слово получит своё место в твоём городе и смешную историю."):`<div class="card">${ws.map(word).join("")||`<div class="empty">По запросу «${esc(q)}» слов нет — попробуй немецкое слово или перевод.</div>`}</div>`}`},
word(){const w=wl[wi];if(!w)return V.book();const k=kindOf(w),col=isOwn(w)?"#cfcfda":{der:"#7aa6ff",die:"#ff8fb0",das:"#6ff0a8",verb:"#f5c542"}[k];const p=placeOf(w.place,w.place_label);
 const due=w.due_at?new Date(w.due_at):null,dd=(x=>x[0].toUpperCase()+x.slice(1))(repLine(w)),dl=due&&due.getFullYear()<2090&&!isDue(w)?due.toLocaleDateString("ru-RU",{day:"numeric",month:"long"}):"";
 return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="back()">‹</div><div class="chip">${wi+1} / ${wl.length}</div><div style="font-size:26px;cursor:pointer" onclick="say()">🔊</div></div>
${CARD_V2?card2(w,k,col,p):`<div class="hero" style="text-align:center;padding:28px 18px">${isOwn(w)?`<span class="art big own">🎒 своё</span>`:`<span class="art big ${w.pos==="verb"?"verb":(w.article||"")}">${esc(w.pos==="verb"?"глагол":w.article||"")}</span>`}
<div class="big" style="font-size:46px;color:${col}">${esc(w.lemma)}</div><div style="font-size:20px;color:#cfcfda">${esc(w.syllables||w.lemma)}</div><div style="margin-top:8px;font-size:18px">${esc(trOf(w))}${w.plural?` <span style="color:var(--mut)">· мн. ${esc(w.plural)}</span>`:""}</div></div>
<div class="card" style="margin-top:12px"><h3 style="display:flex;justify-content:space-between">📍 ${esc(p.t||zname(k))}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3><small class="art-l">${isOwn(w)?"🎒 своё слово":`${ZK[k][0]} ${esc(artLbl(k))}`}</small>
${sounds(w)?`<div style="margin-top:10px;font-size:17px">🔤 ${esc(w.syllables||w.lemma)} → ${sounds(w)}</div>`:""}</div>
${w.image?`<div class="card story"><h3>🎬 Образ</h3><p>${R23.boldsnd?boldAssoc(esc(MP.road(String(w.image)).replace(/\*\*/g,"")),[w]):esc(MP.road(String(w.image)).replace(/\*\*/g,""))}</p></div>`:""}`}
<div class="card"><div class="w"><div class="t"><b>${dd}</b><small>${dl?"📅 "+dl+(w.interval_days?" · ":""):""}${w.interval_days?`интервал ${w.interval_days} ${plr(w.interval_days,"день","дня","дней")}`:""}</small></div>${stl(w)}</div></div>
<div class="seg">${w.story_id&&D.episodes.some(e=>e.id===w.story_id)?`<span class="chip" onclick="openEp('${w.story_id}')">📖 Вся глава</span>`:""}<span class="chip" onclick="step(-1)">← Пред.</span><span class="chip" onclick="step(1)">След. →</span></div>`},
more(){return `<div class="top"><b style="font-size:24px">Ещё</b><div></div></div><div class="card">
<div class="w" onclick="go('review')"><div class="t"><b>🔁 Повторение</b><small>карточки и перечитывание</small></div>›</div>
<div class="w" onclick="go('mywords')"><div class="t"><b>🎒 Свои слова и профессии</b><small>слова с работы и из жизни, профессиональные наборы</small></div>›</div>
<div class="w" onclick="openKl()"><div class="t"><b>☑ Что уже знаешь?</b><small>знакомые слова следующей части</small></div>›</div></div>
${RS.restore?`<div class="card"><div class="w" id="rsback" onclick="rrOpen()"><div class="t"><b>↩️ Вернуть мой город</b><small>как было до сброса · копия до ${esc(rsDate(RS.restore.expires_at))}</small></div>›</div></div>`:""}
<div class="card"><div class="w" id="rsitem" onclick="rsOpen()"><div class="t"><b>🔄 Полный сброс</b><small>стереть всё: город, истории, словарь — начать с нуля (копия 30 дней)</small></div>›</div></div>`}};
V.home=V.book;
// PM #189: «знаю / учим» — the same checklist as in the bot (memcity.word_skips via the edge op, signed initData; never WebApp.send-data)
let KL=null, klMode="part";
const nxTitle=()=>{const n=D.next||{};return `Глава «${n.title||""}»`+(n.n?`, часть ${n.n}`:"")};
async function api(b){const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:tg&&tg.initData,...b})});return r.json()}
// Tester #380: «знаю / учим» taps on one word go to the server IN ORDER (one at a time per word); a tap overtaken by a newer
// one is not sent at all, and only the LAST tap's failure rolls the mark back — the last tap wins
const KQ={};
// Tester #393: q.ok = the state the SERVER last confirmed for this word (before the first tap: the state then); a failed
// last tap rolls the mark back to q.ok, not to «before this tap». The queue entry goes when idle (next tap starts fresh).
function wq(id,on,send,fail){const q=KQ[id]||(KQ[id]={n:0,p:Promise.resolve(),ok:!on}),my=++q.n;
 return q.p=q.p.then(async()=>{if(my!==q.n)return;let r={};try{r=await send()}catch(e){r={error:"server"}}
  if(r&&!r.error)q.ok=on;else if(my===q.n)fail(q.ok,r||{});if(my===q.n&&KQ[id]===q)delete KQ[id]})}
async function openKl(){try{KL=await api({op:"kl"})}catch(e){KL={error:"server"}}nav("kl")}
async function klT(id){const all=[...(KL.part||[]),...(KL.all||[])].filter(w=>w.id===id);if(!all.length)return;const on=!all[0].known;all.forEach(w=>w.known=on);render();
 try{tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("light")}catch(e){}
 wq(id,on,()=>api({op:on?"skip":"unskip",word_id:id}),(v,r)=>{all.forEach(w=>w.known=v);KL.msg=r.message||"Не получилось сохранить — попробуй ещё раз";render();setTimeout(()=>{KL.msg="";render()},2600)})}
const klRow=w=>`<div class="kl ${w.known?"on":""}" onclick="klT('${w.id}')"><div class="t"><strong class="${w.verb&&!isOwn(w)?"v":""}">${isOwn(w)?"🎒 ":w.verb?"🟡 ":""}${esc((w.article?w.article+" ":"")+w.lemma)}</strong><small>${esc(isOwn(w)?ownTr(w):w.translation)}${w.known?" · знаю":""}</small></div><span class="cb">${w.known?"✓":""}</span></div>`;
V.kl=function(){if(!KL||KL.error||!KL.chapter)return `<div class="back" onclick="goBack()">‹</div><div class="empty">Список появится, когда начнётся глава.<a class="main" onclick="go('next')">▶️ Читать дальше</a></div>`;
 const ws=klMode==="part"?KL.part:KL.all,kn=ws.filter(w=>w.known).length;
 return `<div class="back" onclick="goBack()">‹</div><div class="hd"><div class="sub">📖 ${esc(KL.chapter.title)}${KL.chapter.n?` · часть ${KL.chapter.n}`:""}</div><h1>Что уже знаешь?</h1></div>
<div class="seg"><a class="${klMode==="part"?"on":""}" onclick="klMode='part';render()">Часть · ${KL.part.filter(w=>!w.known).length}</a><a class="${klMode==="all"?"on":""}" onclick="klMode='all';render()">Вся глава · ${KL.all.length}</a></div>
<div class="sub" style="margin:10px 4px">Отметь, что уже знаешь — эти слова мы пропустим. Остальные оживут в истории.</div>
<div class="card" style="padding:0 16px">${ws.map(klRow).join("")||`<div class="empty">Все слова этой главы уже в историях</div>`}</div>
<div class="sub" style="margin:6px 4px 0">${kn?`Знаю: ${kn} · учим: ${ws.length-kn}`:"Пока всё учим"}</div>
${KL.msg?`<div class="toast">${esc(KL.msg)}</div>`:""}
<a class="main stick" onclick="go('go_${KL.chapter.id}${Number.isInteger(KL.chapter.p)?"_"+KL.chapter.p:""}')">▶️ Готово — пишем часть</a>`};   // #426: go_<cid>_<parts written> — an outdated / repeated link writes nothing
const NAV=[["home","🏠","Главная"],["eps","🎬","Главы"],["city","🏙","Город"],["dict","📖","Словарь"],["more","⋯","Ещё"]];
function openWord(id){const src=tab==="ep"?(D.episodes.find(e=>e.id===epId)||{words:[]}).words:tab==="dict"?D.words.slice().sort((a,b)=>a.lemma.localeCompare(b.lemma,"de")):(tab==="home"||tab==="book")?D.words.filter(isDue):D.words;
 wl=src.length?src:D.words;wi=Math.max(0,wl.findIndex(w=>w.user_word_id===id));if(tab!=="word")prev=tab;nav("word")}
function step(d){if(!wl.length)return;wi=(wi+d+wl.length)%wl.length;render();scrollTo(0,0)}
function back(){goBack()}
const AUDIO="https://wbrpcvbpipeejdnsymdz.supabase.co/storage/v1/object/public/audio/";let player=null;
function speak(w){if(!window.speechSynthesis)return toast("Озвучка появится через пару минут");const u=new SpeechSynthesisUtterance((w.article?w.article+" ":"")+w.lemma);u.lang="de-DE";u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function say(){const w=wl[wi];if(!w)return;try{if(player)player.pause();player=new Audio(AUDIO+w.word_id+".mp3");player.play().catch(()=>speak(w));player.onerror=()=>speak(w)}catch(e){speak(w)}}
let tx=null;document.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});document.addEventListener("touchend",e=>{if(tab!=="word"||tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60)step(dx<0?1:-1);tx=null},{passive:true});
// miniapp-inapp-nav: ONE back stack for the Telegram BackButton and every in-app «‹ / ⬅️ Назад» — each step pops the screen it
// came from (word, chapter, tree level, topic, handoff …); «Главная» with an empty stack = the root (BackButton hidden →
// Telegram's own ✕ closes). Bottom tabs are roots over «Главная». The coins screens keep their own steps (CV, coins.js).
let HIST=[],NAVN=0,LASTC=null;   // NAVN / LASTC: the double-tap guard (#368, below)
const snap=()=>({tab,epId,prev,wi,wl,tSec,tSub,tBlk,tOpen,HV,BCID,klMode,homeTab});
function unsnap(x){({tab,epId,prev,wi,wl,tSec,tSub,tBlk,tOpen,HV,BCID,klMode,homeTab}=x)}
// #368 (Tester): the same screen never twice on the stack (a double tap / a second async open of the same screen)
const sameSnap=(a,b)=>!!a&&!!b&&Object.keys(a).every(k=>a[k]===b[k]||(k==="HV"&&JSON.stringify(a[k])===JSON.stringify(b[k])));   // HV: a new object of the same handoff
function push(s){NAVN++;if(window.CV&&CV.is(tab))return;s=s||snap();if(sameSnap(HIST[HIST.length-1],s))return;HIST.push(s);if(HIST.length>80)HIST.shift()}
window.navPush=push;
function popBack(){NAVN++;const x=HIST.pop();if(x){unsnap(x);render();scrollTo(0,0);if(tab==="more")rsInfo()}else if(tab!=="home"){tab="home";render();scrollTo(0,0)}}
window.navPop=popBack;
function goBack(){return window.CV&&CV.is(tab)?CV.back():popBack()}
if(tg&&tg.BackButton)tg.BackButton.onClick(()=>goBack());
const isRoot=()=>tab==="home"&&!HIST.length;
function navKey(t,pv){const base=x=>window.CV&&CV.is(x)?CV.navOf(x):x==="ep"||x==="chap"?"eps":x==="kl"?"dict":/^(reset|resetDone|restore|restoreDone)$/.test(x)?"more":x==="book"?"home":x;
 const ov=x=>x==="word"||x==="act"||x==="chat";
 if(!ov(t))return base(t);
 if(t==="word"&&pv&&!ov(pv))return base(pv);
 for(let i=HIST.length-1;i>=0;i--){const x=HIST[i].tab;if(!ov(x))return base(x)}return "home"}
let RTAB=null;   // PM #244: any change of the screen (also coins.js CV steps) arms the double-tap guard
function render(){if(tab==="book")tab="home";if(tab!==RTAB){NAVN++;RTAB=tab}if(tg&&tg.BackButton){isRoot()?tg.BackButton.hide():tg.BackButton.show()}$("#app").innerHTML=V[tab]?V[tab]():V.home();const nt=window.CV&&CV.is(tab)?CV.navOf(tab):navKey(tab,prev);$("#nav").innerHTML=NAV.map(([k,i,l])=>`<div class="${k===nt?"on":""}" onclick="navTab('${k}')"><span>${i}</span>${l}</div>`).join("")}
function nav(t,o){o=o||{};NAVN++;if(t==="home"||t==="book")HIST=[];else if(!o.replace&&t!==tab)push();tab=t;render();scrollTo(0,0);if(t==="more")rsInfo()}
function to(t,f){const b=snap();f&&f();if(sameSnap(b,{...snap(),tab:t}))return;push(b);nav(t,{replace:true})}   // a new screen whose own state is set first (the old one is on the stack); the same screen again = nothing (#368)
// #368: the second tap of a double tap must not land on the NEW screen (a different item under the finger): a click within
// 400 ms at the same spot after the screen changed (nav / back / push of an in-tab step / a new tab in render) is dropped,
// and every dropped one restarts the 400 ms (PM #244: triple taps). Separate taps elsewhere are never touched.
// PM #381: «⬅️ Назад» is never dropped — each press = one step, like Telegram's BackButton; it still arms the guard, so a
// FORWARD tap in the same spot right after it is dropped (the #368 case)
const isBackTap=e=>!!(e.target&&e.target.closest&&e.target.closest('.bk,[onclick^="goBack"],[onclick^="back("],[onclick^="tUp"],[onclick^="CV.back"]'));
document.addEventListener("click",e=>{const now=Date.now(),l=LASTC;
 if(isBackTap(e)){LASTC={t:now,x:e.clientX,y:e.clientY,n:NAVN};return}
 if(l&&now-l.t<400&&Math.abs(e.clientX-l.x)<24&&Math.abs(e.clientY-l.y)<24&&NAVN!==l.n){l.t=now;e.stopImmediatePropagation();e.preventDefault();return}   // PM #244: a dropped tap extends the window — a triple tap (200 ms apart) is dropped whole
 LASTC={t:now,x:e.clientX,y:e.clientY,n:NAVN}},true);
function openEp(id){to("ep",()=>{epId=id})} function openZone(k){nav("city");setTimeout(()=>{const el=document.getElementById("z-"+k);el&&el.scrollIntoView({behavior:"smooth"})},50)}
const SCREENS=["home","eps","city","dict","more","ep","word","kl","reset","restore"];   // #358: ?screen= only these, else «Главная»
async function boot(){const init=tg&&tg.initData;if(!init){$("#app").innerHTML='<div class="load">Открой приложение из бота @'+BOT+'</div>';return}
 try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:init})});if(!r.ok)throw new Error(r.status);D=await r.json();
 const st=new URLSearchParams(location.search).get("screen");if(st)tab=SCREENS.includes(st)?st:"home";if(tab==="book")tab="home";if(tab==="ep")epId=D.episodes[0]&&D.episodes[0].id;if(tab==="word"){tab="home";render();openWord((D.words.find(isDue)||D.words[0]||{}).user_word_id);return}if(tab==="kl"){tab="dict";return openKl()}render()}
 catch(e){console.error("memcity load failed:",e&&e.message||e);   // #369: details only in the console
  $("#app").innerHTML='<div class="load">Не получилось загрузить твой город — проверь интернет и попробуй ещё раз.<br><button class="btn" id="loadretry" onclick="bootRetry()">🔄 Попробовать ещё раз</button></div>'}}
function bootRetry(){$("#app").innerHTML='<div class="load">Загружаю твой город…</div>';boot()}
boot();

// The big word card of the old look (as in the 13.10 screenshot) is the default; v2 «грунд» card: ?card2=1 or window.MC_CARD_V2=true.
const CARD_V2=R23.card2||new URLSearchParams(location.search).get("card2")==="1"||window.MC_CARD_V2===true;
const DOTS={der:"🔵",die:"🔴",das:"🟢",verb:"🟡"};
function card2(w,k,col,p){const nm=(w.article?w.article+" ":"")+w.lemma,parts=String(w.syllables||w.lemma).split(/\s*[·‧-]\s*/).filter(Boolean),ss=Array.isArray(w.sounds)?w.sounds:[];
 const assoc=ss.length===parts.length?parts.map((x,i)=>`<div>${esc(x)} → ${qs(ss[i])}</div>`).join(""):esc(parts.join(" · "));
 const story=k==="verb"&&!isOwn(w)?`<span style="color:var(--gold)">${esc(MP.road(w.image||""))}</span>`:esc(MP.road(w.image||""));
 return `<div class="hero" style="padding:20px 18px"><div style="font-size:24px">${isOwn(w)?"🎒":DOTS[k]||"⚪"} <b style="color:${col}">${esc(nm)}</b></div>
<div style="margin-top:6px;font-size:18px">${esc(trOf(w))} · ${sounds(w)||"—"}</div></div>
<div class="card" style="margin-top:12px"><h3>🔤 Части и ассоциации</h3><div style="font-size:17px;line-height:1.6">${assoc}</div></div>
<div class="card"><h3 style="display:flex;justify-content:space-between">📍 ${esc(isOwn(w)?zname(k):artLbl(k))}${p.t?" — "+esc(p.t):""}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3></div>
<div class="card story"><h3>🎬 История</h3><p>${story||"История ещё не придумана."}</p></div>`}

// ---------- r25 (NordSturm 17.10): «Главы» деревом — 8 разделов → подглава (тема без уровня, бейджи A1/A2/B1) →
// [блоки «Части 1–3 · 4–6», если частей > 3] → части и слова. «⬅️ Назад» + строка пути на каждом уровне; Telegram BackButton
// = на уровень выше. Разделы — та же таблица, что в боте (chapters.js из core/sections.py). Данные — тот же payload (topic
// истории = название главы), новых запросов нет. Без бейджа срока и красных точек; r25b: без 🔥 в «Главах» (PM #171 UX 5).
const TR=window.MCTree||{sections:[{k:"base",e:"🧩",n:"Основа",c:"#f5c542"}],catalog:[],big:3,block:3,sectionOf:()=>"base"};
let tSec=null,tSub=null,tBlk=null,tOpen=null,tList=[];
const subTitle=e=>String(e.topic||"").trim()||"Мои главы";
const shade=c=>{const n=parseInt(c.slice(1),16),f=x=>Math.round(x*.62).toString(16).padStart(2,"0");return "#"+f(n>>16)+f((n>>8)&255)+f(n&255)};
const words_=n=>`${n} ${plr(n,"слово","слова","слов")}`, parts_=n=>`${n} ${plr(n,"часть","части","частей")}`;
function tree(){const subs=new Map();
 TR.catalog.forEach(c=>subs.set(c.t,{t:c.t,e:c.e,sec:c.sec,lv:c.lv||[],n:c.n,eps:[]}));
 (D.episodes||[]).forEach(e=>{const t=subTitle(e);let x=subs.get(t);if(!x){x={t,e:"📘",sec:TR.sectionOf(t,false),lv:[],n:0,eps:[]};subs.set(t,x)}x.eps.push(e)});
 subs.forEach(x=>{x.eps.sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")));x.words=x.eps.reduce((a,e)=>a+e.words.length,0);x.due=x.eps.reduce((a,e)=>a+e.words.filter(isDue).length,0)});
 const all=[...subs.values()];
 return TR.sections.map(s=>({...s,subs:all.filter(x=>x.sec===s.k).sort((a,b)=>(a.eps.length?0:1)-(b.eps.length?0:1))}))}
const bk=()=>`<div class="bk" onclick="tUp()">⬅️ Назад</div>`;
function tGo(k){push();tSec=k;tSub=null;tBlk=null;tOpen=null;render();scrollTo(0,0)}
function tPick(i){const x=tList[i];if(!x)return;push();tSub=x.t;tBlk=null;tOpen=null;render();scrollTo(0,0)}
function tUp(){goBack()}
function tB(b){tBlk=b;tOpen=null;render()} function tP(id){tOpen=tOpen===id?"":id;render()}
function navTab(k){if(k==="eps"&&tab==="eps"){tSec=null;tSub=null;tBlk=null;tOpen=null}
 // a bottom tab is a root over «Главная»; «Главы» kept on a tree level gets its levels under it (Назад = one level up)
 HIST=[];if(k!=="home"){HIST.push({...snap(),tab:"home"});if(k==="eps"&&tSec){HIST.push({...snap(),tab:"eps",tSec:null,tSub:null,tBlk:null,tOpen:null});if(tSub)HIST.push({...snap(),tab:"eps",tSub:null,tBlk:null,tOpen:null})}}
 nav(k,{replace:true})}
const partName=(e,sub)=>{let t=tt(e.title||"").replace(/^\s*часть\s*\d+\s*·\s*/i,"").replace(/\s*·\s*часть\s*\d+\s*$/i,"").replace(/^«(.+)»$/,"$1").trim();return t===sub||/^Глава\b/.test(t)?"":t};
V.eps=function(){const S=tree();
 if(tSec&&tSub){const s=S.find(x=>x.k===tSec),x=s&&s.subs.find(y=>y.t===tSub);if(x)return vSub(s,x);tSub=null}
 if(tSec){const s=S.find(x=>x.k===tSec);if(s)return vSec(s);tSec=null}
 const nx=D.next,tot=D.words.length;   // r25b (PM #171 UX 5): «Главы» = a book, no 🔥 streak
 return `<div class="top"><div class="ttl" style="margin:0">Мои главы</div>${verLabel()}</div><div class="sub" style="margin:-8px 0 16px">${S.length} разделов · ${words_(tot)}</div>
${nx?`<div class="streakline">📖 Читаешь «${esc(nx.title)}»${nx.n?", часть "+nx.n:""}</div>`:""}
${S.map(s=>{const w=s.subs.reduce((a,x)=>a+x.words,0),dn=s.subs.reduce((a,x)=>a+x.due,0),on=s.subs.some(x=>x.eps.length);
 return `<div class="sec ${s.k==="base"?"dark":""}" style="background:linear-gradient(135deg,${s.c},${shade(s.c)})" onclick="tGo('${s.k}')"><div class="em">${s.e}</div><div class="t"><b>${esc(s.n)}</b><small>${s.subs.slice(0,3).map(x=>esc(x.t)).join(" · ")}</small><span class="pill">${s.subs.length} ${plr(s.subs.length,"подглава","подглавы","подглав")}</span>${w?`<span class="pill">${words_(w)}</span>`:on?"":`<span class="pill">ещё не начато</span>`}${dn?`<span class="pill">🔁 ${dn} повторить</span>`:""}</div><div class="chev">›</div></div>`}).join("")}`};
function vSec(s){tList=s.subs;const w=s.subs.reduce((a,x)=>a+x.words,0),dn=s.subs.reduce((a,x)=>a+x.due,0);
 return `${bk()}<div class="crumb">Главы ›</div><div class="ttl">${s.e} ${esc(s.n)}</div><div class="sub">${s.subs.length} ${plr(s.subs.length,"подглава","подглавы","подглав")}${w?" · "+words_(w):""}${dn?" · 🔁 "+dn+" повторить":""}</div>
${s.subs.map((x,i)=>{const k=x.eps.length,pct=x.n?Math.min(100,Math.round(100*x.words/x.n)):k?100:0;
 return `<div class="sub2 ${k?"":"idle"}" style="--c:${s.c}" onclick="tPick(${i})"><div class="no">${x.e}</div><div class="t"><b>${esc(x.t)}</b><small>${k?`${parts_(k)} · ${words_(x.words)}${x.due?" · 🔁 "+x.due+" повторить":""}`:`ещё не начато${x.n?" · "+words_(x.n)+" в теме":""}`}</small>${x.lv.map(l=>`<span class="lv">${l}</span>`).join("")}<div class="bar2"><i style="width:${pct}%"></i></div></div><div class="chev">›</div></div>`}).join("")||`<div class="empty">Здесь пока нет глав.</div>`}`}
function partCard(e,i,cur,sub){const open=tOpen===e.id||(tOpen===null&&cur),dn=e.words.filter(isDue).length,nm=partName(e,sub);
 return `<div class="part ${cur?"cur":""}"><div class="h" onclick="tP('${e.id}')"><div><b>Часть ${i}${nm?" · "+esc(nm):""}</b><small style="display:block">${words_(e.words.length)}${dn?" · 🔁 "+dn+" повторить":""}</small></div><span class="st2 ${cur?"r":""}">${cur?"▶️ читаешь":"✅ прочитано"}</span></div>
${open?`<div class="wds">${e.words.map(w=>`<div class="wd" onclick="openWord('${w.user_word_id}')">${isOwn(w)?`<span class="art own">своё</span>`:`<span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span>`}<div class="t"><b class="${w.pos==="verb"&&!isOwn(w)?"gold":""}">${esc(w.syllables||w.lemma)}</b><small>${esc(trOf(w))}${sounds(w)?" · "+sounds(w):""}</small></div></div>`).join("")}
${cur?`<button class="btn" onclick="go('next')">▶️ Читать дальше</button>`:""}<a class="link" onclick="openEp('${e.id}')">📖 Открыть текст части</a></div>`:""}</div>`}
function vSub(s,x){const ps=x.eps,last=ps.length-1,B=TR.block||3,nb=Math.ceil(ps.length/B),cb=Math.floor(Math.max(0,last)/B);
 const head=`${bk()}<div class="crumb">Главы › ${esc(s.n)} ›</div><div class="ttl">${x.e} ${esc(x.t)}</div><div class="sub">${ps.length?parts_(ps.length)+" · "+words_(x.words)+` · 📖 читаешь часть ${ps.length}`:"ещё не начато"+(x.n?" · "+words_(x.n)+" в теме":"")}${x.lv.length?" · "+x.lv.join(" "):""}</div>`;
 if(!ps.length)return head+(BOOKERR&&!window.MCBook?bookErr():`<div class="card promo" onclick="openSubCh()"><div class="e">📖</div><div><b>Начни эту главу</b><p>Отметь знакомые слова — остальные поселятся в твоём городе и оживут в истории</p></div></div><button class="btn" onclick="openSubCh()">▶️ Начать главу</button>`+lvRow(x.t));   // #238: on a book.js error only the error + 🔄 (no «▶️ Начать главу» above it)
 if(ps.length<=(TR.big||3))return head+ps.map((e,i)=>partCard(e,i+1,i===last,x.t)).join("")+lvRow(x.t);
 const ob=tBlk===null?cb:tBlk;let h=head;
 for(let b=0;b<nb;b++){const a=b*B,z=Math.min(ps.length,a+B),lab=a+1===z?`Часть ${z}`:`Части ${a+1}–${z}`;
  h+=b===ob?`<div class="grp">${lab}</div>`+ps.slice(a,z).map((e,j)=>partCard(e,a+j+1,a+j===last,x.t)).join(""):`<div class="part blk" onclick="tB(${b})"><div class="h"><b>${lab}</b><span class="chev">›</span></div></div>`}
 return h+lvRow(x.t)}
// ---------- r25 «🔄 Полный сброс» (NordSturm 17.10): предупреждение → вписать «OK» (регистр неважен) → edge op "reset"
// (initData проверяется на сервере; стирается только аккаунт этого initData; бэкап 30 дней; двойное нажатие — один сброс).
// 14:24: стирается всё, вкл. ассоциации; единственный выбор — свои списки «Мои слова / профессия»: op "reset_info" → N;
// N > 0 → «У тебя есть свои слова (N). Удалить их тоже?» [Оставить мои слова] (по умолчанию) / [Удалить и мои слова].
// r25b (PM #171): Cyrillic «ОК» = OK (as the bot and the edge); «↩️ Вернуть мой город» 30 days (op reset_info.restore →
// item in «Ещё» + on the done screen → confirmation → op "restore"); after the reset the old place names / name are gone.
let RS={busy:false,msg:"",n:0,keep:true,kept:false,restore:null,info:false};
const okTxt=v=>/^[oOоО][kKкК][.!]*$/.test(String(v||"").trim());
const rsDate=v=>{const d=new Date(v||"");return isNaN(d)?"":d.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"})};
async function rsInfo(force){if(RS.info&&!force)return;RS.info=true;let r={};try{r=await api({op:"reset_info"})}catch(e){r={}}
 const was=!!RS.restore;RS.restore=r&&r.restore&&r.restore.expires_at?r.restore:null;
 if(r&&typeof r.own_words==="number")RS.n=Math.max(0,Math.floor(r.own_words));
 if(was!==!!RS.restore&&(tab==="more"||tab==="resetDone"))render();return r}
function rsRender(){const i=$("#rsok"),v=i?i.value:"";render();const j=$("#rsok");if(j&&v){j.value=v;rsChk()}}
async function rsOpen(){RS={...RS,busy:false,msg:"",n:0,keep:true,kept:false};nav("reset");
 const r=await rsInfo(true)||{};
 const n=r&&typeof r.own_words==="number"?Math.max(0,Math.floor(r.own_words)):0;   // old edge / error → no question
 if(n&&tab==="reset"&&!RS.busy){RS.n=n;rsRender()}}
function rsKeep(k){if(RS.busy)return;RS.keep=!!k;rsRender()}
function rsChk(){const b=$("#rsb");if(b)b.disabled=RS.busy||!okTxt(($("#rsok")||{}).value)}
async function doReset(){const v=($("#rsok")||{}).value;if(RS.busy||!okTxt(v))return;RS.busy=true;const b=$("#rsb");if(b){b.disabled=true;b.textContent="Стираю…"}
 const keep=RS.n?RS.keep:true;
 let r={};try{r=await api({op:"reset",confirm:String(v).trim(),keep_own:keep})}catch(e){r={error:"server"}}
 if(r&&r.ok){RS.kept=keep&&RS.n>0&&r.kept_own!==false;
  // PM #171 Б7: nothing of the old city stays on screen — places, place names, name, plan, «знаю»
  D={...D,words:[],episodes:[],zones:[],next:null,city:"",name:"",place_names:{},place_names_v:"",kl:null,stats:{words:0,due:0,learned:0,streak:0},reset:true};
  tSec=tSub=null;nav("resetDone",{replace:true});rsInfo(true);return}
 RS.busy=false;RS.msg="Не получилось — ничего не стёрто. Попробуй ещё раз.";rsRender()}
V.reset=function(){return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">🔄 Полный сброс</div><div class="sub">стереть всё и начать заново</div>
<div class="card warn"><b>⚠️ Будут стёрты:</b><ul><li>город и все места</li><li>образы, ассоциации и все истории</li><li>словарь и прогресс повторений</li></ul><p>Останутся: уровень, напоминание, часовой пояс${D&&D.coins?", монетки":""}.</p><p>Потом — новая анкета и новый город.</p><p class="mut">↩️ Передумаешь — 30 дней можно вернуть всё: «↩️ Вернуть мой город» в «Ещё».</p></div>
${RS.n?`<div class="card rsown"><b>📝 У тебя есть свои слова (${RS.n}). Удалить их тоже?</b><div class="seg"><a id="rskeep" class="${RS.keep?"on":""}" onclick="rsKeep(true)">${RS.keep?"✅ ":""}Оставить мои слова</a><a id="rsdrop" class="${RS.keep?"":"on"}" onclick="rsKeep(false)">${RS.keep?"":"✅ "}Удалить и мои слова</a></div><p class="mut">Их ассоциации и истории сотрутся в любом случае — если оставишь, истории к ним создадутся заново.</p></div>`:""}
<div class="card"><label for="rsok">Чтобы подтвердить, впиши <b>OK</b> (можно «ОК» по-русски)</label><input id="rsok" class="srch rsin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="OK" oninput="rsChk()">
<button id="rsb" class="btn danger" disabled onclick="doReset()">🔄 Стереть всё и начать заново</button>${RS.msg?`<p class="rsmsg">${esc(RS.msg)}</p>`:""}</div>
<a class="link" onclick="goBack()">Отмена — ничего не стирать</a>`};
V.resetDone=function(){return `<div class="empty rsdone"><div style="font-size:48px">🧹</div><b>Готово — всё стёрто</b><p>Копия хранится 30 дней${RS.restore?" — до "+esc(rsDate(RS.restore.expires_at)):""}.</p>${RS.kept?`<p>📝 Твои слова (${RS.n}) остались — истории к ним создадутся заново в новом городе.</p>`:""}<p>Теперь новая анкета и новый город — ${ACT_ON()?"бот задаст вопросы прямо здесь":"продолжим в боте"}.</p><button class="btn" onclick="go('new')">▶️ Начать анкету</button>${RS.restore?`<a class="link" id="rsback2" onclick="rrOpen()">↩️ Вернуть мой город</a>`:""}</div>`};
// PM #171 Б7 / UX 6: after the reset «Главная» and «Город» say honestly that the city comes after the questionnaire
function rsEmpty(){return `<div class="top"><b style="font-size:24px">Новый старт</b>${verLabel()}</div><div class="empty rsdone"><div style="font-size:48px">🏗</div><b>Город появится после анкеты</b><p>${ACT_ON()?"Ответь на вопросы бота":"Ответь в боте на вопросы"} — и слова поселятся в новом городе.</p><button class="btn" onclick="go('new')">▶️ Начать анкету</button>${RS.restore?`<a class="link" onclick="rrOpen()">↩️ Вернуть мой город</a>`:""}</div>`}
// ---------- r25b #290 «↩️ Вернуть мой город»: confirmation → op "restore" → the payload is loaded again ----------
let RR={busy:false,msg:""};
function rrOpen(){RR={busy:false,msg:""};nav("restore",{replace:tab==="restore"})}
async function doRestore(){if(RR.busy)return;RR.busy=true;const b=$("#rrb");if(b){b.disabled=true;b.textContent="Возвращаю…"}
 let r={};try{r=await api({op:"restore",confirm:true})}catch(e){r={error:"server"}}
 if(r&&r.ok){try{const p=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:tg&&tg.initData})});if(p.ok)D=await p.json()}catch(e){}
  RS.restore=null;RS.info=false;tSec=tSub=null;nav("restoreDone",{replace:true});return}
 RR.busy=false;RR.msg=r&&r.error==="no_backup"?"Копии для возврата нет — она хранится 30 дней после сброса.":"Не получилось — ничего не изменилось. Попробуй ещё раз.";render()}
V.restore=function(){const x=RS.restore||{};return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">↩️ Вернуть мой город?</div><div class="sub">как было до сброса${x.created_at?" "+esc(rsDate(x.created_at)):""}</div>
<div class="card"><b>Вернётся всё:</b><ul><li>город и все места</li><li>образы, ассоциации и все истории</li><li>словарь и прогресс повторений</li></ul><p>То, что ты сделал после сброса (новая анкета, новый город, новые истории), заменится старым городом.</p>${x.expires_at?`<p class="mut">Копия хранится до ${esc(rsDate(x.expires_at))}.</p>`:""}</div>
<button id="rrb" class="btn" onclick="doRestore()">✅ Да, вернуть мой город</button>${RR.msg?`<p class="rsmsg">${esc(RR.msg)}</p>`:""}
<a class="link" onclick="goBack()">Нет, оставить как есть</a>`};
V.restoreDone=function(){return `<div class="empty rsdone"><div style="font-size:48px">↩️</div><b>Твой город вернулся</b><p>Места, истории, словарь и прогресс — такие, как были до сброса.</p><button class="btn" onclick="nav('home')">🏠 На главную</button></div>`};
// ---------- miniapp-inapp-nav (NordSturm 19.10 22:56 / 23:01): topics, the current chapter and the chat handoff — in the app ----------
// Topics = the bot's chapters (book.js, GENERATED from core/chapters + core/checklist.plan — the same words and order as the
// bot; loaded only when a topic screen opens). «знаю / учим» = the bot's registry memcity.word_skips (edge ops known / skip /
// unskip, signed initData). Writing a part stays in the bot (the model, 1–2 min, progress in the chat) → an explicit button.
// #354: ?v of THIS script (index.html, set by bump_version.sh) — never another script that only contains «app.js» (telegram-web-app.js)
const STAMP=(()=>{try{const me=document.currentScript||[...document.scripts].find(s=>{try{return /\/app\.js$/.test(new URL(s.src,location.href).pathname)}catch(e){return false}});
 return new URL(me.src,location.href).searchParams.get("v")||APP_VERSION}catch(e){return APP_VERSION}})();
let BOOKP=null,BOOKERR=false,BOOKN=0;
// #367 (Tester): a book.js that loads but is broken (200 + syntax error / throw / an HTML page) = the same error as no network:
// the promise and the <script> are dropped, so «🔄 Попробовать ещё раз» makes a NEW request (cache-bust &r=N on a retry)
function loadBook(){if(window.MCBook)return Promise.resolve(window.MCBook);
 if(!BOOKP)BOOKP=new Promise(res=>{const el=document.createElement("script");el.src="book.js?v="+encodeURIComponent(STAMP)+(BOOKN?"&r="+BOOKN:"");
  const fail=()=>{BOOKP=null;BOOKERR=true;BOOKN++;el.remove();res(null)};
  el.onload=()=>{if(!window.MCBook)return fail();BOOKERR=false;res(window.MCBook)};el.onerror=fail;document.head.appendChild(el)});return BOOKP}
// #355: bad network → say so where the words should be, with a retry (never a wrong «Свои главы» / chat screen)
const bookErr=()=>`<div class="card bkerr"><p style="margin:0">⚠️ Не получилось загрузить слова главы — проверь сеть</p><button class="btn" id="bookretry" onclick="bookRetry()">🔄 Попробовать ещё раз</button></div>`;
function bookRetry(){BOOKERR=false;render();loadBook().then(()=>render())}   // render() after a failure shows the error (BOOKERR) — never a loop
const bookCh=id=>window.MCBook?(window.MCBook.chapters.find(c=>c.id===id)||null):null;
const subChs=t=>window.MCBook?window.MCBook.chapters.filter(c=>c.s===t):[];
// the lemma rule of the bot / edge (core/chapters.word_key, edge cleanLemma + wkey): one word = article|lemma
const cLem=l=>{let t=String(l||"").replace(/^\s*(?:\d+[.)]?|[•\-–*])\s+(?=\D)/,"").trim();const m=t.match(/^[А-Яа-яЁё\s,]+\s+([A-Za-zÄÖÜäöüß].*)$/);return m?m[1].trim():t};
const wkeyOf=(a,l)=>String(a||"").toLowerCase()+"|"+cLem(l).toLowerCase();
let KN=null,KNP=null,BCMSG="",CHP=null;   // CHP {c,p}: parts of chapter c written so far (PM hq #304, #426: go_<cid>_<p>)
function loadKnown(force,cid){if(KN&&!force)return Promise.resolve(KN);
 if(!KNP)KNP=api(cid?{op:"known",chapter_id:cid}:{op:"known"}).then(r=>{if(cid)CHP=r&&r.chapter_id===cid&&Number.isInteger(r.p)?{c:cid,p:r.p}:null;
  return KN=r&&Array.isArray(r.ids)?{ok:true,ids:new Set(r.ids),keys:new Set(r.keys||[])}:{ok:false,ids:new Set(),keys:new Set()}})
  .catch(()=>KN={ok:false,ids:new Set(),keys:new Set()}).then(k=>{KNP=null;return k});return KNP}
// QA #207 / core/chapters.word_state: «done» (in a story: id or lemma) → «known» (☑ знаю, the lemma rule) → «fresh»
let WS0=null;const placedOf=()=>{if(!WS0||WS0.d!==D.words)WS0={d:D.words,ids:new Set(D.words.map(x=>x.word_id)),lem:new Set(D.words.map(x=>cLem(x.lemma).toLowerCase()))};return WS0};
function wst(w){const {ids,lem}=placedOf();
 if(ids.has(w[0])||lem.has(cLem(w[2]).toLowerCase()))return "done";if(KN&&(KN.ids.has(w[0])||KN.keys.has(wkeyOf(w[1],w[2]))))return "known";return "fresh"}
function chProg(c){const r={done:0,known:0,fresh:0};c.w.forEach(w=>r[wst(w)]++);return r}
const lastEp=()=>(D.episodes||[]).slice().sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||""))).pop()||null;
const secOfSub=t=>{const c=(TR.catalog||[]).find(x=>x.t===t);return c?c.sec:TR.sectionOf(t,false)};
// «🎒 Наборы тем» / «Новая глава» / «Начни первую главу» → the topics of the book = the tree «Главы» (sections → topics)
function openTopics(){to("eps",()=>{tSec=null;tSub=null;tBlk=null;tOpen=null});loadBook()}
// «Сейчас читаешь · Глава …» → that chapter's topic in «Главы» (its parts, the current one open, «▶️ Читать дальше»)
async function openCur(){const n=D.next||{};await loadBook();const c=n.cid?bookCh(n.cid):null;let sub=c?c.s:"";
 if(!sub&&n.title){const t=String(n.title).split(" · ")[0].trim();if((TR.catalog||[]).some(x=>x.t===t))sub=t}   // #355: no book.js → the topic of D.next
 if(!sub&&!n.cid){const e=lastEp();sub=e?subTitle(e):""}                                                          // only without D.next: the last part
 if(!sub)return go("next");
 to("eps",()=>{tSec=c?c.sec:secOfSub(sub);tSub=sub;tBlk=null;tOpen=null})}
// a topic → its chapter to start: the learner's level first, then any with fresh words (= TreeUX.current_chapter)
async function openSubCh(){const t=tSub;const bk=await loadBook();if(!bk){BOOKERR=true;return render()}const cs=subChs(t);if(!cs.length)return ACT_ON()?act("🎒 Свои главы","topic"):chat("topics","topic");
 await loadKnown();const open=cs.filter(c=>chProg(c).fresh>0);openCh((open.find(c=>c.lv===D.level)||open[0]||cs[0]).id)}
function openCh(id){to("chap",()=>{BCID=id;BCMSG="";CHP=null});loadKnown(true,id).then(()=>{if(tab==="chap")render()})}
function lvRow(t){const cs=subChs(t);if(!window.MCBook){if(BOOKERR)return bookErr();loadBook().then(b=>{if((b||BOOKERR)&&tab==="eps"&&tSub===t)render()});return ""}   // #367: never re-render on a null without the error flag
 if(!cs.length)return "";const ks=cs.map(c=>c.lv+"|"+c.p),many=new Set(ks).size<ks.length;
 return `<div class="grp">Слова главы</div><div class="seg lvrow">${cs.map(c=>`<span class="chip" onclick="openCh('${c.id}')">${esc(c.lv)}${c.ps>1?" ч."+c.p:""}${many&&c.ft!==t?" · "+esc(c.ft):""} · слова</span>`).join("")}</div>`}
const chRow=(w,st)=>{const vb=w[3]==="verb"&&!w[1],nm=(w[1]?w[1]+" ":"")+w[2];
 return st==="done"?`<div class="kl done" style="cursor:default;opacity:.6"><div class="t"><strong class="${vb?"v":""}">${vb?"🟡 ":""}${esc(nm)}</strong><small>${esc(w[4])} · ✅ в истории</small></div><span class="cb">✓</span></div>`
  :`<div class="kl ${st==="known"?"on":""}" onclick="chT('${w[0]}')"><div class="t"><strong class="${vb?"v":""}">${vb?"🟡 ":""}${esc(nm)}</strong><small>${esc(w[4])}${st==="known"?" · знаю":""}</small></div><span class="cb">${st==="known"?"✓":""}</span></div>`};
V.chap=function(){const c=bookCh(BCID);if(!c)return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="empty">Глава не найдена.</div>`;
 const sec=(TR.sections.find(x=>x.k===c.sec)||{}).n||"",pr=chProg(c),started=(D.episodes||[]).some(e=>subTitle(e)===c.s);
 return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="crumb">Главы › ${esc(sec)} › ${esc(c.s)} ›</div><div class="ttl">${c.e} ${esc(c.ft)}</div>
<div class="sub">${esc(c.lv)} · ${pr.done+pr.known} из ${words_(c.w.length)}${pr.done?" · ✅ в истории "+pr.done:""}${pr.known?" · знаю "+pr.known:""}</div>
<div class="sub" style="margin:10px 4px">Отметь, что уже знаешь — эти слова мы пропустим. Остальные оживут в истории.</div>
${!KN?`<div class="sub" style="margin:0 4px 8px">Загружаю твои отметки…</div>`:KN.ok?"":`<div class="sub" style="margin:0 4px 8px">⚠️ Отметки «знаю» не загрузились — открой главу ещё раз</div>`}
<div class="card" style="padding:0 16px">${c.w.map(w=>chRow(w,wst(w))).join("")}</div>
<div class="sub" style="margin:6px 4px 0">${pr.known?`Знаю: ${pr.known} · учим: ${pr.fresh}`:"Пока всё учим"}</div>
${BCMSG?`<div class="toast">${esc(BCMSG)}</div>`:""}
${pr.fresh?`<a class="main stick" id="chgo" onclick="go('go_${c.id}${CHP&&CHP.c===c.id?"_"+CHP.p:""}')">▶️ ${started?"Читать дальше":"Начать главу"}</a>`:`<div class="empty">✅ Все слова этой главы уже в историях или отмечены «знаю»</div>`}`};
async function chT(id){const c=bookCh(BCID),w=c&&c.w.find(x=>x[0]===id);if(!w||!KN||wst(w)==="done")return;
 const k=wkeyOf(w[1],w[2]),on=wst(w)!=="known",set=v=>{if(v){KN.ids.add(id);KN.keys.add(k)}else{KN.ids.delete(id);KN.keys.delete(k)}};
 set(on);render();try{tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("light")}catch(e){}
 const cid=BCID;wq(id,on,()=>api({op:on?"skip":"unskip",word_id:id,chapter_id:cid}),(v,r)=>{set(v);BCMSG=r.message||"Не получилось сохранить — попробуй ещё раз";render();setTimeout(()=>{BCMSG="";if(tab==="chap")render()},2600)})}
// ---------- the handoff (3.7.0), used while the bot does not take app requests (payload app_actions false — PM #359 #362/#364):
// what only the bot does → a screen here + ONE explicit «💬 … в чате» (never a silent jump) ----------
const HO={next:["▶️ Следующая часть","Новую часть пишет бот в чате — там видно, как она складывается, это 1–2 минуты. Готовая часть сразу появится здесь, в «Главах».","💬 Открыть в чате"],
 start:["▶️ Начать главу","Отметки «знаю» уже сохранены. Часть главы напишет бот в чате — это 1–2 минуты. Готовая часть появится здесь, в «Главах».","💬 Начать в чате"],
 review:["🔁 Повторение","Проверка с ответом идёт в чате: бот показывает слово, ты вспоминаешь — и ответ двигает следующее повторение. Здесь можно спокойно пролистать карточки.","💬 Повторить в чате"],
 check:["🧠 Проверить себя","Проверка по этой части идёт в чате: бот спрашивает слова из истории.","💬 Открыть в чате"],
 rw:["✏️ Переписать часть","Переписать часть можно в чате: бот спросит «Переписать эту часть?» — текущий текст заменится новым, слова останутся те же.","💬 Открыть в чате"],   // #391
 tts:["🔊 Озвучить","Озвучка части приходит в чат голосовым сообщением.","💬 Открыть в чате"],
 st:["📖 Часть в чате","Эта часть откроется в чате бота.","💬 Открыть в чате"],
 city:["✏️ Добавить или поправить детали","Места правятся в чате: бот спросит, что поменять, и сам пересчитает названия. Слова и истории останутся.","💬 Открыть в чате"],
 topics:["🎒 Свои главы","Свои и профессиональные главы пока открываются в чате.","💬 Открыть в чате"],
 mywords:["🎒 Свои слова и профессии","Свои слова и профессиональные наборы сейчас открываются в чате: там их добавляешь и сразу пишешь из них историю.","💬 Открыть в чате"],
 new:["📝 Анкета","Вопросы анкеты после сброса бот задаёт в чате: ответишь там — и город появится здесь.","💬 Начать анкету в чате"],   // Tester #390
 other:["💬 В чате","Это делает бот в чате.","💬 Открыть в чате"]};
function chat(k,p){to("chat",()=>{HV={k:HO[k]?k:"other",p:String(p||"")}})}
function revCards(){const due=D.words.filter(isDue);if(!due.length)return;to("word",()=>{prev=tab;wl=due;wi=0})}
V.chat=function(){const k=HV&&HO[HV.k]?HV.k:"other",h=HO[k];let ctx="",alt="";
 if(k==="next"&&D.next)ctx="📖 "+nxTitle();
 if(k==="start"){const c=bookCh(HV.p.slice(3));if(c)ctx=`${c.e} ${c.ft} · ${c.lv}`;else if(D.next&&D.next.cid===HV.p.slice(3))ctx="📖 "+nxTitle()}
 if(k==="next"){const e=lastEp();if(e)alt=`<a class="link" id="chalt" onclick="openEp('${e.id}')">📖 Перечитать последнюю часть</a>`}
 if(k==="review"){const n=D.words.filter(isDue).length;if(n){ctx=`🔁 ${n} ${plr(n,"слово","слова","слов")} к повторению`;alt=`<a class="link" id="chalt" onclick="revCards()">🃏 Пролистать карточки здесь</a>`}}
 return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">${h[0]}</div>${ctx?`<div class="sub">${esc(ctx)}</div>`:""}<div class="card" style="margin-top:12px"><p style="margin:0">${h[1]}</p></div>
<button class="btn" id="tochat" onclick="toChat(HV.p)">${h[2]}</button>${alt}`};
