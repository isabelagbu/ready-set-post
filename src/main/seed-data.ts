/**
 * Demo account IDs — must match `SEED_ACCOUNT_IDS` / `getSeedAccounts()` in
 * `src/renderer/src/accounts/types.ts`.
 */
const A = {
  yt: 'seed-acc-youtube',
  ytm: 'seed-acc-youtube-music',
  ig: 'seed-acc-instagram',
  th: 'seed-acc-threads',
  tt: 'seed-acc-tiktok',
  li: 'seed-acc-linkedin',
  x: 'seed-acc-x'
} as const

/** Sample posts shown on first launch (no content-store.json yet). */
export function getSeedPosts(): Record<string, unknown>[] {
  const now = Date.now()
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString()
  const from = (h: number) => new Date(now + h * 3600_000).toISOString()
  const todayAt = (hour24: number, minute: number) => {
    const t = new Date()
    return new Date(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      hour24,
      minute,
      0,
      0
    ).toISOString()
  }

  return [
    {
      id: 'seed-p1',
      title: 'Literally so excited to start playing',
      body: 'Literally so excited to start playing #electricguitar #yamaha #guitar #yamahaerg121 #blackguitar #music #band #fyp',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      contentNotes: {
        script: '',
        hashtags: '#electricguitar #yamaha #guitar #yamahaerg121 #blackguitar #music #band #fyp',
        caption: 'Literally so excited to start playing',
        other: ''
      },
      status: 'posted',
      scheduledAt: ago(5),
      postedUrl: 'https://www.tiktok.com/@sincerely_xomi/video/7551554767307197703',
      createdAt: ago(9)
    },
    {
      id: 'seed-p2',
      title: 'For good (Wicked) | Cover by Xomi',
      body: 'I really enjoyed making this cover! I hope you enjoy it too :) #forgood #wicked #songcover\n\nInstrumental: Wicked, Ariana Grande & Cynthia Erivo\nVocals: Xomi\nFilmed with: iPhone 13 Cinematic Mode\nRecorded on: Audio-Technica ATR2100x-USB, Focusrite Scarlet Solo\nEdited in: Ableton Live Lite, Wondershare Filmora\n\nOriginal music & lyrics by Stephen Schwartz.',
      platforms: ['YouTube'],
      accountIds: [A.ytm],
      contentNotes: {
        script: '',
        hashtags: '#forgood #wicked #songcover',
        caption: 'For good (Wicked) | Cover by Xomi',
        other: 'YouTube channel also includes @xomi_music'
      },
      status: 'posted',
      scheduledAt: ago(72),
      postedUrl: 'https://youtu.be/4oe-2AbX5ek?si=gWbQIm9DZeKIWiwe',
      createdAt: ago(96)
    },
    {
      id: 'seed-p3',
      title: 'Unboxing my First Electric Guitar',
      body: 'Unboxing my first electric guitar, Focusrite interface, and Tonor mic stand. Hey guys! I am so excited to post my first YouTube video and I hope you enjoy it :)',
      platforms: ['YouTube'],
      accountIds: [A.yt],
      status: 'posted',
      scheduledAt: ago(140),
      postedUrl: 'https://www.youtube.com/watch?v=emugTdZxgqE&t=773s',
      createdAt: ago(180)
    },
    {
      id: 'seed-p4',
      title: 'Leaves from the Vine (Uncle Iroh\'s Song)',
      body: 'Leaves from the Vine (Uncle Iroh\'s Song) #avatarthelastairbender #atla #leavesfromthevine #uncleiroh #singing #songcover #fyp',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      contentNotes: {
        script: '',
        hashtags: '#avatarthelastairbender #atla #leavesfromthevine #uncleiroh #singing #songcover #fyp',
        caption: 'Leaves from the Vine (Uncle Iroh\'s Song)',
        other: ''
      },
      status: 'posted',
      scheduledAt: ago(10),
      postedUrl: 'https://www.tiktok.com/@sincerely_xomi/video/7561321017986092296',
      createdAt: ago(16)
    },
    {
      id: 'seed-p5',
      title: 'Lauver Girl cover - Laufey',
      body: 'Lover girls unite! #laufey #laufeycover #singing #cover #songcover',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      contentNotes: {
        script: '',
        hashtags: '#laufey #laufeycover #singing #cover #songcover',
        caption: 'Lover girls unite! 👯‍♀️',
        other: ''
      },
      status: 'posted',
      scheduledAt: ago(6),
      postedUrl: 'https://www.tiktok.com/@sincerely_xomi/video/7564466806883175698',
      createdAt: ago(12)
    },
    {
      id: 'seed-s1',
      title: 'Canada Day Vlog 2025 | Surrey BC',
      body: 'This is a vlog of how I spent Canada Day. I had lots of fun and I hope you did too.',
      platforms: ['YouTube'],
      accountIds: [A.yt],
      contentNotes: {
        script: '',
        hashtags: '#canadaday #vlog #surreybc',
        caption: 'Canada Day Vlog 2025 | Surrey BC',
        other: 'Lifestyle vlog on @xomisdiary'
      },
      status: 'posted',
      scheduledAt: ago(4),
      postedUrl: 'https://youtu.be/oZRIH-aGXVw?si=AkjMGB7es0wOlMEf',
      createdAt: ago(20)
    },
    {
      id: 'seed-s2',
      title: 'Ready Set Post Demo',
      body: 'Demo walkthrough of Ready Set Post: create, schedule, drag-to-reschedule, and track content across platforms.',
      platforms: ['LinkedIn'],
      accountIds: [A.li],
      contentNotes: {
        script: 'Intro problem -> quick app tour -> drag to reschedule -> close with invite to connect.',
        hashtags: '#buildinpublic #productdemo #contentcreator',
        caption: 'Quick demo of Ready Set Post in action.',
        other: 'Record a 45-60 second screen capture for upload.'
      },
      status: 'scheduled',
      scheduledAt: from(26),
      postedUrl: null,
      createdAt: ago(1)
    },
    {
      id: 'seed-s3',
      title: 'Go live on TikTok',
      body: 'Going live tonight at 10PM on TikTok.\n#tiktoklive #livestream',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      status: 'scheduled',
      scheduledAt: todayAt(22, 0),
      postedUrl: null,
      contentNotes: {
        caption: 'Going live tonight at 10PM on TikTok.',
        hashtags: '#tiktoklive #livestream',
        notes: 'Topic: music practice + quick Q&A.'
      },
      createdAt: ago(1)
    },
    {
      id: 'seed-d1',
      title: 'Behind the song setup reel',
      body: 'Quick reel showing mic setup, interface levels, and one vocal take.',
      platforms: ['Instagram', 'TikTok'],
      accountIds: [A.ig, A.tt],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      contentNotes: {
        caption: 'Mini behind-the-scenes of my recording setup.',
        hashtags: '#musiccreator #homestudio #singer',
        notes: 'Film vertical clips: mic close-up, gain knob, quick vocal line.'
      },
      createdAt: ago(2)
    },
    {
      id: 'seed-d2',
      title: 'Cover teaser for YouTube short',
      body: '15s teaser clip for next cover upload with CTA to full video.',
      platforms: ['YouTube'],
      accountIds: [A.ytm],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      contentNotes: {
        caption: 'Snippet from my next cover is up now.',
        hashtags: '#songcover #vocals #youtubecreator',
        notes: 'End card text: Full cover on channel.'
      },
      createdAt: ago(5)
    }
  ]
}

/** Generic sample posts for safe public demos. */
export function getGenericSeedPosts(): Record<string, unknown>[] {
  const now = Date.now()
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString()
  const from = (h: number) => new Date(now + h * 3600_000).toISOString()
  const todayAt = (hour24: number, minute: number) => {
    const t = new Date()
    return new Date(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      hour24,
      minute,
      0,
      0
    ).toISOString()
  }

  return [
    {
      id: 'seed-gp1',
      title: 'Launch week update',
      body: 'Quick launch week recap: what shipped, what we learned, and what is next.',
      platforms: ['LinkedIn'],
      accountIds: [A.li],
      status: 'posted',
      scheduledAt: ago(20),
      postedUrl: 'https://www.linkedin.com',
      contentNotes: { caption: 'Launch week update', hashtags: '#product #buildinpublic', notes: '' },
      createdAt: ago(26)
    },
    {
      id: 'seed-gp2',
      title: 'Short product teaser',
      body: 'A 20-second teaser showing the core workflow in action.',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      status: 'posted',
      scheduledAt: ago(9),
      postedUrl: 'https://www.tiktok.com',
      contentNotes: { caption: 'Short product teaser', hashtags: '#productdemo #saas', notes: '' },
      createdAt: ago(12)
    },
    {
      id: 'seed-gs1',
      title: 'Ready Set Post demo clip',
      body: 'Recording a clean walkthrough for social channels.',
      platforms: ['YouTube'],
      accountIds: [A.yt],
      status: 'scheduled',
      scheduledAt: from(18),
      postedUrl: null,
      contentNotes: { caption: 'Ready Set Post demo clip', hashtags: '#demo #creatortools', notes: 'Keep under 60 seconds.' },
      createdAt: ago(2)
    },
    {
      id: 'seed-gs2',
      title: 'Go live on TikTok',
      body: 'Going live on TikTok at 10PM.\n#live #tiktok',
      platforms: ['TikTok'],
      accountIds: [A.tt],
      status: 'scheduled',
      scheduledAt: todayAt(22, 0),
      postedUrl: null,
      contentNotes: { caption: 'Going live on TikTok at 10PM.', hashtags: '#live #tiktok', notes: '' },
      createdAt: ago(1)
    },
    {
      id: 'seed-gd1',
      title: 'Workflow tip carousel draft',
      body: 'Draft content for a 5-slide carousel on weekly planning.',
      platforms: ['LinkedIn'],
      accountIds: [A.li],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      contentNotes: {
        caption: 'Simple weekly content planning workflow.',
        hashtags: '#contentstrategy #marketing',
        notes: 'Slides: plan, batch, schedule, review, improve.'
      },
      createdAt: ago(1)
    },
    {
      id: 'seed-gd2',
      title: 'Feature spotlight draft',
      body: 'Draft copy for spotlighting drag-to-reschedule.',
      platforms: ['X'],
      accountIds: [A.x],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      contentNotes: {
        caption: 'Reschedule posts by dragging in calendar view.',
        hashtags: '#productivity #socialmedia',
        notes: 'Add short GIF when posting publicly.'
      },
      createdAt: ago(4)
    }
  ]
}

/**
 * Bump when built-in demo posts change. Existing installs whose store is
 * still demo-only (every post `id` starts with `seed-`) get fresh posts on next launch.
 */
export const DEMO_STORE_VERSION = 13

export function isDemoOnlyPostList(posts: unknown): boolean {
  if (!Array.isArray(posts) || posts.length === 0) return false
  for (const p of posts) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return false
    const id = (p as Record<string, unknown>).id
    if (typeof id !== 'string' || !id.startsWith('seed-')) return false
  }
  return true
}

/** True when the file still has a demo-only list but IDs don’t match the current `getSeedPosts()` set (e.g. after a trim). */
export function demoPostListOutOfSyncWithSeed(posts: unknown): boolean {
  if (!isDemoOnlyPostList(posts)) return false
  const canonical = new Set(
    getSeedPosts().map((p) => {
      const id = (p as Record<string, unknown>).id
      return typeof id === 'string' ? id : ''
    })
  )
  canonical.delete('')
  const list = posts as { id: unknown }[]
  const fileIds = new Set(
    list.map((row) => (typeof row.id === 'string' ? row.id : '')).filter(Boolean)
  )
  if (fileIds.size !== canonical.size) return true
  for (const id of canonical) {
    if (!fileIds.has(id)) return true
  }
  return false
}

/** Sample notepad text shown on first launch. */
export const SEED_SCRATCHPAD = `Ideas
─────
• Hook: "Nobody talks about this side of content creation…"
• Collab — reach out to @creator next week
• Hashtags: #buildinpublic #creatoreconomy

Reminders
─────────
• Link in bio before Sunday’s post
• Export analytics end of month

(This pad saves automatically — rename tabs by double-clicking them.)`
