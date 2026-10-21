// Тото в «Городе» (GAMIFICATION_PLAN v5 §5, макеты A_detail hq #309/#313/#316/#318, PM #298, задачи #435–#441, #443–#445).
// Работает ТОЛЬКО если edge прислал «gami» (GAMI_ENABLED + GAMI_ALLOWLIST, набор ассетов активен) — иначе ничего не меняет.
// * Житель — код (toto.js: window.TOTO[ступень][calm|joy|doze] = inline SVG, code-art e319ce6), грузится лениво при первом
//   «Городе»; фон — WebP текущей ступени; ничего не предзагружаем (ни следующую ступень, ни сундуки, ни силуэты).
// * Анимации — только transform / opacity; prefers-reduced-motion → статичный кадр.
// * Чисел P нет нигде (#438): только полоса и «скоро …». Монеты — только в бейдже Ⓜ (его рисует coins.js, здесь не трогаем).
// * «⬅️ Назад» — живая .bk (goBack), как на всех экранах; названия ступеней города — ТОЛЬКО из GR (coins.js = core/growth.py).
(function(){
const G=()=>D&&D.gami&&D.gami.set?D.gami:null, R=()=>(G()||{}).resident||{};
const NAME="Тото", IMG="img/", RM=()=>matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const CAMPFIRE="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 80 90\" width=\"140\" height=\"158\"><defs><filter id=\"mcf-n\" filterUnits=\"userSpaceOnUse\" x=\"-20\" y=\"-20\" width=\"300\" height=\"300\"><feGaussianBlur stdDeviation=\"1.6\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter><linearGradient id=\"mcf-fr\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#1B2046\"/><stop offset=\"1\" stop-color=\"#0B0D20\"/></linearGradient><linearGradient id=\"mcf-lid\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#262C5C\"/><stop offset=\"1\" stop-color=\"#151935\"/></linearGradient><radialGradient id=\"mcf-in\" cx=\".5\" cy=\".8\" r=\".7\"><stop offset=\"0\" stop-color=\"#FFFFFF\"/><stop offset=\".35\" stop-color=\"#9FF4FF\"/><stop offset=\"1\" stop-color=\"#27E8FF\" stop-opacity=\"0\"/></radialGradient><linearGradient id=\"mcf-beam\" x1=\"0\" y1=\"1\" x2=\"0\" y2=\"0\"><stop offset=\"0\" stop-color=\"#CFFAFF\" stop-opacity=\".75\"/><stop offset=\"1\" stop-color=\"#27E8FF\" stop-opacity=\"0\"/></linearGradient><radialGradient id=\"mcf-fl\" cx=\".5\" cy=\".8\" r=\".75\"><stop offset=\"0\" stop-color=\"#FFFFFF\"/><stop offset=\".3\" stop-color=\"#BFF8FF\"/><stop offset=\".62\" stop-color=\"#27E8FF\"/><stop offset=\"1\" stop-color=\"#8F6BFF\"/></radialGradient></defs><ellipse cx=\"40\" cy=\"83\" rx=\"30\" ry=\"4.5\" fill=\"#000\" opacity=\".5\"/><ellipse cx=\"40\" cy=\"80\" rx=\"26\" ry=\"6\" fill=\"#27E8FF\" opacity=\".16\"/><ellipse cx=\"17\" cy=\"81\" rx=\"5\" ry=\"3\" fill=\"#161A36\" stroke=\"#27E8FF\" stroke-width=\".6\" stroke-opacity=\".6\"/><ellipse cx=\"27\" cy=\"84\" rx=\"5.5\" ry=\"3\" fill=\"#161A36\" stroke=\"#27E8FF\" stroke-width=\".6\" stroke-opacity=\".6\"/><ellipse cx=\"40\" cy=\"85.5\" rx=\"6\" ry=\"3\" fill=\"#161A36\" stroke=\"#27E8FF\" stroke-width=\".6\" stroke-opacity=\".6\"/><ellipse cx=\"53\" cy=\"84\" rx=\"5.5\" ry=\"3\" fill=\"#161A36\" stroke=\"#27E8FF\" stroke-width=\".6\" stroke-opacity=\".6\"/><ellipse cx=\"63\" cy=\"81\" rx=\"5\" ry=\"3\" fill=\"#161A36\" stroke=\"#27E8FF\" stroke-width=\".6\" stroke-opacity=\".6\"/><g transform=\"rotate(-12 40 77)\"><rect x=\"12\" y=\"73\" width=\"56\" height=\"8\" rx=\"4\" fill=\"#1A1D30\"/><rect x=\"12\" y=\"73\" width=\"56\" height=\"8\" rx=\"4\" fill=\"none\" stroke=\"#27E8FF\" stroke-width=\"1.1\" filter=\"url(#mcf-n)\"/><circle cx=\"14\" cy=\"77\" r=\"2.2\" fill=\"none\" stroke=\"#27E8FF\" stroke-width=\".8\"/></g><g transform=\"rotate(12 40 77)\"><rect x=\"12\" y=\"73\" width=\"56\" height=\"8\" rx=\"4\" fill=\"#1A1D30\"/><rect x=\"12\" y=\"73\" width=\"56\" height=\"8\" rx=\"4\" fill=\"none\" stroke=\"#A6FF3B\" stroke-width=\"1.1\" filter=\"url(#mcf-n)\"/><circle cx=\"66\" cy=\"77\" r=\"2.2\" fill=\"none\" stroke=\"#A6FF3B\" stroke-width=\".8\"/></g><path d=\"M40 8 C 50 26, 62 36, 59 56 C 57 70, 48 76, 40 76 C 31 76, 21 70, 21 57 C 20 44, 30 38, 34 24 C 38 33, 44 30, 40 8Z\" fill=\"#8F6BFF\" opacity=\".55\" filter=\"url(#mcf-n)\"/><path d=\"M24 44 C 20 54, 22 64, 30 70 C 24 62, 26 54, 24 44Z M58 40 C 64 50, 60 62, 52 70 C 58 60, 56 50, 58 40Z\" fill=\"#8F6BFF\" opacity=\".9\"/><path d=\"M40 8 C 50 26, 62 36, 59 56 C 57 70, 48 76, 40 76 C 31 76, 21 70, 21 57 C 20 44, 30 38, 34 24 C 38 33, 44 30, 40 8Z\" fill=\"url(#mcf-fl)\" transform=\"translate(40 76) scale(.86) translate(-40 -76)\"/><path d=\"M40 34 C 47 46, 51 54, 49 63 C 47 70, 34 70, 32 63 C 30 55, 38 50, 40 34Z\" fill=\"#FFFFFF\" opacity=\".95\"/><circle cx=\"27\" cy=\"18\" r=\"1.3\" fill=\"#9FF4FF\" filter=\"url(#mcf-n)\"/><circle cx=\"55\" cy=\"22\" r=\"1.1\" fill=\"#9FF4FF\" filter=\"url(#mcf-n)\"/><circle cx=\"47\" cy=\"4\" r=\"0.9\" fill=\"#FFFFFF\" filter=\"url(#mcf-n)\"/></svg>";
const LS=k=>{try{return JSON.parse(localStorage.getItem("tt_"+k)||"null")}catch(e){return null}},
 SV=(k,v)=>{try{localStorage.setItem("tt_"+k,JSON.stringify(v))}catch(e){}};
const GM=window.GM={seenOnce:{},look:false,
 asset(slot){const a=(G().assets||{})[slot];return a&&a.path?IMG+String(a.path).split("/").pop():""},
 pose(r){r=r||R();return r.mood==="dozing"&&!GM.look?"doze":(GM.joy?"joy":"calm")},
 svg(stage,pose){const T=window.TOTO;return T&&T[String(stage)]?T[String(stage)][pose]||T[String(stage)].calm:""},
 load(){if(window.TOTO||GM._ld)return;GM._ld=1;const s=document.createElement("script");s.src="toto.js?v=e319ce6";s.async=true;
  s.onload=()=>{const up=document.getElementById("ttflash"),pe=document.getElementById("ttpet");   // экран роста не перерисовываем (#471)
   if(up&&pe){const r=R();pe.innerHTML=GM.svg(r.stage||1,"joy")||pe.innerHTML;return}if(tab==="city"||tab==="gCard")render()};s.onerror=()=>{GM._ld=0};document.head.appendChild(s)},
 // #496 (PM 03:06): праздник и тост помечаются «показан» ТОЛЬКО после фактического показа на «Городе» и только тем, что
 // показали: {stage} праздника / {at} тоста. Сервер (gami_seen) идемпотентен. Не дошло (сеть, 401, 429, мини-апп закрыли
 // сразу) → ничего не помечено → при следующем открытии «Города» праздник и тост покажутся снова. В этой сессии повтора нет
 // (upDone / reactAt в памяти); localStorage up / rat — только ПОСЛЕ ответа ok (защита от устаревшего payload).
 // intro — как раньше: пометка «в ожидании» уходит снова.
 seen(what,x){x=x||{};const k=what+":"+(x.stage||x.at||"");if(GM.seenOnce[k])return;GM.seenOnce[k]=1;
  if(what==="intro"){const P=LS("pend")||{};P.intro=1;SV("pend",P)}
  Promise.resolve().then(()=>api({op:"gami_seen",what,...x})).then(r=>{if(r&&r.ok){
   if(what==="intro"){const Q=LS("pend")||{};delete Q.intro;SV("pend",Q)}if(what==="stage"&&x.stage)SV("up",x.stage);if(what==="react"&&x.at)SV("rat",x.at)}}).catch(()=>{})},
 retry(){const P=LS("pend")||{};if(P.intro&&!GM.seenOnce["intro:"])GM.seen("intro");if(P.stage||P.react)SV("pend",P.intro?{intro:1}:{})},
 due(){return (D.words||[]).filter(isDue).length},
 chest(){const n=GM.due();GM.look=true;if(ACT_ON())return act("🧰 Сундук","chest");return toChat("chest")},
 hop(){if(RM())return;const el=document.getElementById("ttpet");if(!el)return;el.classList.remove("hop");void el.offsetWidth;el.classList.add("hop")}};
// --- компонент «житель» (сменный: другой набор = другой component / свои спрайты) ---
function pet(r,cls){const p=GM.pose(r),sv=GM.svg(r.stage||1,p);GM.load();
 return `<div class="tt-pet ${cls||""} ${p}" id="ttpet" data-stage="${r.stage||1}" data-pose="${p}" aria-label="${NAME} · ${esc(r.title||"")}">${sv||`<span class="tt-emoji">🦝</span>`}</div>`}
function stageCap(){const g=(D.coins||{}).growth;if(!g||!window.GR)return "";const s=g.stage||0;
 return `<div class="tt-cap" id="ttcap">${GR.icon[s]||""} Ступень ${s} из 6 · ${esc(GR.name[s]||"")}</div>`}
// «Тото · Юнга ›» — чип тёмного стекла в углу карты (hq #316): ОТКРЫТЫЙ ВОПРОС — Designer ещё сжимает; отдельный компонент
function chip(r){const p=GM.pose(r);return `<div class="tt-chip" id="ttchip" onclick="to('gCard')"><span class="tt-av">${GM.svg(r.stage||1,p)||"🦝"}</span><b>${NAME} · ${esc(r.title||"")}${p==="doze"?" · дремлет":""}</b><span class="tt-ch">›</span></div>`}
function scene(r,opt){opt=opt||{};const bg=GM.asset((G().now||{}).bg||""),gs=((D.coins||{}).growth||{}).stage||0;
 return `<div class="tt-hero ${opt.cls||""}" id="tthero">${bg?`<img class="tt-bg" src="${bg}" alt="" decoding="async" fetchpriority="low" onerror="this.remove()">`:""}
${window.MAPA?MAPA.svg(Math.max(gs,0),D.growth_map||{}):""}<div class="tt-fire">${CAMPFIRE}</div>${pet(r)}${opt.nocap?"":stageCap()}${opt.nochip?"":chip(r)}${opt.extra||""}</div>`}
function bar(r){if(!r.next_open)return `<div class="card tt-nx"><b>${NAME} — ${esc(r.title||"")}</b><p class="mut">Дальше — ${esc(r.next_title||"Хранитель района")}, скоро.</p></div>`;
 return `<div class="card tt-nx"><b>До следующего: «${esc(r.next_title||"")}»</b><div class="bar"><i style="width:${Math.round(100*Math.max(0,Math.min(1,+r.bar||0)))}%"></i></div>
<p class="mut">${r.near?`Ещё чуть-чуть — и ${NAME} станет ${esc(r.next_ins||r.next_title||"")}`:`${NAME} растёт от каждого перевода, который ты пишешь сам`}</p></div>`}
function chestBtn(r){const n=GM.due();
 if(!n)return `<div class="tt-empty">🧰 Сундук пуст — новые слова созреют позже</div>`;
 if(ACT_ON())return `<button class="btn tt-chest" id="ttchest" onclick="GM.chest()">🧰 Открыть сундук · ${n}</button>`;
 return `<button class="btn tt-chest" id="ttchest" onclick="GM.chest()">💬 Повторить в чате · ${n}</button><p class="mut tt-hint">${NAME} подпрыгнет, когда вернёшься</p>`}
function react(r){const x=r.react||{},n=+x.n||0,at=String(x.at||""),ax=at?{at}:{};if(!n)return "";
 if(at&&at===LS("rat")){GM.seen("react",ax);return ""}          // #496: этот тост сервер уже подтвердил (payload устарел)
 GM.joy=true;if(GM.reactAt!==at){GM.reactAt=at;setTimeout(()=>{GM.hop();if(document.visibilityState!=="hidden")GM.seen("react",ax)},350)}
 const sp=RM()?"":Array.from({length:6},(_,i)=>`<i class="tt-sp" style="--i:${i}"></i>`).join("");
 return `<div class="tt-toast" id="tttoast">✨ ${n} ${plr(n,"слово вспомнилось","слова вспомнились","слов вспомнились")} — окна зажглись</div><div class="tt-sparks">${sp}</div>`}
function intro(r){if(r.intro_seen||GM.seenOnce["intro:"])return "";setTimeout(()=>GM.seen("intro"),400);
 return `<div class="card tt-intro"><b>${(r.react||{}).n?`${NAME} видел твои первые слова`:`Это ${NAME}`}</b><p>Здесь вырастет твой город. Завтра эти слова созреют — откроем сундук вместе.</p></div>`}
// --- «Город» ---
const _city=V.city;
V.city=function(){const g=G();if(!g||D.reset||typeof window.CITY0!=="function")return _city();
 const r=R();let h=CITY0();
 GM.retry();
 if(r.stage>(r.stage_seen||1)&&!GM.upDone){if(r.stage>(+LS("up")||0))return V.gUp();GM.seen("stage",{stage:r.stage})}   // #496: up — только после ok
 const dz=r.mood==="dozing"&&!GM.look&&GM.due();
 const top=dz?`<div class="tt-hello"><b>С возвращением!</b><span class="mut">${NAME} задремал, пока тебя не было</span></div>`:"";
 const block=`<div class="tt-wrap">${scene(r,{extra:react(r)})}${top}${intro(r)}${chestBtn(r)}${dz?`<a class="link" id="ttlook" onclick="GM.look=true;render()">Просто посмотреть город</a>`:""}${bar(r)}</div>`;
 h=h.replace(revRow(D.words),"");
 const ED=/<div class="card" onclick="go\('city'\)"><div class="w"><div class="t"><b>✏️ Добавить или поправить детали<\/b>[\s\S]*?›<\/div><\/div>/,em=h.match(ED),edit=em?em[0]:"";if(edit)h=h.replace(ED,"");
 return h.replace(/(<div class="top">[\s\S]*?<\/div>\s*<\/div>|<div class="top">[\s\S]*?<\/div>)/,"$1"+block+edit).replace('<div class="grid">','<div class="grid tt-tiles">')};
// --- новая стадия (если рост не показал итог сундука в боте): сжатие → вспышка → проявление, один раз ---
V.gUp=function(){const r=R(),st=r.stage;GM.joy=true;GM.upDone=1;   // «Назад» → «Город» в этой сессии не повторяет
 setTimeout(()=>{r.stage_seen=st},0);
 setTimeout(()=>{if(document.visibilityState!=="hidden")GM.seen("stage",{stage:st})},250);   // #496: отметка — когда праздник уже на экране
 setTimeout(()=>{const p=document.getElementById("ttpet"),f=document.getElementById("ttflash");if(!p||RM())return;p.classList.add("squash");
  setTimeout(()=>{f&&f.classList.add("go");p.classList.remove("squash");p.classList.add("appear")},150)},200);
 return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">🦝 ${NAME} стал ${esc(r.title_ins||r.title||"")}!</div>
${scene(r,{nochip:true,extra:`<div class="tt-flash" id="ttflash"></div>`})}<div class="card"><p style="margin:0">${NAME} растёт от слов, которые ты вспоминаешь и пишешь сам.</p></div>
<button class="btn" id="ttupnext" onclick="GM.upDone=1;nav('city',{replace:true})">Дальше</button>`};
// --- карточка Тото 02 (тап по чипу) ---
V.gCard=function(){const r=R(),L=(G().ladder||[]);
 const tr=L.map(x=>{const cur=x.stage===r.stage,nxt=x.stage===r.stage+1,soon=!x.open,img=soon?GM.asset("resident.soon.s"+x.stage):"";
  return `<div class="${cur?"cur":""} ${nxt?"nxt":""} ${soon?"lock":""}">${soon?(img?`<img src="${img}" alt="" loading="lazy">`:"·"):`<span class="tt-mini">${x.stage<=r.stage||nxt?GM.svg(x.stage,"calm")||"🦝":"🦝"}</span>`}${esc(x.title)}${soon?"<small>скоро</small>":""}</div>`}).join("");
 return `<div class="bk" onclick="goBack()">⬅️ Назад</div><div class="ttl">🦝 ${NAME} · ${esc(r.title||"")}</div>
<div class="tt-cardpet">${pet(r,"big")}</div>${bar(r)}<div class="card"><div class="tt-track">${tr}</div></div>
<div class="card"><p style="margin:0">${NAME} живёт в твоём городе и растёт, когда ты сам пишешь перевод слова. Ничего не теряется: пропустил день — ${NAME} просто задремлет.</p></div>`};
// навигация: новые экраны живут внутри вкладки «Город»
const _nk=window.navKey;if(typeof _nk==="function")window.navKey=function(t,p){return t==="gCard"||t==="gUp"?"city":_nk(t,p)};
})();
