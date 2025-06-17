// components/VideoPreview.tsx

'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import 'plyr-react/plyr.css';

const Plyr = dynamic(() => import('plyr-react'), { ssr: false });

interface VideoPreviewProps {
  videoUrl: string;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl }) => {
  const plyrProps = {
    source: {
      type: 'video',
      sources: [
        {
          src: videoUrl,
          provider: 'html5',
        },
      ],
    },
    options: {
      controls: ['play', 'progress', 'volume', 'fullscreen'],
    },
  };

  return (
    <div className="video-wrapper">
      <Plyr {...plyrProps} />
    </div>
  );
};

export default VideoPreview;
