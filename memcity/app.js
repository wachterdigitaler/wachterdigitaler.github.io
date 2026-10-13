const API="https://wbrpcvbpipeejdnsymdz.supabase.co/functions/v1/memcity-app", BOT="fixDeutsch_bot";
const tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor("#0b0b0f");tg.setBackgroundColor("#0b0b0f")}catch(e){}}
const $=s=>document.querySelector(s), esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let D=null, tab="home", epId=null, q="", homeTab="zones";
const ZK={der:["🔵","der","Мужской район","#2d6cff,#1a3d99"],die:["🔴","die","Женский район","#ff5d8a,#a3244c"],das:["🟢","das","Средний район","#22c58b,#0e7a55"],verb:["🟡","глаголы","Улица действий","#f5c542,#b07d00"]};
const kindOf=w=>w.pos==="verb"?"verb":(w.article||w.zone_kind||"das");
const isDue=w=>w.due_at&&Date.parse(w.due_at)<=Date.now();
const dot=w=>isDue(w)?"var(--red)":(w.due_at&&Date.parse(w.due_at)-Date.now()<2*864e5?"var(--gold)":"var(--grn)");
const sounds=w=>(Array.isArray(w.sounds)?w.sounds:[]).map(s=>"«"+esc(s)+"»").join(" + ");
const go=p=>{ if(tg&&tg.openTelegramLink){tg.openTelegramLink(`https://t.me/${BOT}?start=${p}`);setTimeout(()=>tg.close(),300)} else location.href=`https://t.me/${BOT}?start=${p}` };
const word=w=>`<div class="w"><span class="art ${w.pos==="verb"?"verb":(w.article||"")}">${w.pos==="verb"?"verb":esc(w.article||"")}</span><div class="t"><b>${esc(w.syllables||w.lemma)}</b><small>${esc(w.translation)}${sounds(w)?" · "+sounds(w):""}${w.place?" · 📍 "+esc(w.place):""}</small></div><span style="color:${dot(w)}">●</span></div>`;
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/🟡\s?([^\s.,!?;:]+)/g,"<b>$1</b>").split(/\n{2,}/).map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("")}
function zoneTiles(){const g={};D.words.forEach(w=>{const k=kindOf(w);(g[k]=g[k]||[]).push(w)});
 return `<div class="grid">${Object.keys(ZK).map(k=>{const ws=g[k]||[],z=ZK[k],dn=ws.filter(isDue).length,zn=D.zones.find(x=>x.kind===k);const pct=ws.length?Math.round(100*ws.filter(w=>!isDue(w)).length/ws.length):0;
 return `<div class="tile" onclick="openZone('${k}')" style="background:linear-gradient(150deg,${z[3]});${k==="verb"?"color:#1a1300":""}"><div style="font-size:24px">${z[0]} ${z[1]}</div><div><b>${z[2]}</b><small>${zn?esc(zn.name)+" · ":""}${ws.length} слов${dn?" · ⏰"+dn:""}</small><div class="bar"><i style="width:${pct}%;${k==="verb"?"background:#1a1300":""}"></i></div></div></div>`}).join("")}</div>`}
function epCard(e){const dn=e.words.filter(isDue).length;return `<div class="card ep" onclick="openEp('${e.id}')"><div class="ic">🎬</div><div class="t" style="flex:1"><b>${esc(e.title||e.topic)}</b><small style="display:block;color:var(--mut)">${e.words.length} слов${dn?" · ⏰ "+dn+" к повторению":""}</small></div>›</div>`}
const V={
home(){const s=D.stats,due=D.words.filter(isDue);return `<div class="top"><div class="av">${esc((D.name||"?")[0])}</div><div class="chip">📍 ${esc(D.city)} · ${esc(D.level)}</div><div></div></div>
<div class="hero"><small>Слов в твоём городе</small><div class="big">${s.words} <span>слов</span></div><div class="stats"><div class="st"><b>${s.due}</b><i>⏰ к повторению</i></div><div class="st"><b>${s.streak} 🔥</b><i>дней подряд</i></div><div class="st"><b>${s.learned}</b><i>выучено</i></div></div></div>
<div class="acts"><div class="a p" onclick="go('topic')"><div>▶️</div>Новая серия</div><div class="a" onclick="go('review')"><div>🔁</div>Повторение</div><div class="a" onclick="nav('eps')"><div>📚</div>Мои серии</div><div class="a" onclick="nav('dict')"><div>📖</div>Словарь</div></div>
${due.length?`<div class="card"><h3>Сегодня к повторению · ${due.length}</h3>${due.slice(0,4).map(word).join("")}<button class="btn" onclick="${due[0].story_id?`openEp('${due[0].story_id}')`:"go('review')"}">📖 Перечитать серию и проверить себя</button></div>`:`<div class="card promo"><div class="e">✨</div><div><b>На сегодня всё повторено</b><p>Самое время для новой серии</p></div></div>`}
<div class="tabs"><div class="tab ${homeTab==="zones"?"on":""}" onclick="homeTab='zones';render()">Город</div><div class="tab ${homeTab==="eps"?"on":""}" onclick="homeTab='eps';render()">Серии</div></div>
${homeTab==="zones"?zoneTiles():(D.episodes.slice().reverse().map(epCard).join("")||'<div class="empty">Серий пока нет</div>')}`},
city(){return `<div class="top"><b style="font-size:24px">${esc(D.city)}</b><div class="chip">${D.words.length} мест</div></div>${zoneTiles()}
${Object.keys(ZK).map(k=>{const ws=D.words.filter(w=>kindOf(w)===k).sort((a,b)=>(a.chain_order??0)-(b.chain_order??0));return ws.length?`<div class="card" id="z-${k}" style="margin-top:12px"><h3>${ZK[k][0]} ${ZK[k][2]}</h3>${ws.map(word).join("")}</div>`:""}).join("")}
<p style="color:var(--mut);font-size:12px;text-align:center"><span style="color:var(--grn)">●</span> помню · <span style="color:var(--gold)">●</span> скоро · <span style="color:var(--red)">●</span> пора повторить</p>`},
eps(){return `<div class="top"><b style="font-size:24px">Мои серии</b><div class="chip" onclick="go('topic')">▶️ Новая</div></div>${D.episodes.slice().reverse().map(epCard).join("")||'<div class="empty">Серий пока нет</div>'}`},
ep(){const e=D.episodes.find(x=>x.id===epId);if(!e)return V.eps();return `<div class="top"><div style="font-size:26px;cursor:pointer" onclick="nav('eps')">‹</div><b>${esc(e.title)}</b><div></div></div>
<div class="card map"><h3>🗺 Карта серии</h3>${e.words.map(w=>`<div>${isDue(w)?"⏰ ":""}📍 ${esc(w.place||"—")} — <b>${esc((w.article?w.article+" ":"")+w.lemma)}</b> (${esc(w.translation)}) · ${esc(w.syllables||w.lemma)}${sounds(w)?" → "+sounds(w):""}</div>`).join("")}</div>
<div class="card story">${md(e.body)}</div>
<div class="seg"><span class="chip" onclick="go('st_${e.id}')">🧠 Проверить себя</span><span class="chip" onclick="go('st_${e.id}')">✍️ Переписать</span><span class="chip" onclick="go('st_${e.id}')">🔊 Озвучить</span></div>
<button class="btn" onclick="go('review')">🔁 Повторить слова этой серии</button>`},
dict(){const ws=D.words.filter(w=>!q||(w.lemma+" "+w.translation).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.lemma.localeCompare(b.lemma,"de"));
 return `<div class="top"><b style="font-size:24px">Словарь</b><div class="chip">${D.words.length}</div></div><input class="srch" placeholder="Поиск: слово или перевод" value="${esc(q)}" oninput="q=this.value;const c=this.selectionStart;render();const i=$('.srch');i.focus();i.setSelectionRange(c,c)">
<div class="card">${ws.map(w=>`<div onclick="${w.story_id?`openEp('${w.story_id}')`:""}">${word(w)}</div>`).join("")||'<div class="empty">Ничего не найдено</div>'}</div>`},
more(){return `<div class="top"><b style="font-size:24px">Ещё</b><div></div></div><div class="card">
<div class="w" onclick="go('review')"><div class="t"><b>🔁 Повторение</b><small>карточки и перечитывание</small></div>›</div>
<div class="w" onclick="go('topic')"><div class="t"><b>🎒 Наборы тем</b><small>выбрать тему для новой серии</small></div>›</div>
<div class="w" onclick="go('series')"><div class="t"><b>💬 Открыть чат с ботом</b><small>все действия — в чате</small></div>›</div></div>`}};
const NAV=[["home","🏠","Главная"],["eps","🎬","Серии"],["city","🏙","Город"],["dict","📖","Словарь"],["more","⋯","Ещё"]];
function render(){$("#app").innerHTML=V[tab]();const nt=tab==="ep"?"eps":tab;$("#nav").innerHTML=NAV.map(([k,i,l])=>`<div class="${k===nt?"on":""}" onclick="nav('${k}')"><span>${i}</span>${l}</div>`).join("")}
function nav(t){tab=t;render();scrollTo(0,0)} function openEp(id){epId=id;nav("ep")} function openZone(k){nav("city");setTimeout(()=>{const el=document.getElementById("z-"+k);el&&el.scrollIntoView({behavior:"smooth"})},50)}
(async()=>{const init=tg&&tg.initData;if(!init){$("#app").innerHTML='<div class="load">Открой приложение из бота @'+BOT+'</div>';return}
 try{const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({initData:init})});if(!r.ok)throw new Error(r.status);D=await r.json();
 const st=new URLSearchParams(location.search).get("screen");if(st)tab=st;if(tab==="ep")epId=D.episodes[0]&&D.episodes[0].id;render()}
 catch(e){$("#app").innerHTML='<div class="load">Не получилось загрузить данные ('+esc(e.message)+'). Попробуй ещё раз.</div>'}})();
