'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Plyr for client-side only
const Plyr = dynamic(() => import('plyr-react'), { ssr: false })

interface VideoPreviewProps {
  videoUrl: string
  subtitlesUrl?: string
}

export default function VideoPreview({ videoUrl, subtitlesUrl }: VideoPreviewProps) {
  const [subtitles, setSubtitles] = useState<string | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const playerRef = useRef<any>(null)

  useEffect(() => {
    // Import CSS only in the browser
    import('plyr-react/plyr.css')

    // Load subtitles if available
    if (subtitlesUrl) {
      fetch(subtitlesUrl)
        .then((res) => res.text())
        .then((text) => setSubtitles(text))
        .catch((err) => console.error('Failed to load subtitles:', err))
    }

    // Show the player after component mounts to avoid SSR issues
    setShowPlayer(true)
  }, [subtitlesUrl])

  if (!showPlayer) return null

  return (
    <div className="video-preview">
      <Plyr
        ref={playerRef}
        source={{
          type: 'video',
          sources: [{ src: videoUrl, type: 'video/mp4' }],
          tracks: subtitles
            ? [
                {
                  kind: 'subtitles',
                  label: 'English',
                  srcLang: 'en',
                  src: subtitlesUrl!,
                  default: true,
                },
              ]
            : [],
        }}
        options={{
          captions: { active: true, language: 'en', update: true },
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'fullscreen',
          ],
        }}
      />
    </div>
  )
}
