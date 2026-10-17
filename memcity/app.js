const API="https://wbrpcvbpipeejdnsymdz.supabase.co/functions/v1/memcity-app", BOT="fixDeutsch_bot";
const tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0b0b0f");tg.setBackgroundColor("#0b0b0f")}catch(e){}}
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// oldlook (NordSturm 17.10): the look of 924d475 (#134) back — dark cards, colour tiles per place, 5 tabs, the big word card —
// with the r23 data on top: human place names (placename.js), the gender zone label, no technical zone codes, bold story words.
// oldlook: r23 extras over the old look are switches, so the PM can keep or drop each one. Override: ?r23=-status,card2 (a «+» in a URL is a space, so «on» = the bare name)
// or window.MC_R23={card2:true}. Always on (not switches): human place names, gender zone label, no technical zone codes, no names in the URL.
const R23=(()=>{const f={status:false,readnext:true,kl:true,map:true,nextpart:true,card2:false,boldsnd:true,legend:true};
 try{Object.assign(f,window.MC_R23||{})}catch(e){}
 String(new URLSearchParams(location.search).get("r23")||"").split(",").forEach(t=>{t=t.trim();if(/^[+-]?\w+$/.test(t))f[t.replace(/^[+-]/,"")]=t[0]!=="-"});return f})();
let D=null, wl=[], wi=0, prev="home", tab="home", epId=null, q="", homeTab="zones";
const ZK={der:["🔵","der","#2d6cff,#1a3d99"],die:["🔴","die","#ff5d8a,#a3244c"],das:["🟢","das","#22c58b,#0e7a55"],verb:["🟡","глаголы","#f5c542,#b07d00"]};
const kindOf=w=>w.pos==="verb"?"verb":(w.article||w.zone_kind||"das");
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
const go=p=>{ if(tg&&tg.openTelegramLink){tg.openTelegramLink(`https://t.me/${BOT}?start=${p}`);setTimeout(()=>tg.close(),300)} else location.href=`https://t.me/${BOT}?start=${p}` };
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
const word=w=>`<div class="w" onclick="openWord('${w.user_word_id}')"><span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span><div class="t"><b>${esc(w.syllables||w.lemma)}</b><small><span class="tr">${esc(w.translation)}</span>${sounds(w)?" · "+sounds(w):""}${" · 📍 "+esc(ptxt(w))}</small></div>${stl(w)}</div>`;
function tt(t){return String(t||"").replace(/^\s*\u0421\u0435\u0440\u0438\u044f\s+(\d+):\s*(.+)$/i,"«$2» · часть $1")}
function nounGold(s,ws){/* r22d #178: 🟡 = verbs only */const nn=new Set((ws||[]).filter(w=>w.article).map(w=>String(w.lemma||"").toLowerCase()));return String(s||"").replace(/🟡\s?(\*\*([^*]+)\*\*|[^\s.,!?;:]+)/g,(m,t,b)=>{const k=(b||t).replace(/^(der|die|das|den|dem|des)\s+/i,"").toLowerCase();return nn.has(k)?t:m})}
function md(s,ws){s=MP.noPlan(s);s=MP.road(s);if(MP.keyLegend)s=MP.keyLegend(s,znames()).replace(/^(Места: .*)$/mu,m=>m.replace(/🟡/gu,"\uE000"));return boldAssoc(esc(nounGold(s,ws)),ws).replace(/🟡\s?\*\*(.+?)\*\*/g,"<b class=\"v\">$1</b>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/🟡\s?([^\s.,!?;:]+)/g,"<b class=\"v\">$1</b>").split(/\n{2,}/).map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("").replace(/\uE000/g,"🟡")}
// r23: sound-alikes («баня», «хохот») bold inside the chapter text — any Russian ending (stem match).
function boldAssoc(h,ws){const st=new Set();(ws||[]).forEach(w=>sparts(w.sounds).forEach(x=>x.split(/\s+/).forEach(t=>{t=t.toLowerCase().replace(/[^а-яё]/g,"");if(t.length>=3)st.add(t.length>=4?t.slice(0,t.length-1):t)})));
 if(!st.size)return h;const rx=new RegExp("(^|[^А-Яа-яЁё>])(("+[...st].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")[а-яё]{0,3})(?![А-Яа-яЁё])","gi");
 return h.split(/(<[^>]+>)/).map(p=>p.startsWith("<")?p:p.replace(rx,"$1<b>$2</b>")).join("")}
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
book(){const s=D.stats,due=D.words.filter(isDue);return `<div class="top"><div class="av">${esc((D.name||"?")[0])}</div><div class="chip" onclick="go('city')" title="Изменить город">📍 ${esc(D.city)} · ${esc(D.level)} ✏️</div><div></div></div>
<div class="hero"><small>Слов в твоём городе</small><div class="big">${s.words} <span>${plr(s.words,"слово","слова","слов")}</span></div><div class="stats"><div class="st"><b>${s.due}</b><i>🔁 к повторению</i></div><div class="st"><b>${s.streak} 🔥</b><i>дней подряд</i></div><div class="st"><b>${s.learned}</b><i>✅ выучено</i></div></div></div>
<div class="acts">${R23.readnext?`<div class="a p" onclick="go('next')"><div>▶️</div>Читать дальше</div>`:`<div class="a p" onclick="go('topic')"><div>▶️</div>Новая глава</div>`}<div class="a" onclick="go('review')"><div>🔁</div>Повторить</div><div class="a" onclick="nav('eps')"><div>📚</div>Мои главы</div><div class="a" onclick="nav('dict')"><div>📖</div>Словарь</div></div>
${R23.readnext&&D.next?`<div class="card nx" onclick="go('next')"><small>Сейчас читаешь</small><b>📖 ${esc(nxTitle())}</b></div>`:""}
${due.length?`<div class="card"><h3 class="rvh" onclick="go('review')">🔁 Повторить: ${due.length} ${plr(due.length,"слово","слова","слов")}<span>›</span></h3>${due.slice(0,4).map(word).join("")}<button class="btn" onclick="${due[0].story_id?`openEp('${due[0].story_id}')`:"go('review')"}">📖 Перечитать главу и проверить себя</button></div>`:D.words.length?`<div class="card promo"><div class="e">✨</div><div><b>На сегодня всё повторено</b><p>Самое время читать дальше</p></div></div>`:`<div class="card promo" onclick="go('topic')"><div class="e">📖</div><div><b>Начни первую главу</b><p>Выбери тему — и твой город оживёт в первой главе</p></div></div>`}
<div class="tabs"><div class="tab ${homeTab==="zones"?"on":""}" onclick="homeTab='zones';render()">Город</div><div class="tab ${homeTab==="eps"?"on":""}" onclick="homeTab='eps';render()">Главы</div></div>
${homeTab==="zones"?zoneTiles():eps()}`},
city(){return `<div class="top"><b style="font-size:24px">${esc(D.city)}</b><div class="chip">${D.words.length} ${plr(D.words.length,"слово","слова","слов")}</div></div>${zoneTiles()}
<div style="margin-top:12px">${revRow(D.words)}</div>
<div class="card" onclick="go('city')"><div class="w"><div class="t"><b>✏️ Добавить или поправить детали</b><small>места, названия, забытые подробности — без анкеты</small></div>›</div></div>
${Object.keys(ZK).map(k=>{const ws=D.words.filter(w=>kindOf(w)===k).sort((a,b)=>(a.chain_order??0)-(b.chain_order??0));return ws.length?`<div class="card" id="z-${k}" style="margin-top:12px"><h3 class="zh">${zhead(k)}${zid(k)?`<span class="chip" onclick="event.stopPropagation();go('ce_z_${zid(k)}')">✏️ Править</span>`:""}</h3>${ws.map(word).join("")}</div>`:""}).join("")}
${R23.legend&&R23.status?`<p class="legend"><span class="rs now">🔁 сегодня</span> повторить сегодня · <span class="rs soon">через 3 дн.</span> · <span class="rs ok">✅ выучено</span></p>`:""}`},
eps(){return `<div class="top"><b style="font-size:24px">Мои главы</b><div class="chip" onclick="go('next')">▶️ Читать дальше</div></div>${eps()}`},
ep(){const e=D.episodes.find(x=>x.id===epId);if(!e)return V.eps();return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="nav('eps')">‹</div><b>${esc(tt(e.title))}</b><div></div></div>
<div class="card story read">${md(e.body,e.words)}</div>
${R23.map?`<details class="card map"><summary>🗺 Карта главы · ${e.words.length} ${plr(e.words.length,"слово","слова","слов")}</summary>${e.words.map(w=>`<div>${isDue(w)?"🔁 ":""}📍 ${esc(ptxt(w))} — <b onclick="openWord('${w.user_word_id}')" style="text-decoration:underline dotted">${esc((w.article?w.article+" ":"")+w.lemma)}</b> (${esc(w.translation)}) · ${esc(w.syllables||w.lemma)}${sounds(w)?" → "+sounds(w):""}</div>`).join("")}</details>`:""}
<div class="seg"><span class="chip" onclick="go('st_${e.id}')">🧠 Проверить себя</span><span class="chip" onclick="go('st_${e.id}')">✍️ Переписать</span><span class="chip" onclick="go('st_${e.id}')">🔊 Озвучить</span></div>
${R23.nextpart?`<button class="btn" onclick="go('next')">▶️ Следующая часть</button><a class="link" onclick="go('st_${e.id}')">Проверить себя</a>`:`<button class="btn" onclick="go('review')">🔁 Повторить слова этой главы</button>`}`},
dict(){const ws=D.words.filter(w=>!q||(w.lemma+" "+w.translation).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
 return `<div class="top"><b style="font-size:24px">Словарь</b><div class="chip">${D.words.length}</div></div>
${R23.kl?`<div class="card kc" onclick="openKl()"><div class="w"><div class="t"><b>☑ Что уже знаешь?</b><small>отметь знакомые слова следующей части — книга не будет тратить на них страницы</small></div>›</div></div>`:""}${revRow(D.words)}${!D.words.length?"":`<input class="srch" placeholder="Поиск: слово или перевод" value="${esc(q)}" oninput="q=this.value;const c=this.selectionStart;render();const i=$('.srch');i.focus();i.setSelectionRange(c,c)">`}
${!D.words.length?emptyCTA("Тут появятся слова твоей первой главы","Каждое слово получит своё место в твоём городе и смешную историю."):`<div class="card">${ws.map(word).join("")||`<div class="empty">По запросу «${esc(q)}» слов нет — попробуй немецкое слово или перевод.</div>`}</div>`}`},
word(){const w=wl[wi];if(!w)return V.book();const k=kindOf(w),col={der:"#7aa6ff",die:"#ff8fb0",das:"#6ff0a8",verb:"#f5c542"}[k];const p=placeOf(w.place,w.place_label);
 const due=w.due_at?new Date(w.due_at):null,dd=(x=>x[0].toUpperCase()+x.slice(1))(repLine(w)),dl=due&&due.getFullYear()<2090&&!isDue(w)?due.toLocaleDateString("ru-RU",{day:"numeric",month:"long"}):"";
 return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="back()">‹</div><div class="chip">${wi+1} / ${wl.length}</div><div style="font-size:26px;cursor:pointer" onclick="say()">🔊</div></div>
${CARD_V2?card2(w,k,col,p):`<div class="hero" style="text-align:center;padding:28px 18px"><span class="art big ${w.pos==="verb"?"verb":(w.article||"")}">${esc(w.pos==="verb"?"глагол":w.article||"")}</span>
<div class="big" style="font-size:46px;color:${col}">${esc(w.lemma)}</div><div style="font-size:20px;color:#cfcfda">${esc(w.syllables||w.lemma)}</div><div style="margin-top:8px;font-size:18px">${esc(w.translation)}${w.plural?` <span style="color:var(--mut)">· мн. ${esc(w.plural)}</span>`:""}</div></div>
<div class="card" style="margin-top:12px"><h3 style="display:flex;justify-content:space-between">📍 ${esc(p.t||zname(k))}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3><small class="art-l">${ZK[k][0]} ${esc(artLbl(k))}</small>
${sounds(w)?`<div style="margin-top:10px;font-size:17px">🔤 ${esc(w.syllables||w.lemma)} → ${sounds(w)}</div>`:""}</div>
${w.image?`<div class="card story"><h3>🎬 Образ</h3><p>${R23.boldsnd?boldAssoc(esc(MP.road(String(w.image)).replace(/\*\*/g,"")),[w]):esc(MP.road(String(w.image)).replace(/\*\*/g,""))}</p></div>`:""}`}
<div class="card"><div class="w"><div class="t"><b>${dd}</b><small>${dl?"📅 "+dl+(w.interval_days?" · ":""):""}${w.interval_days?`интервал ${w.interval_days} ${plr(w.interval_days,"день","дня","дней")}`:""}</small></div>${stl(w)}</div></div>
<div class="seg">${w.story_id&&D.episodes.some(e=>e.id===w.story_id)?`<span class="chip" onclick="openEp('${w.story_id}')">📖 Вся глава</span>`:""}<span class="chip" onclick="step(-1)">← Пред.</span><span class="chip" onclick="step(1)">След. →</span></div>`},
more(){return `<div class="top"><b style="font-size:24px">Ещё</b><div></div></div><div class="card">
<div class="w" onclick="go('review')"><div class="t"><b>🔁 Повторение</b><small>карточки и перечитывание</small></div>›</div>
<div class="w" onclick="go('topic')"><div class="t"><b>🎒 Наборы тем</b><small>выбрать тему для новой главы</small></div>›</div>
<div class="w" onclick="openKl()"><div class="t"><b>☑ Что уже знаешь?</b><small>знакомые слова следующей части</small></div>›</div>
<div class="w" onclick="go('city')"><div class="t"><b>🏙 Мой город</b><small>места и названия — в разделе «Город» в боте</small></div>›</div></div>`}};
V.home=V.book;
// PM #189: «знаю / учим» — the same checklist as in the bot (memcity.word_skips via the edge op, signed initData; never WebApp.send-data)
let KL=null, klMode="part";
const nxTitle=()=>{const n=D.next||{};return `Глава «${n.title||""}»`+(n.n?`, часть ${n.n}`:"")};
async function api(b){const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:tg&&tg.initData,...b})});return r.json()}
async function openKl(){try{KL=await api({op:"kl"})}catch(e){KL={error:"server"}}nav("kl")}
async function klT(id){const all=[...(KL.part||[]),...(KL.all||[])].filter(w=>w.id===id);if(!all.length)return;const on=!all[0].known;all.forEach(w=>w.known=on);render();
 try{tg&&tg.HapticFeedback&&tg.HapticFeedback.impactOccurred("light")}catch(e){}
 let r={};try{r=await api({op:on?"skip":"unskip",word_id:id})}catch(e){r={error:"server"}}
 if(r.error){all.forEach(w=>w.known=!on);KL.msg=r.message||"Не получилось сохранить — попробуй ещё раз";render();setTimeout(()=>{KL.msg="";render()},2600)}}
const klRow=w=>`<div class="kl ${w.known?"on":""}" onclick="klT('${w.id}')"><div class="t"><strong class="${w.verb?"v":""}">${w.verb?"🟡 ":""}${esc((w.article?w.article+" ":"")+w.lemma)}</strong><small>${esc(w.translation)}${w.known?" · знаю":""}</small></div><span class="cb">${w.known?"✓":""}</span></div>`;
V.kl=function(){if(!KL||KL.error||!KL.chapter)return `<div class="back" onclick="nav('dict')">‹</div><div class="empty">Список появится, когда начнётся глава.<a class="main" onclick="go('next')">▶️ Читать дальше</a></div>`;
 const ws=klMode==="part"?KL.part:KL.all,kn=ws.filter(w=>w.known).length;
 return `<div class="back" onclick="nav('dict')">‹</div><div class="hd"><div class="sub">📖 ${esc(KL.chapter.title)}${KL.chapter.n?` · часть ${KL.chapter.n}`:""}</div><h1>Что уже знаешь?</h1></div>
<div class="seg"><a class="${klMode==="part"?"on":""}" onclick="klMode='part';render()">Часть · ${KL.part.filter(w=>!w.known).length}</a><a class="${klMode==="all"?"on":""}" onclick="klMode='all';render()">Вся глава · ${KL.all.length}</a></div>
<div class="sub" style="margin:10px 4px">Отметь, что уже знаешь — эти слова мы пропустим. Остальные оживут в истории.</div>
<div class="card" style="padding:0 16px">${ws.map(klRow).join("")||`<div class="empty">Все слова этой главы уже в историях</div>`}</div>
<div class="sub" style="margin:6px 4px 0">${kn?`Знаю: ${kn} · учим: ${ws.length-kn}`:"Пока всё учим"}</div>
${KL.msg?`<div class="toast">${esc(KL.msg)}</div>`:""}
<a class="main stick" onclick="go('go_${KL.chapter.id}')">▶️ Готово — пишем часть</a>`};
const NAV=[["home","🏠","Главная"],["eps","🎬","Главы"],["city","🏙","Город"],["dict","📖","Словарь"],["more","⋯","Ещё"]];
function openWord(id){const src=tab==="ep"?(D.episodes.find(e=>e.id===epId)||{words:[]}).words:tab==="dict"?D.words.slice().sort((a,b)=>a.lemma.localeCompare(b.lemma,"de")):(tab==="home"||tab==="book")?D.words.filter(isDue):D.words;
 wl=src.length?src:D.words;wi=Math.max(0,wl.findIndex(w=>w.user_word_id===id));if(tab!=="word")prev=tab;nav("word")}
function step(d){if(!wl.length)return;wi=(wi+d+wl.length)%wl.length;render();scrollTo(0,0)}
function back(){nav(prev||"home")}
const AUDIO="https://wbrpcvbpipeejdnsymdz.supabase.co/storage/v1/object/public/audio/";let player=null;
function speak(w){if(!window.speechSynthesis)return toast("Озвучка появится через пару минут");const u=new SpeechSynthesisUtterance((w.article?w.article+" ":"")+w.lemma);u.lang="de-DE";u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function say(){const w=wl[wi];if(!w)return;try{if(player)player.pause();player=new Audio(AUDIO+w.word_id+".mp3");player.play().catch(()=>speak(w));player.onerror=()=>speak(w)}catch(e){speak(w)}}
let tx=null;document.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});document.addEventListener("touchend",e=>{if(tab!=="word"||tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60)step(dx<0?1:-1);tx=null},{passive:true});
if(tg&&tg.BackButton)tg.BackButton.onClick(()=>tab==="word"?back():tab==="ep"?nav("eps"):tab==="kl"?nav("dict"):nav("home"));
function render(){if(tab==="book")tab="home";if(tg&&tg.BackButton){tab==="home"?tg.BackButton.hide():tg.BackButton.show()}$("#app").innerHTML=V[tab]?V[tab]():V.home();const nt=tab==="ep"?"eps":tab==="kl"?"dict":tab==="word"?(prev==="ep"?"eps":prev==="book"?"home":prev):tab;$("#nav").innerHTML=NAV.map(([k,i,l])=>`<div class="${k===nt?"on":""}" onclick="nav('${k}')"><span>${i}</span>${l}</div>`).join("")}
function nav(t){tab=t;render();scrollTo(0,0)} function openEp(id){epId=id;nav("ep")} function openZone(k){nav("city");setTimeout(()=>{const el=document.getElementById("z-"+k);el&&el.scrollIntoView({behavior:"smooth"})},50)}
(async()=>{const init=tg&&tg.initData;if(!init){$("#app").innerHTML='<div class="load">Открой приложение из бота @'+BOT+'</div>';return}
 try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:init})});if(!r.ok)throw new Error(r.status);D=await r.json();
 const st=new URLSearchParams(location.search).get("screen");if(st)tab=st;if(tab==="book")tab="home";if(tab==="ep")epId=D.episodes[0]&&D.episodes[0].id;if(tab==="word"){tab="home";render();openWord((D.words.find(isDue)||D.words[0]||{}).user_word_id);return}if(tab==="kl"){tab="dict";return openKl()}render()}
 catch(e){$("#app").innerHTML='<div class="load">Не получилось загрузить данные ('+esc(e.message)+'). Попробуй ещё раз.</div>'}})();

// The big word card of the old look (as in the 13.10 screenshot) is the default; v2 «грунд» card: ?card2=1 or window.MC_CARD_V2=true.
const CARD_V2=R23.card2||new URLSearchParams(location.search).get("card2")==="1"||window.MC_CARD_V2===true;
const DOTS={der:"🔵",die:"🔴",das:"🟢",verb:"🟡"};
function card2(w,k,col,p){const nm=(w.article?w.article+" ":"")+w.lemma,parts=String(w.syllables||w.lemma).split(/\s*[·‧-]\s*/).filter(Boolean),ss=Array.isArray(w.sounds)?w.sounds:[];
 const assoc=ss.length===parts.length?parts.map((x,i)=>`<div>${esc(x)} → ${qs(ss[i])}</div>`).join(""):esc(parts.join(" · "));
 const story=k==="verb"?`<span style="color:var(--gold)">${esc(MP.road(w.image||""))}</span>`:esc(MP.road(w.image||""));
 return `<div class="hero" style="padding:20px 18px"><div style="font-size:24px">${DOTS[k]||"⚪"} <b style="color:${col}">${esc(nm)}</b></div>
<div style="margin-top:6px;font-size:18px">${esc(w.translation)} · ${sounds(w)||"—"}</div></div>
<div class="card" style="margin-top:12px"><h3>🔤 Части и ассоциации</h3><div style="font-size:17px;line-height:1.6">${assoc}</div></div>
<div class="card"><h3 style="display:flex;justify-content:space-between">📍 ${esc(artLbl(k))}${p.t?" — "+esc(p.t):""}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3></div>
<div class="card story"><h3>🎬 История</h3><p>${story||"История ещё не придумана."}</p></div>`}
