# Ready Set Post!

A desktop app for planning, scheduling, and managing social media content — built with Electron, React, and TypeScript.

Designed & developed by Isabel Agbu.

---

## Features

### Dashboard
- Customisable greeting (double-click to edit)
- Uploadable cover photo banner with built-in crop tool
- At-a-glance stat cards: Drafts, Scheduled, Posted, Overdue, Total
- "Next up" and "Recent drafts" side-by-side for quick access
- Recent posts grid with YouTube/TikTok thumbnails and platform colours
- Overdue post warning with one-click calendar link
- Contextual usage hint cards

### Content Management
- Create posts with a title, body, platform selection, and optional scheduled date
- Two tabs: **Drafts** and **Content** (scheduled + posted)
- Filter by platform, account, or status; search by keyword; sort by newest or oldest
- Edit posts inline or delete with a confirmation prompt
- Mark posts as posted directly from the content card
- Post cards show thumbnails for live posts (YouTube/TikTok) with platform-coloured placeholders while loading
- After publishing, opens the new post in Content with an in-app success dialog

### Video Publishing (YouTube)
- **Plan** vs **Publish** workflow in the post composer — Publish mode is for uploading a video
- Upload videos directly to YouTube via the YouTube Data API (resumable upload)
- Per-video settings: title, description, tags, privacy (public / unlisted / private), made-for-kids, optional custom thumbnail
- **Post now** or schedule for a future date (scheduled uploads go to YouTube as private until publish time)
- Upload progress overlay while the file is sending
- In-app **Posted to YouTube** dialog with watch link and **View in Content**
- Saves a local preview thumbnail (custom image or a frame from the video) so private uploads still show a thumbnail in the app
- TikTok and Instagram publish fields are available in the composer for planning; API upload is YouTube-only today

### Calendar View
- Monthly calendar showing all scheduled posts per day
- Hover over a day with posts to see a bubble of post titles
- Click any day to open a panel for viewing, creating, or editing posts
- **Drag-to-reschedule** — drag a post card onto a new date to move it
- Cards become translucent while dragging for clear visual feedback

### Detailed Notes View
- Full-screen overlay for script, hashtags, caption, and other notes
- All fields auto-save continuously
- Post metadata (status, date, platform pills) shown inline
- Edit post details without leaving the view
- Delete post from the toolbar with a confirmation prompt
- Live post preview: shows YouTube or TikTok thumbnail for posted items (uses saved local preview for private YouTube videos)

### Notepad
- 10 persistent tabs (A–J) for free-form scratch notes
- Double-click any tab to rename it
- **Sticky notes** — spawn draggable, colour-coded sticky notes anywhere on screen
  - Six colour themes (yellow, green, pink, purple, orange, teal)
  - Drag freely; constrained so they never overlap the sidebar
  - Confirmation bubble before deletion, styled to match the note colour
  - Scrollbar colour matches each sticky note
- All content saved automatically

### Accounts
- Add multiple accounts per platform (TikTok, Instagram, YouTube, LinkedIn, X, Threads)
- Each account gets its own embedded browser tab
- Back, forward, and refresh controls per tab
- Loading bar and animated indicator while pages load
- User-agent spoofing for full compatibility with LinkedIn and X

### Reminders
- System notification when a scheduled post becomes due
- Check runs every 60 seconds in the background
- Send test notification from Settings to verify macOS permissions
- Fully toggleable from Settings

### Onboarding
- First-launch onboarding flow walks through core features
- Dismisses permanently once completed

### Settings
- **Appearance** — Light, Dark, or System theme
- **Primary colour** — Rose, Amber, Forest, Ocean, Violet, Pearl, Onyx
- **Sound** — toggle click and navigation sounds on or off
- **Hints** — show or hide contextual tip cards throughout the app
- **Reminders** — enable/disable post-due notifications + test button
- **Dashboard** — toggle cover photo banner on or off
- **Accounts** — add, edit, or remove accounts per platform
- **Google Drive Sync** — connect/disconnect, manual sync, sync status and pending-change visibility
- **YouTube posting** — separate from Drive; uses its own Google sign-in flow
  - Optional **channel discovery** OAuth to match handles to channels
  - **Connect for posting** and **Sign in to this channel** per YouTube row (multi-channel support)
  - Shows **Uploads as** and **Posting: Ready** status per account
  - Drive disconnect does not clear YouTube upload tokens

### Cloud Sync
- Google OAuth connection from Settings (Drive uses `drive.file` scope only)
- Auto-sync for posts (`content-store.json`) and scratchpad (`scratchpad.json`)
- Workspace mirror (`workspace.json`) syncs key local preferences across devices:
  - accounts and account-preview toggle
  - onboarding completion
  - notepad tabs, active tab, demo version, and sticky notes
  - dashboard greeting and banner image + banner enabled toggle
  - reminders, hints, enabled form platforms, content section memory
  - theme, accent, and sound preference
- Conflict handling:
  - posts merge by post `id` + latest `updatedAt` (local + remote on sync)
  - workspace merges per key using latest timestamp
- Notes:
  - OAuth tokens remain device-local (each device connects once)
  - Drive and YouTube can use different Google accounts
  - synced data is cached locally for offline use and later upload

### Sound Effects
- Subtle pop on every button click and navigation
- Single pop when scheduling a post or creating a sticky note
- Triple pop when marking a post as posted
- Fully toggleable from Settings

### Usage Hints
- Contextual tip cards in every main view
- Hint cards can be hidden globally from Settings without reloading

---

## Platforms Supported

| Platform  | Accounts | Browser Tab | Pills | API publish |
|-----------|----------|-------------|-------|-------------|
| Instagram | ✓ | ✓ | ✓ | — |
| TikTok    | ✓ | ✓ | ✓ | — |
| YouTube   | ✓ | ✓ | ✓ | ✓ upload + schedule |
| X         | ✓ | ✓ | ✓ | — |
| LinkedIn  | ✓ | ✓ | ✓ | — |
| Threads   | ✓ | ✓ | ✓ | — |

---

## Tech Stack

- **Electron** — desktop shell, file-system storage, native notifications, theme integration
- **React 19** — UI and component state
- **TypeScript** — end-to-end type safety
- **Vite / electron-vite** — fast dev builds and HMR
- **CSS custom properties + `color-mix()`** — dynamic theming and accent colours
- **HTML5 Drag and Drop API** — calendar rescheduling and sticky note dragging
- **react-image-crop** — banner photo cropping
- **Web Audio / HTML Audio** — sound effects
- **Electron `Notification`** — native macOS reminders
- **Google Drive API** — cloud file sync for posts, scratchpad, and workspace preferences
- **Google OAuth 2.0** — Drive sync and YouTube upload (separate token stores)
- **YouTube Data API v3** — channel listing, resumable video upload, thumbnail upload
- **localStorage** — renderer cache and UI state, mirrored into workspace sync keys
- **Electron `<webview>`** — embedded social platform browsers
- **IPC (preload bridge)** — secure main ↔ renderer communication for store, Drive, YouTube, and notifications

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Google Cloud project with OAuth credentials (for Drive sync and YouTube publishing)

### Install

```bash
npm install
```

### Configure Google credentials (dev)

Create `.env.local` in the project root:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

In Google Cloud Console, enable **Google Drive API** and **YouTube Data API v3**, and add OAuth scopes as needed:

- `https://www.googleapis.com/auth/drive.file` — Drive sync
- `https://www.googleapis.com/auth/youtube.upload` — video uploads
- `https://www.googleapis.com/auth/youtube.readonly` — channel discovery / listing

Restart the dev server after changing `.env.local` or main-process code.

### Run in development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Package macOS app (DMG)

```bash
npm run dist
```

### Type check

```bash
npm run typecheck
```

---

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App setup, IPC, YouTube upload, notifications
│   ├── seed-data.ts         # Default posts shown on first launch
│   └── drive/
│       ├── auth.ts          # Google / YouTube OAuth (Drive, list, per-channel upload)
│       ├── client.ts        # Drive API client
│       ├── store.ts         # Local cache + Drive sync + merge
│       └── workspaceFile.ts # Workspace JSON read/write
├── preload/                 # Context bridge (store, Drive, YouTube, theme, notify)
└── renderer/src/
    ├── App.tsx              # Shell layout, navigation, post creation, publish success UI
    ├── main.tsx             # React entry, workspace hydration, error boundary
    ├── main.css             # All styles
    ├── theme.ts             # Theme + accent preset definitions
    ├── theme-sync-document.ts  # Early theme/accent apply (CSP-friendly)
    ├── accounts/            # AccountsContext, YouTube channel matching, types
    ├── components/          # Shared UI components
    │   ├── BannerCropModal.tsx
    │   ├── BrandLogo.tsx
    │   ├── ConfirmDialog.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── PostCardThumb.tsx
    │   ├── PostCreateForm.tsx      # Plan + Publish composer, YouTube upload UI
    │   ├── PostCreateModal.tsx
    │   ├── PublishSuccessDialog.tsx
    │   ├── PostLivePreview.tsx
    │   ├── PostNotesFullView.tsx
    │   └── …
    ├── hooks/
    │   ├── useReminders.ts
    │   └── useEnabledPlatformFormLabels.ts
    ├── posts/               # Post types, parsing, merge, thumbnails, video preview
    ├── workspace/           # Cross-device localStorage sync helpers
    ├── utils/               # sound, hints, reminders, accounts view
    └── views/
        ├── AccountsView.tsx
        ├── CalendarView.tsx
        ├── ContentView.tsx
        ├── DashboardView.tsx
        ├── NotesView.tsx
        └── SettingsView.tsx   # Drive + YouTube OAuth UI
```

---

## Data Storage

Runtime data is stored in Electron's `userData` directory and mirrored to Google Drive when connected:

- `content-store.json` — posts (including video metadata, YouTube video id, local preview thumbnails)
- `scratchpad.json` — notes scratchpad
- `workspace.json` — synced preference/localStorage mirror for cross-device continuity
- `drive-tokens.bin` — Google Drive OAuth tokens (encrypted when OS keychain available)
- `youtube-list-tokens.bin` — optional YouTube channel-discovery OAuth
- `youtube-channel-tokens.bin` — per-channel YouTube upload OAuth tokens

Renderer state still uses `localStorage` for immediate reads, then hydrates/applies updates from synced workspace data.
