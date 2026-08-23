# AI Interview Agent — Complete Technical Interview Preparation Analysis

> Based on 100% code inspection. Every claim is tied to an actual file and line.  
> Anything not found in the codebase is explicitly marked **NOT FOUND IN CODEBASE**.

---

## 1. Executive Summary

This is a **MERN SaaS platform** that simulates realistic AI-driven job interviews. Users authenticate via Google (Firebase), upload a PDF resume, and the backend parses it using `pdfjs-dist`, then calls **OpenRouter → GPT-4o-mini** to generate 5 personalized interview questions. A voice/video interview UI plays the AI interviewer (pre-recorded video) with text-to-speech via the Web Speech API. User answers via microphone (Web Speech Recognition) or typing. Each answer is submitted to the backend for AI evaluation, producing confidence/communication/correctness scores. A final report is generated, downloadable as PDF using `jsPDF`. Credits gate interviews (100 free, 50 per interview), and more credits can be purchased via Razorpay.

---

## 2. Technology Stack (Confirmed from Code)

### Frontend (`E:/AI-Interview-/client/`)
| Technology | Version | File Evidence |
|------------|---------|---------------|
| React | 19.2.4 | `package.json` |
| Vite | 8.0.1 | `package.json`, `vite.config.js` |
| Tailwind CSS | 4.2.2 | `package.json` |
| Redux Toolkit | 2.11.2 | `package.json`, `src/redux/` |
| React Router DOM | 7.13.2 | `package.json`, `App.jsx` |
| Axios | 1.14.0 | `package.json`, every component |
| Motion (Framer) | 12.38.0 | `package.json`, `motion/react` imports |
| Firebase | 12.11.0 | `package.json`, `utils/firebase.js` |
| jsPDF | 4.2.1 | `package.json`, `Step3Report.jsx` |
| jspdf-autotable | 5.0.8 | `package.json`, `Step3Report.jsx` |
| react-circular-progressbar | 2.2.0 | `package.json`, `Timer.jsx`, `Step3Report.jsx` |
| recharts | 2.15.4 | `package.json`, `Step3Report.jsx` |
| react-icons | 5.6.0 | `package.json`, all components |
| **JavaScript (not TypeScript)** | — | All `.jsx` files |

### Backend (`E:/AI-Interview-/server/`)
| Technology | Version | File Evidence |
|------------|---------|---------------|
| Node.js | — | `package.json` (ESM: `"type":"module"`) |
| Express | 5.2.1 | `package.json`, `index.js` |
| Mongoose | 9.3.3 | `package.json`, all models |
| JWT (jsonwebtoken) | 9.0.3 | `package.json`, `config/token.js` |
| cookie-parser | 1.4.7 | `package.json`, `index.js` |
| multer | 2.1.1 | `package.json`, `middlewares/multer.js` |
| pdfjs-dist | 5.6.205 | `package.json`, `interview.controller.js` |
| Razorpay SDK | 2.9.6 | `package.json`, `services/razorpay.service.js` |
| Axios | 1.14.0 | `package.json`, `services/openRouter.services.js` |
| dotenv | 17.4.0 | `package.json`, every file |
| nodemon | 3.1.14 | `package.json` (dev) |

### External Services
| Service | Purpose | Config File |
|---------|---------|-------------|
| Firebase (Google Auth) | Google Sign-In | `client/src/utils/firebase.js` |
| OpenRouter API → GPT-4o-mini | AI (resume, questions, eval) | `server/services/openRouter.services.js` |
| Razorpay | Payments | `server/services/razorpay.service.js` |
| MongoDB Atlas | Database | `server/config/connectDb.js` |
| Vercel | Frontend hosting | (env var `VITE_SERVER_URL`) |
| Render | Backend hosting | (env var `PORT`, `MONGODB_URL`) |

---

## 3. Architecture

### Directory Structure
```
E:/AI-Interview-/
├── client/                          ← React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                  ← Root component, router, user bootstrap
│   │   ├── main.jsx                 ← React DOM mount, Redux Provider, BrowserRouter
│   │   ├── index.css                ← Minimal global styles (22 bytes)
│   │   ├── pages/
│   │   │   ├── Home.jsx             ← Landing page
│   │   │   ├── Auth.jsx             ← Google login page
│   │   │   ├── InterviewPage.jsx    ← Orchestrates 3 steps
│   │   │   ├── InterviewHistory.jsx ← Past interviews list
│   │   │   ├── InterviewReport.jsx  ← Fetches & displays a specific report
│   │   │   └── Pricing.jsx          ← Credit purchase page
│   │   ├── components/
│   │   │   ├── Navbar.jsx           ← Nav with credits, user menu, auth modal
│   │   │   ├── AuthModel.jsx        ← Modal wrapper around Auth.jsx
│   │   │   ├── Footer.jsx           ← Static footer
│   │   │   ├── Step1SetUp.jsx       ← Resume upload + interview setup form
│   │   │   ├── Step2Interview.jsx   ← Live interview UI (voice/video/timer)
│   │   │   ├── Step3Report.jsx      ← Post-interview report + PDF download
│   │   │   └── Timer.jsx            ← Circular countdown component
│   │   ├── redux/
│   │   │   ├── store.js             ← configureStore with userSlice
│   │   │   └── userSlice.js         ← userData state (null or user object)
│   │   └── utils/
│   │       └── firebase.js          ← Firebase app init, auth, GoogleAuthProvider
│   └── .env                         ← VITE_FIREBASE_API_KEY, VITE_RAZORPAY_KEY_ID, VITE_RAZORPAY_KEY_SECRET, VITE_SERVER_URL
│
└── server/                          ← Express backend
    ├── index.js                     ← Express app, CORS, middleware, route mounting
    ├── config/
    │   ├── connectDb.js             ← mongoose.connect()
    │   └── token.js                 ← jwt.sign() helper
    ├── middlewares/
    │   ├── isAuth.js                ← JWT cookie verification middleware
    │   └── multer.js                ← Disk storage, 5MB limit, filename sanitize
    ├── models/
    │   ├── user.models.js           ← User schema
    │   ├── interview.model.js       ← Interview + embedded Questions schema
    │   └── payment.model.js         ← Payment/order schema
    ├── controllers/
    │   ├── auth.controller.js       ← googleAuth, logout
    │   ├── interview.controller.js  ← analyzeResume, generateQuestion, submitAnswer, finishInterview, getMyInterviews, getInterviewReport
    │   ├── payment.controller.js    ← createOrder, verifyPayment
    │   └── user.controller.js       ← getCurrentUser
    ├── routes/
    │   ├── auth.route.js            ← POST /google, GET /logout
    │   ├── interview.route.js       ← All interview endpoints
    │   ├── payment.route.js         ← POST /order, POST /verify
    │   └── user.route.js            ← GET /current-user
    └── services/
        ├── openRouter.services.js   ← Axios wrapper to OpenRouter API
        └── razorpay.service.js      ← Razorpay instance init
```

### Request Flow Diagram
```
Browser (React)
    │
    │  axios + withCredentials (cookie-based auth)
    ▼
Express 5 (Render)
    │
    ├── CORS Middleware (origin: localhost:5173 only — prod bug)
    ├── express.json()
    ├── cookieParser()
    ├── Custom COOP/COEP headers
    │
    ├── /api/auth/*     → isAuth? NO  → auth.controller.js
    ├── /api/user/*     → isAuth YES  → user.controller.js
    ├── /api/interview/* → isAuth YES → interview.controller.js
    │                                     └── openRouter.services.js → OpenRouter API → GPT-4o-mini
    │                                     └── multer.js (resume upload)
    │                                     └── pdfjs-dist (PDF parsing)
    └── /api/payment/*  → isAuth YES  → payment.controller.js
                                          └── razorpay.service.js → Razorpay API
    │
    ▼
MongoDB Atlas (Mongoose 9)
    Collections: users, interviews, payments
```

### State Management
- **Redux Toolkit** with a single slice: `userSlice`
- State shape: `{ user: { userData: null | UserObject } }`
- `userData` contains: `_id, name, email, credits, createdAt, updatedAt`
- Set on: app boot (`/api/user/current-user`), Google login, payment verify
- Cleared on: logout

---

## 4. Complete User Flow

### Flow Table

| Stage | Frontend File | API Endpoint | Method | Controller | DB Operation | External |
|-------|--------------|--------------|--------|------------|--------------|---------|
| App loads | `App.jsx` | `/api/user/current-user` | GET | `getCurrentUser` | `User.findById(req.userId)` | — |
| Google Login | `Auth.jsx` | `/api/auth/google` | POST | `googleAuth` | `User.findOne({email})` or `User.create()` | Firebase SDK (client-side popup) |
| View credits | `Navbar.jsx` | — | — | — | Redux state | — |
| Open Interview | `InterviewPage.jsx` | — | — | — | — | — |
| Resume upload | `Step1SetUp.jsx` | `/api/interview/resume` | POST | `analyzeResume` | — (no DB save) | OpenRouter/GPT-4o-mini |
| Generate questions | `Step1SetUp.jsx` | `/api/interview/generate-questions` | POST | `generateQuestion` | `User.findById`, `user.save()` (credits-=50), `Interview.create()` | OpenRouter/GPT-4o-mini |
| Live interview | `Step2Interview.jsx` | — | — | — | — | Web Speech API (TTS + STT) |
| Submit answer | `Step2Interview.jsx` | `/api/interview/submit-answer` | POST | `submitAnswer` | `Interview.findById`, `interview.save()` | OpenRouter/GPT-4o-mini |
| Finish interview | `Step2Interview.jsx` | `/api/interview/finish` | POST | `finishInterview` | `Interview.findById`, `interview.save()` | — |
| View live report | `Step3Report.jsx` | — | — | — | Uses in-memory data from `finishInterview` response | — |
| Download report | `Step3Report.jsx` | — | — | — | — | jsPDF (client-side) |
| View history | `InterviewHistory.jsx` | `/api/interview/get-interview` | GET | `getMyInterviews` | `Interview.find({userId})` | — |
| View old report | `InterviewReport.jsx` | `/api/interview/report/:id` | GET | `getInterviewReport` | `Interview.findById(id)` | — |
| Buy credits | `Pricing.jsx` | `/api/payment/order` | POST | `createOrder` | `Payment.create()` | Razorpay API |
| Verify payment | `Pricing.jsx` (handler) | `/api/payment/verify` | POST | `verifyPayment` | `Payment.findOne()`, `Payment.save()`, `User.findByIdAndUpdate($inc credits)` | crypto (HMAC-SHA256) |

---

## 5. Authentication

### What Auth Methods Exist

**ONLY Google/Firebase authentication exists.** There is no email/password registration, no password field in the User schema, and no signup/signin with email form anywhere.

### Firebase Configuration (`client/src/utils/firebase.js`)
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "interviewiq-b8f7a.firebaseapp.com",
  projectId: "interviewiq-b8f7a",
  storageBucket: "interviewiq-b8f7a.firebasestorage.app",
  messagingSenderId: "330539656691",
  appId: "1:330539656691:web:df63a6931af2f020571e86"
};
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
```
- Only `apiKey` comes from env. All other config values are hardcoded.

### Google Sign-In Flow (Step by Step)

**Step 1 — Client (`Auth.jsx` → `handleGoogleAuth`):**
```
signInWithPopup(auth, provider)
  → Firebase SDK opens Google OAuth popup
  → User selects Google account
  → Firebase returns response.user with:
      - displayName (name)
      - email
      - uid (NOT sent to backend)
      - idToken (NOT extracted or sent)
```

**Step 2 — Client sends to backend:**
```javascript
axios.post(serverUrl + "/api/auth/google", 
  { name: User.displayName, email: User.email },
  { withCredentials: true }
)
```
⚠️ **Critical:** Only raw `name` and `email` strings are sent. The Firebase ID token is NOT verified by the backend.

**Step 3 — Backend (`auth.controller.js` → `googleAuth`):**
```javascript
const { name, email } = req.body;
let user = await User.findOne({ email });
if (!user) {
  user = await User.create({ name, email }); // 100 credits by default
}
let token = await genToken(user._id);
res.cookie("token", token, {
  httpOnly: true,
  secure: false,        // ← should be true in production
  sameSite: "lax",
  maxAge: 7*24*60*60*1000  // 7 days
});
return res.json({ message: "Login Successfull", user, success: true });
```

**Step 4 — Token generation (`config/token.js`):**
```javascript
jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
```

**Step 5 — Auth middleware (`middlewares/isAuth.js`):**
```javascript
let token = req.cookies.token;   // reads httpOnly cookie
const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
req.userId = verifyToken.userId;
next();
```

### Summary: Auth Token Storage
- **JWT stored in httpOnly cookie** named `"token"`
- Cookie is sent automatically by browser with every request (`withCredentials: true`)
- Token contains: `{ userId, iat, exp }`
- Token expires: 7 days
- `secure: false` (should be `true` for HTTPS in production)
- `sameSite: "lax"` (means cross-site POST will not send cookie — potential issue for Vercel → Render)

### Logout (`auth.controller.js` → `logout`)
```javascript
res.clearCookie("token");
return res.status(200).json({ message: "Logout Successfull", success: true });
```

### Protected Routes
- All `/api/user`, `/api/interview`, `/api/payment` routes are protected by `isAuth` middleware
- `/api/auth/google` and `/api/auth/logout` are NOT authenticated
- **Frontend has no protected route wrapper** — users can navigate to `/interview`, `/history`, `/pricing` directly in the browser without being logged in (the API calls will fail with 400/500 but the page renders)

### Current User (`user.controller.js`)
```javascript
const user = await User.findById(userId);
return res.status(200).json({ message: "User found", user, success: true });
```
Called on every app load from `App.jsx` to restore Redux state.

---

## 6. Database Architecture

### Collection: `users` (model: `user.models.js`)

```javascript
{
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true },
  credits: { type: Number, default: 100 },
  // Timestamps:
  createdAt: Date,  // auto by { timestamps: true }
  updatedAt: Date
}
```

- **No password field** (Google-only auth)
- **No passwordHash field**
- Credits default to 100 on account creation
- No indexes beyond `email` (unique constraint creates an index)

### Collection: `interviews` (model: `interview.model.js`)

```javascript
// Embedded sub-document: questionsSchema
{
  question:      String,
  difficulty:    String,   // "easy" | "medium" | "hard"
  timeLimit:     Number,   // seconds: 60 | 90 | 120
  answer:        String,   // user's submitted answer
  feedback:      String,   // AI feedback text
  score:         { type: Number, default: 0 },       // 0–10
  confidence:    { type: Number, default: 0 },       // 0–10
  communication: { type: Number, default: 0 },       // 0–10
  correctness:   { type: Number, default: 0 }        // 0–10
}

// Main interview document
{
  userId:     { type: ObjectId, ref: "User", required: true },
  role:       { type: String, required: true },
  experience: { type: String, required: true },
  mode:       { type: String, enum: ["HR", "Technical"], required: true },
  resumeText: { type: String },
  questions:  [questionsSchema],           // embedded array, no separate collection
  finalScore: { type: Number, default: 0 },
  // ⚠️ SCHEMA BUG: Two 'status' fields defined — Mongoose keeps the last one:
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'Completed', 'finished'],
    default: 'pending'
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Important:** Questions, answers, scores, and feedback are ALL embedded inside the Interview document. There is **no separate Questions collection, no Answers collection, no Report collection**.

### Collection: `payments` (model: `payment.model.js`)

```javascript
{
  userId:           { type: ObjectId, ref: "User", required: true },
  planId:           String,   // "basic" | "pro"
  amount:           Number,   // INR amount (e.g. 100, 500)
  credits:          Number,   // credits to add (150, 650)
  razorpayOrderId:  String,
  razorpayPaymentId: String,
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Relationships
```
User (1)
  └─ Interviews (many) — via userId ObjectId reference
       └─ Questions (embedded array, 1–5 per interview)
            └─ Answers (embedded in Question subdoc)
            └─ Scores (embedded in Question subdoc)

User (1)
  └─ Payments (many) — via userId ObjectId reference

No explicit Resume model — resume text stored in Interview.resumeText
No explicit Report model — report computed from Interview.questions on demand
```

---

## 7. Resume Processing Pipeline

### Full Pipeline

```
User selects PDF file (Step1SetUp.jsx)
  → click "Analyze Resume" button
  → axios.post("/api/interview/resume", FormData{resume: file}, {withCredentials})
  
Backend: POST /api/interview/resume
  → isAuth middleware (JWT check)
  → upload.single("resume") (multer middleware)
       - Storage: diskStorage → server/public/
       - Filename: Date.now() + "-" + sanitizedOriginalName
       - Size limit: 5MB
       - ⚠️ No MIME type filter (only frontend accept="application/pdf")
  → analyzeResume controller (interview.controller.js)
       - fs.promises.readFile(req.file.path) → Buffer
       - new Uint8Array(buffer) → pdfjs-dist
       - pdfjsLib.getDocument({data: uint8Array}).promise
       - Loop pages: page.getTextContent() → items.map(i => i.str).join(" ")
       - resumeText = allPageText.replace(/\s+/g, " ").trim()
       
       AI Call (openRouter.services.js):
         messages = [
           { role: "system", content: `Extract structured data from resume. Return strictly JSON:
             { "role": "string", "experience": "string", "projects": [...], "skills": [...] }` },
           { role: "user", content: resumeText }
         ]
         → POST https://openrouter.ai/api/v1/chat/completions
           model: "openai/gpt-4o-mini"
           
       parseLLMJson(aiResponse):
         - Regex: text.match(/\{[\s\S]*\}/) — extracts JSON from markdown wrapper
         - JSON.parse(jsonMatch[0])
         
       fs.unlinkSync(filepath)  ← file deleted after parsing
       
Response to frontend:
  { role, experience, projects, skills, resumeText }
  ⚠️ resumeText is the raw PDF text — sent back to client, stored in React state
```

### Storage
- **File is stored temporarily** on the server disk in `server/public/`
- File is **deleted immediately** after AI parsing succeeds (`fs.unlinkSync`)
- **Resume text is NOT saved to the database** at this stage
- Resume text is stored in React state (`setResumeText`) and sent again in the next API call

### How Resume Influences Questions
The resume text is passed to `/api/interview/generate-questions` in the request body as `resumeText`. It becomes part of the AI prompt:
```
Role: ${role}
Experience: ${experience}
InterviewMode: ${mode}
Projects: ${projectText}   ← from resumeData.projects
Skills: ${skillsText}      ← from resumeData.skills
Resume: ${safeResume}      ← full PDF text
```
The AI system prompt instructs it to generate personalized questions using this context.

---

## 8. AI Architecture

### AI Provider
- **Provider:** OpenRouter (`https://openrouter.ai/api/v1/chat/completions`)
- **Model:** `openai/gpt-4o-mini`
- **Authentication:** Bearer token from `process.env.OPENROUTER_API_KEY`
- **File:** `server/services/openRouter.services.js`
- **No streaming** — standard completion calls
- **No timeout configured** (hangs indefinitely if OpenRouter is slow)

### `askAi()` Function
```javascript
export const askAi = async (messages) => {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    { model: "openai/gpt-4o-mini", messages },
    { headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` } }
  );
  const content = response?.data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("AI returned empty response.");
  return content;  // raw string
};
```

### `parseLLMJson()` Helper (`interview.controller.js` L8-17)
```javascript
const parseLLMJson = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON structure found in response");
  return JSON.parse(jsonMatch[0]);
};
```
- Handles markdown fencing (```json ... ```) by extracting the first `{...}` block
- Throws if no JSON found — caught by controller's try/catch → 500 response

---

### AI Call 1: Resume Analysis

**System prompt:**
```
Extract structured data from resume. Return strictly JSON formatting:
{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
```
**User message:** Full extracted PDF text

**Expected output:** JSON with 4 keys (role, experience, projects, skills)

**Parsing:** `parseLLMJson()` → extracts `{...}` block → JSON.parse

**Response fields used:** `parsed.role`, `parsed.experience`, `parsed.projects`, `parsed.skills`

---

### AI Call 2: Question Generation

**System prompt:**
```
You are a real human interviewer conducting a professional interview.
Speak in simple, natural English as if you are directly talking to the candidate.
Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard
```

**User message:**
```
Role: ${role}
Experience: ${experience}
InterviewMode: ${mode}   (HR or Technical)
Projects: ${projects.join(", ")}
Skills: ${skills.join(", ")}
Resume: ${resumeText}
```

**Expected output:** Plain text, 5 lines, one question per line

**Parsing:** 
```javascript
aiResponse.split("\n").map(q => q.trim()).filter(q => q.length > 0).slice(0, 5)
```
- NOT JSON parsing — splits by newlines
- Takes first 5 non-empty lines

**Question structure saved to DB:**
```javascript
questions: questionsArray.map((q, index) => ({
  question: q,
  difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
  timeLimit:  [60, 60, 90, 90, 120][index],  // seconds
}))
```

**Note:** No category (HR/Technical) stored per question. Mode is stored at interview level only.  
**Note:** No weightage stored per question in DB.

---

### AI Call 3: Answer Evaluation

**System prompt:**
```
You are a professional human interviewer evaluating a candidate's answer.
Score the answer in these areas (0 to 10): Confidence, Communication, Correctness.

Calculate: finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).
Feedback Rules: Write natural human feedback, 10 to 15 words only.

Return ONLY valid JSON format:
{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
```

**User message:**
```
Question: ${question.question}
Answer: ${answer}
```

**Note:** Resume context is NOT re-sent during evaluation. Only question text + answer.

**Parsing:** `parseLLMJson()` → JSON.parse

**Data saved to DB per question:**
```javascript
question.answer = answer;
question.confidence = parsed.confidence;
question.communication = parsed.communication;
question.correctness = parsed.correctness;
question.score = parsed.finalScore;       // AI-calculated average
question.feedback = parsed.feedback;
```

---

## 9. Voice + Video Architecture

All voice/video logic lives in **`Step2Interview.jsx`**.

### AI Video
- **Pre-recorded MP4 files** in `client/src/assets/videos/`
  - `male-ai.mp4`
  - `female-ai.mp4`
- A `<video>` element with `ref={videoRef}`, `muted`, `playsInline`, `preload="auto"`
- Video plays when AI speaks, pauses when AI stops
- Which video plays depends on which voice is selected (female preferred, male fallback)

### Text-to-Speech (AI Speaks)
- **Web Speech API** — `window.speechSynthesis`
- No third-party TTS library
- Voice selection logic:
  ```javascript
  // 1. Try female voices: "zira", "samantha", "female" in name
  // 2. Fallback to male: "david", "mark", "male"
  // 3. Final fallback: voices[0]
  ```
- `utterance.rate = 0.92` (slightly slower)
- `utterance.pitch = 1.05` (slight warmth)
- `utterance.volume = 1`
- Text modified before speaking: commas → `", ... "`, periods → `". ... "` (adds natural pauses)
- `utterance.onstart` → plays video, stops mic
- `utterance.onend` → pauses video, resets to 0, restarts mic if `isMicOn`

### Speech Recognition (User Speaks)
- **Web Speech API** — `window.webkitSpeechRecognition`
- `recognition.lang = "en-US"`
- `recognition.continuous = true`
- `recognition.interimResults = false`
- `onresult`: appends transcript to `answer` state: `prev + " " + transcript`
- **No MediaRecorder** — no audio file recording, just transcript text
- **No camera** — camera permission NOT requested

### Complete Interview Sequence
```
Step2Interview mounts
  → loadVoices() (useEffect)
  → selectedVoice set
  → runIntro() triggered (useEffect on selectedVoice)
       → speakText("Hi ${userName}, it's great to meet you today...")
       → speakText("I'll ask you a few questions...")
       → isIntroPhase = false
  → runIntro() triggered again (useEffect on isIntroPhase, currentIndex)
       → if last question: speakText("Alright, this one might be a bit more challenging.")
       → speakText(currentQuestion.question)
       → video plays during AI speech
       → startMic() when AI finishes
  
User speaks or types answer
  → SpeechRecognition appends to answer state OR textarea onChange
  
User clicks "Submit Answer" (or timer hits 0)
  → submitAnswer()
       → stopMic()
       → POST /api/interview/submit-answer
            { interviewId, questionIndex, answer, timeTaken: timeLimit - timeLeft }
       → receives { feedback }
       → speakText(feedback)   ← AI speaks feedback
       → setFeedback(feedback) ← shows "Next Question" button
  
User clicks "Next Question"
  → handleNext()
       → setCurrentIndex(currentIndex + 1)   OR
       → finishInterview() if last question
  → runIntro() useEffect fires again for new question
```

### Cleanup
```javascript
useEffect(() => {
  return () => {
    recognitionRef.current?.stop();
    recognitionRef.current?.abort();
    window.speechSynthesis.cancel();
  };
}, []);
```
No `MediaStream` cleanup needed since no camera/audio recording is used — only Speech API.

### Browser Compatibility
- `webkitSpeechRecognition` — Chrome-only prefix
- `window.speechSynthesis` — widely supported
- No fallback for unsupported browsers (no error message shown if API absent)

---

## 10. Timer

### Implementation (`Step2Interview.jsx`)

**State:** `const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)`

**Timer limits per question (set in `generateQuestion` controller):**
- Q1, Q2: 60 seconds
- Q3, Q4: 90 seconds
- Q5: 120 seconds

**Timer reset (useEffect, depends on `currentIndex`):**
```javascript
useEffect(() => {
  if (!isIntroPhase && currentQuestion) {
    setTimeLeft(currentQuestion.timeLimit || 60);
  }
}, [currentIndex]);
```

**Countdown (useEffect, depends on `isIntroPhase, currentIndex`):**
```javascript
const timer = setInterval(() => {
  setTimeLeft((prev) => {
    if (prev <= 1) { clearInterval(timer); return 0; }
    return prev - 1;
  });
}, 1000);
return () => clearInterval(timer);
```

**Auto-submit at 0 (useEffect, depends on `timeLeft`):**
```javascript
useEffect(() => {
  if (!isIntroPhase && currentQuestion && timeLeft === 0 && !isSubmitting && !feedback) {
    submitAnswer();
  }
}, [timeLeft]);
```

**`timeTaken` sent to backend:**
```javascript
timeTaken: currentQuestion.timeLimit - timeLeft
```

**Backend check (`submitAnswer` controller):**
```javascript
if (timeTaken > question.timeLimit) {
  question.score = 0;
  question.feedback = "Time limit exceeded. Answer not evaluated.";
  // ...
}
```

**Security Analysis:**
- Timer is **entirely frontend-controlled**
- `timeTaken` is **sent from the client** — a user could manipulate it in DevTools to send `timeTaken: 0` for any answer, bypassing the time limit check on the backend
- The backend checks if `timeTaken > question.timeLimit` but trusts the client's reported value
- Timer state is lost on page refresh — no server-side timer tracking

---

## 11. Scoring System

### Per-Question Score (AI Generated)
The AI directly calculates `finalScore` as the average of three 0–10 scores:
```
confidence (0-10) + communication (0-10) + correctness (0-10)
─────────────────────────────────────────────────────────────  = finalScore (AI rounds to integer)
                           3
```
This is computed by GPT-4o-mini based on the prompt instruction.

### Final Interview Score (`finishInterview` controller)
```javascript
let totalScore = 0;
interview.questions.forEach((q) => {
  totalScore += q.score || 0;
});
const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
interview.finalScore = finalScore;
```

**This is a simple arithmetic mean — NOT weighted.**

Example with 5 questions scoring [8, 6, 7, 5, 4]:
```
finalScore = (8 + 6 + 7 + 5 + 4) / 5 = 6.0
```

**There are NO question weights.** The spec mentions Q1=10%, Q2=20% etc., but the code does not implement this. Every question contributes equally.

### Score Stored
- `interview.finalScore = finalScore` (full precision)
- Returned to client as `Number(finalScore.toFixed(1))` (1 decimal)

### Score Display
- `Step3Report.jsx`: `percentage = (score / 10) * 100` for circular progress bar
- Score out of 10

### Performance Classification (`Step3Report.jsx`)
```javascript
if (finalScore >= 8)       → "Ready for job opportunities."
else if (finalScore >= 5)  → "Needs minor improvement before interviews."
else                       → "Significant improvement required."
```

### Average Skill Scores
Both `finishInterview` and `getInterviewReport` compute:
```javascript
avgConfidence   = totalConfidence   / totalQuestions
avgCommunication = totalCommunication / totalQuestions
avgCorrectness  = totalCorrectness  / totalQuestions
```
These are simple averages, all returned as `toFixed(1)`.

---

## 12. Credit System

### Storage
Credits stored in `User.credits` field (Number, default: 100).

### Initial Assignment
```javascript
user = await User.create({ name, email });
// credits defaults to 100 via schema default
```

### Interview Cost
Hardcoded: `50` credits. Defined in `generateQuestion` controller:
```javascript
if (user.credits < 50) {
  return res.status(400).json({ message: "Not enough credits. Minimum 50 required." });
}
// ...
user.credits -= 50;
await user.save();
```

### Deduction Timing (CRITICAL BUG)
Credits are deducted and `user.save()` is called **before** `Interview.create()`:
```javascript
user.credits -= 50;  // L178
await user.save();   // L179
const interview = await Interview.create({...});  // L181
```
If `Interview.create()` fails (e.g., DB timeout), the user loses 50 credits but gets no interview.

### Race Condition (CRITICAL BUG)
The credit check and deduction are NOT atomic:
```javascript
// Request A and Request B can both reach here simultaneously:
if (user.credits < 50) return 400;  // both pass
// ...
user.credits -= 50;  // both deduct
await user.save();   // last write wins — user loses only 50 in DB but gets 2 interviews
```

### Frontend Credit Guard
`Step1SetUp.jsx` also checks before calling the API:
```javascript
if (!userData || userData.credits < 50) {
  showToast("Not enough credits...");
  return;
}
```
This is a UX convenience, not a security control.

### After Interview
If `submitAnswer` fails, credits are already deducted (no refund mechanism).
If `finishInterview` is called again on a completed interview, no additional credits are deducted (scoring is recalculated but credits only deducted at `generateQuestion` time).

### Negative Credits
**Possible** via race condition — if two requests fire simultaneously with exactly 50 credits each, both deduct, resulting in 0 or potentially -50 if the save order is wrong.

---

## 13. Razorpay Payment System

### Plans Defined (`Pricing.jsx`)
```javascript
{ id: "free",  price: 0,    credits: 100, default: true }  // no payment
{ id: "basic", price: ₹100, credits: 150 }
{ id: "pro",   price: ₹500, credits: 650 }
```

### Payment Flow

**Step 1 — Create Order (Frontend → Backend):**
```javascript
axios.post(serverUrl + "/api/payment/order", {
  planId: plan.id,    // "basic" or "pro"
  amount: 100 or 500, // INR — hardcoded on FRONTEND
  credits: plan.credits
}, { withCredentials: true })
```
`payment.controller.js → createOrder`:
```javascript
const options = {
  amount: amount * 100,  // paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`
};
const order = await razorpay.orders.create(options);
await Payment.create({
  userId: req.userId, planId, amount, credits,
  razorpayOrderId: order.id, status: "created"
});
return res.json(order);  // returns full Razorpay order object
```

**Step 2 — Razorpay Checkout (Frontend):**
```javascript
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  amount: result.data.amount,  // from order response (in paise)
  currency: "INR",
  order_id: result.data.id,
  handler: async function(response) {
    // Called on payment success by Razorpay SDK
    await axios.post(serverUrl + "/api/payment/verify", response, {withCredentials: true})
  }
};
const rzp = new window.Razorpay(options);
rzp.open();
```

**Step 3 — Verify Payment (Frontend → Backend):**
`payment.controller.js → verifyPayment`:
```javascript
const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

// HMAC-SHA256 verification
const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(body).digest("hex");

if (expectedSignature !== razorpay_signature) {
  return res.status(400).json({ message: "Invalid payment signature" });
}

// Find payment record
const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
if (!payment) return res.status(404).json({ message: "Payment not found" });

// Idempotency check
if (payment.status === "paid") {
  return res.json({ message: "Already processed" });
}

payment.status = "paid";
payment.razorpayPaymentId = razorpay_payment_id;
await payment.save();

// Add credits
const updatedUser = await User.findByIdAndUpdate(
  payment.userId,
  { $inc: { credits: payment.credits } },
  { returnDocument: 'after' }   // ⚠️ BUG: should be { new: true } for Mongoose
);

return res.json({ success: true, user: updatedUser });
```

### Security Analysis of Razorpay
| Check | Status |
|-------|--------|
| Signature HMAC-SHA256 verification | ✅ Implemented |
| Order exists in DB before crediting | ✅ Implemented |
| Idempotency (duplicate payment check) | ✅ Implemented (`status === "paid"` check) |
| Amount validation (backend checks amount matches plan) | ❌ NOT IMPLEMENTED — amount is trusted from client |
| Currency validation | ❌ NOT IMPLEMENTED |
| `returnDocument: 'after'` vs `new: true` | ⚠️ BUG — Mongoose returns old document |
| Credits read from DB payment record (not client) | ✅ `payment.credits` from DB |
| Razorpay secret in client .env | ❌ `VITE_RAZORPAY_KEY_SECRET` exposed in browser bundle |

---

## 14. Complete API Documentation

### Auth Routes (`/api/auth`)

| Method | Route | Auth | Purpose | Body | Response |
|--------|-------|------|---------|------|----------|
| POST | `/api/auth/google` | No | Google login/signup | `{name, email}` | `{message, user, success}` + sets `token` cookie |
| GET | `/api/auth/logout` | No | Logout | — | `{message, success}` + clears `token` cookie |

---

### User Routes (`/api/user`)

| Method | Route | Auth | Purpose | Body | Response |
|--------|-------|------|---------|------|----------|
| GET | `/api/user/current-user` | Yes (isAuth) | Get logged-in user | — | `{message, user, success}` |

---

### Interview Routes (`/api/interview`)

| Method | Route | Auth | Purpose | Body/Params | Response |
|--------|-------|------|---------|------------|----------|
| POST | `/api/interview/resume` | Yes | Upload & analyze resume | `multipart/form-data: resume (PDF)` | `{role, experience, projects, skills, resumeText}` |
| POST | `/api/interview/generate-questions` | Yes | Generate 5 AI questions, deduct 50 credits | `{role, experience, mode, resumeText, projects, skills}` | `{interviewId, creditsLeft, userName, questions[]}` |
| POST | `/api/interview/submit-answer` | Yes | Submit answer for 1 question, AI evaluates | `{interviewId, questionIndex, answer, timeTaken}` | `{feedback}` |
| POST | `/api/interview/finish` | Yes | Calculate final score | `{interviewId}` | `{finalScore, confidence, communication, correctness, questionWiseScore[]}` |
| GET | `/api/interview/get-interview` | Yes | Get all interviews for current user | — | Array of `{role, experience, mode, finalScore, status, createdAt}` |
| GET | `/api/interview/report/:id` | Yes | Get full report for one interview | `params: id` | `{finalScore, confidence, communication, correctness, questionWiseScore[]}` |

---

### Payment Routes (`/api/payment`)

| Method | Route | Auth | Purpose | Body | Response |
|--------|-------|------|---------|------|----------|
| POST | `/api/payment/order` | Yes | Create Razorpay order | `{planId, amount, credits}` | Razorpay order object |
| POST | `/api/payment/verify` | Yes | Verify payment, add credits | `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` | `{success, message, user}` |

---

## 15. Security Audit

### CRITICAL

**SEC-C1: Backend does not verify Firebase ID token**
- **File:** `auth.controller.js` L6, `Auth.jsx` L22
- **Problem:** Backend accepts `{name, email}` strings from client and creates/finds user by email. No Firebase token is verified. An attacker can POST `{name: "Anyone", email: "victim@gmail.com"}` and get a valid JWT for that account.
- **How to fix:** Client should send `firebaseIdToken = await User.getIdToken()`. Backend should verify it via Firebase Admin SDK or Firebase REST verification endpoint.

**SEC-C2: Razorpay key secret exposed in frontend**
- **File:** `client/.env` L3: `VITE_RAZORPAY_KEY_SECRET=3ITpqxlFRaQ3WbA1gGS0cX79`
- **Problem:** All `VITE_` prefixed variables are bundled into the frontend JavaScript and visible in any browser. The Razorpay KEY SECRET should only exist on the server.
- **How to fix:** Remove from `client/.env`. It's only needed in `server/.env`.

**SEC-C3: CORS only allows localhost in production**
- **File:** `server/index.js` L16-18: `origin: ["http://localhost:5173"]`
- **Problem:** The production frontend on Vercel cannot make any API calls to Render. Every fetch is blocked by CORS policy.
- **How to fix:** `origin: process.env.FRONTEND_URL` (already set in server `.env`).

**SEC-C4: JWT secret committed to git**
- **File:** `server/.env` L3: `JWT_SECRET="BobzyTheKing2"`
- **Problem:** The `.gitignore` for the server only excludes `node_modules`. The `.env` file is committed. Anyone with repo access can forge JWT tokens.
- **How to fix:** Add `.env` to `.gitignore`, rotate the secret, use a cryptographically random 256-bit string.

**SEC-C5: Credit deduction race condition**
- **File:** `interview.controller.js` L110-179
- **Problem:** Read-check-decrement is not atomic. Two simultaneous requests both pass `credits < 50` check and both deduct 50 credits.
- **How to fix:** Use `User.findOneAndUpdate({_id, credits: {$gte: 50}}, {$inc: {credits: -50}}, {new: true})` and return 400 if result is null.

---

### HIGH

**SEC-H1: No ownership check on `submitAnswer` or `finishInterview`**
- **File:** `interview.controller.js` L211, L279
- **Problem:** `Interview.findById(interviewId)` — no check that `interview.userId === req.userId`. Any authenticated user can submit answers to or finish another user's interview.
- **Severity:** HIGH — data corruption, score manipulation

**SEC-H2: No ownership check on `getInterviewReport`**
- **File:** `interview.controller.js` L338
- **Problem:** `Interview.findById(req.params.id)` — any logged-in user can access any interview report by guessing the ID.
- **Severity:** HIGH — privacy violation

**SEC-H3: isAuth returns 500 for expired/invalid JWT**
- **File:** `middlewares/isAuth.js` L21
- **Problem:** `jwt.verify` throws `TokenExpiredError` or `JsonWebTokenError` for invalid tokens. The catch block returns 500 ("Is Authentication error..."). Should return 401.
- **Severity:** HIGH — frontend shows generic server error, no redirect to login

**SEC-H4: No rate limiting**
- **File:** `server/index.js` — no rate limiting middleware
- **Problem:** All endpoints including `/api/auth/google`, AI generation, and payment are unlimited. An attacker can hammer the auth endpoint, abuse AI credits, or trigger unlimited Razorpay order creation.

**SEC-H5: File upload MIME type not validated**
- **File:** `middlewares/multer.js` — no `fileFilter`
- **Problem:** Only the frontend `accept="application/pdf"` attribute is present. This is trivially bypassed. A malicious `.exe` renamed to `.pdf` would pass through.

**SEC-H6: `cookie: secure: false` in production**
- **File:** `auth.controller.js` L17
- **Problem:** Cookie is not flagged `Secure`, meaning it can be transmitted over HTTP. On Render (HTTPS), this is less critical since traffic is HTTPS, but it's incorrect configuration.

---

### MEDIUM

**SEC-M1: Amount not validated server-side on payment order**
- **File:** `payment.controller.js` L8-13
- **Problem:** `amount` comes from the request body. A user could modify it (e.g., send `amount: 1`) and create a ₹1 Razorpay order for 650 credits. The backend passes this amount to Razorpay.
- **Note:** Razorpay will process whatever amount the order was created with, not a fixed price. The signature is valid as long as it matches the (low) order amount.

**SEC-M2: Credits deducted before Interview created**
- **File:** `interview.controller.js` L178-181
- **Problem:** If `Interview.create()` throws after `user.save()`, user loses 50 credits permanently.

**SEC-M3: Duplicate `status` field in Interview schema**
- **File:** `interview.model.js` L54-64
- **Problem:** Two `status` fields are declared. JavaScript objects discard duplicate keys; Mongoose uses only the last one. The first enum (`Incomplete/Completed`) is dead code. This creates inconsistency in the codebase.

**SEC-M4: `returnDocument: 'after'` is not a valid Mongoose option**
- **File:** `payment.controller.js` L75
- **Problem:** Mongoose uses `{ new: true }` to return the updated document. `returnDocument: 'after'` is a native MongoDB driver option, not Mongoose. This means `updatedUser` is the OLD document (before credit addition). The stale credit count is then dispatched to Redux.

**SEC-M5: `signInWithRedirect` imported but unused**
- **File:** `Auth.jsx` L7
- **Problem:** Dead import. Minor code quality issue.

**SEC-M6: `serverUrl` shadowed by local variable**
- **File:** `Step1SetUp.jsx` L44: `const serverUrl = import.meta.env.VITE_SERVER_URL;`
- **Problem:** The imported `serverUrl` from `App.jsx` is shadowed by a new local declaration. Functionally the same value, but creates confusion and could diverge if the logic changes.

---

### LOW

**SEC-L1: `console.log` throughout production code**
- **Files:** `Step1SetUp.jsx`, `Step2Interview.jsx`, `InterviewHistory.jsx`, `InterviewReport.jsx`, `Pricing.jsx`, `auth.controller.js`
- **Problem:** Logs interview data, API responses, user data — visible in browser dev tools. Includes `console.log(result.data)` after every API call.

**SEC-L2: No protected route on frontend**
- **File:** `App.jsx` — no `ProtectedRoute` component
- **Problem:** Unauthenticated users can navigate to `/interview`, `/history`, `/pricing`. Pages render and make API calls that fail with auth errors. No automatic redirect to `/Auth`.

**SEC-L3: Duplicate BrowserRouter**
- **File:** `App.jsx` imports `BrowserRouter` but doesn't use it — `main.jsx` wraps App with `<BrowserRouter>`.

**SEC-L4: No OpenRouter timeout**
- **File:** `openRouter.services.js`
- **Problem:** Axios call has no `timeout` option. If OpenRouter is slow, Express request hangs indefinitely until the connection closes.

---

## 16. Performance Audit

### What IS Implemented
- **Framer Motion** lazy animations (opacity, x/y transitions on mount)
- **React state** co-located per component (no unnecessary re-renders)
- **`interview.questions` embedded** in Interview document — single DB read for full interview data
- **select() projection** in `getMyInterviews`: `.select("role experience mode finalScore status createdAt")` — only fetches needed fields

### What is NOT Implemented
- **No lazy loading / React.lazy / Suspense** — all routes are eagerly imported in `App.jsx`
- **No code splitting** — all JS bundled together
- **No pagination** — `Interview.find({userId})` returns ALL interviews sorted by `createdAt` desc with no limit
- **No MongoDB indexes** explicitly defined (only email's unique constraint creates an implicit index; `userId` on interviews has no index)
- **No API response caching**
- **No debouncing** on form inputs
- **No image optimization** (assets are MP4 videos, no size optimization shown)
- **No loading skeleton** — just a text loading state in `InterviewReport.jsx`
- **No memoization** (no `useMemo`, `useCallback` except one `useCallback` for `showToast` in `Step1SetUp`)
- **No compression middleware** on Express

### Database Query Performance
- `Interview.find({ userId: req.userId })` — `userId` field is not indexed → full collection scan as data grows
- `Interview.findById(interviewId)` — uses `_id` index (default MongoDB index) → ✅ fast
- `User.findById(req.userId)` — uses `_id` index → ✅ fast
- `Payment.findOne({ razorpayOrderId })` — `razorpayOrderId` is not indexed → scan

---

## 17. Deployment Architecture

### Frontend (Vercel)
- **URL:** Production Vercel URL (NOT in codebase)
- `VITE_SERVER_URL` in `client/.env` = `https://ai-interview-7-0ztc.onrender.com` (the Render backend)
- Vite builds to static files deployed to Vercel's CDN

### Backend (Render)
- `server/index.js` listens on `process.env.PORT || 8000`
- `connectDb()` called after server starts (inside `app.listen` callback)
- **CORS issue:** `origin: ["http://localhost:5173"]` — production Vercel origin is NOT allowed
- `FRONTEND_URL="http://localhost:5173"` in `.env` — should be the Vercel URL but isn't used

### Database (MongoDB Atlas)
- `MONGODB_URL` in server `.env` — Atlas connection string
- `mongoose.connect(process.env.MONGODB_URL)` — no connection options specified (no `serverSelectionTimeoutMS`, `socketTimeoutMS`, etc.)

### Environment Variables

**Server `.env`:**
```
PORT=8000
MONGODB_URL=mongodb+srv://...
JWT_SECRET="BobzyTheKing2"
OPENROUTER_API_KEY=sk-or-v1-...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
FRONTEND_URL="http://localhost:5173"  ← not used, should be Vercel URL
```

**Client `.env`:**
```
VITE_FIREBASE_API_KEY=...
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_RAZORPAY_KEY_SECRET=...          ← ⚠️ secret exposed
VITE_SERVER_URL=https://ai-interview-7-0ztc.onrender.com
```

### Production Risks
| Risk | Status |
|------|--------|
| Render cold starts (30s sleep after 15 min inactivity on free tier) | YES — affects AI call timeout, user sees hanging requests |
| CORS blocking all production API calls | YES — `origin` hardcoded to localhost |
| Cookie not reaching cross-origin requests (sameSite: lax + cross-origin) | LIKELY — `sameSite: lax` may block cookies on cross-origin POST (Vercel → Render) |
| No request timeout on AI calls | YES — Render dyno can hang |
| PDF upload timeout | POSSIBLE — 5MB PDF + AI call = potentially >30s on cold start |
| No MongoDB connection pooling config | Mongoose defaults used — acceptable for single server |
| `VITE_RAZORPAY_KEY_SECRET` in production bundle | YES — critical security issue |

---

## 18. Actual Bugs / Risks Summary

| ID | Severity | File | Bug |
|----|----------|------|-----|
| B1 | CRITICAL | `server/index.js` | CORS only allows localhost — all production calls blocked |
| B2 | CRITICAL | `auth.controller.js` | No Firebase token verification — any email can be impersonated |
| B3 | CRITICAL | `client/.env` | Razorpay secret bundled into frontend JS |
| B4 | CRITICAL | `server/.env` + `.gitignore` | JWT secret committed to git |
| B5 | CRITICAL | `interview.controller.js` | Credit deduction race condition (non-atomic) |
| B6 | HIGH | `interview.controller.js` | No ownership check on submitAnswer / finishInterview |
| B7 | HIGH | `interview.controller.js` | No ownership check on getInterviewReport |
| B8 | HIGH | `isAuth.js` | 500 returned for expired JWT (should be 401) |
| B9 | HIGH | `payment.controller.js` | `returnDocument:'after'` is wrong Mongoose option → stale user returned |
| B10 | HIGH | No file in server | No rate limiting on any endpoint |
| B11 | MEDIUM | `interview.model.js` | Duplicate `status` field (Mongoose keeps only last definition) |
| B12 | MEDIUM | `interview.controller.js` | Credits deducted before Interview.create() |
| B13 | MEDIUM | `payment.controller.js` | Amount not validated server-side (user can set their own amount) |
| B14 | MEDIUM | `Step2Interview.jsx` | `timeTaken` sent from client — can be manipulated |
| B15 | LOW | `auth.controller.js` | `secure: false` on cookie in production |
| B16 | LOW | `App.jsx` | No frontend protected routes |
| B17 | LOW | `openRouter.services.js` | No request timeout on AI API calls |
| B18 | LOW | Multiple files | `console.log` throughout production code |
| B19 | LOW | `Step2Interview.jsx` | `alert()` for backend error (blocks UI) |
| B20 | LOW | `App.jsx` | Unused `BrowserRouter` import |

---

## 19. Technical Interview Questions

### Basic Level

1. What is the MERN stack? Which version of each technology does this project use?
2. Why did you choose MongoDB over a relational database for this project?
3. What is an httpOnly cookie? Why is the JWT stored in one rather than localStorage?
4. What is Redux and why did you use it? What data is stored in Redux?
5. What is multer? What role does it play in this project?
6. What is OpenRouter? Why did you use it instead of calling OpenAI directly?
7. What is pdfjs-dist and how did you use it to parse resumes?
8. What is jsPDF and how is the interview report downloaded?
9. What are the three pricing plans? How many credits does each give?
10. What is Vite? Why did you use it instead of Create React App?
11. How does the interview flow work at a high level?
12. What happens when a new user signs up? How many credits do they start with?
13. What is Recharts? Where is it used in this project?
14. What is Framer Motion (`motion`) and where do you use it?
15. What is `withCredentials: true` in Axios and why is it needed?

---

### Intermediate Level

1. Walk me through the complete Google authentication flow — from the browser clicking "Continue with Google" to the user being logged in.
2. How does the JWT token get from the server to the browser? How does it get sent on subsequent requests?
3. Explain the resume analysis pipeline step by step. What happens between the user clicking "Analyze Resume" and the extracted data appearing on screen?
4. How does question generation work? What information is sent to the AI and what prompt is used?
5. How does the voice interview work? What Web APIs are used for TTS and STT?
6. How is the pre-recorded AI interviewer video synchronized with the text-to-speech?
7. Explain the complete Razorpay payment flow — all 3 steps.
8. How does signature verification work in `verifyPayment`? Walk me through the HMAC calculation.
9. How does the credit system work? Where are credits stored and when are they deducted?
10. How is the final interview score calculated? Is it weighted?
11. What is the structure of the Interview document in MongoDB? How are questions, answers, and scores stored?
12. How is the interview report generated? Is there a separate Report collection?
13. What is the purpose of `parseLLMJson()` and why is it needed?
14. How does the two-minute timer work? What happens when it hits zero?
15. How does `isAuth` middleware protect routes? What does it do step by step?
16. What is `express-rate-limit` and is it used in this project?
17. How does the `InterviewPage` orchestrate the 3 steps (Setup → Interview → Report)?
18. What is Redux Toolkit? How is the `userSlice` structured?
19. How does the history page fetch only the current user's interviews?
20. What is the difference between `finishInterview` and `getInterviewReport` endpoints?

---

### Advanced Level

1. The backend CORS is configured as `origin: ["http://localhost:5173"]`. What happens in production when the Vercel frontend tries to call the Render backend?
2. Explain the race condition in the credit deduction logic. How would you fix it using MongoDB's `findOneAndUpdate`?
3. The backend doesn't verify the Firebase ID token. What attack does this enable? How would you fix it?
4. `findByIdAndUpdate` is called with `{ returnDocument: 'after' }`. What is the bug and why does it happen?
5. The `timeTaken` field sent to `submitAnswer` is calculated on the frontend. How could a user exploit this?
6. There is no ownership check on `submitAnswer`. What attack does this enable?
7. Credits are deducted before `Interview.create()`. What is the risk? How would you make this transactional in MongoDB?
8. How does `parseLLMJson()` handle AI responses that return JSON wrapped in markdown code fences? What edge cases does it miss?
9. Explain the `speech synthesis voice loading` problem in Chrome and how the code handles it with `onvoiceschanged`.
10. What is `recognition.continuous = true`? What happens if the browser loses mic access mid-interview?
11. The `status` field is defined twice in `interview.model.js`. What does Mongoose actually store in the database when both definitions exist?
12. Why does `sameSite: "lax"` on the JWT cookie potentially break cross-origin authentication between Vercel and Render?
13. The amount is client-provided in `createOrder`. Walk me through a complete attack where a user buys 650 credits for ₹1.
14. What is `webkitSpeechRecognition`? Which browsers support it? How would you handle unsupported browsers?
15. How would you add proper MongoDB indexing to this project? Which fields would you index and why?
16. What is `pdfjs-dist` and how does it differ from simply using regex on a PDF file?
17. Why is `VITE_RAZORPAY_KEY_SECRET` in the client `.env` dangerous? What can an attacker do with it?
18. Explain cold starts on Render's free tier. How does this affect the AI interview experience? How would you mitigate it?
19. How would you implement atomic credit deduction to prevent race conditions without Redis or a message queue?
20. The interview scores are a simple average. How would you implement weighted scoring where Q5 contributes 30%?

---

## 20. Interview Follow-up Question Chains

### Chain 1: Authentication

**Q: Why did you use Firebase authentication?**  
→ To delegate OAuth complexity to Google's infrastructure. Handles OAuth 2.0, token refresh, and account linking.

**Q: How does Firebase authentication actually work in your project?**  
→ Client calls `signInWithPopup(auth, provider)`. Firebase opens a Google OAuth popup, user authenticates, Firebase returns a `UserCredential` containing `displayName` and `email`.

**Q: Does your backend verify the Firebase token?**  
→ ❌ Currently, no. The client sends `name` and `email` as plain strings. The backend trusts them without verification.

**Q: What attack does that enable?**  
→ Account impersonation. An attacker can POST `{email: "victim@gmail.com"}` to `/api/auth/google` and receive a valid JWT for that account.

**Q: How would you fix it?**  
→ Call `firebaseUser.getIdToken()` on the client, send the token to the backend. Backend verifies with Firebase Admin SDK's `auth.verifyIdToken(idToken)` or via Firebase's REST verification endpoint. Extract `email` from the verified token, never trust the client-provided value.

**Q: What would happen if someone's JWT token is stolen?**  
→ The attacker has 7 days of access (JWT expiration). There's no token revocation in the current implementation.

**Q: How would you revoke a compromised token?**  
→ Options: (1) Maintain a token blacklist in Redis/MongoDB, checked in `isAuth`. (2) Add a `tokenVersion` field to User, increment on logout/revoke, validate in JWT payload. (3) Shorten JWT expiry and use refresh tokens.

---

### Chain 2: AI & Resume Processing

**Q: How does the AI generate interview questions?**  
→ The backend sends a system prompt to GPT-4o-mini via OpenRouter with resume text, role, experience, mode, skills, and projects. The AI returns 5 plain-text questions, one per line.

**Q: How do you handle the AI returning malformed output?**  
→ For JSON responses, `parseLLMJson()` regex-extracts the first `{...}` block and calls `JSON.parse`. For questions (plain text), splits by newline and takes first 5. Malformed JSON throws → caught by try/catch → 500 response.

**Q: What if GPT returns fewer than 5 questions?**  
→ The `slice(0, 5)` ensures max 5. If fewer questions come back, the interview will have fewer questions. No retry logic exists.

**Q: Is the resume stored in your database?**  
→ The raw PDF is deleted from disk after parsing. The extracted text (`resumeText`) is returned to the frontend, stored in React state, and sent with `generateQuestion`. The resume text is then stored inside the `Interview.resumeText` field in MongoDB.

**Q: What AI model do you use and why?**  
→ GPT-4o-mini via OpenRouter. Cost-effective for the three calls needed per interview (resume analysis, question generation, per-answer evaluation × 5).

**Q: What happens if OpenRouter is down?**  
→ The Axios call hangs indefinitely since there's no timeout configured. The Render dyno holds the connection until it times out or the client drops it.

---

### Chain 3: Credit System & Payments

**Q: How does the credit system work?**  
→ Users start with 100 credits (schema default). Each interview costs 50 credits. Credits are stored in the `User` document. Deduction happens in `generateQuestion` controller before creating the Interview document.

**Q: Can a user start two interviews simultaneously and bypass the credit check?**  
→ Yes. The check (`if user.credits < 50`) and deduction (`user.credits -= 50; user.save()`) are not atomic. Two concurrent requests can both pass the check and both deduct.

**Q: How would you fix that?**  
→ `User.findOneAndUpdate({_id: userId, credits: {$gte: 50}}, {$inc: {credits: -50}}, {new: true})`. If the returned document is null, the user didn't have enough credits — return 400.

**Q: How does Razorpay payment work?**  
→ Three-step flow: (1) Backend creates order via Razorpay API, stores in DB. (2) Frontend opens Razorpay checkout. (3) On success, frontend POSTs payment IDs to backend which verifies the HMAC-SHA256 signature, then credits the user.

**Q: How do you prevent someone from calling `/api/payment/verify` directly without paying?**  
→ HMAC-SHA256 signature verification using the Razorpay secret. Only Razorpay's servers generate the correct signature for a given `order_id + payment_id` combination. Without the secret, an attacker cannot generate a valid signature.

**Q: Can a user buy 650 credits for ₹1?**  
→ Yes, currently. The `amount` in `createOrder` comes from the client request body. A user can POST `{amount: 1, credits: 650}` and the backend creates a ₹1 Razorpay order. Razorpay processes it and issues a valid signature. Backend verifies the signature and adds 650 credits. The fix is to derive the amount server-side from the `planId`.

---

### Chain 4: Voice & Video

**Q: How does the AI interviewer speak?**  
→ Web Speech API's `SpeechSynthesis`. `window.speechSynthesis.speak(utterance)`. No TTS service, no audio files — entirely browser-native.

**Q: How does the AI video sync with speech?**  
→ A pre-recorded MP4 is played/paused via a `<video>` ref. `utterance.onstart` → `videoRef.current.play()`. `utterance.onend` → `videoRef.current.pause(); videoRef.current.currentTime = 0`.

**Q: How does the user's speech get converted to text?**  
→ `window.webkitSpeechRecognition` with `continuous: true`. The `onresult` callback appends the transcript to the `answer` state variable. No audio files are recorded or sent to the server.

**Q: What browsers support this?**  
→ `webkitSpeechRecognition` works on Chrome and Chromium-based browsers. Firefox and Safari have limited or no support.

**Q: What happens when the AI starts speaking?**  
→ `startMic()` is called which stops recognition. When AI speech ends, `stopMic()` is called and mic restarts (if `isMicOn` is true).

---

### Chain 5: MongoDB & Scoring

**Q: How are interview questions stored in MongoDB?**  
→ As an embedded array in the Interview document (`questions: [questionsSchema]`). No separate Questions collection.

**Q: Why embedded instead of referenced?**  
→ Questions are never accessed independently. Every query that needs questions also needs the interview context. Embedding avoids joins (lookups) and keeps the data co-located.

**Q: How is the final score calculated?**  
→ Simple arithmetic mean: `sum(question.score) / question.count`. No weightage is applied despite the spec mentioning weights.

**Q: Is the score 0–10 or 0–100?**  
→ 0–10. Each question is scored 0–10 by the AI (`finalScore = avg(confidence, communication, correctness)`). The interview `finalScore` is the average of all question scores.

**Q: Is there a MongoDB index on `userId` in the interviews collection?**  
→ No explicit index. Only the implicit `_id` index exists. The `userId` field has a `ref: "User"` declaration but Mongoose does not auto-create an index for references.

---

## 21. Interviewer Traps

These are specific challenges an interviewer might raise based on your actual code:

---

**TRAP 1 — Timer bypass:**  
*"Can a user bypass your 2-minute timer?"*  
Yes. `timeTaken` is calculated as `timeLimit - timeLeft` on the frontend and sent in the request body. Using browser DevTools or Postman, a user can send `timeTaken: 0` for any answer, bypassing the `timeTaken > timeLimit` check on the backend.

---

**TRAP 2 — Credit race condition:**  
*"If I open two browser tabs and click Start Interview simultaneously with exactly 50 credits, what happens?"*  
Both requests pass the credit check. Both deduct 50 credits. Due to `user.save()` being called on the same document, the last write wins in MongoDB, resulting in 0 credits — but two interviews are created. Potentially, if the saves interleave, one could see the other's write and end up at -50.

---

**TRAP 3 — Account impersonation:**  
*"If I know someone's email address, can I log in as them?"*  
Yes. The backend `/api/auth/google` accepts `{name, email}` without verifying a Firebase ID token. A POST request with any victim's email creates or retrieves their account and returns a valid JWT.

---

**TRAP 4 — Payment amount manipulation:**  
*"Could a user pay ₹1 and get 650 credits?"*  
Yes. The `amount` field in the order creation request comes from the client. There's no server-side price lookup. A user can modify the request to `{planId: "pro", amount: 1, credits: 650}`.

---

**TRAP 5 — Cross-user report access:**  
*"Can User A view User B's interview report?"*  
Yes. `getInterviewReport` does `Interview.findById(req.params.id)` without checking that `interview.userId === req.userId`. Knowing another user's interview ID is sufficient to view their full report including all questions, answers, and scores.

---

**TRAP 6 — Production CORS:**  
*"Your app is deployed to Vercel but I'm getting CORS errors. What's wrong?"*  
The server CORS is `origin: ["http://localhost:5173"]`. The production Vercel URL is not included. `process.env.FRONTEND_URL` is set to `"http://localhost:5173"` in `.env` and isn't even used in the CORS config.

---

**TRAP 7 — Malformed AI response:**  
*"What happens if GPT returns a score of 'excellent' instead of a number?"*  
`parseLLMJson` will parse the JSON successfully. `parsed.confidence = "excellent"`. This string is stored in MongoDB. `totalConfidence += "excellent"` → NaN. `finalScore = NaN / 5 = NaN`. `NaN.toFixed(1)` → throws → 500 error on `finishInterview`.

---

**TRAP 8 — Razorpay secret in browser:**  
*"I can see your Razorpay key secret in your browser's JavaScript bundle. What can someone do with it?"*  
They can use the secret to generate valid HMAC signatures for any `order_id + payment_id` pair, potentially crafting a fake payment verification request. More immediately, the secret can be used to access the Razorpay dashboard API.

---

**TRAP 9 — Stale credits after payment:**  
*"After a user pays ₹500, the UI still shows old credits. Why?"*  
`findByIdAndUpdate` is called with `{ returnDocument: 'after' }`. Mongoose does not recognize this option (it uses `{ new: true }`). So `updatedUser` is the document before the `$inc`, which is then dispatched to Redux. The user sees their old credit balance.

---

**TRAP 10 — Double finish:**  
*"What happens if `finishInterview` is called twice for the same interview?"*  
No idempotency check. The controller does `Interview.findById(interviewId)`, recalculates `finalScore`, updates `interview.finalScore`, and saves. If answers were added between calls, the score changes. An attacker (or a React double-render) could call it multiple times.

---

## 22. 30-Second Project Explanation

"I built **InterviewIQ.AI**, an AI-powered mock interview SaaS using the MERN stack. Users sign in with Google via Firebase, upload their PDF resume, and the system uses GPT-4o-mini to generate 5 personalized interview questions. The interview uses browser-native text-to-speech with a pre-recorded AI interviewer video and speech recognition for hands-free answering. Each answer is AI-evaluated for confidence, communication, and correctness. The final report shows scores per question with a downloadable PDF. It's deployed on Vercel and Render with MongoDB Atlas and Razorpay for credit-based payments."

---

## 23. 1-Minute Project Explanation

"InterviewIQ.AI is a production MERN SaaS that simulates AI-powered job interviews. Here's the technical flow:

The user authenticates via Google OAuth through Firebase — the client gets a user credential, sends the name and email to our Express backend, which creates or retrieves the user in MongoDB and returns a JWT stored in an httpOnly cookie.

The user uploads a PDF resume — multer stores it temporarily on disk, pdfjs-dist extracts text page by page, and GPT-4o-mini via OpenRouter analyzes it into structured JSON (role, experience, skills, projects). The PDF is deleted after parsing.

Then the user starts an interview — 50 credits are deducted, and GPT-4o-mini generates 5 questions tailored to their role and resume. These are stored as embedded subdocuments in the Interview MongoDB document.

During the interview, the Web Speech Synthesis API reads each question aloud with a synchronized pre-recorded video. Speech Recognition captures the user's answer as text. Each answer is submitted to the backend where GPT-4o-mini scores it 0-10 for confidence, communication, and correctness.

After all 5 questions, the backend calculates the final score as an average, and the frontend generates a downloadable PDF report using jsPDF. All interviews are stored in history. Additional credits can be purchased through Razorpay with HMAC-SHA256 signature verification on the backend."

---

## 24. 3-Minute Technical Explanation

"Let me walk you through the architecture and some interesting technical decisions.

**Stack:** React 19 + Vite 8 on the frontend with Tailwind CSS for styling, Redux Toolkit for state management (specifically storing the current user), React Router 7 for navigation, and Axios with cookie-based auth for API communication. The backend is Express 5 on Node.js with Mongoose 9 connecting to MongoDB Atlas. AI is powered by OpenRouter calling GPT-4o-mini — I used OpenRouter instead of direct OpenAI so I can switch models without code changes.

**Authentication:** I chose Firebase for Google OAuth because it handles the entire OAuth 2.0 dance for me. After `signInWithPopup`, I send the user's name and email to my backend, which uses JWT with 7-day expiry stored in an httpOnly cookie. The cookie is sent automatically on every request via Axios's `withCredentials: true`.

**Resume Pipeline:** When a user uploads a PDF, multer stores it temporarily on disk. I use `pdfjs-dist` to iterate over every page, extract the text items, join them, and send that raw text to GPT-4o-mini with a structured JSON extraction prompt. I created a `parseLLMJson` helper that regex-extracts the first JSON object from the response — this handles cases where the model wraps its output in markdown fences. After parsing, the file is deleted from disk.

**Interview & AI:** Question generation sends the full resume text, role, experience, mode, skills, and projects to GPT-4o-mini. The system prompt asks for exactly 5 questions, one per line, with a difficulty progression from easy to hard. I split the response by newlines. For answer evaluation, I send the question and answer with a prompt asking for 3 scores (confidence, communication, correctness) and a feedback string — all as JSON.

**Voice & Video:** This was the most interesting part. I use `window.speechSynthesis` for TTS — it's browser-native with no cost. I prefer female voices by checking for 'zira' or 'samantha' in the voice name. The AI interviewer video is a pre-recorded MP4 that plays during speech and pauses on silence — synchronized via the `utterance.onstart` and `utterance.onend` callbacks. Speech recognition uses `webkitSpeechRecognition` in continuous mode, appending transcripts to the answer state.

**Credits & Payments:** Credits are stored as a number field on the User document. New users get 100 by default. Before generating questions, I check `credits >= 50` and deduct atomically via `user.save()`. For payments, Razorpay creates an order with a receipt ID, the frontend opens the Razorpay checkout widget, and on success, the frontend POSTs the payment IDs to `/api/payment/verify`. The backend verifies the HMAC-SHA256 signature using `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)` — this is how I ensure the payment actually happened on Razorpay's side.

**Data Model:** I chose to embed questions, answers, and scores inside the Interview document rather than creating separate collections. Since you never query questions without their interview context, this eliminates joins and simplifies the read path significantly."

---

## 25. Topics I Must Study Before Interview

### Must Know Cold
- [ ] **JWT deep dive** — `jwt.sign`, `jwt.verify`, payload structure, expiry, what happens on tamper
- [ ] **httpOnly cookies** — why safer than localStorage, how sent cross-origin, `SameSite` values, CSRF implications
- [ ] **CORS** — preflight requests, `Access-Control-Allow-Origin`, `credentials: true` requirements
- [ ] **Firebase Authentication** — OAuth 2.0 flow, ID token vs access token, `getIdToken()`, token verification
- [ ] **MongoDB embedded vs referenced documents** — when to embed, when to reference, tradeoffs
- [ ] **Mongoose vs MongoDB native driver** — `{ new: true }` vs `{ returnDocument: 'after' }`
- [ ] **Razorpay HMAC-SHA256 signature verification** — exactly how `order_id|payment_id` is signed
- [ ] **pdfjs-dist** — how PDF text extraction works, `getTextContent()`, `getDocument()`
- [ ] **Web Speech API** — `SpeechSynthesis`, `SpeechRecognition`, voice selection, browser support
- [ ] **OpenRouter API** — how it proxies to different models, `choices[0].message.content` structure
- [ ] **Redux Toolkit** — `createSlice`, `configureStore`, `useSelector`, `useDispatch`
- [ ] **React state management** — `useState`, `useEffect` dependencies, `useRef` for non-reactive values

### Should Know Well
- [ ] **Express 5** differences from Express 4 (async error handling)
- [ ] **multer** — disk storage, `fileFilter`, `limits`, field names
- [ ] **MongoDB atomic operations** — `$inc`, `findOneAndUpdate`, why they prevent race conditions
- [ ] **jsPDF + autotable** — how PDF is generated client-side, table formatting
- [ ] **Framer Motion** — `initial`, `animate`, `transition`, `whileHover`, `whileTap`
- [ ] **Vite** — why faster than Webpack, `import.meta.env` for env vars, `VITE_` prefix requirement
- [ ] **React Router v7** — `BrowserRouter`, `Routes`, `Route`, `useParams`, `useNavigate`

### Interview Question Prep Topics
- [ ] Why MongoDB over SQL for this use case?
- [ ] How would you scale this system (more users, more AI calls)?
- [ ] How would you implement refresh tokens?
- [ ] How would you add email/password auth alongside Google?
- [ ] How would you paginate interview history?
- [ ] How would you add real-time features (live score updates)?
- [ ] How would you handle Render cold starts?
- [ ] How would you make credits ACID-safe?
- [ ] How would you add question categories and topic filtering?
- [ ] What would break first at 10,000 concurrent users?
