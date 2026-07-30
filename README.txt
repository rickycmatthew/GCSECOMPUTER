EDEXCEL iGCSE COMPUTER SCIENCE (4CP0) EXAM TRAINER - PWA
========================================================

DEPLOY (Netlify drag & drop, same as your other PWAs):
1. Unzip this folder.
2. Go to app.netlify.com/drop and drag the whole folder in.
3. Open the site on your phone > Add to Home Screen. Works offline after first load.

WHAT'S INSIDE
- index.html, css/, js/          app shell (vanilla JS, no build step)
- js/data.js                     full 4CP0 curriculum map (6 topics, 22 chapters)
- js/flow.js                     SVG flowchart renderer for flowchart questions
- data/notes-1-1.json            Ch1 revision pointers with memory hooks
- data/q-1-1-theory.json         100 predicted exam-style questions (Ch1)
- data/q-1-1-practical.json      100 practical questions (Ch1)
- sw.js, manifest.json, icons/   PWA offline + install

ADDING THE NEXT CHAPTER (e.g. Ch2 Creating algorithms)
1. Create data/notes-1-2.json, data/q-1-2-theory.json, data/q-1-2-practical.json
   using the same JSON structure as the 1-1 files.
2. In js/data.js set live:true for the section id "1-2".
3. Bump the CACHE name in sw.js (cs4cp0-v2) so the service worker refreshes.

QUESTION JSON SCHEMA
{ "id":"T001", "type":"mcq|short|trace|code|flow|design", "marks":2,
  "q":"question text (**bold** and `mono` supported)",
  "code":"optional pseudocode block",
  "flow":[{"s":"start|end|proc|io|dec|sub","t":"label","yes":"...","no":"..."}],
  "options":[...], "answer":0,        <- mcq only
  "ms":"mark scheme", "msCode":"optional model answer code",
  "msFlow":[...] }                    <- optional model-answer flowchart

MARKING
- MCQs mark automatically.
- Written/practical questions reveal the mark scheme; the student self-awards
  marks (0..max) exactly like marking a past paper. Progress is saved on-device.
