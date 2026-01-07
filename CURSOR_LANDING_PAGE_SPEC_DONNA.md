# DONNA — New Landing Page Build Spec (Cursor-ready)

This document is written to be dropped into the repo and used as the **single source of truth** for building the new DONNA landing page.

---

## 0) Goal + Experience (what “done” feels like)

**Mobile-first cinematic landing page** that:
1) Plays a **short full-screen logo reveal** on arrival (8s).
2) After reveal, shows a **pulsing “Scroll” cue** (text + arrows).
3) The full story is consumed in **5–7 vertical swipes** (section-per-screen).
4) Inside sections, users can **horizontal-swipe** feature cards / galleries.
5) Desktop gets a slightly richer experience (more detail density, not heavier motion).

Primary KPI: **engaged scroll depth + CTA clicks** without sacrificing load speed.

---

## 1) Decision: Video vs Animation (balance of style vs performance)

### Recommendation (v1):
**Keep the intro as a video, but ship it as optimized, muted, multi-resolution sources.**

Why:
- Your intro is already polished and on-brand.
- Converting to SVG/Lottie “stroke animation” could be lighter, but will take iteration to match the exact look.
- We can get the video payload extremely small (sub-500KB) and still look premium.

### Plan for v2 (optional):
If we want even better performance + crispness on all screens, convert the logo reveal to:
- **SVG stroke animation** (best for line-art logos) or
- **Lottie** (JSON) if the reveal has more complex timing.

**Important UX rule:** If user has `prefers-reduced-motion: reduce`, **skip the intro** (or show a static poster for 300–600ms then proceed).

---

## 2) Assets Provided (already generated in this workspace)

Use these optimized assets (preferred):
- `public/intro/donna_intro_480p.mp4` (≈200KB)
- `public/intro/donna_intro_720p.mp4` (≈470KB)
- `public/intro/donna_intro_poster.jpg` (≈40KB)

If you need to regenerate from the original:
- Original source: `DONNA-LogoAnimated.mp4` (4.18MB, 2560×1440, 8s)

**Implementation note:** Always remove audio for web (mute tracks) unless we intentionally want sound.

---

## 3) Page Information Architecture (5–7 swipes)

Use **full-viewport sections** with scroll snap (mobile) so the experience is “chaptered”.

### Section list (recommended 6)
1. **Hero**: “One AI. Every Industry.” + 1-line subtext + primary CTA
2. **What DONNA does**: horizontal swipe cards (capabilities)
3. **Verticals**: horizontal swipe cards (hospitality, construction, real estate, etc.)
4. **D2D Network**: short explanation + horizontal examples
5. **Proof / Outcomes**: metrics, logos, testimonial snippets
6. **CTA / Contact**: lead capture + secondary CTA (demo / join beta)

**Total: 6 screens** → fits your 5–7 swipe target.

---

## 4) Interaction Requirements (must match the vision)

### 4.1 Intro overlay behavior
- Full-screen overlay on first load:
  - Plays video **autoplay, muted, playsinline**.
  - No user interaction required.
- On `ended` (or user taps “Skip”), overlay fades out and reveals page.
- After intro completes, show **pulsing scroll cue**:
  - Text: `SCROLL` or `Scroll to begin`
  - Arrow(s) beneath, pulsing in sync
- Remember completion:
  - Store `localStorage.setItem("donnaIntroSeen","1")`
  - If intro seen in last 24h (or 7d), skip it.

### 4.2 Vertical swipe sections
- Page is consumable in **5–7 vertical swipes**.
- Use **CSS scroll snap** on mobile:
  - `scroll-snap-type: y mandatory;`
  - `section { scroll-snap-align: start; height: 100svh; }`
- Desktop:
  - Allow free scroll (optional) or keep snap but with softer behavior.

### 4.3 Horizontal swipe inside sections
- Each “content” section has a horizontal rail:
  - `overflow-x: auto; display: flex; scroll-snap-type: x mandatory;`
  - Cards have `scroll-snap-align: start;`
- Add a subtle “Swipe” hint on first horizontal rail only.

---

## 5) Performance Targets (non-negotiable)

**LCP target (mobile):** under ~2.5s on decent 4G  
**Intro video total transfer:** under ~600KB for default mobile path  
**JS budget:** minimal; avoid heavy libraries unless necessary

### Engineering rules
- `preload="metadata"` for intro video.
- `poster` attribute set.
- Use `playsinline` (required on iOS).
- Only load heavier desktop visuals with media queries or `prefers-reduced-data`.

---

## 6) Accessibility + Motion Safety

- Respect `prefers-reduced-motion`:
  - Skip the intro overlay animation/video.
  - Disable scroll-snap “mandatory” (switch to `proximity`) or allow normal scroll.
  - Stop pulsing arrows (or reduce intensity).
- Provide a **Skip intro** control (top-right):
  - Must be keyboard accessible on desktop.
- Ensure color contrast for text over black.

---

## 7) SEO + Analytics (baseline)

### SEO
- One H1 on the hero.
- Proper meta title/description.
- OG tags for social shares.
- Keep copy lightweight and scannable.

### Analytics Events (simple)
Track:
- `intro_played`
- `intro_skipped`
- `section_view` (1–6) using IntersectionObserver
- `cta_click_primary`
- `cta_submit`

---

## 8) Recommended Tech Approach (choose one)

### Option A (fastest, best performance): Static HTML/CSS/JS
- `index.html`, `styles.css`, `app.js`
- Works anywhere (SiteGround, Vercel static, etc.)

### Option B (if the repo is already Next.js): Next.js + lightweight client JS
- Use `<video>` overlay in a client component
- Keep motion mostly CSS
- Avoid GSAP unless absolutely required

**Default recommendation:** Option A unless the project must live inside an existing Next/Vercel app.

---

## 9) Implementation Details (copy/paste blueprint)

### 9.1 Intro overlay markup (HTML)
```html
<div id="introOverlay" class="intro">
  <button id="skipIntro" class="skip" aria-label="Skip intro">Skip</button>

  <video id="introVideo"
         class="introVideo"
         autoplay
         muted
         playsinline
         preload="metadata"
         poster="/intro/donna_intro_poster.jpg">
    <source src="/intro/donna_intro_480p.mp4" type="video/mp4" media="(max-width: 600px)">
    <source src="/intro/donna_intro_720p.mp4" type="video/mp4">
  </video>
</div>
```

### 9.2 Scroll cue (after intro)
```html
<div id="scrollCue" class="scrollCue" aria-hidden="true">
  <div class="scrollText">SCROLL</div>
  <div class="scrollArrows">↓ ↓ ↓</div>
</div>
```

### 9.3 CSS essentials
```css
/* Intro overlay */
.intro{
  position:fixed; inset:0; z-index:9999;
  display:flex; align-items:center; justify-content:center;
  background:#000;
}
.introVideo{ width:100%; height:100%; object-fit:cover; }
.intro.fadeOut{ animation: fadeOut .6s ease forwards; }
@keyframes fadeOut{ to{ opacity:0; visibility:hidden; } }

.skip{
  position:absolute; top:16px; right:16px; z-index:2;
  background:rgba(0,0,0,.4); color:#fff; border:1px solid rgba(255,255,255,.2);
  padding:10px 12px; border-radius:999px;
}

/* Scroll cue */
.scrollCue{
  position:fixed; left:0; right:0; bottom:24px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  opacity:0; pointer-events:none;
}
.scrollCue.show{ opacity:1; transition:opacity .35s ease; }
.scrollText, .scrollArrows{
  letter-spacing:.22em; font-weight:600; font-size:12px; color:rgba(255,255,255,.85);
  animation:pulse 1.2s ease-in-out infinite;
}
@keyframes pulse{ 0%,100%{ transform:translateY(0); opacity:.55 } 50%{ transform:translateY(-3px); opacity:1 } }

/* Vertical snap container */
main.snap{
  height:100svh; overflow-y:auto;
  scroll-snap-type:y mandatory;
}
section.snapSection{
  height:100svh; scroll-snap-align:start;
  display:flex; align-items:center; justify-content:center;
}

/* Horizontal rail */
.hRail{
  display:flex; gap:14px; overflow-x:auto;
  scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;
}
.hCard{ min-width:78vw; scroll-snap-align:start; border-radius:20px; }
@media (min-width: 900px){ .hCard{ min-width:420px; } }
```

### 9.4 JS behavior (intro + reduced motion)
```js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const introSeen = localStorage.getItem('donnaIntroSeen') === '1';

const overlay = document.getElementById('introOverlay');
const video = document.getElementById('introVideo');
const skipBtn = document.getElementById('skipIntro');
const scrollCue = document.getElementById('scrollCue');

function finishIntro(reason){
  if (!overlay) return;
  overlay.classList.add('fadeOut');
  localStorage.setItem('donnaIntroSeen','1');
  scrollCue?.classList.add('show');
  // optional: analytics event reason: ended | skipped | reduced
}

if (reducedMotion || introSeen){
  overlay?.remove();
  scrollCue?.classList.add('show');
}else{
  skipBtn?.addEventListener('click', () => finishIntro('skipped'));
  video?.addEventListener('ended', () => finishIntro('ended'));
  // Safety timeout (if video fails)
  setTimeout(() => finishIntro('timeout'), 12000);
}
```

---

## 10) Acceptance Checklist (QA)

### Visual / UX
- [ ] Intro plays full-screen on first visit
- [ ] “Scroll” cue appears only after intro finishes (or is skipped)
- [ ] 5–7 swipes reach the bottom CTA
- [ ] Horizontal swipe works smoothly and snaps cards

### Performance
- [ ] Mobile intro loads from 480p source by default
- [ ] Video is muted + faststart enabled
- [ ] No layout shifts when overlay is removed

### Accessibility
- [ ] Skip button is accessible on desktop
- [ ] Reduced motion skips intro automatically

---

## 11) Notes for Designers / Content

Keep copy ultra-short per section.
Avoid stacking too many paragraphs; use:
- 1 headline
- 1 supporting line
- 1 horizontal rail
- 1 CTA

Brand tone: **futuristic, confident, minimal**.
