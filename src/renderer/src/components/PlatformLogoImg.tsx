import type { Platform } from '../accounts/types'
import instagram from '../assets/platforms/instagram.png'
import linkedin from '../assets/platforms/linkedin.png'
import tiktok from '../assets/platforms/tiktok.png'
import threads from '../assets/platforms/threads.png'
import xPng from '../assets/platforms/x.png'
import youtube from '../assets/platforms/youtube.png'

const BY_PLATFORM: Record<Platform, string> = {
  instagram,
  threads,
  tiktok,
  youtube,
  linkedin,
  x: xPng
}

export default function PlatformLogoImg({
  platform,
  size = 20,
  className
}: {
  platform: Platform
  size?: number
  className?: string
}): React.ReactElement {
  const base = 'platform-logo-img' + (platform === 'x' ? ' platform-logo-img--x' : '')
  return (
    <img
      src={BY_PLATFORM[platform]}
      alt=""
      width={size}
      height={size}
      className={className ? `${base} ${className}` : base}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
