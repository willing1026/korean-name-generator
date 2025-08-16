/* -------------------------------------------
  외국인 한글이름 생성기 - 운영 버전 (영어이름 전용, JSON 로딩)
  - 남/여 상위 이름 JSON(최근 3년 가중치) 로딩
  - 성 자동 분포, 유지형 포함
  - 성별: 자동/남/여/공용
------------------------------------------- */

// ========== DOM ==========
const $ = (s) => document.querySelector(s);
const enInput   = $("#enName");
const genderSel = $("#gender");
const countSel  = $("#count");
const genBtn    = $("#genBtn");
const resultsEl = $("#results");

// ========== 데이터 로딩 ==========
let MALE = [];
let FEMALE = [];
let UNISEX = []; // 로딩 후 동적으로 구성

async function loadData() {
  const [mRes, fRes] = await Promise.all([
    fetch("data/male_top300.json"),
    fetch("data/female_top300.json")
  ]);
  MALE = await mRes.json();
  FEMALE = await fRes.json();

  // 공용 이름 풀 만들기(두 리스트 교집합 + 일부 인기 이름)
  const fSet = new Set(FEMALE.map(x=>x.n));
  const mSet = new Set(MALE.map(x=>x.n));
  const common = [...mSet].filter(n => fSet.has(n));
  // 공용 후보 가중치는 양쪽 weight의 평균 정도로
  UNISEX = common.map(n => {
    const mw = MALE.find(x=>x.n===n)?.w || 1;
    const fw = FEMALE.find(x=>x.n===n)?.w || 1;
    return { n, w: Math.round((mw+fw)/2) };
  });

  // 유니섹스 대표감 추가(연우/이안/지안/하율/아윤 등) 없으면 보강
  const addIfMissing = (name, w) => { if (!UNISEX.find(x=>x.n===name)) UNISEX.push({n:name, w}); };
  ["연우","이안","지안","하율","아윤","시온","윤서","수아","예린"].forEach(n=>addIfMissing(n,4));
}
loadData().catch(console.error);

// ========== 성씨 분포 ==========
const SURNAME_DISTR = [
  {n:"김", w:21}, {n:"이", w:15}, {n:"박", w:8}, {n:"최", w:5}, {n:"정", w:5},
  {n:"강", w:3}, {n:"조", w:2}, {n:"윤", w:2}, {n:"임", w:2}, {n:"한", w:1.5}
];
function pickSurname() {
  const total = SURNAME_DISTR.reduce((s,a)=>s+a.w,0);
  let r = Math.random()*total;
  for (const a of SURNAME_DISTR){ r -= a.w; if (r<=0) return a.n; }
  return "김";
}

// ========== 유지형 사전 + 폴백 음역 ==========
const KEPT_MAP = {
  "liam":"리암","noah":"노아","lucas":"루카스","oliver":"올리버","olivia":"올리비아",
  "emma":"에마","emily":"에밀리","ava":"에이바","mia":"미아","sophia":"소피아",
  "isabella":"이사벨라","charlotte":"샬럿","henry":"헨리","jack":"잭","daniel":"다니엘",
  "michael":"마이클","william":"윌리엄","james":"제임스","benjamin":"벤자민",
  "amelia":"아멜리아","harper":"하퍼","theodore":"시어도어","alexander":"알렉산더",
  "victoria":"빅토리아","sarah":"사라","grace":"그레이스","hannah":"한나","natalie":"나탈리",
  "david":"데이비드","ethan":"에이든/이선","samuel":"사무엘"
};
function fallbackTranslit(en){
  let s = (en||"").toLowerCase();
  const repl = [
    [/ch/g,"치"],[/sh/g,"쉬"],[/ph/g,"프"],[/th/g,"스"],[/ck/g,"ㅋ"],
    [/a/g,"아"],[/e/g,"에"],[/i/g,"이"],[/o/g,"오"],[/u/g,"우"],
    [/b/g,"브"],[/c/g,"크"],[/d/g,"드"],[/f/g,"프"],[/g/g,"그"],[/h/g,"ㅎ"],
    [/j/g,"지"],[/k/g,"크"],[/l/g,"를"],[/m/g,"므"],[/n/g,"느"],[/p/g,"프"],
    [/q/g,"쿠"],[/r/g,"르"],[/s/g,"스"],[/t/g,"트"],[/v/g,"브"],
    [/w/g,"우"],[/x/g,"스"],[/y/g,"이"],[/z/g,"즈"]
  ];
  for (const [re,to] of repl) s = s.replace(re,to);
  return s.replace(/[^가-힣]/g,"").replace(/스스/g,"스").replace(/르르/g,"르") || "";
}
function keptCandidate(en){
  const key = (en||"").trim().toLowerCase().split(/\s+/)[0];
  return KEPT_MAP[key] || fallbackTranslit(key);
}

// ========== 성별 힌트(간단) ==========
const EN_HINT_MALE = new Set(["michael","daniel","james","william","oliver","noah","liam","lucas","benjamin","henry","jack","david","ethan","samuel","alexander","theodore"]);
const EN_HINT_FEMALE = new Set(["sophia","emma","emily","ava","isabella","mia","charlotte","olivia","amelia","harper","lily","ella","grace","hannah","victoria","sarah","natalie"]);
function guessGender(en){
  const t = (en||"").toLowerCase().split(/\s+/)[0];
  if (EN_HINT_MALE.has(t)) return "male";
  if (EN_HINT_FEMALE.has(t)) return "female";
  return "unisex";
}

// ========== 발음 키 ==========
function phoneticKey(en){
  const s = (en||"").toLowerCase().replace(/[^a-z]/g,"");
  const v = (s.match(/[aeiou]+/g) || [])[0] || "";
  let vClass = "a";
  if (/^i|ee|ea/.test(v)) vClass="i";
  else if (/^e/.test(v)) vClass="e";
  else if (/^o|oa|ou/.test(v)) vClass="o";
  else if (/^u/.test(v)) vClass="u";
  const targetVowel = ({a:"아",e:"에",i:"이",o:"오",u:"우"})[vClass];
  return {
    vClass, targetVowel,
    hasL:/l/.test(s), hasN:/n/.test(s), hasM:/m/.test(s),
    hasR:/r/.test(s), hasW:/w|oo|ou/.test(s), hasY:/y/.test(s)
  };
}

// ========== 스코어링 ==========
function scoreKName(kname, key, baseWeight){
  let s = 0;
  if (key.targetVowel && kname.includes(key.targetVowel)) s += 18;
  if (/아|이|오|우|에/.test(kname)) s += 6;
  s += baseWeight * 6; // 최근3년 가중치 강조
  if (key.hasN && /[ㄴ]/.test(kname)) s += 3;
  if (key.hasM && /[ㅁ]/.test(kname)) s += 2;
  if (key.hasR && /[ㄹ]/.test(kname)) s += 2;
  if (key.hasW && /우|오|워/.test(kname)) s += 2;
  if (key.hasY && /[여예유이]/.test(kname)) s += 1;
  return s;
}

// ========== 추천 생성 ==========
function recommend(en, opts){
  const {gender="auto", count=5, includeKept=true} = opts;
  const key = phoneticKey(en);

  const g = gender==="auto" ? guessGender(en) : gender;
  let pool = [];
  if (g==="male") pool = MALE.slice();
  else if (g==="female") pool = FEMALE.slice();
  else pool = UNISEX.concat(MALE.slice(0,50), FEMALE.slice(0,50)); // 공용이면 얕게 혼합

  const scored = pool.map(x => ({...x, score: scoreKName(x.n, key, x.w)}))
                     .sort((a,b)=>b.score-a.score);

  const top = scored.slice(0, Math.min(30, scored.length));
  const pickSet = new Set();
  let guard = 0;
  while (pickSet.size < count && guard < 400) {
    const total = top.reduce((s,a)=>s + (a.score*a.score), 0) || 1;
    let r = Math.random()*total;
    for (const a of top) {
      r -= (a.score*a.score);
      if (r <= 0) { pickSet.add(a.n); break; }
    }
    guard++;
  }

  const surname = pickSurname();
  const list = Array.from(pickSet);
  if (includeKept) {
    const kept = keptCandidate(en);
    if (kept) {
      const idx = list.indexOf(kept);
      if (idx >= 0) list.splice(idx,1);
      list.unshift(kept);
    }
  }
  const finalGiven = list.slice(0, count);
  return finalGiven.map(given => `${surname} ${given}`);
}

// ========== 렌더 ==========
function render(list){
  resultsEl.innerHTML = "";
  if (!list.length){
    resultsEl.innerHTML = `<div class="card"><span>추천 결과가 없습니다.</span></div>`;
    return;
  }
  list.forEach(fullname => {
    const card = document.createElement("div");
    card.className = "card";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = fullname;

    const btn = document.createElement("button");
    btn.className = "copy";
    btn.textContent = "복사";
    btn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(fullname);
        const old = btn.textContent;
        btn.textContent = "복사됨!";
        setTimeout(()=>btn.textContent = old, 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = fullname; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
        btn.textContent = "복사됨!"; setTimeout(()=>btn.textContent="복사",1200);
      }
    };

    card.appendChild(nameSpan);
    card.appendChild(btn);
    resultsEl.appendChild(card);
  });
}

// ========== 이벤트 ==========
genBtn.addEventListener("click", () => {
  const en = (enInput.value || "").trim();
  const cnt = parseInt(countSel.value, 10) || 5;
  if (!en){ render([]); return; }
  const list = recommend(en, {
    gender: genderSel.value,
    count: cnt,
    includeKept: true
  });
  render(list);
});
