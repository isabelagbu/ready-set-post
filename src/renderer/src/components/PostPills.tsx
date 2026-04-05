import { useAccounts } from '../accounts/context'
import { PLATFORM_META } from '../accounts/types'
import type { Post } from '../posts/types'

/**
 * Renders platform/account pills for a post.
 * If the post has accountIds, shows account name chips with platform colour.
 * Otherwise falls back to platform name chips.
 */
export default function PostPills({ post }: { post: Post }): React.ReactElement {
  const { accounts } = useAccounts()

  if (post.accountIds.length > 0) {
    const postAccounts = post.accountIds
      .map((id) => accounts.find((a) => a.id === id))
      .filter(Boolean) as (typeof accounts)[number][]

    if (postAccounts.length > 0) {
      return (
        <div className="pills">
          {postAccounts.map((acc) => (
            <span
              key={acc.id}
              className="pill pill--account"
              style={{ '--pill-color': PLATFORM_META[acc.platform].color } as React.CSSProperties}
            >
              {acc.name}
            </span>
          ))}
        </div>
      )
    }
  }

  // Fallback: platform name pills
  return (
    <div className="pills">
      {post.platforms.map((p) => (
        <span key={p} className="pill">
          {p}
        </span>
      ))}
    </div>
  )
}
