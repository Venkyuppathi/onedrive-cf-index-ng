'use client'

import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { OdFileObject } from '../../types'

import { useRouter } from 'next/router'
import ReactAudioPlayer from 'react-audio-player'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import { LoadingIcon } from '../Loading'
import { formatModifiedDateTime } from '../../utils/fileDetails'
import { getStoredToken } from '../../utils/protectedRouteHandler'

enum PlayerState {
  Loading,
  Ready,
  Playing,
  Paused,
}

interface AudioPreviewProps {
  file: OdFileObject
}

const AudioPreview: FC<AudioPreviewProps> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const audioSrc = `/api/raw?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const thumbnail = `/api/thumbnail?path=${asPath}&size=medium${hashedToken ? `&odpt=${hashedToken}` : ''}`

  const rapRef = useRef<ReactAudioPlayer>(null)
  const [playerStatus, setPlayerStatus] = useState(PlayerState.Loading)
  const [playerVolume, setPlayerVolume] = useState(1)
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  useEffect(() => {
    const audio = rapRef.current?.audioEl.current
    if (!audio) return

    audio.oncanplay = () => setPlayerStatus(PlayerState.Ready)
    audio.onended = () => setPlayerStatus(PlayerState.Paused)
    audio.onpause = () => setPlayerStatus(PlayerState.Paused)
    audio.onplay = () => setPlayerStatus(PlayerState.Playing)
    audio.onplaying = () => setPlayerStatus(PlayerState.Playing)
    audio.onseeking = () => setPlayerStatus(PlayerState.Loading)
    audio.onwaiting = () => setPlayerStatus(PlayerState.Loading)
    audio.onerror = () => setPlayerStatus(PlayerState.Paused)
    audio.onvolumechange = () => setPlayerVolume(audio.volume)
  }, [])

  return (
    <>
      <PreviewContainer>
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
          <div className="relative flex aspect-square w-full items-center justify-center rounded bg-gray-100 transition-all duration-75 dark:bg-gray-700 md:w-48">
            <div
              className={`absolute z-20 flex h-full w-full items-center justify-center transition-all duration-300 ${
                playerStatus === PlayerState.Loading ? 'bg-white opacity-80 dark:bg-gray-800' : 'bg-transparent opacity-0'
              }`}
            >
              <LoadingIcon className="z-10 inline-block h-5 w-5 animate-spin" />
            </div>

            {!brokenThumbnail ? (
              <div className="absolute m-4 aspect-square rounded-full shadow-lg">
                <img
                  className={`h-full w-full rounded-full object-cover object-top ${
                    playerStatus === PlayerState.Playing ? 'animate-spin-slow' : ''
                  }`}
                  src={thumbnail}
                  alt={file.name}
                  onError={() => setBrokenThumbnail(true)}
                />
              </div>
            ) : (
              <FontAwesomeIcon
                className={`z-10 h-5 w-5 ${playerStatus === PlayerState.Playing ? 'animate-spin' : ''}`}
                icon="music"
                size="2x"
              />
            )}
          </div>

          <div className="flex w-full flex-col justify-between">
            <div>
              <div className="mb-2 font-medium">{file.name}</div>
              <div className="mb-4 text-sm text-gray-500">
                {'Last modified: ' + formatModifiedDateTime(file.lastModifiedDateTime)}
              </div>
            </div>

            <ReactAudioPlayer
              className="h-11 w-full"
              src={audioSrc}
              ref={rapRef}
              controls
              preload="auto"
              volume={playerVolume}
            />
          </div>
        </div>
      </PreviewContainer>

      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default AudioPreview
