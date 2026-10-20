// #299 (NordSturm 17.10 20:44, 21:12–21:13; TZ #179 rev. 2, design #185/#188, PM #187): coins, city growth and the MEMC
// token as a SHOWCASE. It only LOOKS like it works: no limits, no prices, no real payments (no payment API call), no TON
// network / SDK, every operation is a test row. Shown only when the edge payload carries D.coins (flags OFF → nothing).
// «⬅️ Назад» (design proto/nav.js, #188): a finishing action REPLACES its step — 04b → 01, T2b/T3b/T5b → T1b,
// 09/09b → 08; a growth event is shown once (growth_seen). One balance number on the whole path (always D.coins).
// #316 (Tester #204) + NordSturm 18.10: STRICT ≤ 3 buttons on a screen incl. «⬅️ Назад». Монетки = 👛 Кошелёк · 👥 Позвать
// друга; ONE «👛 Кошелёк» holds Пополнить (packs, receipts), Pro and the token: Кошелёк = ⭐ Пополнить · 👑 Pro (token on:
// ⭐ Пополнить · ⋯ Ещё → 👑 Pro · Ⓜ Токен); Пополнить = 1 pack + «⋯ Ещё суммы» a page, the last page 2 packs; receipt
// «Назад» → Кошелёк; TON wallet = Ⓜ Купить · ⋯ Ещё (🔁 В монетки · ⋯ Ещё → ↗️ Вывести · Отключить); TON amount typed.
// #314: the «−10 за часть» line only right after the charge (last_part.fresh), never on a later re-read.
(function(){
const CVIEWS=["coins","wallet","walletMore","coinsMore","shop","shop2","shop3","shop4","shop5","shopOk","tokenMore","tokenMore2","pro","ref","token","tokenBuy","tokenBuyOk","tokenConv","tokenConvOk","tokenEarn","tokenOut","tokenOutOk","gEvent"];
let CST=[], CORG="home", TK={on:false,buy:0,conv:0,out:0,last:null}, PRO_OK=false;
const C=()=>D&&D.coins, F=()=>(C()&&C().flags)||{};
const TEST=`<div class="tst">🧪 Тестовый режим — ничего не списывается</div>`, TTEST=`<div class="tst">🧪 Тестовый режим — без настоящих TON и токенов</div>`;
const TN=()=>esc(F().token_name||"MEMC");
const coin=n=>`<span class="cn">Ⓜ</span> ${n}`;
const bal=()=>C()?C().balance:0;
const proOn=()=>C()&&C().pro_until&&Date.parse(C().pro_until)>Date.now();
const ruDate=s=>{try{return new Date(s).toLocaleDateString("ru-RU",{day:"numeric",month:"long",timeZone:"Europe/Berlin"})}catch(e){return ""}};
const bk=`<div class="bk" onclick="CV.back()">⬅️ Назад</div>`;
function hist(h){const n=(F().daily_n||5);return (h||[]).filter(x=>x.delta).map(x=>{const d=x.delta,w=x.kind==="spent_part"?String(x.title||"часть").replace(/^Глава\s+/,"").replace(/[«»]/g,"").replace(" · часть",", часть"):({daily_5words:`${n} слов за сегодня`,purchase:"тестовая покупка",referral:"друг засчитан",referral_welcome:"тебя пригласили",token_convert:"из "+(F().token_name||"MEMC"),refund:"возврат"})[x.kind]||"";
 return `<div class="hl"><span>${esc(w)}</span><b class="${d>0?"pl":"mn"}">${d>0?"+":"−"}${Math.abs(d)}</b></div>`}).join("")}
const CV=window.CV={
 is:t=>CVIEWS.includes(t),
 navOf:t=>t==="gEvent"?"city":"more",
 open(v){if(!C())return;if(CV.is(tab))CST.push(tab);else{CORG=tab;CST=[];window.navPush&&navPush()}tab=v;render();scrollTo(0,0)},   // miniapp-inapp-nav: the screen it came from is on the app's back stack
 rep(v){tab=v;render();scrollTo(0,0)},     // a finishing step replaces the current one (never a «Назад» target)
 back(){if(tab==="gEvent"){CV._ev=null;tab="city";render();scrollTo(0,0);return}const p=CST.pop();if(p){tab=p;render();scrollTo(0,0)}else if(window.navPop)navPop();else nav(CORG||"home")},
 async op(b){let r={};try{r=await api(b)}catch(e){r={error:"server"}}if(r&&r.coins)D.coins=r.coins;return r||{}},
};
// ---------- M0 chip + M5 line (streak tile kept, RC 18.10) ----------
CV.chip=()=>C()?`<div class="cchip" id="cchip" onclick="CV.open('coins')">${coin(bal())}${proOn()?` <span class="pro">👑 Pro</span>`:""}</div>`:"";   // PM #324: Home = the Ⓜ plaque only — no flying «−10» (it was clipped at the top); the line stays under the part
CV.partLine=sid=>{const c=C(),lp=c&&c.last_part;if(!lp||!lp.fresh||(sid&&lp.story_id!==sid))return "";const n=F().daily_n||5,b=[];
 if(lp.daily)b.push(`+${F().daily_bonus||200} за ${n} слов`);if(lp.delta)b.push(`−${Math.abs(lp.delta)} за часть`);b.push(`у тебя ${bal()}`);
 return `<div class="cline" id="cline"><i><span class="cn">Ⓜ</span> ${b.join(" · ")}</i></div>`};
const _book=V.book;
V.book=V.home=function(){let h=_book();if(!C()||D.reset)return h;
 h=h.replace(/<div class="ver">/,CV.chip()+'<div class="ver">');
 // RC 18.10 22:18 (NordSturm «за основу бери вид, который сейчас»): the streak tile stays; coins = the chip only (additive)
 // RC 18.10 22:45 (NordSturm): the main screen = live pixel for pixel except the top «Ⓜ N» badge — no part line here
 // (the «Ⓜ −10 за часть» line stays under the story itself, V.ep); the growing city lives only in «Город»
 return h};
const _ep=V.ep;
V.ep=function(){let h=_ep();if(!C())return h;return h.replace(/(<div class="card story read">[\s\S]*?<\/div>)/,"$1"+CV.partLine(epId))};
const _more=V.more;
V.more=function(){let h=_more();if(!C())return h;   // RC 19.10 (NordSturm): the growing city only in «Город» — no stage here
 return h.replace(/<div class="card">/,`<div class="card"><div class="w" id="coinsitem" onclick="CV.open('coins')"><div class="t"><b>🪙 Монетки</b><small>${coin(bal())}</small></div>›</div>
</div><div class="card">`)};
// ---------- M1 Монетки ----------
V.coins=function(){const c=C(),f=F(),how=(f.rules||[]).map(r=>`<div class="hl"><span>${esc(r.t)}</span><b class="pl">+${r.n}</b></div>`).join("");
 return `${bk}<div class="ttl">Монетки <span class="tag">🧪 тест</span></div><div class="hero cbig"><div class="cbg">Ⓜ</div><div class="big" id="cbal">${bal()}</div><small>заработано ${c.earned} · куплено ${c.purchased}</small></div>
${how?`<div class="card"><h3>Как получить</h3>${how}</div>`:""}${(c.history||[]).length?`<div class="card"><h3>История</h3>${hist(c.history)}</div>`:""}
<div class="row2"><button class="btn" id="towallet" onclick="CV.open('wallet')">👛 Кошелёк</button><button class="btn sec" id="toref" onclick="CV.open('ref')">👥 Позвать друга</button></div>`};
// ---------- 👛 Кошелёк: the ONE place for Пополнить / покупки / квитанции / Pro / токен ----------
V.wallet=function(){const c=C(),f=F();return `${bk}<div class="ttl">👛 Кошелёк <span class="tag">🧪 тест</span></div><div class="card"><div class="hl"><span>У тебя</span><b id="wbal">${coin(bal())}</b></div><small class="mut">заработано ${c.earned} · куплено ${c.purchased}</small>${proOn()?`<div class="hl"><span>👑 Pro</span><b>до ${esc(ruDate(c.pro_until))}</b></div>`:""}</div>
<div class="row2"><button class="btn" id="toshop" onclick="CV.open('shop')">⭐ Пополнить</button>${f.token?`<button class="btn sec" id="wmore" onclick="CV.open('walletMore')">⋯ Ещё</button>`:`<button class="btn sec" id="topro" onclick="CV.open('pro')">👑 Pro</button>`}</div>`};
V.walletMore=()=>`${bk}<div class="ttl">👛 Кошелёк · ещё <span class="tag">🧪 тест</span></div><div class="card"><div class="hl"><span>У тебя</span><b>${coin(bal())}</b></div></div>
<div class="row2"><button class="btn sec" id="topro" onclick="CV.open('pro')">👑 Pro</button><button class="btn tok" id="totoken" onclick="CV.open('token')"><span class="cn">Ⓜ</span> Токен</button></div>`;
V.coinsMore=V.wallet;   // the unreleased «Монетки · ещё» → Кошелёк
// ---------- M2 Пополнить → квитанция (replace) ----------
// strict ≤ 3 incl. «Назад»: one pack + «⋯ Ещё суммы» a page, the last page two packs (≤ 2 packs → one page)
const packs=()=>F().packs||[], SHOPV=["shop","shop2","shop3","shop4","shop5"];
const shopPages=()=>{const n=packs().length,r=[];let i=0;while(n-i>2&&r.length<SHOPV.length-1){r.push([i,i+1]);i++}r.push([i,n]);return r};
const shopPg=k=>{const pg=shopPages(),[a,b]=pg[Math.min(k,pg.length-1)],more=k<pg.length-1;
 return `${bk}<div class="ttl">⭐ Пополнить</div>${TEST}<div class="packs">${packs().map((p,i)=>i<a||i>=b?"":`<div class="pack" id="pk${i}" onclick="CV.buy(${i})"><b>+${p.coins} <span class="cn">Ⓜ</span></b><small>${esc(p.name)}</small></div>`).join("")}</div>${more?`<button class="btn sec" id="shopmore" onclick="CV.open('${SHOPV[k+1]}')">⋯ Ещё суммы</button>`:""}`};
SHOPV.forEach((v,k)=>{V[v]=()=>shopPg(k)});
let BUSY=false, OK={};
CV.buy=async i=>{if(BUSY)return;BUSY=true;const p=(F().packs||[])[i];const r=await CV.op({op:"coins_buy",pack:i});BUSY=false;
 if(r.ok){OK={n:p.coins,name:p.name};CST=CST.filter(v=>!SHOPV.includes(v));CV.rep("shopOk")}   // receipt «Назад» → Кошелёк
 else toast("Не получилось — попробуй ещё раз")};
V.shopOk=function(){return `${bk}<div class="ttl">🧪 Тестовая покупка</div>${TEST}<div class="hero cbig"><div class="big">+${OK.n} <span class="cn">Ⓜ</span></div><small>${esc(OK.name)} · ничего не списано</small></div><div class="card"><div class="hl"><span>У тебя</span><b id="okbal">${bal()}</b></div></div><button class="btn" onclick="nav('home')">📖 К книге</button>`};
// ---------- M3 Pro ----------
V.pro=function(){const on=proOn();return `${bk}<div class="ttl">👑 Pro</div>${TEST}<div class="card"><div class="hl"><span>• свои слова и списки</span></div><div class="hl"><span>• другие темы и поиск по ним</span></div><small class="mut">временно — состав Pro уточняется</small></div>
${on?`<div class="card"><b>👑 Pro до ${esc(ruDate(C().pro_until))}</b></div>`:`<button class="btn" id="proon" onclick="CV.pro()">👑 Pro · тест</button>`}`};
CV.pro=async()=>{if(BUSY)return;BUSY=true;await CV.op({op:"coins_pro"});BUSY=false;render()};
// ---------- M4 Друзья ----------
V.ref=function(){const r=C().ref||{},f=F(),link=r.code?`https://t.me/${BOT}?start=r_${r.code}`:"";
 if(!r.code&&!CV._rq){CV._rq=1;CV.op({op:"ref_code"}).then(()=>{CV._rq=0;if(tab==="ref")render()})}
 return `${bk}<div class="ttl">👥 Позвать друга</div><div class="card"><p>Друг получит +${f.referral_bonus} <span class="cn">Ⓜ</span>, ты — +${f.referral_bonus} <span class="cn">Ⓜ</span>, когда он вспомнит 5 слов в два разных дня.</p>${f.referral_pro_at?`<p>${f.referral_pro_at} друзей → 👑 Pro на месяц</p>`:""}<div class="hl"><span>Засчитано</span><b>${r.counted||0}</b></div></div>
${link?`<div class="card lnk" id="reflink">${esc(link)}</div><div class="row2"><button class="btn sec" onclick="CV.copy('${link}')">📋 Копировать</button><button class="btn" onclick="CV.share('${link}')">📤 Поделиться</button></div>`:`<div class="card">Готовлю ссылку…</div>`}`};
CV.copy=l=>{try{navigator.clipboard.writeText(l)}catch(e){}toast("Ссылка скопирована")};
CV.share=l=>{const u="https://t.me/share/url?url="+encodeURIComponent(l);try{tg&&tg.openTelegramLink?tg.openTelegramLink(u):window.open(u)}catch(e){}};
// ---------- 7Т Токен (макет: без TON-сети и SDK, «подключено» — фейк) ----------
const tokBal=()=>C()?C().token:0;
V.token=function(){if(!TK.on)return `${bk}<div class="ttl"><span class="cn">Ⓜ</span> Токен ${TN()}</div>${TTEST}<div class="card"><p>Кошелёк не подключён.</p><p>Подключи кошелёк TON, чтобы покупать и выводить ${TN()}.</p></div><button class="btn tonb" id="tconn" onclick="CV.conn(1)">🔗 Подключить кошелёк</button>`;
 return `${bk}<div class="ttl"><span class="cn">Ⓜ</span> Токен ${TN()}</div>${TTEST}<div class="card"><div class="hl"><span>Кошелёк</span><b>UQ…TeSt (тест)</b></div><div class="hl"><span>${TN()}</span><b id="tbal">${tokBal()}</b></div></div>
<div class="card"><h3>✨ Как заработать ${TN()}</h3><div class="hl"><span>каждые 10 осевших слов</span><b class="pl">+1</b></div><div class="hl"><span>новая ступень города</span><b class="pl">+10</b></div><div class="hl"><span>друг засчитан</span><b class="pl">+5</b></div></div>
<div class="row2"><button class="btn tonb" id="tbuy" onclick="CV.open('tokenBuy')"><span class="cn">Ⓜ</span> Купить за TON</button><button class="btn sec" id="tmore" onclick="CV.open('tokenMore')">⋯ Ещё</button></div>`};
V.tokenMore=()=>`${bk}<div class="ttl"><span class="cn">Ⓜ</span> ${TN()} · ещё</div>${TTEST}<div class="card"><div class="hl"><span>${TN()}</span><b>${tokBal()}</b></div></div>
<div class="row2"><button class="btn sec" id="tconv" onclick="CV.open('tokenConv')">🔁 В монетки</button><button class="btn sec" id="tmore2" onclick="CV.open('tokenMore2')">⋯ Ещё</button></div>`;
V.tokenMore2=()=>`${bk}<div class="ttl"><span class="cn">Ⓜ</span> ${TN()} · ещё</div>${TTEST}<div class="card"><div class="hl"><span>${TN()}</span><b>${tokBal()}</b></div></div>
<div class="row2"><button class="btn sec" id="tout" onclick="CV.open('tokenOut')">↗️ Вывести</button><button class="btn sec warn" id="tdisc" onclick="CV.disc()">Отключить кошелёк</button></div>`;
CV.conn=v=>{TK.on=!!v;render()};CV.TK=TK;
CV.disc=()=>{TK.on=false;CST=CST.filter(v=>v!=="tokenMore"&&v!=="tokenMore2");CV.back()};   // back to the token screen, now «не подключён»
CV.amt=(id,max)=>{const v=parseInt((document.getElementById(id)||{}).value||"0",10);return Math.max(0,Math.min(isNaN(v)?0:v,max||1e5))};
V.tokenBuy=function(){const r=F().ton_rate||100;return `${bk}<div class="ttl"><span class="cn">Ⓜ</span> Купить ${TN()} за TON</div>${TTEST}
<input class="srch" id="tbin" inputmode="numeric" placeholder="сколько TON, например 5" value="${TK.buy||""}" oninput="CV.TK.buy=parseInt(this.value||'0',10)||0">${F().token_show_rate?`<small class="mut">1 TON = ${r} ${TN()}</small>`:""}
<button class="btn tonb" id="tbgo" onclick="CV.tok('token_in',(CV.TK.buy||0)*${r},'tokenBuyOk')">Купить (тест)</button>`};
V.tokenBuyOk=()=>`${bk}<div class="ttl">🧪 Готово</div>${TTEST}<div class="hero cbig"><div class="big">+${TK.last} ${TN()}</div><small>TON не списаны</small></div><div class="card"><div class="hl"><span>${TN()}</span><b>${tokBal()}</b></div></div>`;
V.tokenConv=function(){return `${bk}<div class="ttl">🔁 ${TN()} в монетки</div>${TTEST}<div class="card"><div class="hl"><span>${TN()}</span><b>${tokBal()}</b></div></div>
<input class="srch" id="tcin" inputmode="numeric" placeholder="сколько ${TN()}"><a class="link" onclick="document.getElementById('tcin').value=${tokBal()}">Всё</a><small class="mut">→ столько же <span class="cn">Ⓜ</span></small>
<button class="btn tonb" id="tcgo" onclick="CV.tok('token_convert',CV.amt('tcin',${tokBal()}),'tokenConvOk')">Обменять (тест)</button>`};
V.tokenConvOk=()=>`${bk}<div class="ttl">🧪 Готово</div>${TTEST}<div class="hero cbig"><div class="big">−${TK.last} ${TN()} · +${TK.last} <span class="cn">Ⓜ</span></div></div><div class="card"><div class="hl"><span>У тебя</span><b>${coin(bal())}</b></div><div class="hl"><span>${TN()}</span><b>${tokBal()}</b></div></div>`;
V.tokenEarn=()=>`${bk}<div class="ttl">✨ Заработать ${TN()}</div>${TTEST}<div class="card"><div class="hl"><span>каждые 10 осевших слов</span><b class="pl">+1</b></div><div class="hl"><span>новая ступень города</span><b class="pl">+10</b></div><div class="hl"><span>друг засчитан</span><b class="pl">+5</b></div></div><div class="card"><div class="hl"><span>Начислено (тест)</span><b>${tokBal()} ${TN()}</b></div></div>`;
V.tokenOut=function(){return `${bk}<div class="ttl">↗️ Вывести ${TN()}</div>${TTEST}<div class="card">на кошелёк UQ…TeSt</div><input class="srch" id="toin" inputmode="numeric" placeholder="сколько ${TN()}"><a class="link" onclick="document.getElementById('toin').value=${tokBal()}">Всё</a>
<button class="btn tonb" id="togo" onclick="CV.tok('token_withdraw',CV.amt('toin',${tokBal()}),'tokenOutOk')">Вывести (тест)</button>`};
V.tokenOutOk=()=>`${bk}<div class="ttl">🧪 Вывод не выполняется</div>${TTEST}<div class="hero cbig"><small>в тестовом режиме. Записано:</small><div class="big">−${TK.last} ${TN()}</div></div>`;
CV.tok=async(kind,n,ok)=>{if(BUSY)return;if(!n||n<1)return toast("Впиши сумму");BUSY=true;const r=await CV.op({op:"token",kind,amount:n});BUSY=false;
 if(r.ok){TK.last=r.amount;CST=CST.filter(v=>v!=="tokenMore"&&v!=="tokenMore2");CV.rep(ok)}else toast("Не получилось — попробуй ещё раз")};
// ---------- M6 Город: ступень + карта A; M7 событие роста (один раз) ----------
const GR=window.GR={name:["Костёр","Стоянка","Деревня","Село","ПГТ","Город","Сити-центр"],icon:["🔥","⛺","🛖","🏡","🏘","🏙","🌆"],
 // RC 18.10 22:47 (NordSturm «Мой город»): what the settlement is now — mirrors core/growth.py DESC
 desc:["Костёр на пустом месте — город только начинается.","У стоянки собираются первые места: слова начали оседать.","Несколько домов и тропинки между районами.","Улицы и свои места в каждом открытом районе.","Посёлок: районы застроены, появляются новые уголки.","Все районы живут, места на каждой улице.","Город построен целиком — от окраин до центра."]};
const _city=V.city;
V.city=function(){let h=_city();if(!C()||!F().growth||D.reset)return h;const g=C().growth||{},s=g.stage||0,nx=g.next;
 const card=`<div class="card gcard" data-growth-slot="map" data-concept="${esc(F().concept||"AB")}" data-stage="${s}">${MAPA.svg(s,D.growth_map||{})}
<div class="gst"><b>${GR.icon[s]} Ступень ${s} из 6 · ${esc(GR.name[s])}</b><p class="gdesc">${esc(GR.desc[s]||"")}</p>${nx?`<div class="bar"><i style="width:${Math.min(100,Math.round(100*(g.settled||0)/nx))}%"></i></div><small>Осело ${g.settled||0} / ${nx} · до «${esc(GR.name[s+1])}» ещё ${Math.max(0,nx-(g.settled||0))} · растёт только от осевших слов</small>`:`<small>Осело ${g.settled||0}</small>`}</div></div>`;   // RC 19.10 (NordSturm: no duplicates): no own edit button — the EXISTING «✏️ Добавить или поправить детали» card moves right under this card (growth ON only)
 const ED=/<div class="card" onclick="go\('city'\)"><div class="w"><div class="t"><b>✏️ Добавить или поправить детали<\/b>[\s\S]*?›<\/div><\/div>/,em=h.match(ED),edit=em?em[0]:"";if(edit)h=h.replace(ED,"");
 return h.replace(/(<div class="top">[\s\S]*?<\/div>\s*<\/div>|<div class="top">[\s\S]*?<\/div>)/,"$1"+card+edit)};
const _nav=window.nav;
window.nav=function(t,o){if(t==="city"&&C()&&F().growth&&!D.reset){const g=C().growth||{};if((g.stage||0)>(g.stage_seen||0)&&!CV._ev){if(!(o&&o.replace)&&tab!=="city"&&window.navPush)navPush();CV._ev={from:g.stage_seen||0,to:g.stage};CORG="city";CST=[];g.stage_seen=g.stage;CV.op({op:"growth_seen"});tab="gEvent";render();scrollTo(0,0);try{tg&&tg.HapticFeedback&&tg.HapticFeedback.notificationOccurred("success")}catch(e){}return}}return _nav(t,o)};
V.gEvent=function(){const e=CV._ev||{from:0,to:0},to=e.to,np=MAPA.newPlace(to,D.growth_map||{}),st=F().stages||[10,40,120,400,900,2750];
 const skip=to-e.from>1?`<p class="mut">Пока тебя не было, выросли ${GR.name.slice(e.from+1,to).join(" и ")}.</p>`:"";
 const q=(C().growth||{}).quote;
 return `${bk}<div class="gev" data-growth-slot="event" data-concept="${esc(F().concept||"AB")}"><div class="ttl">${esc(GR.icon[to]+" Ступень "+to+" · "+GR.name[to])}</div>${MAPA.svg(to,D.growth_map||{},np&&np[1])}
<p>${st[to-1]||0} слов осели — ${np?`в районе «${esc(np[0])}» появилось новое место: «${esc(np[1])}».`:"туман над окраиной рассеялся."}</p>${skip}${q?`<p class="quote">«${esc(q)}»</p>`:""}</div>
<button class="btn" id="evnext" onclick="CV._ev=null;nav('city',{replace:true})">Дальше</button>`};
CV.evBack=()=>{CV._ev=null;nav("city")};
// ---------- карта A (правила README «Правила раскладки», PM #187 P2-2) ----------
const GC={der:"#2d6cff",die:"#ff5d8a",das:"#22c58b",verb:"#f5c542"},TL={der:"#27407a",die:"#6a2e4f",das:"#1e6b4f",verb:"#5a4a1a"};
const OPEN={der:1,die:2,das:3,verb:4},CAP=[0,1,2,4,6,8,8],N=8,TW=58,TH=29,OX=256,OY=190;
const iso=(x,y,z)=>[OX+(x-y)*TW/2,OY+(x+y)*TH/2-(z||0)];
const qof=(x,y)=>x===3||y===4?"street":x<3&&y<4?"der":x>3&&y<4?"die":x<3?"das":"verb";
const slots=q=>{const t=[];for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(qof(x,y)===q&&!(q==="verb"&&x===7&&y===5))t.push([x,y]);
 t.sort((a,b)=>Math.min(Math.abs(a[0]-3),Math.abs(a[1]-4))-Math.min(Math.abs(b[0]-3),Math.abs(b[1]-4))||(Math.abs(a[0]-3)+Math.abs(a[1]-4))-(Math.abs(b[0]-3)+Math.abs(b[1]-4)));return t.slice(0,8)};
const trim=s=>s.length<=14?s:s.slice(0,13).trimEnd()+"…";
const P=(pts,f,x)=>`<polygon points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="${f}" ${x||""}/>`;
function vis(stage,G){const r={};for(const k of ["der","die","das","verb"]){const z=G[k]||{},ps=(z.places||[]).filter((p,i,a)=>p&&a.indexOf(p)===i);
 if(stage<OPEN[k]||!ps.length){r[k]={open:false,soon:stage>=OPEN[k]&&!ps.length,show:[],more:0,name:z.name||""};continue}
 const cap=CAP[Math.min(stage,6)];r[k]=ps.length>8&&cap>=8?{open:true,show:ps.slice(0,7),more:ps.length-7,name:z.name||""}:{open:true,show:ps.slice(0,Math.min(ps.length,cap)),more:0,name:z.name||""}}return r}
const MAPA=window.MAPA={
 newPlace(stage,G){if(stage<1)return null;const a=vis(stage-1,G),b=vis(stage,G);for(const k of Object.keys(b).sort((x,y)=>(OPEN[y]===stage)-(OPEN[x]===stage)))for(const p of b[k].show)if(!a[k].show.includes(p))return [b[k].name,p];return null},
 svg(stage,G,hi){const V2=vis(stage,G);let s=`<svg viewBox="0 0 512 512" class="mapa" role="img" aria-label="Карта города"><defs><radialGradient id="fog"><stop offset="0" stop-color="#b9aef0" stop-opacity=".85"/><stop offset="1" stop-color="#8f80d9" stop-opacity="0"/></radialGradient></defs><rect width="512" height="512" rx="40" fill="#1d1648"/><circle cx="440" cy="60" r="18" fill="#f5e7b8" opacity=".9"/>`;
  for(let x=0;x<N;x++)for(let y=0;y<N;y++){const q=qof(x,y);s+=P([iso(x,y),iso(x+1,y),iso(x+1,y+1),iso(x,y+1)],q==="street"?(stage>=4?"#c9a227":"#7a6a3a"):TL[q],'stroke="#00000022"')}
  const labels=[],taken=[[0,0,300,112],[410,30,470,92]],dots=[];
  const fits=b=>!taken.some(t=>!(b[2]+3<t[0]||t[2]+3<b[0]||b[3]+3<t[1]||t[3]+3<b[1]));
  for(const k of ["der","die","das","verb"]){const v=V2[k],sl=slots(k);
   v.show.forEach((p,i)=>{const [x,y]=sl[i],h=26+((i*7)%3)*10,A=iso(x+.15,y+.15),B=iso(x+.85,y+.15),Cc=iso(x+.85,y+.85),Dd=iso(x+.15,y+.85);
    s+=P([Dd,Cc,[Cc[0],Cc[1]-h],[Dd[0],Dd[1]-h]],GC[k],'opacity=".75"')+P([B,Cc,[Cc[0],Cc[1]-h],[B[0],B[1]-h]],GC[k],'opacity=".9"')+P([A,B,Cc,Dd].map(q=>[q[0],q[1]-h]),GC[k]);
    labels.push({k,p,cx:(A[0]+Cc[0])/2,by:Math.min(A[1],B[1])-h-4,pri:p===hi?0:2})});
   if(v.more){const [x,y]=sl[7];const c=iso(x+.5,y+.5);labels.push({k,p:"ещё "+v.more,cx:c[0],by:c[1]-8,pri:-1})}
   if(!v.open){const c=iso(...(k==="der"?[1.5,2]:k==="die"?[5.5,2]:k==="das"?[1.5,6]:[5.5,6]));s+=`<ellipse cx="${c[0]}" cy="${c[1]}" rx="120" ry="70" fill="url(#fog)"/>`;if(v.soon)labels.push({k,p:"скоро здесь",cx:c[0],by:c[1],pri:-1})}}
  labels.sort((a,b)=>a.pri-b.pri);let n=0;
  for(const L of labels){const t=trim(L.p),w=t.length*9+14,h=26,x=Math.max(6,Math.min(506-w,L.cx-w/2)),b=[x,L.by-h,x+w,L.by];
   if((L.pri>=0&&n>=6)||!fits(b)){const dy=L.by-4;if(!taken.some(t=>L.cx>t[0]-8&&L.cx<t[2]+8&&dy>t[1]-8&&dy<t[3]+8))dots.push(`<circle cx="${L.cx.toFixed(1)}" cy="${(L.by-4).toFixed(1)}" r="5" fill="${GC[L.k]}" stroke="#fff"/>`);continue}
   taken.push(b);if(L.pri>=0)n++;
   s+=`<g><rect x="${x.toFixed(1)}" y="${b[1].toFixed(1)}" width="${w}" height="${h}" rx="6" fill="${GC[L.k]}" stroke="${L.p===hi?"#fff":"#00000066"}" ${L.p===hi?'stroke-width="2.5"':""}/><text x="${(x+w/2).toFixed(1)}" y="${(b[1]+h-8).toFixed(1)}" font-size="16" font-weight="700" fill="${L.k==="verb"?"#1a1300":"#fff"}" text-anchor="middle" font-family="Inter,Arial,sans-serif">${esc(t)}</text></g>`}
  return s+dots.join("")+(stage>=1?`<text x="40" y="480" font-size="34">${GR.icon[stage]}</text>`:`<text x="40" y="480" font-size="34">⛺</text>`)+"</svg>"}};
})();
