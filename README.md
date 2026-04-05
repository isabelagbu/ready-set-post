# Ready Set Post!

A desktop app for planning, scheduling, and managing social media content — built with Electron, React, and TypeScript.

Designed & developed by Isabel Agbu.

---

## Features

### Content Management
- Create posts with a title, body, platform tags, and an optional scheduled date
- Three sections: **Drafts**, **Content** (scheduled + posted)
- Filter by platform or account, search by keyword, and sort by newest or oldest
- Edit posts inline or delete with a confirmation prompt
- Mark posts as posted directly from the content card

### Calendar View
- Monthly calendar showing all scheduled posts
- Click any day to view, create, or edit posts for that date
- Day panel with per-post editing and platform pills

### Dashboard
- At-a-glance overview of overdue, upcoming, and recent draft posts
- Quick navigation to other views

### Accounts
- Add multiple accounts per platform (TikTok, Instagram, YouTube, LinkedIn, X)
- Each account gets its own embedded browser tab
- Back, forward, and refresh controls per tab
- Loading bar and animated indicator while pages load
- User-agent spoofing for full compatibility with LinkedIn and X

### Detailed Notes View
- Full-screen overlay for script writing and production notes
- Sections: Script, Hashtags, Caption, Other notes — all auto-save
- Post metadata (status, date, platform pills) shown inline
- Edit post details without leaving the view
- Delete post from the toolbar with confirmation
- Live post preview card: shows YouTube or TikTok video thumbnail when a posted URL is added

### Notepad
- 10 persistent tabs (A–J) for free-form notes
- Double-click any tab to rename it
- All content saved to localStorage

### Settings
- **Primary colour** — choose from accent presets
- **Appearance** — Light, Dark, or System theme
- **Sound** — toggle click and navigation sounds on or off
- **Accounts** — add, edit, or remove accounts per platform with custom URLs

### Sound Effects
- Subtle pop sound on every button and navigation click
- Single pop on scheduling a post
- Triple pop when marking a post as posted
- Fully toggleable from Settings

---

## Platforms Supported

| Platform  | Accounts | Browser Tab | Pills |
|-----------|----------|-------------|-------|
| Instagram | ✓ | ✓ | ✓ |
| TikTok    | ✓ | ✓ | ✓ |
| YouTube   | ✓ | ✓ | ✓ |
| X         | ✓ | ✓ | ✓ |
| LinkedIn  | ✓ | ✓ | ✓ |

---

## Tech Stack

- **Electron** — desktop shell, file-system storage, native theme integration
- **React 19** — UI and component state
- **TypeScript** — end-to-end type safety
- **Vite / electron-vite** — fast dev builds and HMR
- **CSS custom properties + `color-mix()`** — dynamic theming and accent colours
- **Web Audio / HTML Audio** — sound effects
- **localStorage** — preferences, notepad tabs, sidebar state, accounts
- **Electron `<webview>`** — embedded social platform browsers

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Type check

```bash
npm run typecheck
```

---

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── index.ts        # App setup, IPC handlers, file storage
│   └── seed-data.ts    # Default posts shown on first launch
├── preload/            # Context bridge
└── renderer/src/
    ├── App.tsx          # Shell layout and navigation
    ├── main.tsx         # React entry, global sound listener
    ├── main.css         # All styles
    ├── accounts/        # AccountsContext, types, localStorage helpers
    ├── components/      # Shared UI components
    │   ├── ConfirmDialog.tsx
    │   ├── DateTimePicker.tsx
    │   ├── PostContentNotesEditor.tsx
    │   ├── PostCreateForm.tsx
    │   ├── PostCreateModal.tsx
    │   ├── PostEditorForm.tsx
    │   ├── PostLivePreview.tsx
    │   ├── PostNotesFullView.tsx
    │   └── PostPills.tsx
    ├── posts/           # Post type, parsing, platform options
    ├── utils/           # sound.ts
    └── views/
        ├── AccountsView.tsx
        ├── CalendarView.tsx
        ├── ContentView.tsx
        ├── DashboardView.tsx
        ├── NotesView.tsx
        └── SettingsView.tsx
```

---

## Data Storage

All posts are persisted to a JSON file in Electron's `userData` directory (`content-store.json`). Preferences (theme, accent, sound, sidebar state, accounts, notepad tabs) are stored in `localStorage`.
