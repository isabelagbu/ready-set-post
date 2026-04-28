# Manual test checklist

Use this when validating releases, after large refactors, or when testing on a new platform (macOS / build). **No automated test suite exists in this repo** — these are the flows you should exercise by hand.

**Environment**

- [ ] `npm install` completes without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run build` completes (for packaged sanity)
- [ ] `npm run dev` launches the app without console errors in main/renderer that block use

**Data note:** Posts live in `content-store.json` under Electron user data. Deleting that file (or a fresh user profile) exercises first-run / seed behaviour. Preferences and scratch data live in `localStorage` (see README).

---

## 1. Shell & navigation

- [ ] App window opens, sidebar shows: Dashboard, Calendar, Content, Notepad, Accounts, Settings
- [ ] Each nav item switches the main view; active state highlights correctly
- [ ] Sidebar collapse/expand (hover) still allows navigation (if you use that behaviour)
- [ ] If sound is on in Settings: subtle pop on button clicks and navigation; no errors if sound is off
- [ ] Hints: with **Settings → Hints** on, tip cards appear in main views; with hints off, tips are hidden (no broken layout)

---

## 2. Onboarding (first run or “never seen” state)

*Reset onboarding by clearing the relevant `localStorage` key if you need to retest — or use a clean profile.*

- [ ] Onboarding modal appears for a new user and steps through without crashing
- [ ] Completing onboarding dismisses it permanently; app is usable
- [ ] (Optional) Partial dismiss / reopen behaviour matches your product expectation

---

## 3. Dashboard

- [ ] Greeting: double-click to edit, save, Escape to cancel, character limit feels OK
- [ ] Stat cards: **Drafts, Scheduled, Posted, Overdue** show plausible counts
- [ ] **Overdue** card: with at least one past-due **scheduled** post, count matches; card styling indicates danger
- [ ] **Overdue** + navigate: clicking **Overdue** opens **Calendar** on the **first overdue day** (that day selected, month visible, day panel shows those posts)
- [ ] “Open calendar” in the overdue section (when overdue exists) does the same jump with the first overdue day selected
- [ ] **Scheduled** & **New post**-style navigations from dashboard go to the right place
- [ ] “Next up” and “Recent” lists: items render, links (e.g. open calendar) work
- [ ] If banner is enabled in Settings: upload/crop banner, image displays; disable banner in Settings and confirm dashboard layout still works
- [ ] Recent posts: thumbnails/gradients and platform feel consistent; “View” links (if any) work

---

## 4. Content (Drafts + Content + filters)

- [ ] **Drafts** tab lists draft posts; **Content** tab lists scheduled and posted
- [ ] `+` / create flow opens create modal, required fields, schedule optional
- [ ] New post appears in the list and persists after app restart
- [ ] **Search** and **filter** (platform, account, status) narrow the list; clearing restores full list
- [ ] **Sort** (newest / oldest) reorders as expected
- [ ] **Edit** inline: title/body/schedule changes save and survive reload
- [ ] **Delete** shows confirmation, removes post, list updates
- [ ] **Mark as posted** (or equivalent) updates status and any posted URL handling you rely on
- [ ] On each post card, the hint reads **“Click for full details”** (not “notes”)
- [ ] Clicking the main body area opens the full overlay (**Post notes / full view**)
- [ ] `aria` / keyboard: focus the clickable region, Enter/Space opens full view where implemented

---

## 5. Full details overlay (`PostNotesFullView`)

- [ ] Opens from Content and from Calendar day panel
- [ ] Back/close returns without data loss; unsaved feel matches autosave behaviour
- [ ] Script/body, production note fields, hashtags/captions (whatever is in the form) **autosave** — reload overlay or app and check persistence
- [ ] Edit post from toolbar (if available) and delete with confirmation; list updates
- [ ] For **posted** posts with URLs: live preview / thumbnail (YouTube, TikTok) if applicable

---

## 6. Calendar

- [ ] **Month** prev/next, title matches grid
- [ ] Days outside current month are visually distinct; today is identifiable if styled
- [ ] Days with posts show the right count; **overdue** label under day when applicable
- [ ] **Hover** day with posts: tooltip / preview of titles; overdue titles styled as designed (e.g. red)
- [ ] **Click a day:** side panel shows that date, **Scheduled** list for that day
- [ ] **Overdue** scheduled posts: card has overdue styling, **“overdue”** label in bottom-right of the card, **“Click for full details”** in the body area
- [ ] **Drag a post** from one day to another: post moves, `scheduledAt` updates, no duplicate, undo path is “edit manually” (no formal undo in app)
- [ ] While dragging: card feedback (e.g. translucency) is visible; drop on invalid target doesn’t crash
- [ ] **+ New post** from day panel: creates for selected date, appears on that day
- [ ] **Edge:** day with no posts → empty state copy; selecting another day updates panel

---

## 7. Notepad (scratch + stickies)

- [ ] 10 tabs (A–J): type in each, switch tabs, text persists (localStorage)
- [ ] **Double-click tab** to rename; name persists
- [ ] **Sticky note:** create, pick colour, drag, stays on top within constraints (e.g. not under sidebar)
- [ ] Sticky: delete with confirmation, colour-appropriate UI
- [ ] Restart app: notepad + tab names + stickies (if persisted) still there

---

## 8. Accounts

- [ ] Add account per platform; list shows entries
- [ ] Open embedded **webview** (or “open in tab” per your UI): back/forward/refresh work
- [ ] Loading state / bar appears on slow load
- [ ] LinkedIn and X: user-agent / compatibility smoke (load login page, no instant blank crash)
- [ ] Remove account, confirm it disappears from list

---

## 9. Settings

- [ ] **Theme:** Light, Dark, System — UI and `document` theme look correct, no hardcoded white/black leaks
- [ ] **Primary colour (accent):** each preset updates buttons/highlights; persists after restart
- [ ] **Sound:** on/off actually gates pops (with Navigation sounds)
- [ ] **Reminders:** toggle; **Send test notification** (macOS permission prompt on first use); notification appears when allowed
- [ ] **Dashboard banner** toggle: dashboard respects on/off
- [ ] **Hints** toggle: re-check main views
- [ ] **Accounts** subsection (if in Settings): in sync with Accounts view, or as implemented

---

## 10. Reminders (time-dependent)

*Hard to test in one session — at minimum:*

- [ ] With reminders **on** and a post **scheduled a few minutes ahead**, a **system notification** appears near the due time (background interval ~60s — allow latency)
- [ ] With reminders **off**, no notification (or at least not expected)

---

## 11. Data persistence & upgrades

- [ ] Create post → quit app → reopen: post still there
- [ ] Change theme/accent → reopen: preference sticks
- [ ] Optional: back up `content-store.json`, corrupt slightly, app doesn’t **hard-crash** (or document expected failure) — only if you maintain migration logic

---

## 12. Regression spots (from recent work)

*Keep these in mind if you change navigation or post types again.*

- [ ] Dashboard **Overdue** → Calendar lands on **first overdue date** (selected), not “today” only
- [ ] Calendar **overdue** post cards: corner **“overdue”** text + “Click for full **details**” hint
- [ ] No stray “Click for full-screen **notes**” in Content or Calendar post cards (unless reverted intentionally)

---

## 13. Build & packaging (pre-release)

- [ ] `npm run build` succeeds
- [ ] Install/run the built `.dmg` / `.exe` / target artifact (or your dist): smoke open app, open Dashboard, one Content flow, quit

---

*Last aligned with app features in README and main views. Extend this file when you add new IPC routes, new views, or new user-visible toggles.*
