/** Sample posts when `content-store.json` does not exist yet. */
export function getSeedPosts(): Record<string, unknown>[] {
  const day = (d: number, h: number, m = 0) =>
    new Date(2026, 3, d, h, m, 0, 0).toISOString()
  const ago = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString()

  return [
    {
      id: 'seed-1',
      body: 'Launch teaser — link in bio. Short, punchy, one CTA.',
      platforms: ['Instagram', 'Threads'],
      status: 'scheduled',
      scheduledAt: day(3, 10, 30),
      createdAt: ago(48)
    },
    {
      id: 'seed-2',
      body: 'Thread: 5 lessons from shipping v1 this week. (Draft outline in notepad.)',
      platforms: ['X', 'Bluesky'],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(36)
    },
    {
      id: 'seed-3',
      body: 'Professional update for network — hiring, milestone, or industry take.',
      platforms: ['LinkedIn'],
      status: 'scheduled',
      scheduledAt: day(2, 9, 0),
      createdAt: ago(72)
    },
    {
      id: 'seed-4',
      body: 'Short vertical — trend sound + on-screen text only.',
      platforms: ['TikTok', 'YouTube'],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(12)
    },
    {
      id: 'seed-5',
      body: 'Already went out — thank-you / recap post.',
      platforms: ['X'],
      status: 'posted',
      scheduledAt: day(1, 14, 0),
      postedUrl: null,
      createdAt: ago(96)
    },
    {
      id: 'seed-6',
      body: 'Reminder: weekly live or Q&A — drop questions below.',
      platforms: ['YouTube', 'Instagram'],
      status: 'scheduled',
      scheduledAt: day(5, 18, 0),
      createdAt: ago(6)
    },
    {
      id: 'seed-7',
      body: 'No platforms tagged yet — idea still taking shape.',
      platforms: [],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(3)
    },
    {
      id: 'seed-8',
      body: 'Threads-only: micro-rant + question to drive replies.',
      platforms: ['Threads'],
      status: 'scheduled',
      scheduledAt: day(4, 12, 0),
      createdAt: ago(18)
    },
    {
      id: 'seed-9',
      body: 'Bluesky cross-post with alt text on the image.',
      platforms: ['Bluesky', 'X'],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(8)
    },
    {
      id: 'seed-10',
      body: 'LinkedIn carousel slide 1 copy — hook + stat.',
      platforms: ['LinkedIn', 'Instagram'],
      status: 'scheduled',
      scheduledAt: day(6, 8, 30),
      createdAt: ago(24)
    },
    {
      id: 'seed-11',
      body: 'TikTok caption + pinned comment with link.',
      platforms: ['TikTok'],
      status: 'posted',
      scheduledAt: day(1, 20, 0),
      postedUrl: 'https://example.com/video/tiktok-placeholder',
      createdAt: ago(120)
    },
    {
      id: 'seed-12',
      body: 'YouTube Community tab — poll + short teaser line.',
      platforms: ['YouTube'],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(4)
    },
    {
      id: 'seed-13',
      body: 'Full cross-post: same core copy, tweak tone per network.',
      platforms: ['X', 'LinkedIn', 'Threads', 'Bluesky'],
      status: 'scheduled',
      scheduledAt: day(7, 15, 0),
      createdAt: ago(2)
    },
    {
      id: 'seed-14',
      body: 'Instagram story script — 3 frames, sticker poll on frame 2.',
      platforms: ['Instagram'],
      status: 'draft',
      scheduledAt: null,
      createdAt: ago(1)
    },
    {
      id: 'seed-15',
      body: 'X quote-tweet angle — add one sharp line + your take.',
      platforms: ['X'],
      status: 'scheduled',
      scheduledAt: day(3, 16, 45),
      createdAt: ago(30)
    }
  ]
}

/** Sample notepad text when `scratchpad.json` does not exist yet. */
export const SEED_SCRATCHPAD = `Quick notes
───────────
• Monday: poll idea — “what should we build next?”
• Hashtags to try: #buildinpublic #creatorlife
• Remember: swap hook line before posting to LinkedIn

(Tip: this pad saves automatically.)`
