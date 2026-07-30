/* Edexcel iGCSE CS Exam Trainer — app core */
(()=>{
const view=document.getElementById('view');
const backBtn=document.getElementById('backBtn');
const barTitle=document.getElementById('barTitle');
const scorePill=document.getElementById('scorePill');
const tabbar=document.getElementById('tabbar');
const cache={};           // fetched JSON
let stack=[];             // nav stack of render fns
let quiz=null;            // active quiz state

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store={
  get k(){return 'cs4cp0-progress'},
  read(){try{return JSON.parse(localStorage.getItem(this.k))||{}}catch(e){return{}}},
  write(p){localStorage.setItem(this.k,JSON.stringify(p))},
  record(secId,bank,qid,gotMarks,maxMarks){
    const p=this.read();
    p[secId]=p[secId]||{};p[secId][bank]=p[secId][bank]||{};
    p[secId][bank][qid]={g:gotMarks,m:maxMarks,t:Date.now()};
    this.write(p);
  },
  bankStats(secId,bank,total){
    const b=(this.read()[secId]||{})[bank]||{};
    const done=Object.keys(b).length;
    let g=0,m=0;Object.values(b).forEach(r=>{g+=r.g;m+=r.m});
    return{done,total,g,m};
  }
};

async function loadJSON(path){
  if(cache[path])return cache[path];
  const r=await fetch(path);
  if(!r.ok)throw new Error(path);
  cache[path]=await r.json();
  return cache[path];
}

function setBar(title,showBack){
  barTitle.textContent=title;
  backBtn.hidden=!showBack;
  scorePill.hidden=true;
}
function push(fn){stack.push(fn);fn();}
function goBack(){
  if(quiz&&!confirm('Leave this quiz? Progress on answered questions is saved.'))return;
  quiz=null;stack.pop();
  const fn=stack[stack.length-1];if(fn)fn();else home();
}
backBtn.onclick=goBack;
tabbar.addEventListener('click',e=>{
  const b=e.target.closest('.tab');if(!b)return;
  quiz=null;stack=[];
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));
  ({home,progress:progressView,about:aboutView})[b.dataset.tab]();
});

/* ---------- home / topics ---------- */
function home(){
  setBar('Computer Science',false);
  stack=[home];
  view.innerHTML=CURRICULUM.map(t=>`
   <div class="topic-card">
     <div class="topic-head"><span class="topic-num">TOPIC ${t.n}</span><span class="topic-name">${esc(t.name)}</span></div>
     ${t.sections.map(s=>`
       <button class="section-row" data-sec="${s.id}" ${s.live?'':'disabled'}>
         <span class="sec-num">${s.n}</span>
         <span class="sec-name">${esc(s.name)}</span>
         ${s.live?'<span class="sec-count">200 Qs</span>':'<span class="sec-soon">coming soon</span>'}
       </button>`).join('')}
   </div>`).join('')+
   `<p class="muted">Predicted questions modelled on official Edexcel 4CP0 past papers.<br>Sections unlock as question banks are added.</p>`;
  view.querySelectorAll('.section-row[data-sec]').forEach(b=>{
    if(!b.disabled)b.onclick=()=>push(()=>sectionHub(b.dataset.sec));
  });
}
function findSection(id){
  for(const t of CURRICULUM)for(const s of t.sections)if(s.id===id)return{t,s};
}

/* ---------- section hub ---------- */
function sectionHub(id){
  const {t,s}=findSection(id);
  setBar(`Ch ${s.n} · ${s.name}`,true);
  const th=store.bankStats(id,'theory',100),pr=store.bankStats(id,'practical',100);
  view.innerHTML=`
   <h2 class="hub-title">${esc(s.name)}</h2>
   <p class="hub-sub">Topic ${t.n} — ${esc(t.name)}</p>
   <div class="hub-grid">
     <button class="hub-btn wide" id="goNotes"><h3>&#128278; Revision notes</h3><p>Easy-to-remember pointers, flowchart symbols, pseudocode commands and memory hooks.</p></button>
     <button class="hub-btn" id="goTheory"><h3>&#128221; Predicted questions</h3><p>100 exam-style questions — every style asked in the official papers.</p>
       <span class="hub-progress">${th.done}/100 attempted${th.m?` · ${th.g}/${th.m} marks`:''}</span></button>
     <button class="hub-btn" id="goPractical"><h3>&#9881;&#65039; Practical questions</h3><p>100 code, flowchart, trace-table and error-fixing questions.</p>
       <span class="hub-progress">${pr.done}/100 attempted${pr.m?` · ${pr.g}/${pr.m} marks`:''}</span></button>
   </div>`;
  document.getElementById('goNotes').onclick=()=>push(()=>notesView(id));
  document.getElementById('goTheory').onclick=()=>push(()=>quizSetup(id,'theory'));
  document.getElementById('goPractical').onclick=()=>push(()=>quizSetup(id,'practical'));
}

/* ---------- notes ---------- */
async function notesView(id){
  setBar('Revision notes',true);
  view.innerHTML='<p class="muted">Loading notes…</p>';
  const notes=await loadJSON(`data/notes-${id}.json`);
  view.innerHTML=notes.groups.map(g=>`
    <div class="note-group">
      <h3>${esc(g.h)}</h3>
      <ul>${g.points.map(p=>`<li>${fmt(p)}</li>`).join('')}</ul>
      ${g.hook?`<div class="memory-hook">&#129504; <b>Remember:</b> ${g.hook}</div>`:''}
    </div>`).join('');
}

/* ---------- quiz setup ---------- */
async function quizSetup(id,bank){
  const label=bank==='theory'?'Predicted questions':'Practical questions';
  setBar(label,true);
  view.innerHTML='<p class="muted">Loading question bank…</p>';
  const qs=await loadJSON(`data/q-${id}-${bank}.json`);
  const attempted=Object.keys((store.read()[id]||{})[bank]||{});
  view.innerHTML=`
   <div class="setup-card">
     <h3>How many questions?</h3>
     <div class="chip-row" id="numRow">
       ${[10,20,50,100].map((n,i)=>`<button class="chip${i===0?' sel':''}" data-n="${n}">${n}</button>`).join('')}
     </div>
   </div>
   <div class="setup-card">
     <h3>Question order</h3>
     <div class="chip-row" id="ordRow">
       <button class="chip sel" data-o="shuffle">Shuffled</button>
       <button class="chip" data-o="seq">In order</button>
       <button class="chip" data-o="new">Unseen first</button>
     </div>
   </div>
   <button class="start-btn" id="startBtn">Start — ${qs.length} in bank · ${attempted.length} attempted</button>`;
  const pick=(row)=>row.addEventListener('click',e=>{
    const c=e.target.closest('.chip');if(!c)return;
    row.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
  });
  pick(document.getElementById('numRow'));pick(document.getElementById('ordRow'));
  document.getElementById('startBtn').onclick=()=>{
    const n=+document.querySelector('#numRow .sel').dataset.n;
    const ord=document.querySelector('#ordRow .sel').dataset.o;
    let list=[...qs];
    if(ord==='shuffle')list.sort(()=>Math.random()-.5);
    if(ord==='new'){
      const seen=new Set(attempted);
      list.sort((a,b)=>(seen.has(a.id)?1:0)-(seen.has(b.id)?1:0)||Math.random()-.5);
    }
    quiz={secId:id,bank,list:list.slice(0,n),i:0,got:0,max:0,answered:0};
    push(renderQuestion);
  };
}

/* ---------- question rendering ---------- */
function updatePill(){
  scorePill.hidden=false;
  scorePill.textContent=`${quiz.got}/${quiz.max} marks`;
}
function renderQuestion(){
  if(!quiz)return;
  const q=quiz.list[quiz.i];
  setBar(`${quiz.bank==='theory'?'Predicted':'Practical'} · Q${quiz.i+1}/${quiz.list.length}`,true);
  updatePill();
  const typeLabel={mcq:'Multiple choice',short:'Written answer',fill:'Complete',trace:'Trace table',code:'Code',flow:'Flowchart',design:'Design an algorithm'}[q.type]||'Question';
  let body=`<div class="qpaper">
    <div class="qmeta"><span class="qtag">${q.id} · ${typeLabel}</span><span>${q.marks} mark${q.marks>1?'s':''}</span></div>
    <div class="qtext">${fmt(q.q)}</div>
    ${q.code?`<pre class="codeblock">${esc(q.code)}</pre>`:''}
    ${q.flow?`<div class="flowwrap">${renderFlow(q.flow)}</div>`:''}
    ${q.table?renderTable(q.table):''}
    <span class="qmarks">(${q.marks})</span>
    <div id="answerArea"></div>
  </div>
  <div class="qnav" id="qnav" hidden>
    <button class="skip" id="skipBtn">Skip</button>
    <button class="next" id="nextBtn">${quiz.i+1<quiz.list.length?'Next question':'Finish'}</button>
  </div>`;
  view.innerHTML=body;
  const area=document.getElementById('answerArea');
  if(q.type==='mcq')renderMCQ(q,area);else renderWritten(q,area);
  document.getElementById('nextBtn').onclick=advance;
  document.getElementById('skipBtn').onclick=advance;
  showNav(false); // nav appears once the question is answered/marked
  window.scrollTo(0,0);
}
function fmt(s){ // escape then allow **bold** and `mono`
  return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code style="font-family:var(--mono);background:var(--mint);padding:1px 4px;border-radius:4px;font-size:.92em">$1</code>');
}
function renderTable(t){
  return `<table class="ttable"><tr>${t.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${
    Array.from({length:t.blank||3},()=>`<tr>${t.cols.map(()=>'<td>&nbsp;</td>').join('')}</tr>`).join('')}</table>`;
}
function showNav(v){document.getElementById('qnav').hidden=!v}

function renderMCQ(q,area){
  area.innerHTML=q.options.map((o,i)=>`<button class="opt" data-i="${i}"><span class="letter">${'ABCD'[i]}</span><span>${fmt(o)}</span></button>`).join('');
  area.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i, right=i===q.answer;
    area.querySelectorAll('.opt').forEach(x=>{
      x.disabled=true;
      if(+x.dataset.i===q.answer)x.classList.add('correct');
      else if(x===b&&!right)x.classList.add('incorrect');
    });
    const got=right?q.marks:0;
    quiz.got+=got;quiz.max+=q.marks;quiz.answered++;
    store.record(quiz.secId,quiz.bank,q.id,got,q.marks);
    updatePill();
    if(q.ms)area.insertAdjacentHTML('beforeend',msBlock(q));
    showNav(true);
  });
}
function renderWritten(q,area){
  area.innerHTML=`
    <textarea class="attempt" placeholder="Type your working / answer here (optional) — then reveal the mark scheme and mark yourself."></textarea>
    <button class="primary-btn reveal-btn" id="revealBtn">Reveal mark scheme</button>`;
  document.getElementById('revealBtn').onclick=()=>{
    document.getElementById('revealBtn').remove();
    area.insertAdjacentHTML('beforeend',msBlock(q)+`
      <div class="selfmark" id="selfmark">
        ${markButtons(q.marks)}
      </div>`);
    document.getElementById('selfmark').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      const got=+b.dataset.m;
      quiz.got+=got;quiz.max+=q.marks;quiz.answered++;
      store.record(quiz.secId,quiz.bank,q.id,got,q.marks);
      updatePill();
      document.getElementById('selfmark').innerHTML=`<button disabled style="flex:1;border-radius:10px;padding:12px;font-weight:700;border:1px solid var(--line);background:#fff">Marked: ${got}/${q.marks}</button>`;
      showNav(true);
    });
  };
}
function markButtons(m){
  if(m<=1)return `<button class="no" data-m="0">&#10007; 0 marks</button><button class="yes" data-m="1">&#10003; 1 mark</button>`;
  let out='';
  for(let i=0;i<=m;i++)out+=`<button class="${i===0?'no':i===m?'yes':''}" data-m="${i}">${i}/${m}</button>`;
  return out;
}
function msBlock(q){
  return `<div class="ms"><h4>Mark scheme</h4><div class="mstext">${fmt(q.ms)}</div>${q.msCode?`<pre class="codeblock">${esc(q.msCode)}</pre>`:''}${q.msFlow?`<div class="flowwrap">${renderFlow(q.msFlow)}</div>`:''}</div>`;
}
function advance(){
  quiz.i++;
  if(quiz.i<quiz.list.length)renderQuestion();
  else results();
}
function results(){
  setBar('Results',true);
  const pct=quiz.max?Math.round(100*quiz.got/quiz.max):0;
  const grade=pct>=90?'Level 9 pace &#127942;':pct>=75?'Strong — grade 7/8 territory':pct>=55?'Solid — keep drilling':'Revise the notes, then retry';
  view.innerHTML=`<div class="result-card">
    <div class="result-big">${quiz.got}/${quiz.max}</div>
    <div class="result-sub">${pct}% · ${grade}</div>
    <div class="pbar"><div style="width:${pct}%"></div></div>
    <button class="primary-btn" id="againBtn">Try another set</button>
    <button class="ghost-btn" id="hubBtn">Back to chapter</button>
  </div>`;
  const secId=quiz.secId,bank=quiz.bank;quiz=null;scorePill.hidden=true;
  document.getElementById('againBtn').onclick=()=>{stack.pop();quizSetup(secId,bank);stack.push(()=>quizSetup(secId,bank));};
  document.getElementById('hubBtn').onclick=()=>{stack=[home,()=>sectionHub(secId)];sectionHub(secId);};
}

/* ---------- progress + about ---------- */
function progressView(){
  setBar('Progress',false);stack=[progressView];
  const p=store.read();let rows='';
  CURRICULUM.forEach(t=>t.sections.forEach(s=>{
    if(!s.live)return;
    const th=store.bankStats(s.id,'theory',100),pr=store.bankStats(s.id,'practical',100);
    rows+=`<div class="prog-row"><h4>Ch ${s.n} — ${esc(s.name)}</h4>
      <small>Predicted: ${th.done}/100 attempted · ${th.g}/${th.m||0} marks</small>
      <div class="pbar"><div style="width:${th.m?Math.round(100*th.g/th.m):0}%"></div></div>
      <small>Practical: ${pr.done}/100 attempted · ${pr.g}/${pr.m||0} marks</small>
      <div class="pbar"><div style="width:${pr.m?Math.round(100*pr.g/pr.m):0}%"></div></div></div>`;
  }));
  view.innerHTML=rows+`<button class="ghost-btn" id="resetBtn">Reset all progress</button>`;
  document.getElementById('resetBtn').onclick=()=>{
    if(confirm('Delete all saved progress?')){localStorage.removeItem(store.k);progressView();}
  };
}
function aboutView(){
  setBar('About',false);stack=[aboutView];
  view.innerHTML=`<div class="note-group about">
   <h3>Edexcel International GCSE (9-1) Computer Science — 4CP0</h3>
   <p>Exam trainer with revision pointers and predicted questions modelled directly on the styles, command words and mark allocations used in official Edexcel past papers (Paper 1: Principles of Computer Science; Paper 2: Application of Computational Thinking).</p>
   <h3>Question banks</h3>
   <p>Each section carries <b>200 questions</b>: 100 predicted exam-style questions (multiple choice, state/describe/explain, complete-the-sentence) and 100 practical questions (trace tables, flowcharts, pseudocode, find-the-error, write-the-algorithm).</p>
   <h3>Marking</h3>
   <p>Multiple-choice questions mark automatically. Written questions reveal an examiner-style mark scheme — award yourself marks honestly, exactly as you would with a real past paper.</p>
   <h3>Offline</h3>
   <p>Install to your home screen; everything works offline after first load.</p>
  </div>`;
}

home();
})();
