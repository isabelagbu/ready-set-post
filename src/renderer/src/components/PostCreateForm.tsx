import { useEffect, useState } from 'react'
import { useAccounts } from '../accounts/context'
import { isYouTubeChannelUploadAuthorized } from '../accounts/youtube-channel'
import { ACCOUNT_PLATFORM_LABELS, PLATFORM_META, type Platform } from '../accounts/types'
import { scheduledAtFromParts, toDateInputValue, toTimeInputValue } from '../posts/datetime'
import type { PublishSuccessInfo } from './PublishSuccessDialog'
import {
  type CreatePostPayload,
  type MediaType,
  type PlatformPublishConfig,
  type PostedLinks,
  type Post,
  type Status,
  type VideoAsset,
  type YouTubeThumbnailAsset
} from '../posts/types'
import { buildLocalPreviewDataUrl } from '../posts/video-preview'
import { useEnabledPlatformFormLabels } from '../hooks/useEnabledPlatformFormLabels'
import ScheduleDateTimeFields from './ScheduleDateTimeFields'
import PlatformLogoImg from './PlatformLogoImg'
import ConfirmDialog from './ConfirmDialog'

/** Platforms that support video in the publish composer. */
const VIDEO_ALLOWED_PLATFORM_LABELS = new Set(['TikTok', 'Instagram', 'YouTube'])

export default function PostCreateForm({
  initialDraft,
  initialDate,
  onCancel,
  onCreate,
  onPostPublished,
  onPublishingChange,
  showTitle = true,
  plain = false
}: {
  initialDraft: boolean
  /** Pre-fill the date picker with this ISO string. Defaults to now. */
  initialDate?: string
  onCancel: () => void
  onCreate: (payload: CreatePostPayload) => Post
  onPostPublished?: (post: Post, info: PublishSuccessInfo) => void
  onPublishingChange?: (publishing: boolean) => void
  showTitle?: boolean
  plain?: boolean
}): React.ReactElement {
  const { accounts } = useAccounts()
  const formPlatformLabels = useEnabledPlatformFormLabels()

  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [body, setBody] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [workflowMode, setWorkflowMode] = useState<'plan' | 'publish'>('plan')
  const [mode, setMode] = useState<'draft' | 'schedule' | 'posted'>(() => (initialDraft ? 'draft' : 'schedule'))
  const [dateStr, setDateStr] = useState(() =>
    toDateInputValue(initialDate ?? new Date().toISOString())
  )
  const [timeStr, setTimeStr] = useState(() =>
    toTimeInputValue(initialDate ?? new Date().toISOString())
  )
  const [noTime, setNoTime] = useState(false)
  const [scheduleDateTouched, setScheduleDateTouched] = useState(false)
  const [postedLinksDraft, setPostedLinksDraft] = useState<PostedLinks>({})
  const [videoAsset, setVideoAsset] = useState<VideoAsset | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoTouched, setVideoTouched] = useState(false)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const [youtubeTitleTouched, setYoutubeTitleTouched] = useState(false)
  const [youtubeDescription, setYoutubeDescription] = useState('')
  const [youtubeTagsText, setYoutubeTagsText] = useState('')
  const [youtubePrivacyStatus, setYoutubePrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('public')
  const [youtubeMadeForKids, setYoutubeMadeForKids] = useState(false)
  const [youtubeThumbnailAsset, setYoutubeThumbnailAsset] = useState<YouTubeThumbnailAsset | null>(null)
  const [youtubeThumbnailFile, setYoutubeThumbnailFile] = useState<File | null>(null)
  const [youtubeThumbnailPreviewUrl, setYoutubeThumbnailPreviewUrl] = useState<string | null>(null)
  const [tiktokCaption, setTiktokCaption] = useState('')
  const [tiktokPrivacyLevel, setTiktokPrivacyLevel] = useState<'followers' | 'friends' | 'private' | 'public'>('followers')
  const [instagramCaption, setInstagramCaption] = useState('')
  const [instagramLocation, setInstagramLocation] = useState('')
  const [publishTab, setPublishTab] = useState<'YouTube' | 'TikTok' | 'Instagram'>('YouTube')
  const [publishTargetTouched, setPublishTargetTouched] = useState(false)
  const [confirmIntent, setConfirmIntent] = useState<'schedule' | 'postNow' | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    onPublishingChange?.(isPublishing)
  }, [isPublishing, onPublishingChange])
  const [authorizedYouTubeChannelIds, setAuthorizedYouTubeChannelIds] = useState<string[]>([])

  function youtubeAccountPublishReady(acc: {
    platform: Platform
    postingPermissions: { canPublish: boolean }
    youtubeChannelId: string | null
  }): boolean {
    return (
      acc.platform === 'youtube' &&
      acc.postingPermissions.canPublish &&
      isYouTubeChannelUploadAuthorized(acc.youtubeChannelId, authorizedYouTubeChannelIds)
    )
  }

  const titleError = titleTouched && !title.trim()
  const youtubeTargeted =
    selectedAccountIds.some((id) => accounts.find((a) => a.id === id)?.platform === 'youtube')
  const youtubeTitleError = youtubeTargeted && youtubeTitleTouched && !youtubeTitle.trim()
  const scheduleDateError = scheduleDateTouched && mode === 'schedule' && !dateStr.trim()
  const isPublishMode = workflowMode === 'publish'
  const isVideoMode = isPublishMode
  const videoError = isVideoMode && videoTouched && videoAsset === null
  const publishTargetError =
    isPublishMode &&
    publishTargetTouched &&
    !selectedAccountIds.some((id) => {
      const acc = accounts.find((a) => a.id === id)
      return (
        !!acc &&
        acc.postingPermissions.canPublish &&
        (acc.platform !== 'youtube' || youtubeAccountPublishReady(acc)) &&
        VIDEO_ALLOWED_PLATFORM_LABELS.has(PLATFORM_META[acc.platform].label)
      )
    })

  useEffect(() => {
    if (!isPublishMode) return
    const api = window.api as { youtubeGetAuthorizedChannelIds?: () => Promise<string[]> }
    if (typeof api.youtubeGetAuthorizedChannelIds !== 'function') return
    void api.youtubeGetAuthorizedChannelIds()
      .then(setAuthorizedYouTubeChannelIds)
      .catch(() => setAuthorizedYouTubeChannelIds([]))
  }, [isPublishMode, accounts])

  useEffect(() => {
    if (!isPublishMode) return
    if (mode !== 'schedule') setMode('schedule')
    setSelectedPlatforms([])
    setVideoTouched(true)
    setNoTime(false)
  }, [isPublishMode, mode])

  useEffect(() => {
    if (!isPublishMode) return
    const publishPlatforms: Platform[] = ['youtube', 'tiktok', 'instagram']
    setSelectedAccountIds((prev) => {
      const next = new Set(prev)
      for (const platform of publishPlatforms) {
        const matches = accounts.filter(
          (a) =>
            a.platform === platform &&
            a.postingPermissions.canPublish &&
            (a.platform !== 'youtube' || youtubeAccountPublishReady(a))
        )
        if (matches.length === 1) {
          next.add(matches[0].id)
        }
      }
      return [...next]
    })
  }, [isPublishMode, accounts])

  useEffect(() => {
    // When switching to video mode, drop any non-video platforms/accounts.
    if (!isVideoMode) return
    setSelectedPlatforms((prev) => prev.filter((label) => VIDEO_ALLOWED_PLATFORM_LABELS.has(label)))
    setSelectedAccountIds((prev) =>
      prev.filter((id) => {
        const acc = accounts.find((a) => a.id === id)
        if (!acc) return false
        if (!acc.postingPermissions.canPublish) return false
        if (acc.platform === 'youtube' && !youtubeAccountPublishReady(acc)) return false
        const label = PLATFORM_META[acc.platform]?.label
        return label ? VIDEO_ALLOWED_PLATFORM_LABELS.has(label) : false
      })
    )
  }, [isVideoMode, accounts, authorizedYouTubeChannelIds])

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  useEffect(() => {
    return () => {
      if (youtubeThumbnailPreviewUrl) URL.revokeObjectURL(youtubeThumbnailPreviewUrl)
    }
  }, [youtubeThumbnailPreviewUrl])

  function togglePlatform(p: string): void {
    if (isVideoMode && !VIDEO_ALLOWED_PLATFORM_LABELS.has(p)) {
      return
    }
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleAccount(id: string): void {
    if (isVideoMode) {
      const acc = accounts.find((a) => a.id === id)
      if (acc && !acc.postingPermissions.canPublish) {
        return
      }
      if (acc?.platform === 'youtube' && !youtubeAccountPublishReady(acc)) {
        return
      }
      const label = acc ? PLATFORM_META[acc.platform]?.label : undefined
      if (!label || !VIDEO_ALLOWED_PLATFORM_LABELS.has(label)) {
        return
      }
      if (acc?.platform === 'youtube') {
        setSelectedAccountIds((prev) => {
          if (prev.includes(id)) return prev.filter((x) => x !== id)
          const withoutOtherYoutube = prev.filter((x) => {
            const other = accounts.find((a) => a.id === x)
            return other?.platform !== 'youtube'
          })
          return [...withoutOtherYoutube, id]
        })
        return
      }
    }
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function buildPublishPayload(nowOverrideIso?: string): {
    title: string
    body: string
    platforms: string[]
    accountIds: string[]
    status: Status
    scheduledAt: string | null
    postedUrl: string | null
    postedLinks: PostedLinks
    mediaType: MediaType
    videoAsset: VideoAsset | null
    platformPublishConfig: PlatformPublishConfig
  } | null {
    const effectiveMediaType: MediaType = 'video'
    setYoutubeTitleTouched(youtubeTargeted)
    setPublishTargetTouched(true)
    setVideoTouched(true)

    const publishAccountIds = selectedAccountIds.filter((id) => {
      const acc = accounts.find((a) => a.id === id)
      return !!acc && acc.postingPermissions.canPublish
    })
    const effectiveAccountIds = isPublishMode ? publishAccountIds : selectedAccountIds
    const accountDerivedPlatforms = [
      ...new Set(
        effectiveAccountIds
          .map((id) => accounts.find((a) => a.id === id)?.platform)
          .filter(Boolean)
          .map((p) => PLATFORM_META[p!].label)
      )
    ]
    const mergedPlatforms = [...new Set([...selectedPlatforms, ...accountDerivedPlatforms])]
    const allPlatforms = mergedPlatforms.filter((label) => VIDEO_ALLOWED_PLATFORM_LABELS.has(label))
    if (allPlatforms.length === 0) return null
    if (allPlatforms.includes('YouTube') && !youtubeTitle.trim()) return null
    if (videoAsset === null || videoFile === null) return null

    const text =
      [youtubeDescription.trim(), tiktokCaption.trim(), instagramCaption.trim()].find(Boolean) ?? ''

    const platformPublishConfig: PlatformPublishConfig = {
      ...(allPlatforms.includes('YouTube')
        ? {
            youtube: {
              title: youtubeTitle.trim(),
              description: youtubeDescription.trim(),
              tags: youtubeTagsText
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              privacyStatus: youtubePrivacyStatus,
              madeForKids: youtubeMadeForKids,
              thumbnailAsset: youtubeThumbnailAsset
            }
          }
        : {}),
      ...(allPlatforms.includes('TikTok')
        ? {
            tiktok: {
              caption: tiktokCaption.trim(),
              privacyLevel: tiktokPrivacyLevel
            }
          }
        : {}),
      ...(allPlatforms.includes('Instagram')
        ? {
            instagram: {
              caption: instagramCaption.trim(),
              location: instagramLocation.trim()
            }
          }
        : {})
    }

    const scheduledAt = nowOverrideIso ?? scheduledAtFromParts(dateStr, noTime ? '' : timeStr)
    if (!scheduledAt) return null

    const fallbackPublishTitle =
      youtubeTitle.trim() || tiktokCaption.trim().slice(0, 80) || instagramCaption.trim().slice(0, 80)

    return {
      title: fallbackPublishTitle.trim() || 'Untitled publish',
      body: text,
      platforms: allPlatforms,
      accountIds: publishAccountIds,
      status: 'scheduled',
      scheduledAt,
      postedUrl: null,
      postedLinks: {},
      mediaType: effectiveMediaType,
      videoAsset,
      platformPublishConfig
    }
  }

  function postNow(): void {
    if (!isPublishMode) return
    setConfirmIntent('postNow')
  }

  function runScheduleSave(): void {
    const effectiveMediaType: MediaType = isPublishMode ? 'video' : 'text'
    if (isPublishMode && youtubeTargeted) setYoutubeTitleTouched(true)
    else setTitleTouched(true)
    if (mode === 'schedule') setScheduleDateTouched(true)
    if (effectiveMediaType === 'video') setVideoTouched(true)
    if (isPublishMode) setPublishTargetTouched(true)
    const fallbackPublishTitle =
      youtubeTitle.trim() || tiktokCaption.trim().slice(0, 80) || instagramCaption.trim().slice(0, 80)
    const trimmedTitle = (isPublishMode ? fallbackPublishTitle : title).trim()
    if (!trimmedTitle && !isPublishMode) return
    if (effectiveMediaType === 'video' && videoAsset === null) return

    // Derive platforms from selected account IDs
    const publishAccountIds = selectedAccountIds.filter((id) => {
      const acc = accounts.find((a) => a.id === id)
      return !!acc && acc.postingPermissions.canPublish
    })
    const effectiveAccountIds = isPublishMode ? publishAccountIds : selectedAccountIds
    const accountDerivedPlatforms = [
      ...new Set(
        effectiveAccountIds
          .map((id) => accounts.find((a) => a.id === id)?.platform)
          .filter(Boolean)
          .map((p) => PLATFORM_META[p!].label)
      )
    ]
    const mergedPlatforms = [...new Set([...selectedPlatforms, ...accountDerivedPlatforms])]
    const allPlatforms =
      effectiveMediaType === 'video'
        ? mergedPlatforms.filter((label) => VIDEO_ALLOWED_PLATFORM_LABELS.has(label))
        : mergedPlatforms
    if (isPublishMode && allPlatforms.length === 0) return
    if (isPublishMode && allPlatforms.includes('YouTube') && !youtubeTitle.trim()) return

    const text = isPublishMode
      ? [youtubeDescription.trim(), tiktokCaption.trim(), instagramCaption.trim()].find(Boolean) ?? ''
      : body.trim()
    const platformPublishConfig: PlatformPublishConfig = isPublishMode
      ? {
          ...(allPlatforms.includes('YouTube')
            ? {
                youtube: {
                  title: youtubeTitle.trim(),
                  description: youtubeDescription.trim(),
                  tags: youtubeTagsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  privacyStatus: youtubePrivacyStatus,
                  madeForKids: youtubeMadeForKids,
                  thumbnailAsset: youtubeThumbnailAsset
                }
              }
            : {}),
          ...(allPlatforms.includes('TikTok')
            ? {
                tiktok: {
                  caption: tiktokCaption.trim(),
                  privacyLevel: tiktokPrivacyLevel
                }
              }
            : {}),
          ...(allPlatforms.includes('Instagram')
            ? {
                instagram: {
                  caption: instagramCaption.trim(),
                  location: instagramLocation.trim()
                }
              }
            : {})
        }
      : {}
    const effectiveStatus: Status = isPublishMode ? 'scheduled' : (mode === 'schedule' ? 'scheduled' : mode)
    if (effectiveStatus === 'draft') {
      onCreate({
        title: trimmedTitle || 'Untitled publish',
        body: text,
        platforms: allPlatforms,
        accountIds: effectiveAccountIds,
        status: 'draft',
        scheduledAt: null,
        postedUrl: null,
        postedLinks: {},
        mediaType: effectiveMediaType,
        videoAsset,
        platformPublishConfig
      })
      return
    }
    if (effectiveStatus === 'posted') {
      if (!dateStr.trim()) return
      const at = scheduledAtFromParts(dateStr, noTime ? '' : timeStr)
      if (!at) return
      const links: PostedLinks = {}
      for (const platform of allPlatforms) {
        const v = postedLinksDraft[platform]?.trim()
        if (v) links[platform] = v
      }
      const first = allPlatforms.map((p) => links[p]).find((x) => !!x) ?? null
      onCreate({
        title: trimmedTitle || 'Untitled publish',
        body: text,
        platforms: allPlatforms,
        accountIds: effectiveAccountIds,
        status: 'posted',
        scheduledAt: at,
        postedUrl: first,
        postedLinks: links,
        mediaType: effectiveMediaType,
        videoAsset,
        platformPublishConfig
      })
      return
    }
    const at = scheduledAtFromParts(dateStr, noTime ? '' : timeStr)
    if (!at) return
    onCreate({
      title: trimmedTitle || 'Untitled publish',
      body: text,
      platforms: allPlatforms,
      accountIds: effectiveAccountIds,
      status: 'scheduled',
      scheduledAt: at,
      postedUrl: null,
      postedLinks: {},
      mediaType: effectiveMediaType,
      videoAsset,
      platformPublishConfig
    })
  }

  function save(): void {
    if (isPublishMode) {
      setConfirmIntent('schedule')
      return
    }
    runScheduleSave()
  }

  async function publishToYouTubeIfNeeded(
    payload: CreatePostPayload,
    postNowIntent: boolean
  ): Promise<{
    payload: CreatePostPayload
    youtube?: PublishSuccessInfo
  }> {
    if (!isPublishMode) return { payload }
    if (!payload.platforms.includes('YouTube')) return { payload }
    const yt = payload.platformPublishConfig.youtube
    if (!yt || !videoFile) return { payload }
    const selectedYouTubeAccounts = accounts.filter(
      (a) =>
        a.platform === 'youtube' &&
        payload.accountIds.includes(a.id) &&
        !!a.youtubeChannelId
    )
    if (selectedYouTubeAccounts.length === 0) {
      throw new Error('Select a connected YouTube account in Settings before publishing.')
    }
    if (selectedYouTubeAccounts.length > 1) {
      throw new Error('Select only one YouTube account per publish. Uncheck the others under Publish to YouTube.')
    }
    const selectedYouTubeAccount = selectedYouTubeAccounts[0]

    const result = await window.api.youtubePublish({
      title: yt.title,
      description: yt.description,
      tags: yt.tags,
      privacyStatus: yt.privacyStatus,
      madeForKids: yt.madeForKids,
      publishAt: postNowIntent ? null : payload.scheduledAt,
      channelId: selectedYouTubeAccount.youtubeChannelId,
      videoBuffer: await videoFile.arrayBuffer(),
      videoMimeType: videoFile.type || 'video/*',
      ...(youtubeThumbnailFile
        ? {
            thumbnailBuffer: await youtubeThumbnailFile.arrayBuffer(),
            thumbnailMimeType: youtubeThumbnailFile.type || 'image/*'
          }
        : {})
    })

    const thumbNote = result.thumbnailWarning ? ` ${result.thumbnailWarning}` : ''
    if (!postNowIntent) {
      await window.api.notify(
        result.thumbnailWarning ? 'YouTube scheduled (no thumbnail)' : 'YouTube upload queued',
        `Uploaded to ${result.channelTitle}.${thumbNote}`
      )
      return { payload }
    }
    await window.api.notify(
      result.thumbnailWarning ? 'YouTube posted (no thumbnail)' : 'YouTube posted',
      `Uploaded to ${result.channelTitle}. ${result.watchUrl}${thumbNote}`
    )
    const youtubeInfo: PublishSuccessInfo = {
      watchUrl: result.watchUrl,
      channelTitle: result.channelTitle,
      thumbnailWarning: result.thumbnailWarning ?? undefined
    }
    return {
      payload: {
        ...payload,
        status: 'posted',
        postedUrl: result.watchUrl,
        postedLinks: { ...payload.postedLinks, YouTube: result.watchUrl },
        youtubeVideoId: result.videoId,
        scheduledAt: result.publishAt ?? new Date().toISOString()
      },
      youtube: youtubeInfo
    }
  }

  async function confirmAction(): Promise<void> {
    if (confirmIntent === 'postNow') {
      const payload = buildPublishPayload(new Date().toISOString())
      setConfirmIntent(null)
      if (!payload) return
      setIsPublishing(true)
      try {
        const previewThumbnailDataUrl = await buildLocalPreviewDataUrl(videoFile, youtubeThumbnailFile)
        const { payload: finalPayload, youtube } = await publishToYouTubeIfNeeded(
          { ...payload, previewThumbnailDataUrl },
          true
        )
        const post = onCreate(finalPayload)
        if (youtube && finalPayload.status === 'posted') {
          onPostPublished?.(post, youtube)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown YouTube publishing error'
        await window.api.notify('YouTube publish failed', msg)
      } finally {
        setIsPublishing(false)
      }
      return
    }
    if (confirmIntent === 'schedule') {
      if (isPublishMode) {
        const payload = buildPublishPayload()
        setConfirmIntent(null)
        if (!payload) return
        setIsPublishing(true)
        try {
          const previewThumbnailDataUrl = await buildLocalPreviewDataUrl(videoFile, youtubeThumbnailFile)
          const { payload: finalPayload } = await publishToYouTubeIfNeeded(
            { ...payload, previewThumbnailDataUrl },
            false
          )
          onCreate(finalPayload)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown YouTube scheduling error'
          await window.api.notify('YouTube schedule failed', msg)
        } finally {
          setIsPublishing(false)
        }
      } else {
        runScheduleSave()
        setConfirmIntent(null)
      }
    }
  }

  return (
    <div className={`${plain ? '' : 'card '}${'composer post-create-form'}`}>
      {showTitle && (
        <h2 className="filter-panel-title" style={{ margin: '0 0 10px' }}>
          Create new
        </h2>
      )}

      <div className="pcf-top-menu-group">
        <span className="label">Workflow</span>
        <div className="pcf-tabs" role="tablist" aria-label="Post workflow">
          <button
            type="button"
            role="tab"
            className={`pcf-tab${workflowMode === 'plan' ? ' pcf-tab--active' : ''}`}
            onClick={() => setWorkflowMode('plan')}
          >
            Plan
          </button>
          <button
            type="button"
            role="tab"
            className={`pcf-tab${workflowMode === 'publish' ? ' pcf-tab--active' : ''}`}
            onClick={() => setWorkflowMode('publish')}
          >
            Publish
          </button>
        </div>
      </div>

      {workflowMode === 'plan' && (
        <div className="pcf-top-menu-group">
          <span className="label">Tracking type</span>
          <div className="pcf-tabs" role="tablist" aria-label="Tracking type">
            <button
              type="button"
              role="tab"
              className={`pcf-tab${mode === 'schedule' ? ' pcf-tab--active' : ''}`}
              onClick={() => setMode('schedule')}
            >
              Schedule
            </button>
            <button
              type="button"
              role="tab"
              className={`pcf-tab${mode === 'draft' ? ' pcf-tab--active' : ''}`}
              onClick={() => setMode('draft')}
            >
              Draft
            </button>
            <button
              type="button"
              role="tab"
              className={`pcf-tab${mode === 'posted' ? ' pcf-tab--active' : ''}`}
              onClick={() => setMode('posted')}
            >
              Already posted
            </button>
          </div>
        </div>
      )}
      {mode === 'posted' && (
        <p className="pcf-hint muted small" style={{ margin: '-4px 0 12px' }}>
          Log something you have already published — add a link if you have one.
        </p>
      )}

      {!isPublishMode ? (
        <>
          <label>
            <span className="label">
              Title <span className="pcf-required" aria-hidden="true">*</span>
            </span>
            <input
              type="text"
              placeholder="e.g. TikTok caption ideas"
              value={title}
              className={titleError ? 'input-error' : ''}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
              onBlur={() => setTitleTouched(true)}
            />
            {titleError && <span className="pcf-error-msg">Title is required</span>}
          </label>

          <label className="pcf-body-field">
            <span className="label">Body / notes</span>
            <textarea
              placeholder="Post text…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
        </>
      ) : (
        <div className="pcf-publish-panel">
          <div className="pcf-top-menu-group">
            <span className="label">Select supported platform</span>
            <div className="pcf-tabs" role="tablist" aria-label="Publish platform">
              {(['YouTube', 'TikTok', 'Instagram'] as const).map((platformLabel) => (
                <button
                  key={platformLabel}
                  type="button"
                  role="tab"
                  className={`pcf-tab${publishTab === platformLabel ? ' pcf-tab--active' : ''}`}
                  onClick={() => setPublishTab(platformLabel)}
                >
                  {platformLabel}
                </button>
              ))}
            </div>
          </div>
          <PublishPlatformTargetPicker
            label={publishTab}
            accounts={accounts}
            selectedAccountIds={selectedAccountIds}
            authorizedYouTubeChannelIds={authorizedYouTubeChannelIds}
            onToggleAccount={toggleAccount}
          />
          {publishTargetError && (
            <span className="pcf-error-msg">Select at least one publish account</span>
          )}
          <div className="pcf-publish-fields" key={publishTab}>
            {publishTab === 'YouTube' && (
              <>
              <label>
                <span className="label">
                  YouTube title <span className="pcf-required" aria-hidden="true">*</span>
                </span>
                <input
                  type="text"
                  placeholder="Title shown on YouTube"
                  value={youtubeTitle}
                  className={youtubeTitleError ? 'input-error' : ''}
                  onChange={(e) => {
                    setYoutubeTitle(e.target.value)
                    setYoutubeTitleTouched(true)
                  }}
                  onBlur={() => setYoutubeTitleTouched(true)}
                />
                {youtubeTitleError && <span className="pcf-error-msg">YouTube title is required</span>}
              </label>
              <label className="pcf-body-field">
                <span className="label">YouTube description</span>
                <textarea
                  placeholder="Description shown on YouTube"
                  value={youtubeDescription}
                  onChange={(e) => setYoutubeDescription(e.target.value)}
                />
              </label>
              <label>
                <span className="label">YouTube tags (optional)</span>
                <input
                  type="text"
                  placeholder="e.g. productivity, study, vlog"
                  value={youtubeTagsText}
                  onChange={(e) => setYoutubeTagsText(e.target.value)}
                />
              </label>
              <div className="pcf-publish-option-group">
                <label>
                  <span className="label">YouTube privacy</span>
                  <select
                    value={youtubePrivacyStatus}
                    onChange={(e) => setYoutubePrivacyStatus(e.target.value as 'private' | 'unlisted' | 'public')}
                  >
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                  </select>
                </label>
                <label className="pcf-checkbox-item">
                  <input
                    type="checkbox"
                    checked={youtubeMadeForKids}
                    onChange={(e) => setYoutubeMadeForKids(e.target.checked)}
                  />
                  Made for kids
                </label>
              </div>
                <label className="pcf-thumbnail-field">
                  <span className="label">YouTube thumbnail (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      if (youtubeThumbnailPreviewUrl) {
                        URL.revokeObjectURL(youtubeThumbnailPreviewUrl)
                        setYoutubeThumbnailPreviewUrl(null)
                      }
                      if (!f) {
                        setYoutubeThumbnailAsset(null)
                        setYoutubeThumbnailFile(null)
                        return
                      }
                      const url = URL.createObjectURL(f)
                      setYoutubeThumbnailPreviewUrl(url)
                      setYoutubeThumbnailFile(f)
                      setYoutubeThumbnailAsset({
                        name: f.name,
                        size: f.size,
                        type: f.type,
                        lastModified: f.lastModified
                      })
                    }}
                  />
                  {youtubeThumbnailPreviewUrl && (
                    <div className="pcf-thumbnail-preview-wrap">
                      <img
                        className="pcf-thumbnail-preview"
                        src={youtubeThumbnailPreviewUrl}
                        alt="YouTube thumbnail preview"
                      />
                    </div>
                  )}
                </label>
              </>
            )}
            {publishTab === 'TikTok' && (
              <>
              <label className="pcf-body-field">
                <span className="label">TikTok caption</span>
                <textarea
                  placeholder="Caption shown on TikTok"
                  value={tiktokCaption}
                  onChange={(e) => setTiktokCaption(e.target.value)}
                />
              </label>
              <label>
                <span className="label">TikTok privacy</span>
                <select
                  value={tiktokPrivacyLevel}
                  onChange={(e) =>
                    setTiktokPrivacyLevel(e.target.value as 'followers' | 'friends' | 'private' | 'public')
                  }
                >
                  <option value="followers">Followers</option>
                  <option value="friends">Friends</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </label>
              </>
            )}
            {publishTab === 'Instagram' && (
              <>
              <label className="pcf-body-field">
                <span className="label">Instagram caption</span>
                <textarea
                  placeholder="Caption shown on Instagram"
                  value={instagramCaption}
                  onChange={(e) => setInstagramCaption(e.target.value)}
                />
              </label>
              <label>
                <span className="label">Instagram location (optional)</span>
                <input
                  type="text"
                  placeholder="Add location tag"
                  value={instagramLocation}
                  onChange={(e) => setInstagramLocation(e.target.value)}
                />
              </label>
              </>
            )}
          </div>

          <label className="pcf-video-field">
            <span className="label">
              Video file to publish <span className="pcf-required" aria-hidden="true">*</span>
            </span>
            <input
              type="file"
              accept="video/*"
              className={videoError ? 'input-error' : ''}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setVideoTouched(true)
                if (!f) {
                  setVideoAsset(null)
                setVideoFile(null)
                  if (videoPreviewUrl) {
                    URL.revokeObjectURL(videoPreviewUrl)
                    setVideoPreviewUrl(null)
                  }
                  return
                }
                if (videoPreviewUrl) {
                  URL.revokeObjectURL(videoPreviewUrl)
                }
                const url = URL.createObjectURL(f)
                setVideoPreviewUrl(url)
              setVideoFile(f)
                setVideoAsset({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  lastModified: f.lastModified
                })
              }}
            />
            {videoAsset && (
              <>
                <span className="muted small pcf-video-meta">
                  {videoAsset.name} · {(videoAsset.size / (1024 * 1024)).toFixed(1)} MB
                </span>
                {videoPreviewUrl && (
                  <div className="pcf-video-preview-wrap">
                    <video
                      className="pcf-video-preview"
                      src={videoPreviewUrl}
                      controls
                      muted
                    />
                  </div>
                )}
              </>
            )}
            {videoError && <span className="pcf-error-msg">Please select a video file</span>}
          </label>

          <div className="pcf-when-block">
            <span className="label">When</span>
            <ScheduleDateTimeFields
              idPrefix="pcf"
              dateValue={dateStr}
              timeValue={timeStr}
              onDateChange={setDateStr}
              onTimeChange={setTimeStr}
              noTime={noTime}
              onNoTimeChange={(v) => {
                setNoTime(v)
                if (v) setTimeStr('')
              }}
              showNoTime={false}
              showDateError={scheduleDateError}
            />
          </div>
        </div>
      )}

      {!isPublishMode && (mode === 'schedule' || mode === 'posted') && (
        <div className="pcf-when-block">
          <span className="label">When</span>
          <ScheduleDateTimeFields
            idPrefix="pcf"
            dateValue={dateStr}
            timeValue={timeStr}
            onDateChange={setDateStr}
            onTimeChange={setTimeStr}
            noTime={noTime}
            onNoTimeChange={(v) => {
              setNoTime(v)
              if (v) setTimeStr('')
            }}
            showDateError={scheduleDateError || (mode === 'posted' && titleTouched && !dateStr.trim())}
          />
        </div>
      )}

      {mode === 'posted' && (
        <div className="platform-picker-stack" style={{ marginTop: 4 }}>
          <span className="label">Live links by platform (optional)</span>
          {[...new Set([
            ...selectedPlatforms,
            ...selectedAccountIds
              .map((id) => {
                const acc = accounts.find((a) => a.id === id)
                if (!acc?.postingPermissions.canPublish) return undefined
                return acc.platform
              })
              .filter(Boolean)
              .map((p) => PLATFORM_META[p!].label)
          ])].map((platformLabel) => (
            <label key={platformLabel}>
              <span className="label">{platformLabel}</span>
              <input
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={postedLinksDraft[platformLabel] ?? ''}
                onChange={(e) =>
                  setPostedLinksDraft((prev) => ({ ...prev, [platformLabel]: e.target.value }))
                }
                autoComplete="off"
              />
            </label>
          ))}
        </div>
      )}

      {/* Platform / account picker — one row per platform */}
      {!isPublishMode && <div className="platform-picker-stack">
        <span className="label">
          Platforms
          <span className="platform-picker-hint muted">
            — toggle active platforms in Settings
          </span>
        </span>
        {(isPublishMode
          ? formPlatformLabels.filter((label) => VIDEO_ALLOWED_PLATFORM_LABELS.has(label))
          : formPlatformLabels
        ).map((p) => {
          const platformKey = ACCOUNT_PLATFORM_LABELS[p]
          const grpAccounts = platformKey ? accounts.filter((a) => a.platform === platformKey) : []
          return (
            <div key={p} className="platform-picker-row">
              <span className="platform-picker-row-label">
                {platformKey && <PlatformLogoImg platform={platformKey} size={20} />}
                <span className="platform-picker-row-name">{p}</span>
              </span>
              {grpAccounts.length > 0 ? (
                <div className="platform-picker-row-accounts">
                  {grpAccounts.map((acc) => (
                    <label key={acc.id} className="chip chip--account">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(acc.id)}
                        onChange={() => toggleAccount(acc.id)}
                        aria-label={`${p}: ${acc.name}`}
                      />
                      {acc.name}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="platform-picker-row-accounts">
                  <label className="chip chip--platform-solo">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                      aria-label={`Include ${p}`}
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>}

      <div className="row actions pcf-actions-row">
        <div className="pcf-actions-main">
          <button type="button" className="primary" onClick={save}>
            {isPublishMode ? 'Schedule' : 'Save'}
          </button>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
        {isPublishMode && (
          <div className="pcf-actions-secondary">
            <button type="button" className="ghost pcf-post-now-btn" onClick={postNow}>
              Post now
            </button>
          </div>
        )}
      </div>
      {isPublishing && (
        <div className="post-create-publishing" role="status" aria-live="polite">
          <div className="post-create-publishing-spinner" aria-hidden />
          <p className="post-create-publishing-title">Uploading to YouTube…</p>
          <p className="muted small">Keep this window open until the upload finishes.</p>
        </div>
      )}
      {confirmIntent && !isPublishing && (
        <ConfirmDialog
          title={confirmIntent === 'postNow' ? 'Post now?' : 'Schedule post?'}
          message={
            confirmIntent === 'postNow'
              ? 'This will queue the post immediately using your current publish settings.'
              : 'This will save the post with the selected schedule time and publish settings.'
          }
          confirmLabel={confirmIntent === 'postNow' ? 'Post now' : 'Schedule'}
          onConfirm={confirmAction}
          onCancel={() => setConfirmIntent(null)}
        />
      )}
    </div>
  )
}

function PublishPlatformTargetPicker({
  label,
  accounts,
  selectedAccountIds,
  authorizedYouTubeChannelIds,
  onToggleAccount
}: {
  label: 'YouTube' | 'TikTok' | 'Instagram'
  accounts: {
    id: string
    name: string
    platform: Platform
    postingPermissions: { canPublish: boolean }
    youtubeChannelId: string | null
  }[]
  selectedAccountIds: string[]
  authorizedYouTubeChannelIds: string[]
  onToggleAccount: (id: string) => void
}): React.ReactElement {
  const platformKey = ACCOUNT_PLATFORM_LABELS[label]
  const platformAccounts = accounts.filter(
    (a) =>
      a.platform === platformKey &&
      a.postingPermissions.canPublish &&
      (a.platform !== 'youtube' ||
        isYouTubeChannelUploadAuthorized(a.youtubeChannelId, authorizedYouTubeChannelIds))
  )
  return (
    <div className="platform-picker-stack pcf-publish-target-picker">
      <span className="label">
        Publish to {label}
        {label === 'YouTube' ? ' (one channel per post)' : ''}
      </span>
      {platformAccounts.length > 0 && (
        <div className="platform-picker-row-accounts">
          {platformAccounts.map((acc) => (
            <label key={acc.id} className="chip chip--account">
              <input
                type="checkbox"
                checked={selectedAccountIds.includes(acc.id)}
                onChange={() => onToggleAccount(acc.id)}
                aria-label={`${label}: ${acc.name}`}
              />
              {acc.name}
            </label>
          ))}
        </div>
      )}
      {platformAccounts.length === 0 && (
        <p className="muted small">
          {label === 'YouTube'
            ? 'No YouTube channels ready. In Settings, use “Sign in to this channel” on the account you want.'
            : `No connected ${label} accounts yet.`}
        </p>
      )}
    </div>
  )
}
