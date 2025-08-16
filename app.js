// ---- 엘리먼트 ----
const $ = (sel) => document.querySelector(sel);
const enInput = $("#enName");
const genderSel = $("#gender");
const countSel = $("#count");
const genBtn = $("#genBtn");
const results = $("#results");

// ---- 간단한 이름 풀(임시) ----
// 실제로는 최근 3년 가중치가 적용된 대규모 풀로 교체 예정
const MALE = ["민준","도윤","서준","이준","하준","은우","시우","선우","준우","윤우","도현","지호","연우","예준","우진","이안","현우","태오","수호","윤호","준호"];
const FEMALE = ["서아","이서","서윤","하윤","지유","지우","서연","예나","예린","아윤","아라","소연","서린","유나","하린","유진","윤서","다은","하은","지안","수아","은서","윤아","채린","민서","소윤"];
const UNISEX = ["연우","이안","지안","하율","세아","시온","아윤","윤서","유진","수아"];

// 영어이름 → 유지형(리암/노아 등) 간단 사전 + 폴백 음역
const KEPT_MAP = {
  "liam":"리암","noah":"노아","lucas":"루카스","oliver":"올리버","olivia":"올리비아",
  "emma":"에마","emily":"에밀리","ava":"에이바","mia":"미아","sophia":"소피아",
  "isabella":"이사벨라","charlotte":"샬럿","henry":"헨리","jack":"잭","daniel":"다니엘",
  "michael":"마이클","william":"윌리엄","james":"제임스","benjamin":"벤자민","amelia":"아멜리아"
};
function fallbackTranslit(en){
  let s = (en||"").toLowerCase();
  const repl = [
    [/ch/g,"치"],[/sh/g,"쉬"],[/ph/g,"프"],[/th/g,"스"],[/ck/g,"ㅋ"],
    [/a/g,"아"],[/e/g,"에"],[/i/g,"이"],[/o/g,"오"],[/u/g,"우"],
    [/b/g,"브"],[/c/g,"크"],[/d/g,"드"],[/f/g,"프"],[/g/g,"그"],[/h/g,"ㅎ"],[/j/g,"지"],[/k/g,"크"],[/l/g,"를"],[/m/g,"므"],[/n/g,"느"],[/p/g,"프"],[/q/g,"쿠"],[/r/g,"르"],[/s/g,"스"],[/t/g,"트"],[/v/g,"브"],[/w/g,"우"],[/x/g,"스"],[/y/g,"이"],[/z/g,"즈"]
  ];
  for (const [re,to] of repl) s = s.replace(re,to);
  return s.replace(/[^가-힣]/g,"").replace(/스스/g,"스").replace(/르르/g,"르") || "";
}
function keptCandidate(en){
  const key = (en||"").toLowerCase().split(/\s+/)[0];
  return KEPT_MAP[key] || fallbackTranslit(key);
}

// 간단 성씨 분포
const SURNAME = [{n:"김",w:21},{n:"이",w:15},{n:"박",w:8},{n:"최",w:5},{n:"정",w:5},{n:"강",w:3},{n:"조",w:2},{n:"윤",w:2},{n:"임",w:2},{n:"한",w:1.5}];
function pickSurname(){
  const total = SURNAME.reduce((s,a)=>s+a.w,0);
  let r = Math.random()*total;
  for(const a of SURNAME){ r -= a.w; if(r<=0) return a.n; }
  return "김";
}

// 영어이름으로 성별 추정(아주 간단)
const EN_HINT_MALE = new Set(["michael","daniel","james","william","oliver","noah","liam","lucas","benjamin","henry","jack"]);
const EN_HINT_FEMALE = new Set(["sophia","emma","emily","ava","isabella","mia","charlotte","olivia","amelia","harper"]);
function guessGender(en){
  const t = (en||"").toLowerCase().split(/\s+/)[0];
  if (EN_HINT_MALE.has(t)) return "male";
  if (EN_HINT_FEMALE.has(t)) return "female";
  return "unisex";
}

// 결과 렌더
function render(list){
  results.innerHTML = "";
  if (!list.length){
    results.innerHTML = `<div class="card"><span>추천 결과가 없습니다.</span></div>`;
    return;
  }
  list.forEach(name => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <span>${name}</span>
      <button class="copy">복사</button>
    `;
    el.querySelector(".copy").onclick = async () => {
      await navigator.clipboard.writeText(name);
      el.querySelector(".copy").textContent = "복사됨!";
      setTimeout(()=>el.querySelector(".copy").textContent="복사", 1200);
    };
    results.appendChild(el);
  });
}

// 클릭 이벤트
genBtn.addEventListener("click", () => {
  const en = (enInput.value || "").trim();
  const cnt = parseInt(countSel.value, 10) || 5;
  if (!en){ render([]); return; }

  // 성별 풀 선택
  const g = (genderSel.value === "auto") ? guessGender(en) : genderSel.value;
  let pool = g==="male" ? MALE : g==="female" ? FEMALE : UNISEX.concat(MALE.slice(0,8), FEMALE.slice(0,8));

  // 다양성 있게 섞어서 N개 선택
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  const surname = pickSurname();
  const baseList = shuffled.slice(0, cnt).map(given => `${surname} ${given}`);

  // 유지형(있으면 하나 추가)
  const kept = keptCandidate(en);
  if (kept) baseList.unshift(`${surname} ${kept}`);

  render(baseList.slice(0, cnt + 1)); // 유지형 포함해서 최대 +1개
});
