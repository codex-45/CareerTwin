# CareerTwin — 4-person judging script

**Length:** about 7 minutes of demo, then Q&A.  
**Browser:** Chrome, already on http://localhost:3000, production build (`npm run build && npm start`).  
**Before you walk in:** click **Try with demo profile** once, then go back to the home page so the twin is already built. Have the Google JD sample ready. One person drives the laptop; the others stand and talk. Do not all click.

| Person | Owns these marks | Speaks about |
|---|---|---|
| **1 — Host** | Impact & problem-solution fit (20), Demo (5), close | Why this exists, and that every screen ends in a next action |
| **2 — Profile** | Innovation (15), UX of the twin | Digital twin, gap detector, roadmap |
| **3 — Interview** | The live technical wow inside Technical (30) | Adaptive interviewer, voice, webcam |
| **4 — Systems** | Rest of Technical (30), Scalability (15), UX of honesty | Truth checker, ATS, architecture |

UX/UI (10) is shared: point at the screen, don’t describe colours.

---

## 0:00 — Person 1, opening (45 sec)

> “Judges, we’re CareerTwin. The problem on the brief is an AI resume and interview coach. Most tools in this space do one thing: they rewrite a PDF and give you a score. A student still doesn’t know what kind of candidate they are, what to learn next, or whether a bullet is actually true.
>
> We built a working prototype that treats the resume as a **career profile that updates**. I’ll show you the student. Person 2 will show the profile and the plan. Person 3 will run a live interview. Person 4 will show why we refuse to let students fake keywords — and how the system is built so it still works with no paid API.”

**[CLICK]** Home page. If the dashboard is empty, click **Try with demo profile**. Land on Ananya Sharma’s dashboard.

> “This is Ananya, a final-year CSE student. One number: **34% ready for AI Engineer**, her target. Her best fit today is Full-Stack, not AI. That gap is the product. We don’t stop at the number.”

Point at the radar and the “Recommended next steps” card. Hand over.

---

## 0:45 — Person 2, Digital Twin + Gap + Roadmap (2 min)

**Innovation (15).** This is the line judges should hear:

> “The innovation is that we don’t store a PDF. We store a **Career Digital Twin**: skills, projects, experience, strengths, weak areas, and a target role. And every skill has evidence.”

**[CLICK]** Digital Twin → **2 · Profile**.

Point at a green skill and an amber skill.

> “Green means we saw the skill in a project, internship, or GitHub. Amber means she only listed it. Node.js is proven — she used it in an internship. Java is only listed. Scores are evidence-weighted, not keyword counts. A skill used at work scores higher than a skill typed in a skills section.”

**[CLICK]** **3 · Ask your twin** → the chip **“What skills am I missing for an AI Engineer role?”**

> “She can ask the twin what she is, which roles fit, and what’s missing. The answer is grounded in this profile. It will not invent Docker experience she doesn’t have.”

**[CLICK]** JD Gap Detector → **Sample: full Google JD** → **Analyse match**.

> “Paste a real job. Software Engineer at Google. Match is about **47%**. Checkmarks are skills she has proved. The dashed ones are claimed but unproven. Crosses are missing. Notice it did **not** tell her to learn C++. The JD says Python, Java, **or** C++. She already has Python and Java, so that requirement is satisfied.
>
> The part that matters for impact: it does not say ‘go learn Docker.’ Week 2 says **apply System Design to Melodia** — her existing music project. Week 4 says put the new work on the resume and re-run this score. The plan is a next action, not a lecture.”

**[CLICK]** Career Roadmap. Point at the AI Engineer tree.

> “Same target, as a tree: Programming, ML, Systems, GenAI, then Projects, Internship, Job. Green is learned from evidence, yellow is started, red is missing. Click a skill and it updates. This is how the twin is meant to grow with the student.”

Hand to Person 3.

---

## 2:45 — Person 3, live interview (2 min)

**Technical implementation, the part they can see.**

> “A normal mock-interview bot asks random questions. Ours changes the next question from the last answer. It scores **conceptual knowledge** and **practical application** separately.”

**[CLICK]** Adaptive Interview. Topics can stay as suggested. Turn **off** “Answer by voice” and “Interviewer speaks” if the room is noisy — say so:

> “I’ll type so you can read the reasoning. Voice and camera are on in a second pass if you want them.”

**[CLICK]** Start interview.

**Answer 1 — type this, it should score well and raise difficulty:**

> A primary key uniquely identifies each row and cannot be null. A foreign key references the primary key of another table, so the relationship stays valid.

**[CLICK]** Submit. Point at the ladder (Easy → Medium) and the purple decision box.

> “Conceptual came back strong, so it **raised the difficulty to Medium**. The box tells you why. We show the interviewer’s decision instead of hiding it.”

**Answer 2 — type a vague answer on purpose:**

> I think it’s when the database is faster. I’m not sure.

**[CLICK]** Submit.

> “That one is weak. It will either probe the missing idea or step back down to Easy. That is the adaptation: strong theory and weak application gets a practical follow-up; a bad answer does not jump to a harder question.”

If you have 20 extra seconds and a quiet room: turn the mic on, answer one line out loud, and point at WPM, filler words, and long pauses.

If they ask about the camera, turn it on only after reading the consent line:

> “Webcam is optional and needs consent. Video never leaves the laptop. MediaPipe runs in the browser. We measure whether the face is in frame, looking away, movement, and posture shifts. We do **not** claim it can read emotion, honesty, or personality.”

**[CLICK]** End & see report, only if time. Otherwise skip the report and say:

> “The report writes this score back into the twin. Readiness on the dashboard moves. The profile is not a one-time upload.”

Hand to Person 4.

---

## 4:45 — Person 4, truth, ATS, how it’s built (1 min 45 sec)

**[CLICK]** Truth Checker. Open the Melodia bullet: “Developed a highly scalable AI recommendation engine.”

> “This bullet sounds good and proves nothing. Credibility is low. The checker asks what ‘scalable’ means: dataset size, users, architecture, performance. If she types a 170-thousand-song dataset, Python and scikit-learn, and under 200 milliseconds, we rewrite **only those facts**. We delete ‘highly scalable’ because she never justified it. We will not invent a number to make the line prettier.”

**[CLICK]** ATS Simulator. Point at the job table, then the three columns.

> “One resume, many jobs. Full-stack is her best match, cloud is her worst. Keywords are split three ways: **proved, so keep them**; **listed but unproved, so add a project**; **missing, so learn them — do not paste them into the skills section**. Keyword stuffing would raise a dumb ATS score and fail the interview we just ran.”

Then the architecture, slowly. This is the Technical + Scalability block:

> “Under the UI, scores do not come from the language model. A TypeScript engine parses the resume, calls GitHub, and scores about ninety skills by evidence. Ten role models have weights. The interviewer is a state machine: easy, medium, hard, scenario.
>
> The LLM only writes language — the summary, the plan, the pitch — and every prompt says: do not invent skills or numbers. If there is no API key, or the API fails, the same buttons still return an answer from the rule engine. You can see the tag on every card: AI-generated or Rule engine.
>
> Speech and the webcam run on the student’s machine, so that cost does not scale with users. The API routes are stateless, so the app can sit on Vercel. The twin itself stays in the browser for this prototype. A production version would add login and a database; nothing in the design blocks that.”

Hand back to Person 1.

---

## 6:30 — Person 1, close (30 sec)

**[CLICK]** Hire-Me Pitch → **Compare 4 companies**, if the page is fast. If it is slow, describe it and don’t wait.

> “Last piece: the same profile becomes a 30-second ‘why hire you’ for Google, Microsoft, Amazon, and a startup. Different emphasis, same facts. No invented metrics.
>
> So: we didn’t build a resume rewriter. We built a profile that knows what is proved, tells the student the next four weeks, interviews them at the right difficulty, and refuses to let them claim what they haven’t done. Happy to take questions — we’ll answer in the area each of us built.”

---

## If they only give you 4 minutes

Cut in this order. Do not cut the gap plan or the one adaptive interview answer.

1. Skip roadmap (mention it in one sentence).
2. Skip the pitch compare (one sentence in the close).
3. Skip the second interview answer.
4. Person 4 does Truth **or** ATS, not both. Prefer ATS if the judge looks at “don’t keyword-stuff”; prefer Truth if they liked the innovation talk.

---

## Q&A — who answers

Person 1 repeats the question in one line, then names who answers. One person speaks.

| They ask | Who | Say this |
|---|---|---|
| Isn’t the match score just keywords? | **2** | “No. A skill in a project or internship outweighs a skill that is only listed. Role requirements are weighted core, important, or nice-to-have. ‘Python or Java or C++’ counts as one requirement. MySQL implies SQL.” |
| What if the LLM hallucinates? | **4** | “Scores never come from the LLM. Prompts forbid new skills and new numbers. The rewrite only uses the fields the student fills in. If the model is down, the rule engine still answers, and the card says so.” |
| How is this different from ChatGPT plus a resume? | **1** | “ChatGPT will happily add Docker to a resume. We separate proved, listed, and missing, and we tell the student to learn the missing ones. The interview then tests the thing they claim.” |
| Can the camera read confidence or lying? | **3** | “No. We measure face in frame, looking away, movement, and posture. Confidence on the speech panel is pace, pauses, fillers, and hedging — not a personality score. Video is not uploaded.” |
| How do you scale this? | **4** | “API routes are stateless. Camera and speech stay on the device. LLM calls are optional and already provider-agnostic: Gemini, OpenAI, or Groq. Next step is auth, Postgres for the twin, and a cache of job descriptions.” |
| Did you train a model? | **4** | “No, and we shouldn’t for this problem. The scoring has to be explainable to a student. We use a rules engine plus a general LLM for wording, and MediaPipe’s existing face model on-device.” |
| What did each of you build? | **each, one sentence** | 1: product flow and the pitch. 2: twin, gap detector, roadmap. 3: adaptive interview and the speech/camera coach. 4: truth checker, ATS, and the scoring engine. Adjust these to what you actually wrote. |
| Show it on my resume. | **2** | Take the PDF. Digital Twin → upload. Talk while it parses. If Wi-Fi or the file fails, say so and return to Ananya. Do not debug in silence. |

If you don’t know: “That’s outside this prototype. The next step would be ___.” Then stop.

---

## Setup, 10 minutes before

1. `npm run build && npm start` inside `careertwin`. Open Chrome to http://localhost:3000.
2. Load the demo profile once. Click through Gap, Interview, Truth, and ATS so the pages are compiled.
3. Laptop charger in. Brightness up. Zoom the browser to 110% if the back row can’t read.
4. Phone hotspot ready. The demo still runs with **no** API key.
5. Decide who holds the laptop (Person 2 or 3). The others do not touch the trackpad.
6. One rehearsal out loud. Cut anything that made you rush.
