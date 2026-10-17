const API="https://wbrpcvbpipeejdnsymdz.supabase.co/functions/v1/memcity-app", BOT="fixDeutsch_bot";
const tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("bg_color");tg.setBackgroundColor("bg_color")}catch(e){}document.documentElement.dataset.scheme=tg.colorScheme||"dark";tg.onEvent&&tg.onEvent("themeChanged",()=>{document.documentElement.dataset.scheme=tg.colorScheme})}
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let D=null, wl=[], wi=0, prev="book", tab="book", epId=null, q="", homeTab="zones";
const kindOf=w=>w.pos==="verb"?"verb":(w.article||w.zone_kind||"das");
const isDue=w=>w.due_at&&Date.parse(w.due_at)<=Date.now();

const sparts=a=>(Array.isArray(a)?a:[a]).flatMap(s=>String(s??"").split("+")).map(s=>s.trim()).filter(Boolean); // #134: «халат+усы» → «халат» + «усы»
const qs=a=>sparts(a).map(s=>"«"+esc(s)+"»").join(" + ");
const sounds=w=>qs(Array.isArray(w.sounds)?w.sounds:[]);
const plr=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m===1?a:m>=2&&m<=4?b:c};
const dayDiff=d=>{const a=new Date(d),b=new Date();a.setHours(0,0,0,0);b.setHours(0,0,0,0);return Math.round((a-b)/864e5)};
// #134: one consistent state line: «повторено 2 раза · следующее через 3 дня» / «новое слово · первое повторение завтра» / «пора повторить ⏰»
function repLine(w){const n=w.reps||0,due=w.due_at?new Date(w.due_at):null,real=due&&due.getFullYear()<2090;
 const done=n?`повторено ${n} ${plr(n,"раз","раза","раз")}`:"новое слово";
 if(!real)return n?done:"ещё не повторялось";
 if(isDue(w))return `${done} · пора повторить ⏰`;
 const k=dayDiff(due),when=k<=0?"сегодня":k===1?"завтра":k===2?"послезавтра":`через ${k} ${plr(k,"день","дня","дней")}`;
 return `${done} · ${n?"следующее":"первое повторение"} ${when}`}
const go=p=>{ if(tg&&tg.openTelegramLink){tg.openTelegramLink(`https://t.me/${BOT}?start=${p}`);setTimeout(()=>tg.close(),300)} else location.href=`https://t.me/${BOT}?start=${p}` };
function placeOf(raw,lab){if(lab&&typeof raw!=="object"){const p0=placeOf0(raw);return {t:lab,c:p0.t!==lab?p0.c:p0.c}}return placeOf0(raw)}
function placeOf0(raw){let s=String(raw||"").trim();if(!s)return {t:"",c:""};
 s=MP.clean(s).replace(/^zona\s+\S+,\s*/i,"").replace(/\s*\(без рода\)/i,"");
 let ctx="";const ci=s.indexOf(":");if(ci>0){ctx=s.slice(0,ci);s=s.slice(ci+1)}else{const p=s.split(/,\s*/);if(p.length>1){s=p.pop();if(/^где\s/i.test(s)&&p.length>1)s=p.pop();ctx=p.join(", ")}}
 const fix=x=>x.replace(/^(я\s+)?(жил|жила|живу)\s+в\s+/i,"").replace(/^(второе|третье|первое)\s+место\s+(это\s+)?/i,"").replace(/^пускай\s+это\s+будет\s+/i,"").replace(/\s+я\s+буду.*$/i,"")
  .replace(/^(\S+)\s+был[аио]?\s+не\s*большой/i,"небольшой $1").replace(/с\s+парой\s+качель/i,"с качелями").replace(/^(\\S+)ой\\s+квартире/i,"$1ая квартира").replace(/^(\S+)ой\s+квартире/i,"$1ая квартира").replace(/^заходили\s+в\s+/i,"").trim();
 const cut=x=>x.length>42?x.slice(0,40).replace(/\s+\S*$/,"")+"…":x, cap=x=>x?x[0].toUpperCase()+x.slice(1):x;
 return {t:cap(cut(fix(s))),c:cut(fix(ctx))}}
const pl=w=>{const p=placeOf(w.place,w.place_label);return p.t+(p.c?" · "+p.c:"")};
const word=w=>`<div class="w" onclick="openWord('${w.user_word_id}')"><span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span><div class="t"><b>${esc(w.syllables||w.lemma)}</b><small>${esc(w.translation)}${sounds(w)?" · "+sounds(w):""}${w.place?" · 📍 "+esc(placeOf(w.place,w.place_label).t):""}</small></div><span style="color:${dot(w)}">●</span></div>`;
function tt(t){return String(t||"").replace(/^\s*\u0421\u0435\u0440\u0438\u044f\s+(\d+):\s*(.+)$/i,"«$2» · часть $1")}
function nounGold(s,ws){/* r22d #178: 🟡 = verbs only */const nn=new Set((ws||[]).filter(w=>w.article).map(w=>String(w.lemma||"").toLowerCase()));return String(s||"").replace(/🟡\s?(\*\*([^*]+)\*\*|[^\s.,!?;:]+)/g,(m,t,b)=>{const k=(b||t).replace(/^(der|die|das|den|dem|des)\s+/i,"").toLowerCase();return nn.has(k)?t:m})}
function md(s,ws){s=MP.noPlan(s);s=MP.road(s);if(MP.keyLegend)s=MP.keyLegend(s,znames()).replace(/^(Места: .*)$/mu,m=>m.replace(/🟡/gu,"\uE000"));return boldAssoc(esc(nounGold(s,ws)),ws).replace(/🟡\s?\*\*(.+?)\*\*/g,"<b class=\"v\">$1</b>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/🟡\s?([^\s.,!?;:]+)/g,"<b class=\"v\">$1</b>").split(/\n{2,}/).map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("").replace(/\uE000/g,"🟡")}

// r23 design (memcity-design/CHANGES.md): Telegram theme colours only, 3 tabs, one main action per screen.
// Sound-alikes («баня», «хохот») bold inside the chapter text — any Russian ending (stem match).
function boldAssoc(h,ws){const st=new Set();(ws||[]).forEach(w=>sparts(w.sounds).forEach(x=>x.split(/\s+/).forEach(t=>{t=t.toLowerCase().replace(/[^а-яё]/g,"");if(t.length>=3)st.add(t.length>=4?t.slice(0,t.length-1):t)})));
 if(!st.size)return h;const rx=new RegExp("(^|[^А-Яа-яЁё>])(("+[...st].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")[а-яё]{0,3})(?![А-Яа-яЁё])","gi");
 return h.split(/(<[^>]+>)/).map(p=>p.startsWith("<")?p:p.replace(rx,"$1<b>$2</b>")).join("")}
const ring=(p,t,cls="")=>`<div class="ring ${cls}" style="--p:${Math.round(p)}"><b>${t}</b></div>`;
const pct=ws=>ws.length?100*ws.filter(w=>(w.reps||0)>0&&!isDue(w)).length/ws.length:0;
// PM-124 #194: one place name for the learner = the bot's (payload place_names ← memory.place_names); fallback = the
// SAME table as core/planner.PLACE_FALLBACK; a technical zones.name (zona + article + letter) is never shown
// PM-128 #213 / QA-127 #210: ONE place-name rule — placename.js (generated from core/placename_rules.json, = core/placename.py); a minimal stand-in if it failed to load
const MP=window.MCPlace||{road:t=>String(t||"").replace(/[Дд]орога между (?:зонами|местами|районами)/g,"Дорога между местами").replace(/между (?:зонами|районами)/g,"между местами"),isTech:n=>/^\s*зона\s+(?:[a-dxа-гх]|der|die|das|verb|глагол[а-яё]*)(?![а-яёa-z])/i.test(String(n||"")),clean:t=>String(t||"").replace(/^\s*зона\s+(?:[a-dxа-гх]|der|die|das|verb|глагол[а-яё]*)(?![а-яёa-z])(?:\s*\([^)]*\))?\s*[,:—-]\s*/i,"").replace(/между зонами/gi,"между местами").trim(),fallback:k=>({der:"Мой дом",die:"Моя улица",das:"Любимое место",verb:"Двор у дома"})[k]||"Двор у дома",ofZone:z=>z&&z.name&&!/^\s*зона(?![а-яё])/i.test(z.name)?z.name:(({der:"Мой дом",die:"Моя улица",das:"Любимое место",verb:"Двор у дома"})[z&&z.kind]||"Двор у дома"),noPlan:b=>String(b||"").replace(/\n\n🗺 План:[\s\S]*?(?=\n\n🔑 Ключ:|$)/u,"")};
const zname=k=>{const pn=(D.place_names||{})[k];if(pn&&!MP.isTech(pn))return pn;const z=(D.zones||[]).find(x=>x.kind===k);return z?MP.ofZone(z):MP.fallback(k,"")};
// zonehint (NordSturm 17.10): the gender zone next to the human name — the SAME label as the bot (placename_rules.json role_hint)
const roleOf=k=>MP.role?MP.role(k):"",withRole=(k,n)=>MP.withRole?MP.withRole(k,n):n,znames=()=>({der:zname("der"),die:zname("die"),das:zname("das"),verb:zname("verb")});
const artLbl=k=>withRole(k,zname(k));
const wl1=w=>`<div class="wl" onclick="openWord('${w.user_word_id}')"><div class="t"><strong class="${w.pos==="verb"?"v":""}">${esc((w.article?w.article+" ":"")+w.lemma)}</strong><small>${esc(w.translation)}${sounds(w)?" · "+sounds(w).replace(/«([^»]+)»/g,"<b>$1</b>"):""}</small></div>${isDue(w)?'<span class="due">пора</span>':'<span class="st"></span>'}</div>`;
const V={
book(){const s=D.stats,due=D.words.filter(isDue),p=s.words?100*s.learned/s.words:0,eps=D.episodes;
 return `<div class="hd"><h1>Моя книга</h1><div class="sub">${esc(D.city)} · ${esc(D.level)}</div></div>
<div class="card book">${ring(p,Math.round(p)+"%")}<div style="flex:1"><b>${s.learned} из ${s.words} слов выучено</b><div class="sub">${eps.length} ${plr(eps.length,"часть","части","частей")} прочитано</div></div></div>
${D.next?`<div class="card"><div class="sub" style="margin:0 0 2px">Сейчас читаешь</div><b>📖 ${esc(nxTitle())}</b><a class="main" onclick="go('next')">▶️ Читать дальше</a></div>`
 :`<a class="main" style="margin:0 0 10px" onclick="go('next')">▶️ Читать дальше</a>`}
${due.length?`<a class="row2" onclick="go('review')"><span>🔁 Повторить: ${due.length} ${plr(due.length,"слово","слова","слов")}</span><span>›</span></a>`:""}
<div class="lbl">Оглавление</div>
${eps.length?`<div class="card toc">${eps.map((e,i)=>{const pp=pct(e.words),dn=e.words.filter(isDue).length,done=pp>=100;
 return `<a class="ch ${done?"done":""}" onclick="openEp('${e.id}')">${ring(pp,i+1,"sm")}<span class="t"><b>${esc(tt(e.title||e.topic))}</b><small>${e.words.length} ${plr(e.words.length,"слово","слова","слов")}${done?" · выучено":""}</small></span>${dn?`<span class="due">${dn}</span>`:"›"}</a>`}).join("")}</div>`
 :`<div class="empty">Глав пока нет.<a class="main" onclick="go('topic')">Начать первую главу</a></div>`}`},
ep(){const i=D.episodes.findIndex(x=>x.id===epId),e=D.episodes[i];if(!e)return V.book();
 return `<div class="back" onclick="nav('book')">‹</div><div class="hd"><div class="sub">Глава ${i+1} · ${e.words.length} ${plr(e.words.length,"слово","слова","слов")}</div><h1>${esc(tt(e.title))}</h1></div>
<div class="chips">${e.words.map(w=>`<span class="${w.pos==="verb"?"v":""}" onclick="openWord('${w.user_word_id}')">${w.pos==="verb"?esc(w.lemma):`<strong>${esc(w.lemma)}</strong> · ${esc(w.translation)}`}</span>`).join("")}</div>
<div class="read">${md(e.body,e.words)}</div>
<a class="main" onclick="go('next')">▶️ Следующая часть</a><a class="link" onclick="go('st_${e.id}')">Проверить себя</a>`},
word(){const w=wl[wi];if(!w)return V.book();const k=kindOf(w),p=placeOf(w.place,w.place_label);
 const parts=String(w.syllables||w.lemma).split(/\s*[·‧-]\s*/).filter(Boolean),ss=Array.isArray(w.sounds)?w.sounds:[];
 const snd=ss.length===parts.length?parts.map((x,j)=>`<div>${esc(x)} → ${sparts(ss[j]).map(t=>"<b>"+esc(t)+"</b>").join(" + ")}</div>`).join(""):(ss.length?`<div>${esc(parts.join(" · "))} → ${sparts(ss).map(t=>"<b>"+esc(t)+"</b>").join(" + ")}</div>`:"");
 const dots=wl.length<=12?wl.map((_,j)=>`<i class="${j===wi?"on":""}"></i>`).join(""):`${wi+1} / ${wl.length}`;
 return `<div class="pager"><span class="back" style="margin:0" onclick="back()">‹</span><span class="dots">${dots}</span><span onclick="say()" style="cursor:pointer">🔊</span></div>
<div class="card wc" style="margin-top:12px"><div class="art" ${k==="verb"?'style="color:var(--gold-ink)"':""}>${esc(artLbl(k))}</div><div class="lem ${k==="verb"?"v":""}">${esc(w.article&&k!=="verb"?w.article+" "+w.lemma:w.lemma)}</div><div class="tr">${esc(w.translation)}${w.plural?" · мн. "+esc(w.plural):""}</div>${snd?`<div class="snd">${snd}</div>`:""}</div>
${w.image||p.t?`<div class="card">${p.t?`<div class="sub" style="margin:0 0 4px">📍 ${esc(p.t)}</div>`:""}${w.image?boldAssoc(esc(MP.road(String(w.image)).replace(/\*\*/g,"")),[w]):""}</div>`:""}
<div class="row" style="padding:4px"><small>${esc(repLine(w))}</small><small>свайп ← →</small></div>`},
city(){const g={der:[],die:[],das:[],verb:[]};D.words.forEach(w=>{const k=kindOf(w);(g[k]=g[k]||[]).push(w)});
 return `<div class="hd"><h1>${esc(D.city)}</h1><div class="sub">4 места · ${D.words.length} ${plr(D.words.length,"слово","слова","слов")}</div></div>
<div class="city">${Object.keys(g).map(k=>{const ws=g[k],dn=ws.filter(isDue).length;return `<div class="loc ${k==="verb"?"verb":""}" onclick="openZone('${k}')"><span class="k">${esc(roleOf(k)||(k==="verb"?"ГЛАГОЛЫ":k.toUpperCase()))}</span>${dn?`<span class="badge due">${dn}</span>`:""}<div><b class="${k==="verb"?"v":""}">${esc(zname(k))}</b><small>${ws.length} ${plr(ws.length,"слово","слова","слов")}</small><div class="pb"><i style="width:${pct(ws)}%${k==="verb"?";background:var(--gold)":""}"></i></div></div></div>`}).join("")}</div>
${Object.keys(g).map(k=>g[k].length?`<div class="lbl" id="z-${k}">${esc(roleOf(k)?withRole(k,zname(k)):zname(k)+" · "+(k==="verb"?"глаголы":k))}</div><div class="card">${g[k].map(wl1).join("")}</div>`:"").join("")}`},
dict(){const kc=`<div class="card"><b>☑ Что уже знаешь?</b><div class="sub">Отметь знакомые слова следующей части — книга не будет тратить на них страницы.</div><a class="main" onclick="openKl()">☑ Что уже знаешь?</a></div>`;const ws=D.words.filter(w=>!q||(w.lemma+" "+w.translation).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
 return `<div class="hd"><h1>Слова</h1><div class="sub">${D.words.length} ${plr(D.words.length,"слово","слова","слов")}</div></div>${kc}${D.words.length?`<input class="srch" placeholder="Поиск: слово или перевод" value="${esc(q)}" oninput="q=this.value;const c=this.selectionStart;render();const i=$('.srch');i.focus();i.setSelectionRange(c,c)"><div class="card">${ws.map(wl1).join("")||`<div class="empty">Ничего не нашлось</div>`}</div>`:`<div class="empty">Тут появятся слова твоей первой главы.</div>`}`}};
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
const NAV=[["book","📖","Книга"],["city","🏙","Город"],["dict","🔤","Слова"]];
function openWord(id){const src=tab==="ep"?(D.episodes.find(e=>e.id===epId)||{words:[]}).words:tab==="dict"?D.words.slice().sort((a,b)=>a.lemma.localeCompare(b.lemma,"de")):D.words;
 wl=src.length?src:D.words;wi=Math.max(0,wl.findIndex(w=>w.user_word_id===id));if(tab!=="word")prev=tab;nav("word")}
function step(d){if(!wl.length)return;wi=(wi+d+wl.length)%wl.length;render();scrollTo(0,0)}
function back(){nav(prev||"book")}
const AUDIO="https://wbrpcvbpipeejdnsymdz.supabase.co/storage/v1/object/public/audio/";let player=null;
function speak(w){if(!window.speechSynthesis)return toast("Озвучка появится через пару минут");const u=new SpeechSynthesisUtterance((w.article?w.article+" ":"")+w.lemma);u.lang="de-DE";u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function say(){const w=wl[wi];if(!w)return;try{if(player)player.pause();player=new Audio(AUDIO+w.word_id+".mp3");player.play().catch(()=>speak(w));player.onerror=()=>speak(w)}catch(e){speak(w)}}
let tx=null;document.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});document.addEventListener("touchend",e=>{if(tab!=="word"||tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60)step(dx<0?1:-1);tx=null},{passive:true});
if(tg&&tg.BackButton)tg.BackButton.onClick(()=>tab==="word"?back():nav(tab==="kl"?"dict":"book"));
function render(){if(tg&&tg.BackButton){["book","city","dict"].includes(tab)?tg.BackButton.hide():tg.BackButton.show()}$("#app").innerHTML=V[tab]?V[tab]():V.book();const nt=tab==="kl"?"dict":tab==="ep"?"book":tab==="word"?(prev==="ep"?"book":prev):tab;$("#nav").innerHTML=NAV.map(([k,i,l])=>`<div class="${k===nt?"on":""}" onclick="nav('${k}')"><span>${i}</span>${l}</div>`).join("")}
function nav(t){tab=t;render();scrollTo(0,0)} function openEp(id){epId=id;nav("ep")} function openZone(k){nav("city");setTimeout(()=>{const el=document.getElementById("z-"+k);el&&el.scrollIntoView({behavior:"smooth"})},50)}
(async()=>{const init=tg&&tg.initData;if(!init){$("#app").innerHTML='<div class="load">Открой приложение из бота @'+BOT+'</div>';return}
 try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:init})});if(!r.ok)throw new Error(r.status);D=await r.json();
 const st=new URLSearchParams(location.search).get("screen");if(st)tab=st;if(tab==="home"||tab==="eps")tab="book";if(tab==="ep")epId=D.episodes[0]&&D.episodes[0].id;if(tab==="word"){tab="book";render();openWord((D.words.find(isDue)||D.words[0]||{}).user_word_id);return}if(tab==="kl"){tab="dict";return openKl()}render()}
 catch(e){$("#app").innerHTML='<div class="load">Не получилось загрузить данные ('+esc(e.message)+'). Попробуй ещё раз.</div>'}})();
