/* ===== i18n - robust version ===== */
const I18N = {
  en: {
    "meta.title": "Korean Name Generator – Real Usage Distribution",
    "meta.desc": "Type an English name to get Korean names commonly used in Korea (last 3-year weighted). Includes family name and kept-form options (e.g., Liam → 리암).",
    "og.title": "Korean Name Generator",
    "og.desc": "Real distribution-based suggestions + Korean family name + kept-form",

    "hero.title": "Korean Name Generator",
    "hero.subtitle": "English name → popular Korean names (last 3-year weighted) + Korean family name + kept-form",

    "form.name": "English name",
    "form.placeholder": "e.g. Liam, Emma, Michael",
    "form.gender": "Gender",
    "form.count": "Suggestions",
    "gender.auto": "Auto",
    "gender.male": "Male",
    "gender.female": "Female",
    "gender.unisex": "Unisex",
    "cta.generate": "Generate",

    "footer.privacy": "Privacy Policy",
    "result.none": "No suggestions found.",
    "btn.copy": "Copy",
    "btn.copied": "Copied!"
  },
  ko: {
    "meta.title": "외국인 한글이름 생성기 – 실제 분포 반영",
    "meta.desc": "영문 이름을 입력하면 한국에서 실제 많이 쓰이는 이름(최근 3년 가중치)을 추천합니다. 성 포함, 유지형(예: Liam → 리암) 지원.",
    "og.title": "외국인 한글이름 생성기",
    "og.desc": "실제 분포 기반 추천 + 성 포함 + 유지형",

    "hero.title": "외국인 한글이름 생성기",
    "hero.subtitle": "영어 이름 → 실제 많이 쓰이는 한국식 이름(최근 3년 가중치) + 성 포함 + 유지형",

    "form.name": "영문 이름",
    "form.placeholder": "예: Liam, Emma, Michael",
    "form.gender": "성별",
    "form.count": "추천 개수",
    "gender.auto": "자동 추정",
    "gender.male": "남",
    "gender.female": "여",
    "gender.unisex": "공용",
    "cta.generate": "이름 생성",

    "footer.privacy": "개인정보처리방침",
    "result.none": "추천 결과가 없습니다.",
    "btn.copy": "복사",
    "btn.copied": "복사됨!"
  }
};

const $ = (s) => document.querySelector(s);

function getSavedLang() {
  return localStorage.getItem("lang") || "en"; // 기본 EN
}

function applyI18N(dict){
  // 일반 텍스트 노드 치환
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const val = dict[key];
    if (!val) return;

    if (el.tagName === "META") {
      el.setAttribute("content", val);
    } else {
      el.textContent = val;
    }
  });

  // placeholder 치환
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = dict[key];
    if (val) el.setAttribute("placeholder", val);
  });

  // <title> 안전하게 갱신
  if (dict["meta.title"]) document.title = dict["meta.title"];

  // meta description/OG 갱신(예: SEO용)
  const mDesc = document.querySelector('meta[name="description"]');
  if (mDesc && dict["meta.desc"]) mDesc.setAttribute("content", dict["meta.desc"]);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && dict["og.title"]) ogTitle.setAttribute("content", dict["og.title"]);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && dict["og.desc"]) ogDesc.setAttribute("content", dict["og.desc"]);

  // JSON-LD name도 업데이트(선택)
  try {
    const jsonld = document.getElementById("jsonld-website");
    if (jsonld) {
      const data = JSON.parse(jsonld.textContent);
      data.name = dict["og.title"] || data.name;
      jsonld.textContent = JSON.stringify(data);
    }
  } catch(e) { /* ignore */ }
}

function setLang(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  applyI18N(dict);

  // 버튼 active 토글
  const btnEN = $("#btn-en");
  const btnKO = $("#btn-ko");
  if (btnEN && btnKO) {
    btnEN.classList.toggle("active", lang === "en");
    btnKO.classList.toggle("active", lang === "ko");
  }
  localStorage.setItem("lang", lang);
}

function initI18N(){
  // 초기 언어 적용
  setLang(getSavedLang());

  // 버튼 리스너 연결 (DOM 준비 이후)
  const btnEN = $("#btn-en");
  const btnKO = $("#btn-ko");
  if (btnEN) btnEN.addEventListener("click", () => setLang("en"));
  if (btnKO) btnKO.addEventListener("click", () => setLang("ko"));
}

// DOMContentLoaded 보장 (defer 없어도 안전)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initI18N);
} else {
  initI18N();
}

// ===== DOM (form) =====
const enInput   = $("#enName");
const genderSel = $("#gender");
const countSel  = $("#count");
const genBtn    = $("#genBtn");
const resultsEl = $("#results");

// ===== Data loading =====
let MALE = [];
let FEMALE = [];
let UNISEX = [];

async function loadData() {
  const [mRes, fRes] = await Promise.all([
    fetch("data/male_top300.json", {cache: "no-cache"}),
    fetch("data/female_top300.json", {cache: "no-cache"})
  ]);
  MALE = await mRes.json();
  FEMALE = await fRes.json();

  // Build unisex pool (intersection + curated adds)
  const fSet = new Set(FEMALE.map(x=>x.n));
  const mSet = new Set(MALE.map(x=>x.n));
  const common = [...mSet].filter(n => fSet.has(n));
  UNISEX = common.map(n => {
    const mw = MALE.find(x=>x.n===n)?.w || 1;
    const fw = FEMALE.find(x=>x.n===n)?.w || 1;
    return { n, w: Math.round((mw+fw)/2) };
  });
  const addIfMissing = (name, w) => { if (!UNISEX.find(x=>x.n===name)) UNISEX.push({n:name, w}); };
  ["연우","이안","지안","하율","아윤","시온","윤서","수아","예린"].forEach(n=>addIfMissing(n,4));
}
loadData().catch(console.error);

// ===== Surname distribution =====
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

// ===== Kept-form + fallback transliteration =====
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

// ===== Gender hint =====
const EN_HINT_MALE = new Set(["michael","daniel","james","william","oliver","noah","liam","lucas","benjamin","henry","jack","david","ethan","samuel","alexander","theodore"]);
const EN_HINT_FEMALE = new Set(["sophia","emma","emily","ava","isabella","mia","charlotte","olivia","amelia","harper","lily","ella","grace","hannah","victoria","sarah","natalie"]);
function guessGender(en){
  const t = (en||"").toLowerCase().split(/\s+/)[0];
  if (EN_HINT_MALE.has(t)) return "male";
  if (EN_HINT_FEMALE.has(t)) return "female";
  return "unisex";
}

// ===== Phonetic key =====
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

// ===== Scoring =====
function scoreKName(kname, key, baseWeight){
  let s = 0;
  if (key.targetVowel && kname.includes(key.targetVowel)) s += 18;
  if (/아|이|오|우|에/.test(kname)) s += 6;
  s += baseWeight * 6; // last-3-year emphasis
  if (key.hasN && /[ㄴ]/.test(kname)) s += 3;
  if (key.hasM && /[ㅁ]/.test(kname)) s += 2;
  if (key.hasR && /[ㄹ]/.test(kname)) s += 2;
  if (key.hasW && /우|오|워/.test(kname)) s += 2;
  if (key.hasY && /[여예유이]/.test(kname)) s += 1;
  return s;
}

// ===== Recommend =====
function recommend(en, opts){
  const {gender="auto", count=5, includeKept=true} = opts;
  const key = phoneticKey(en);

  const g = gender==="auto" ? guessGender(en) : gender;
  let pool = [];
  if (g==="male") pool = MALE.slice();
  else if (g==="female") pool = FEMALE.slice();
  else pool = UNISEX.concat(MALE.slice(0,50), FEMALE.slice(0,50)); // mild mix

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

// ===== Render =====
function t(key){
  const lang = localStorage.getItem("lang") || "en";
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function render(list){
  resultsEl.innerHTML = "";
  if (!list.length){
    resultsEl.innerHTML = `<div class="card"><span>${t("result.none")}</span></div>`;
    return;
  }
  list.forEach(fullname => {
    const card = document.createElement("div");
    card.className = "card";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = fullname;

    const btn = document.createElement("button");
    btn.className = "copy";
    btn.textContent = t("btn.copy");
    btn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(fullname);
        const old = btn.textContent;
        btn.textContent = t("btn.copied");
        setTimeout(()=>btn.textContent = old, 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = fullname; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
        btn.textContent = t("btn.copied");
        setTimeout(()=>btn.textContent = t("btn.copy"),1200);
      }
    };

    card.appendChild(nameSpan);
    card.appendChild(btn);
    resultsEl.appendChild(card);
  });
}

// ===== Events =====
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
