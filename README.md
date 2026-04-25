# ✈️ AI Travel Planner

> **Plan smarter. Travel better.**  
> An AI-powered full-stack travel itinerary planner built with Gemini API, Node.js, and vanilla HTML/CSS/JS.

![TravelPlanner Banner](images/hero-bg.png)

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| 🖥️ Frontend | `localhost:5000` (local) |
| ⚙️ Backend API | `localhost:5000/health` |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Itinerary Generation** | Day-by-day trip plans powered by Google Gemini 2.5 Flash |
| 💰 **Budget-Based Planning** | Cost breakdown for stay, food & transport based on your budget |
| 🔐 **JWT Authentication** | Secure signup / login with hashed passwords (bcrypt) |
| 💾 **Save Trips** | Save generated itineraries to your profile |
| 🌓 **Light / Dark Theme** | System-aware theme toggle across all pages |
| 📍 **Destination Pages** | Rich info pages for Bihar, Odisha, Kashmir, Goa, Manali & more |
| 🔎 **Live Destination Search** | Real-time search powered by OpenStreetMap Nominatim API |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** — semantic structure
- **CSS3** — glassmorphism, animations, responsive grid
- **Vanilla JavaScript** — no frameworks, no build step

### Backend
- **Node.js** + **Express** — REST API server
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT-based auth
- **dotenv** — environment variable management
- **JSON flat-file** — lightweight user & trip storage

### AI
- **Google Gemini 2.5 Flash** (`@google/genai`) — structured JSON itinerary generation with enforced response schema

---

## 🗂️ Project Structure

```
INT-428 Project/
├── index.html              # Home page
├── pages/
│   ├── login.html          # Auth page (Login + Signup)
│   ├── chat.html           # AI Chat interface
│   ├── profile.html        # User dashboard & trip history
│   ├── budget.html         # Budget planner
│   ├── destinations.html   # All destinations grid
│   ├── bihar.html          # Bihar destination detail
│   ├── odisha.html         # Odisha destination detail
│   ├── kashmir.html        # Kashmir destination detail
│   ├── goa.html            # Goa destination detail
│   └── ...                 # More destination pages
├── js/
│   ├── config.js           # Centralised API base URL
│   ├── auth.js             # Login / Signup / Reset logic
│   ├── chat.js             # AI chat interface logic
│   ├── profile.js          # Dashboard & trip history
│   └── main.js             # Shared nav, theme, animations
├── css/
│   ├── style.css           # Global design system & tokens
│   ├── destinations.css    # Destination cards & city pages
│   └── ...                 # Page-specific stylesheets
├── images/                 # Destination photography
└── backend/
    ├── server.js           # Express server (API + static serve)
    ├── middleware/
    │   └── auth.js         # JWT verification middleware
    ├── .env                # Environment variables (not committed)
    ├── .env.example        # Template for env setup
    ├── users.json          # User store (flat-file)
    └── trips.json          # Trip store (flat-file)
```

---

## ⚙️ How It Works

```
User inputs budget, days & destination
          ↓
    Frontend (chat.js)
          ↓
  POST /chat  (JWT authenticated)
          ↓
    Backend (server.js)
          ↓
  Gemini API → enforced JSON schema
          ↓
  { days[], cost{}, tips[] }
          ↓
  UI renders structured itinerary
          ↓
  User clicks "Save Trip"
          ↓
  POST /save-trip (verifyToken middleware)
          ↓
  Saved to trips.json → visible in Profile
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Google Gemini API key → [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/travelplanner.git
cd travelplanner
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:5000
```

### 4. Start the server
```bash
npm start
```

### 5. Open the app
```
http://localhost:5000
```

---

## 🔒 Security Architecture

```
POST /login  ──→  bcrypt.compare()  ──→  jwt.sign()  ──→  { token }
                                                               ↓
                                              localStorage.setItem('tp_token')
                                                               ↓
POST /save-trip  ──→  verifyToken middleware  ──→  req.user.id (from JWT)
GET  /my-trips   ──→  verifyToken middleware  ──→  filter trips by userId
```

- Passwords are **never stored in plain text** — bcrypt with salt rounds = 10
- `userId` is **never trusted from the client** — always extracted from the verified JWT
- Token expiry: **7 days**
- Protected routes: `/save-trip`, `/my-trips`

---

## 🧩 Challenges Solved

### 1. AI Hallucination Control
Gemini's response is constrained using `responseSchema` with strict type enforcement — the API **cannot** return free-text. It must return a validated JSON object matching `{ days[], cost{}, tips[] }`.

### 2. Structured Response Parsing
Using `responseMimeType: 'application/json'` forces Gemini to return parseable JSON every time, eliminating fragile markdown-stripping logic.

### 3. Theme Consistency
CSS custom properties (`--bg-primary`, `--text-primary`, etc.) are scoped under `[data-theme="dark"]` on the `<html>` element, ensuring every component inherits the correct theme without per-element overrides.

### 4. CORS with Same-Origin Serving
Frontend and backend run on the same Express port (`5000`). The CORS allowlist explicitly includes `http://localhost:5000` so same-origin fetch calls are not blocked by the CORS middleware.

---

## 🗺️ Destinations

| Destination | Tags | Starting From |
|---|---|---|
| 🏛️ Bihar | Heritage · Spiritual · History | ₹3,000 |
| 🌊 Odisha | Beaches · Temples · Culture | ₹4,000 |
| 🏔️ Kashmir | Mountains · Snow · Nature | ₹7,000 |
| 🏖️ Goa | Beaches · Nightlife · Food | ₹8,000 |
| ❄️ Manali | Mountains · Trekking · Snow | ₹6,000 |
| 🏰 Jaipur | Heritage · Shopping · Culture | ₹5,000 |
| 🌴 Kerala | Backwaters · Tea Gardens · Wellness | ₹10,000 |
| 🏛️ Delhi | Monuments · Street Food · Markets | ₹4,000 |
| 🕉️ Varanasi | Spiritual · Ganga Aarti · Temples | ₹3,500 |

---

## 🔮 Future Improvements

- [ ] **Real-time pricing APIs** — live hotel & flight fare integration
- [ ] **Maps integration** — interactive route visualization (Leaflet/Google Maps)
- [ ] **MongoDB** — replace flat-file JSON with a proper database
- [ ] **OAuth** — Google / GitHub social login
- [ ] **PDF export** — download itinerary as a formatted PDF
- [ ] **Multi-language** — Hindi & regional language support
- [ ] **PWA** — offline access & install-to-home-screen support

---

## 📄 License

MIT © 2026 TravelPlanner

---

<p align="center">Built with ❤️ · HTML · CSS · JavaScript · Node.js · Gemini AI</p>
