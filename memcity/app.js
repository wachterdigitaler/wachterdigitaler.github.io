const API="https://wbrpcvbpipeejdnsymdz.supabase.co/functions/v1/memcity-app", BOT="fixDeutsch_bot";
const tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0b0b0f");tg.setBackgroundColor("#0b0b0f")}catch(e){}}
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let D=null, wl=[], wi=0, prev="home", tab="home", epId=null, q="", homeTab="zones";
const ZK={der:["🔵","der","Мужской район","#2d6cff,#1a3d99"],die:["🔴","die","Женский район","#ff5d8a,#a3244c"],das:["🟢","das","Средний район","#22c58b,#0e7a55"],verb:["🟡","глаголы","Улица действий","#f5c542,#b07d00"]};
const kindOf=w=>w.pos==="verb"?"verb":(w.article||w.zone_kind||"das");
const isDue=w=>w.due_at&&Date.parse(w.due_at)<=Date.now();
const dot=w=>isDue(w)?"var(--red)":(w.due_at&&Date.parse(w.due_at)-Date.now()<2*864e5?"var(--gold)":"var(--grn)");
const sounds=w=>(Array.isArray(w.sounds)?w.sounds:[]).map(s=>"«"+esc(s)+"»").join(" + ");
const go=p=>{ if(tg&&tg.openTelegramLink){tg.openTelegramLink(`https://t.me/${BOT}?start=${p}`);setTimeout(()=>tg.close(),300)} else location.href=`https://t.me/${BOT}?start=${p}` };
function placeOf(raw,lab){if(lab&&typeof raw!=="object"){const p0=placeOf0(raw);return {t:lab,c:p0.t!==lab?p0.c:p0.c}}return placeOf0(raw)}
function placeOf0(raw){let s=String(raw||"").trim();if(!s)return {t:"",c:""};
 s=s.replace(/^(зона|zona)\s+\S+,\s*/i,"").replace(/\s*\(без рода\)/i,"");
 let ctx="";const ci=s.indexOf(":");if(ci>0){ctx=s.slice(0,ci);s=s.slice(ci+1)}else{const p=s.split(/,\s*/);if(p.length>1){s=p.pop();if(/^где\s/i.test(s)&&p.length>1)s=p.pop();ctx=p.join(", ")}}
 const fix=x=>x.replace(/^(я\s+)?(жил|жила|живу)\s+в\s+/i,"").replace(/^(второе|третье|первое)\s+место\s+(это\s+)?/i,"").replace(/^пускай\s+это\s+будет\s+/i,"").replace(/\s+я\s+буду.*$/i,"")
  .replace(/^(\S+)\s+был[аио]?\s+не\s*большой/i,"небольшой $1").replace(/с\s+парой\s+качель/i,"с качелями").replace(/^(\\S+)ой\\s+квартире/i,"$1ая квартира").replace(/^(\S+)ой\s+квартире/i,"$1ая квартира").replace(/^заходили\s+в\s+/i,"").trim();
 const cut=x=>x.length>42?x.slice(0,40).replace(/\s+\S*$/,"")+"…":x, cap=x=>x?x[0].toUpperCase()+x.slice(1):x;
 return {t:cap(cut(fix(s))),c:cut(fix(ctx))}}
const pl=w=>{const p=placeOf(w.place,w.place_label);return p.t+(p.c?" · "+p.c:"")};
const word=w=>`<div class="w" onclick="openWord('${w.user_word_id}')"><span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span><div class="t"><b>${esc(w.syllables||w.lemma)}</b><small>${esc(w.translation)}${sounds(w)?" · "+sounds(w):""}${w.place?" · 📍 "+esc(placeOf(w.place,w.place_label).t):""}</small></div><span style="color:${dot(w)}">●</span></div>`;
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/🟡\s?([^\s.,!?;:]+)/g,"<b>$1</b>").split(/\n{2,}/).map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("")}
const zid=k=>{const z=(D.zones||[]).find(x=>x.kind===k);return z?z.id:""};
function zoneTiles(){const g={};D.words.forEach(w=>{const k=kindOf(w);(g[k]=g[k]||[]).push(w)});
 return `<div class="grid">${Object.keys(ZK).map(k=>{const ws=g[k]||[],z=ZK[k],dn=ws.filter(isDue).length,zn=D.zones.find(x=>x.kind===k);const pct=ws.length?Math.round(100*ws.filter(w=>!isDue(w)).length/ws.length):0;
 return `<div class="tile" onclick="openZone('${k}')" style="background:linear-gradient(150deg,${z[3]});${k==="verb"?"color:#1a1300":""}"><div style="font-size:24px">${z[0]} ${z[1]}</div><div><b>${z[2]}</b><small>${zn?esc(zn.name)+" · ":""}${ws.length} слов${dn?" · ⏰"+dn:""}</small><div class="bar"><i style="width:${pct}%;${k==="verb"?"background:#1a1300":""}"></i></div></div></div>`}).join("")}</div>`}
function epCard(e){const dn=e.words.filter(isDue).length;return `<div class="card ep" onclick="openEp('${e.id}')"><div class="ic">🎬</div><div class="t" style="flex:1"><b>${esc(e.title||e.topic)}</b><small style="display:block;color:var(--mut)">${e.words.length} слов${dn?" · ⏰ "+dn+" к повторению":""}</small></div>›</div>`}
const V={
home(){const s=D.stats,due=D.words.filter(isDue);return `<div class="top"><div class="av">${esc((D.name||"?")[0])}</div><div class="chip" onclick="go('city')" title="Изменить город">📍 ${esc(D.city)} · ${esc(D.level)} ✏️</div><div></div></div>
<div class="hero"><small>Слов в твоём городе</small><div class="big">${s.words} <span>слов</span></div><div class="stats"><div class="st"><b>${s.due}</b><i>⏰ к повторению</i></div><div class="st"><b>${s.streak} 🔥</b><i>дней подряд</i></div><div class="st"><b>${s.learned}</b><i>выучено</i></div></div></div>
<div class="acts"><div class="a p" onclick="go('topic')"><div>▶️</div>Новая серия</div><div class="a" onclick="go('review')"><div>🔁</div>Повторение</div><div class="a" onclick="nav('eps')"><div>📚</div>Мои серии</div><div class="a" onclick="nav('dict')"><div>📖</div>Словарь</div></div>
${due.length?`<div class="card"><h3>Сегодня к повторению · ${due.length}</h3>${due.slice(0,4).map(word).join("")}<button class="btn" onclick="${due[0].story_id?`openEp('${due[0].story_id}')`:"go('review')"}">📖 Перечитать серию и проверить себя</button></div>`:`<div class="card promo"><div class="e">✨</div><div><b>На сегодня всё повторено</b><p>Самое время для новой серии</p></div></div>`}
<div class="tabs"><div class="tab ${homeTab==="zones"?"on":""}" onclick="homeTab='zones';render()">Город</div><div class="tab ${homeTab==="eps"?"on":""}" onclick="homeTab='eps';render()">Серии</div></div>
${homeTab==="zones"?zoneTiles():(D.episodes.slice().reverse().map(epCard).join("")||'<div class="empty">Серий пока нет</div>')}`},
city(){return `<div class="top"><b style="font-size:24px">${esc(D.city)}</b><div class="chip">${D.words.length} мест</div></div>${zoneTiles()}
<div class="card" style="margin-top:12px" onclick="go('city')"><div class="w"><div class="t"><b>✏️ Добавить или поправить детали</b><small>места, названия, забытые подробности — без анкеты</small></div>›</div></div>
${Object.keys(ZK).map(k=>{const ws=D.words.filter(w=>kindOf(w)===k).sort((a,b)=>(a.chain_order??0)-(b.chain_order??0));return ws.length?`<div class="card" id="z-${k}" style="margin-top:12px"><h3 style="display:flex;justify-content:space-between">${ZK[k][0]} ${ZK[k][2]}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️ Править</span>`:""}</h3>${ws.map(word).join("")}</div>`:""}).join("")}
<p style="color:var(--mut);font-size:12px;text-align:center"><span style="color:var(--grn)">●</span> помню · <span style="color:var(--gold)">●</span> скоро · <span style="color:var(--red)">●</span> пора повторить</p>`},
eps(){return `<div class="top"><b style="font-size:24px">Мои серии</b><div class="chip" onclick="go('topic')">▶️ Новая</div></div>${D.episodes.slice().reverse().map(epCard).join("")||'<div class="empty">Серий пока нет</div>'}`},
ep(){const e=D.episodes.find(x=>x.id===epId);if(!e)return V.eps();return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="nav('eps')">‹</div><b>${esc(e.title)}</b><div></div></div>
<div class="card map"><h3>🗺 Карта серии</h3>${e.words.map(w=>`<div>${isDue(w)?"⏰ ":""}📍 ${esc(placeOf(w.place,w.place_label).t||"—")} — <b onclick="openWord(\'${w.user_word_id}\')" style="text-decoration:underline dotted">${esc((w.article?w.article+" ":"")+w.lemma)}</b> (${esc(w.translation)}) · ${esc(w.syllables||w.lemma)}${sounds(w)?" → "+sounds(w):""}</div>`).join("")}</div>
<div class="card story">${md(e.body)}</div>
<div class="seg"><span class="chip" onclick="go('st_${e.id}')">🧠 Проверить себя</span><span class="chip" onclick="go('st_${e.id}')">✍️ Переписать</span><span class="chip" onclick="go('st_${e.id}')">🔊 Озвучить</span></div>
<button class="btn" onclick="go('review')">🔁 Повторить слова этой серии</button>`},
dict(){const ws=D.words.filter(w=>!q||(w.lemma+" "+w.translation).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
 return `<div class="top"><b style="font-size:24px">Словарь</b><div class="chip">${D.words.length}</div></div><input class="srch" placeholder="Поиск: слово или перевод" value="${esc(q)}" oninput="q=this.value;const c=this.selectionStart;render();const i=$('.srch');i.focus();i.setSelectionRange(c,c)">
<div class="card">${ws.map(word).join("")||'<div class="empty">Ничего не найдено</div>'}</div>`},
word(){const w=wl[wi];if(!w)return V.home();const k=kindOf(w),col={der:"#7aa6ff",die:"#ff8fb0",das:"#6ff0a8",verb:"#f5c542"}[k];const p=placeOf(w.place,w.place_label);
 const due=w.due_at?new Date(w.due_at):null,dd=due&&due.getFullYear()<2090?(isDue(w)?"пора повторить ⏰":"следующее повторение "+due.toLocaleDateString("ru-RU",{day:"numeric",month:"long"})):"ещё не повторялось";
 return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="back()">‹</div><div class="chip">${wi+1} / ${wl.length}</div><div style="font-size:26px;cursor:pointer" onclick="say()">🔊</div></div>
${CARD_V2?card2(w,k,col,p):`<div class="hero" style="text-align:center;padding:28px 18px"><div style="color:${col};font-weight:700;font-size:20px">${esc(w.pos==="verb"?"глагол":w.article||"")}</div>
<div class="big" style="font-size:46px;color:${col}">${esc(w.lemma)}</div><div style="font-size:20px;color:#cfcfda">${esc(w.syllables||w.lemma)}</div><div style="margin-top:8px;font-size:18px">${esc(w.translation)}${w.plural?` <span style="color:var(--mut)">· мн. ${esc(w.plural)}</span>`:""}</div></div>
<div class="card" style="margin-top:12px"><h3 style="display:flex;justify-content:space-between">📍 ${esc(p.t||"Место ещё не выбрано")}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3>${p.c?`<small style="color:var(--mut)">${esc(p.c)}</small>`:""}
${sounds(w)?`<div style="margin-top:10px;font-size:17px">🔤 ${esc(w.syllables||w.lemma)} → ${sounds(w)}</div>`:""}</div>
${w.image?`<div class="card story"><h3>🎬 Образ</h3><p>${esc(w.image)}</p></div>`:""}`}
<div class="card"><div class="w"><div class="t"><b>${dd}</b><small>повторений: ${w.reps||0} · интервал ${w.interval_days||0} дн.</small></div><span style="color:${dot(w)}">●</span></div></div>
<div class="seg">${w.story_id?`<span class="chip" onclick="openEp('${w.story_id}')">📖 Вся серия</span><span class="chip" onclick="go('st_${w.story_id}')">✏️ Переписать</span>`:""}<span class="chip" onclick="step(-1)">← Пред.</span><span class="chip" onclick="step(1)">След. →</span></div>`},
more(){return `<div class="top"><b style="font-size:24px">Ещё</b><div></div></div><div class="card">
<div class="w" onclick="go('review')"><div class="t"><b>🔁 Повторение</b><small>карточки и перечитывание</small></div>›</div>
<div class="w" onclick="go('topic')"><div class="t"><b>🎒 Наборы тем</b><small>выбрать тему для новой серии</small></div>›</div>
<div class="w" onclick="go('series')"><div class="t"><b>💬 Открыть чат с ботом</b><small>все действия — в чате</small></div>›</div></div>`}};
const NAV=[["home","🏠","Главная"],["eps","🎬","Серии"],["city","🏙","Город"],["dict","📖","Словарь"],["more","⋯","Ещё"]];
function openWord(id){const src=tab==="ep"?(D.episodes.find(e=>e.id===epId)||{words:[]}).words:tab==="dict"?D.words.slice().sort((a,b)=>a.lemma.localeCompare(b.lemma,"de")):tab==="home"?D.words.filter(isDue):D.words;
 wl=src.length?src:D.words;wi=Math.max(0,wl.findIndex(w=>w.user_word_id===id));if(tab!=="word")prev=tab;nav("word")}
function step(d){if(!wl.length)return;wi=(wi+d+wl.length)%wl.length;render();scrollTo(0,0)}
function back(){nav(prev||"home")}
const AUDIO="https://wbrpcvbpipeejdnsymdz.supabase.co/storage/v1/object/public/audio/";let player=null;
function speak(w){if(!window.speechSynthesis)return toast("Озвучка появится через пару минут");const u=new SpeechSynthesisUtterance((w.article?w.article+" ":"")+w.lemma);u.lang="de-DE";u.rate=.85;speechSynthesis.cancel();speechSynthesis.speak(u)}
function toast(t){const d=document.createElement("div");d.textContent=t;d.style.cssText="position:fixed;left:50%;bottom:100px;transform:translateX(-50%);background:#2a2a33;color:#fff;padding:10px 16px;border-radius:14px;font-size:14px;z-index:9";document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function say(){const w=wl[wi];if(!w)return;try{if(player)player.pause();player=new Audio(AUDIO+w.word_id+".mp3");player.play().catch(()=>speak(w));player.onerror=()=>speak(w)}catch(e){speak(w)}}
let tx=null;document.addEventListener("touchstart",e=>{tx=e.touches[0].clientX},{passive:true});document.addEventListener("touchend",e=>{if(tab!=="word"||tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60)step(dx<0?1:-1);tx=null},{passive:true});
if(tg&&tg.BackButton)tg.BackButton.onClick(()=>tab==="word"?back():tab==="ep"?nav("eps"):nav("home"));
function render(){if(tg&&tg.BackButton){tab==="home"?tg.BackButton.hide():tg.BackButton.show()}$("#app").innerHTML=V[tab]();const nt=tab==="ep"?"eps":tab==="word"?prev:tab;$("#nav").innerHTML=NAV.map(([k,i,l])=>`<div class="${k===nt?"on":""}" onclick="nav('${k}')"><span>${i}</span>${l}</div>`).join("")}
function nav(t){tab=t;render();scrollTo(0,0)} function openEp(id){epId=id;nav("ep")} function openZone(k){nav("city");setTimeout(()=>{const el=document.getElementById("z-"+k);el&&el.scrollIntoView({behavior:"smooth"})},50)}
(async()=>{const init=tg&&tg.initData;if(!init){$("#app").innerHTML='<div class="load">Открой приложение из бота @'+BOT+'</div>';return}
 try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:init})});if(!r.ok)throw new Error(r.status);D=await r.json();
 const st=new URLSearchParams(location.search).get("screen");if(st)tab=st;if(tab==="ep")epId=D.episodes[0]&&D.episodes[0].id;if(tab==="word"){tab="home";render();openWord((D.words.find(isDue)||D.words[0]||{}).user_word_id);return}render()}
 catch(e){$("#app").innerHTML='<div class="load">Не получилось загрузить данные ('+esc(e.message)+'). Попробуй ещё раз.</div>'}})();

// v2 «грунд» card (2026-10-15): key-style header → части → ассоциации → район → история. On by default; ?card2=0 or window.MC_CARD_V2=false → old card.
const CARD_V2=new URLSearchParams(location.search).get("card2")!=="0"&&window.MC_CARD_V2!==false;
const DOTS={der:"🔵",die:"🔴",das:"🟢",verb:"🟡"},DIST={der:"Мужской район",die:"Женский район",das:"Средний район",verb:"Улица действий"};
function card2(w,k,col,p){const nm=(w.article?w.article+" ":"")+w.lemma,parts=String(w.syllables||w.lemma).split(/\s*[·‧-]\s*/).filter(Boolean),ss=Array.isArray(w.sounds)?w.sounds:[];
 const assoc=ss.length===parts.length?parts.map((x,i)=>`<div>${esc(x)} → «${esc(ss[i])}»</div>`).join(""):esc(parts.join(" · "));
 const story=k==="verb"?`<span style="color:var(--gold)">${esc(w.image||"")}</span>`:esc(w.image||"");
 return `<div class="hero" style="padding:20px 18px"><div style="font-size:24px">${DOTS[k]||"⚪"} <b style="color:${col}">${esc(nm)}</b></div>
<div style="margin-top:6px;font-size:18px">${esc(w.translation)} · ${sounds(w)||"—"}</div></div>
<div class="card" style="margin-top:12px"><h3>🔤 Части и ассоциации</h3><div style="font-size:17px;line-height:1.6">${assoc}</div></div>
<div class="card"><h3 style="display:flex;justify-content:space-between">📍 ${DIST[k]||"Дорога между районами"}${p.t?" — "+esc(p.t):""}${zid(k)?`<span class="chip" onclick="go('ce_z_${zid(k)}')">✏️</span>`:""}</h3></div>
<div class="card story"><h3>🎬 История</h3><p>${story||"История ещё не придумана."}</p></div>`}
