// ⭐ Ensure this is a client-side component
'use client'

import type { OdFileObject } from '../../types'
import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { useAsync } from 'react-async-hook'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../../utils/getBaseUrl'
import { getExtension } from '../../utils/getFileIcon'
import { getStoredToken } from '../../utils/protectedRouteHandler'

import { DownloadButton } from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import CustomEmbedLinkMenu from '../CustomEmbedLinkMenu'

// ✅ Dynamic import of Plyr with SSR disabled
const Plyr = dynamic(() => import('plyr-react'), { ssr: false })

const VideoPlayer: FC<{
  videoName: string
  videoUrl: string
  width?: number
  height?: number
  thumbnail: string
  subtitle: string
  isFlv: boolean
  mpegts: any
}> = ({ videoName, videoUrl, width, height, thumbnail, subtitle, isFlv, mpegts }) => {
  useEffect(() => {
    // Load Plyr CSS in client-side only
    import('plyr-react/plyr.css')

    // Subtitle loading
    axios.get(subtitle, { responseType: 'blob' })
      .then(resp => {
        const track = document.querySelector('track')
        track?.setAttribute('src', URL.createObjectURL(resp.data))
      })
      .catch(() => console.log('Could not load subtitle.'))

    // FLV support
    if (isFlv) {
      const loadFlv = () => {
        const video = document.getElementById('plyr') as HTMLVideoElement
        const flv = mpegts.createPlayer({ url: videoUrl, type: 'flv' })
        flv.attachMediaElement(video)
        flv.load()
      }
      loadFlv()
    }
  }, [videoUrl, isFlv, mpegts, subtitle])

  const source = {
    type: 'video',
    title: videoName,
    poster: thumbnail,
    tracks: [{ kind: 'captions', label: videoName, src: '', default: true }],
    ...(isFlv ? {} : { sources: [{ src: videoUrl }] }),
  }

  const options: Plyr.Options = {
    ratio: `${width ?? 16}:${height ?? 9}`,
    fullscreen: { iosNative: true },
  }

  return <Plyr id="plyr" source={source as Plyr.SourceInfo} options={options} />
}

const VideoPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const token = getStoredToken(asPath)
  const clipboard = useClipboard()
  const [menuOpen, setMenuOpen] = useState(false)

  const thumbnail = `/api/thumbnail?path=${asPath}&size=large${token ? `&odpt=${token}` : ''}`
  const vtt = `${asPath.substring(0, asPath.lastIndexOf('.'))}.vtt`
  const subtitle = `/api/raw?path=${vtt}${token ? `&odpt=${token}` : ''}`
  const videoUrl = `/api/raw?path=${asPath}${token ? `&odpt=${token}` : ''}`

  const isFlv = getExtension(file.name) === 'flv'
  const { loading, error, result: mpegts } = useAsync(async () => {
    if (isFlv) {
      return (await import('mpegts.js')).default
    }
  }, [isFlv])

  return (
    <>
      <CustomEmbedLinkMenu path={asPath} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PreviewContainer>
        {error ? (
          <FourOhFour errorMsg={error.message} />
        ) : loading && isFlv ? (
          <Loading loadingText="Loading FLV extension..." />
        ) : (
          <VideoPlayer
            videoName={file.name}
            videoUrl={videoUrl}
            width={file.video?.width}
            height={file.video?.height}
            thumbnail={thumbnail}
            subtitle={subtitle}
            isFlv={isFlv}
            mpegts={mpegts}
          />
        )}
      </PreviewContainer>

      <DownloadBtnContainer>
        <div className="flex flex-wrap justify-center gap-2">
          <DownloadButton onClickCallback={() => window.open(videoUrl)} btnColor="blue" btnText="Download" btnIcon="file-download" />
          <DownloadButton
            onClickCallback={() => {
              clipboard.copy(`${getBaseUrl()}/api/raw?path=${asPath}${token ? `&odpt=${token}` : ''}`)
              toast.success('Copied direct link to clipboard.')
            }}
            btnColor="pink"
            btnText="Copy direct link"
            btnIcon="copy"
          />
          <DownloadButton onClickCallback={() => setMenuOpen(true)} btnColor="teal" btnText="Customise link" btnIcon="pen" />
          {/* Additional download options omitted for brevity */}
        </div>
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview
