# Campus Pulse 🌿

> **Intelligent, zero-friction campus life organizer.** Turn scattered WhatsApp forwards, emails, and poster captions into clear, actionable deadlines and calendar events in seconds with an energetic botanical greenery design.

[![Tests](https://img.shields.io/badge/tests-40%20passed-brightgreen.svg)]()
[![Bundle](https://img.shields.io/badge/bundle-58%20KB%20gzipped-emerald.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 📌 Purpose & Problem Solved

College students are bombarded daily with scattered announcements:
- Chaotic WhatsApp group forwards
- Faculty emails with vague subject lines
- Poster captions and club notices

Students miss critical assignment submission windows, clash overlapping lab viva sessions with hackathons, and scramble for exam timings. **Campus Pulse** gives students one unified, intelligent home where they can paste messy text and immediately receive:
1. **Clean, structured event cards** (Exams, Assignments, Clubs, Sports, Placements).
2. **Instant conflict detection** for overlapping exam or event times.
3. **Automatic priority badges** (Today, Urgent within 48h, Upcoming, Expired) computed deterministically in code.
4. **One-click iCalendar (.ics) export** for Google Calendar, Apple Calendar, and Outlook.
5. **AI-powered 150-word Weekly Briefings** summarizing priorities, day-by-day agendas, and heads-up warnings.

A first-time user can understand and use Campus Pulse immediately without any instructions.

---

## 🌿 Design & Aesthetics

Campus Pulse features a custom **energetic greenery** theme designed to promote focus and mental calm:
- **Lush Botanical Light Palette:** Clean airy morning mist backgrounds with rich emerald, sage, and mint botanical accents.
- **Deep Forest Night Palette:** Calming deep spruce and pine tones paired with glowing bioluminescent leaf accents for late-night study sessions.
- **High-Contrast Accessibility:** Tested and certified for WCAG AA compliance across all badges and controls.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18 + Vite (Pure JavaScript, modern JSX).
- **Styling:** Handcrafted plain CSS with CSS Custom Properties, dark/light theme support, WCAG AA accessible contrast, and zero heavy UI library overhead.
- **Serverless AI Backend:** Vercel Serverless Functions (`/api/extract.js`, `/api/digest.js`).
- **AI Engine:** Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`), invoked **strictly** from serverless routes using JSON mode. The `GEMINI_API_KEY` is never exposed to the client.
- **Persistence:** Browser `localStorage` with error recovery and automatic seed data.
- **Testing:** Vitest with jsdom (40 comprehensive unit tests).

```
campus-pulse/
├── api/                     # Vercel serverless functions (secure backend)
│   ├── extract.js           # Smart event extraction via Gemini API
│   └── digest.js            # Weekly AI briefing synthesizer (<150 words)
├── src/
│   ├── components/          # Modular React UI components
│   │   ├── AttentionBanner.jsx  # "Needs Attention Today & Soon" priority shelf
│   │   ├── CalendarView.jsx     # Interactive month calendar grid & day agenda
│   │   ├── ControlsBar.jsx      # Search, filter pills, sorting, view toggles
│   │   ├── EventCard.jsx        # Accessible event card with badges & actions
│   │   ├── ManualEventModal.jsx # Add/edit manual event fallback modal
│   │   ├── Navbar.jsx           # Brand header, theme toggle, digest button
│   │   ├── SmartInput.jsx       # Large text parser with "Try a sample" button
│   │   ├── Toast.jsx            # Non-blocking accessible action feedback
│   │   └── WeeklyDigestModal.jsx# AI weekly summary dialog
│   ├── utils/               # Pure, unit-tested business logic
│   │   ├── conflict.js      # Scheduling conflict & time overlap detection
│   │   ├── date.js          # Relative date resolution & calendar math
│   │   ├── duplicate.js     # Text normalization & duplicate detection
│   │   ├── ics.js           # RFC 5545 iCalendar (.ics) generator & exporter
│   │   ├── status.js        # Status computation (Expired, Today, Urgent, Upcoming)
│   │   └── storage.js       # LocalStorage persistence & sample forwards
│   ├── styles/
│   │   └── index.css        # Clean, modern stylesheet with dark/light themes
│   ├── test/                # Unit tests (Vitest)
│   │   ├── api.test.js
│   │   ├── conflict.test.js
│   │   ├── date.test.js
│   │   ├── duplicate.test.js
│   │   ├── ics.test.js
│   │   ├── setup.js
│   │   └── status.test.js
│   ├── App.jsx              # Main application orchestrator
│   └── main.jsx             # React entry point
├── index.html
├── package.json
├── vercel.json              # Zero-config deployment on Vercel
└── vite.config.js           # Dev server with serverless function proxy middleware
```

---

## ⚡ Core Features

### 1. Smart Notice Parser (`/api/extract`)
- Accepts messy unstructured forwards from WhatsApp, emails, or posters.
- Provides a **"Try a sample notice"** button that populates a realistic university forward with 4 distinct events.
- Resolves relative terms ("tomorrow", "this Friday", "next Monday") accurately by injecting today's reference date into the system prompt.
- Enforces strict JSON response mode.
- Rejects non-events (casual chatter, greetings) with a helpful prompt suggesting manual event addition.
- Identifies ambiguous dates/times with amber **"Review needed"** badges.

### 2. Priority & Reminder Badges (Pure Code Computation)
- **Expired:** Past events that have concluded.
- **Today:** Events occurring on today's calendar date.
- **Urgent:** Deadlines and events occurring within the next 48 hours.
- **Upcoming:** Scheduled beyond 48 hours.
- Prominent **"Needs Attention Today & Soon"** section at the top of the interface.

### 3. Organised Views & Filtering
- **Real-Time Debounced Search:** Search by course name, event title, or venue.
- **Category Filter Pills:** All, Academic, Exam, Deadline, Event, Club, Sports, Placement, Other.
- **Status Filter:** All, Today, Urgent, Upcoming, Expired.
- **Multi-criteria Sorting:** Date (Earliest / Latest), Category, Title.
- **View Switcher:** Toggle between **List View** and **Interactive Month Calendar View**.

### 4. AI Weekly Executive Briefing (`/api/digest`)
- Single-click **"What do I need to know this week?"** button.
- Synthesizes active deadlines and events into a punchy briefing **under 150 words**:
  - *Overview:* One sentence summary of the upcoming week.
  - *Do First:* Immediate priorities and upcoming deadlines.
  - *Day-by-day:* Bulleted timeline of events.
  - *Heads-up:* Schedule conflicts and preparation reminders.
- Safely rendered without `dangerouslySetInnerHTML`.

### 5. Calendar Integration (.ics)
- Export individual events to `.ics` with compliant RFC 5545 syntax.
- Bulk **"Export All (.ics)"** to import the entire semester schedule directly into Google Calendar or Outlook.

### 6. Conflict & Duplicate Detection
- **Conflict Warning:** Automatically alerts when two events share the same date and overlapping times or when multiple exams occur on the same day.
- **Duplicate Prevention:** Matches incoming forwards against existing entries using Dice-coefficient bigram similarity, allowing students to skip duplicates or import all.

---

## 🔒 Security & Quality Assurance

- **Zero Client-Side Keys:** `GEMINI_API_KEY` is strictly accessed in serverless functions; `.env` is committed to `.gitignore`.
- **Input Sanitization & Length Limits:** Requests are capped at 5,000 characters with IP-based rate limiting (25 requests/min) and X-Content-Type-Options headers.
- **Safe Content Rendering:** All AI text is displayed via standard React text nodes and CSS `white-space: pre-wrap`—never `dangerouslySetInnerHTML`.
- **Accessibility (WCAG AA):**
  - High-contrast color palette for both light and dark themes.
  - Status is never conveyed by color alone (always paired with icons and explicit text badges).
  - Explicit `<label>` elements on all form controls.
  - Full keyboard accessibility with visible `:focus-visible` rings and Escape key handlers on modals.
- **Offline / Failure Resilience:** If network connectivity drops or the AI service fails, friendly notices with "Retry" and "Add Manually" buttons guide the user.

---

## 🚀 Setup & Local Development

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/ritik3677/camliv.git
cd camliv
npm install
```

### 2. Configure Environment Variable
Create a `.env` file in the project root (see `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Start Local Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.
*Note:* The Vite development server includes a built-in proxy plugin that routes `/api/extract` and `/api/digest` to the serverless function handlers directly during development, so no external CLI is required.

---

## 🧪 Running Unit Tests

The test suite runs with **Vitest**:
```bash
npm test
```

### Test Coverage Highlights (40 tests across 6 suites):
- `status.test.js`: Verifies `Expired`, `Today`, `Urgent` (within 48h), and `Upcoming` calculations across edge-case dates and times.
- `conflict.test.js`: Validates time-overlap logic, minute conversions, same-day exam clashes, and conflict map generation.
- `duplicate.test.js`: Tests title normalization, bigram similarity metrics, and batch partitioning.
- `ics.test.js`: Tests RFC 5545 compliance, character escaping (`\,`, `\;`, `\\`, `\n`), line folding (75 octets), and all-day vs. timed events.
- `date.test.js`: Tests human-friendly relative formatting, 24h to 12h AM/PM conversions, and monthly calendar grid math.
- `api.test.js`: Tests route validation, non-POST rejection (405), payload size limits (400), rate limit handling, and missing API key handling (500).

---

## 📦 Production Build & Vercel Deployment

### Build Locally
```bash
npm run build
```
Builds the optimized production assets into `dist/` (total bundle size is under 60 KB gzipped).

### Deploy to Vercel
Campus Pulse is pre-configured for **zero-config deployment on Vercel**:
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into Vercel.
3. In the Vercel project settings, add the Environment Variable:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
4. Deploy! Vercel automatically detects Vite, outputs `dist/`, and deploys `/api/*.js` as Node serverless functions.

---

## 📄 License
MIT &copy; Campus Pulse Team

