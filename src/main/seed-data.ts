/** Sample posts when `content-store.json` does not exist yet. */
export function getSeedPosts(): Record<string, unknown>[] {
  const day = (d: number, h: number, m = 0) =>
    new Date(2026, 3, d, h, m, 0, 0).toISOString()
  const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()

  return [
    {
      id: 'seed-1',
      title: 'Launch teaser — link in bio',
      body: 'Short, punchy, one CTA. Drop the link in bio and let the visuals do the work.',
      platforms: ['Instagram'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(3, 10, 30),
      postedUrl: null,
      createdAt: ago(48)
    },
    {
      id: 'seed-2',
      title: '5 lessons from shipping v1',
      body: 'Thread: 5 lessons from shipping v1 this week. Outline in Notepad.',
      platforms: ['X'],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(36)
    },
    {
      id: 'seed-3',
      title: 'Professional network update',
      body: 'Professional update for network — hiring, milestone, or industry take.',
      platforms: ['LinkedIn'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(2, 9, 0),
      postedUrl: null,
      createdAt: ago(72)
    },
    {
      id: 'seed-4',
      title: 'Short vertical — trend sound',
      body: 'Short vertical — trend sound + on-screen text only. Keep it under 30 s.',
      platforms: ['TikTok', 'YouTube'],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(12)
    },
    {
      id: 'seed-5',
      title: 'Thank-you & recap post',
      body: 'Already went out — thank-you / recap post. Link the original in the first comment.',
      platforms: ['X'],
      accountIds: [],
      status: 'posted',
      scheduledAt: day(1, 14, 0),
      postedUrl: null,
      createdAt: ago(96)
    },
    {
      id: 'seed-6',
      title: 'Weekly live / Q&A reminder',
      body: 'Reminder: weekly live or Q&A — drop questions below.',
      platforms: ['YouTube', 'Instagram'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(5, 18, 0),
      postedUrl: null,
      createdAt: ago(6)
    },
    {
      id: 'seed-7',
      title: 'Untitled idea',
      body: 'No platforms tagged yet — idea still taking shape.',
      platforms: [],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(3)
    },
    {
      id: 'seed-8',
      title: 'Engagement question post',
      body: 'Micro-rant + question to drive replies.',
      platforms: ['X'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(4, 12, 0),
      postedUrl: null,
      createdAt: ago(18)
    },
    {
      id: 'seed-9',
      title: 'Cross-post with alt text',
      body: 'Cross-post with alt text on the image. Remember to crop 1:1.',
      platforms: ['X'],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(8)
    },
    {
      id: 'seed-10',
      title: 'LinkedIn carousel — slide 1',
      body: 'LinkedIn carousel slide 1 copy — hook + stat. Keep under 150 chars.',
      platforms: ['LinkedIn'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(6, 8, 30),
      postedUrl: null,
      createdAt: ago(24)
    },
    {
      id: 'seed-11',
      title: 'TikTok caption with pinned comment',
      body: 'TikTok caption + pinned comment with link.',
      platforms: ['TikTok'],
      accountIds: [],
      status: 'posted',
      scheduledAt: day(1, 20, 0),
      postedUrl: 'https://example.com/video/tiktok-placeholder',
      createdAt: ago(120)
    },
    {
      id: 'seed-12',
      title: 'YouTube Community poll',
      body: 'YouTube Community tab — poll + short teaser line.',
      platforms: ['YouTube'],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(4)
    },
    {
      id: 'seed-13',
      title: 'Full cross-post',
      body: 'Full cross-post: same core copy, tweak tone per network.',
      platforms: ['X', 'LinkedIn'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(7, 15, 0),
      postedUrl: null,
      createdAt: ago(2)
    },
    {
      id: 'seed-14',
      title: 'Instagram story — 3 frames',
      body: 'Instagram story script — 3 frames, sticker poll on frame 2.',
      platforms: ['Instagram'],
      accountIds: [],
      status: 'draft',
      scheduledAt: null,
      postedUrl: null,
      createdAt: ago(1)
    },
    {
      id: 'seed-15',
      title: 'X quote-tweet angle',
      body: 'X quote-tweet angle — add one sharp line + your take.',
      platforms: ['X'],
      accountIds: [],
      status: 'scheduled',
      scheduledAt: day(3, 16, 45),
      postedUrl: null,
      createdAt: ago(30)
    }
  ]
}

/** Sample notepad text when `scratchpad.json` does not exist yet. */
export const SEED_SCRATCHPAD = `Quick notes
───────────
• Monday: poll idea — "what should we build next?"
• Hashtags to try: #buildinpublic #creatorlife
• Remember: swap hook line before posting to LinkedIn

(Tip: this pad saves automatically.)`
