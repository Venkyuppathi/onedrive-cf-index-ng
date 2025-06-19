'use client'

import type { FC } from 'react'
import type { OdFileObject } from '../../types'
import { useRouter } from 'next/router'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { getStoredToken } from '../../utils/protectedRouteHandler'

export interface VideoPreviewProps {
  file: OdFileObject
}

const VideoPreview: FC<VideoPreviewProps> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const videoUrl = `/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`

  return (
    <>
      <PreviewContainer>
        <div className="w-full">
          <div className="mb-2 font-medium">{file.name}</div>
          <div className="mb-4 text-sm text-gray-500">
            Last modified: {formatModifiedDateTime(file.lastModifiedDateTime)}
          </div>

          <video
            controls
            className="w-full rounded"
            preload="metadata"
            poster={`/api/thumbnail?path=${asPath}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`}
          >
            <source src={videoUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      </PreviewContainer>

      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview
