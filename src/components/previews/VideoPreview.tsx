'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { FC } from 'react'
import type { OdFileObject } from '../../types'

// Dynamically import plyr-react (no SSR)
const Plyr = dynamic(() => import('plyr-react'), { ssr: false })

interface VideoPreviewProps {
  file: OdFileObject
}

const VideoPreview: FC<VideoPreviewProps> = ({ file }) => {
  const videoUrl = `/api/raw?path=${encodeURIComponent(file.name)}`

  const plyrProps = {
    source: {
      type: 'video',
      title: file.name,
      sources: [
        {
          src: videoUrl,
          type: file?.mimeType || 'video/mp4',
          provider: 'html5',
        },
      ],
    },
    options: {
      controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
    },
  }

  return (
    <div className="video-wrapper px-2 py-4">
      <Plyr {...plyrProps} />
    </div>
  )
}

export default VideoPreview
