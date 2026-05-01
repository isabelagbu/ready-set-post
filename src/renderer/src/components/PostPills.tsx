import { useAccounts } from '../accounts/context'
import { ACCOUNT_PLATFORM_LABELS, PLATFORM_META } from '../accounts/types'
import type { Post } from '../posts/types'
import PlatformLogoImg from './PlatformLogoImg'

/**
 * Renders platform/account pills for a post.
 * If the post has accountIds, shows account name chips with platform colour.
 * Otherwise falls back to platform name chips.
 */
export default function PostPills({ post }: { post: Post }): React.ReactElement {
  const { accounts } = useAccounts()
  const cleanHandle = (name: string): string => name.replace(/^@+/, '')

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
              <PlatformLogoImg platform={acc.platform} size={12} />
              {cleanHandle(acc.name)}
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
          {ACCOUNT_PLATFORM_LABELS[p] && (
            <PlatformLogoImg platform={ACCOUNT_PLATFORM_LABELS[p]} size={12} />
          )}
          {p}
        </span>
      ))}
    </div>
  )
}
