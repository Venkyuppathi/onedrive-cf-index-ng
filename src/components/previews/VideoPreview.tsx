// app/components/VideoPreview.tsx
'use client'

import dynamic from 'next/dynamic'
import 'plyr-react/plyr.css'

const Plyr = dynamic(() => import('plyr-react'), { ssr: false })

interface VideoPreviewProps {
  videoUrl: string
  poster?: string
}

export default function VideoPreview({ videoUrl, poster }: VideoPreviewProps) {
  const source = {
    type: 'video',
    title: 'Video',
    sources: [
      {
        src: videoUrl,
        type: 'video/mp4',
      },
    ],
    poster,
  }

  return <Plyr source={source} />
}
