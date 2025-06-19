import type { OdFileObject, OdFolderChildren, OdFolderObject } from '../types'
import { ParsedUrlQuery } from 'querystring'
import { FC, MouseEventHandler, SetStateAction, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import toast, { Toaster } from 'react-hot-toast'
import emojiRegex from 'emoji-regex'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

import useLocalStorage from '../utils/useLocalStorage'
import { getPreviewType, preview } from '../utils/getPreviewType'
import { useProtectedSWRInfinite } from '../utils/fetchWithSWR'
import { getExtension, getRawExtension, getFileIcon } from '../utils/getFileIcon'
import { getStoredToken } from '../utils/protectedRouteHandler'
import {
  DownloadingToast,
  downloadMultipleFiles,
  downloadTreelikeMultipleFiles,
  traverseFolder,
} from './MultiFileDownloader'

import { layouts } from './SwitchLayout'
import Loading, { LoadingIcon } from './Loading'
import FourOhFour from './FourOhFour'
import Auth from './Auth'
import TextPreview from './previews/TextPreview'
import MarkdownPreview from './previews/MarkdownPreview'
import CodePreview from './previews/CodePreview'
import OfficePreview from './previews/OfficePreview'
import AudioPreview from './previews/AudioPreview'
import VideoPreview from './previews/VideoPreview'
import PDFPreview from './previews/PDFPreview'
import URLPreview from './previews/URLPreview'
import ImagePreview from './previews/ImagePreview'
import DefaultPreview from './previews/DefaultPreview'
import { PreviewContainer } from './previews/Containers'

import FolderListLayout from './FolderListLayout'
import FolderGridLayout from './FolderGridLayout'

// Disable SSR for EPUB preview
const EPUBPreview = dynamic(() => import('./previews/EPUBPreview'), {
  ssr: false,
})

// Convert query to path string
const queryToPath = (query?: ParsedUrlQuery) => {
  if (query) {
    const { path } = query
    if (!path) return '/'
    if (typeof path === 'string') return `/${encodeURIComponent(path)}`
    return `/${path.map(p => encodeURIComponent(p)).join('/')}`
  }
  return '/'
}

const renderEmoji = (name: string) => {
  const emoji = emojiRegex().exec(name)
  return { render: emoji && !emoji.index, emoji }
}
const formatChildName = (name: string) => {
  const { render, emoji } = renderEmoji(name)
  return render ? name.replace(emoji ? emoji[0] : '', '').trim() : name
}

export const ChildName: FC<{ name: string; folder?: boolean }> = ({ name, folder }) => {
  const original = formatChildName(name)
  const extension = folder ? '' : getRawExtension(original)
  const prename = folder ? original : original.substring(0, original.length - extension.length)
  return (
    <span className="truncate before:float-right before:content-[attr(data-tail)]" data-tail={extension}>
      {prename}
    </span>
  )
}
export const ChildIcon: FC<{ child: OdFolderChildren }> = ({ child }) => {
  const { render, emoji } = renderEmoji(child.name)
  return render ? (
    <span>{emoji ? emoji[0] : '📁'}</span>
  ) : (
    <FontAwesomeIcon icon={child.file ? getFileIcon(child.name, { video: Boolean(child.video) }) : ['far', 'folder']} />
  )
}

export const Checkbox: FC<{
  checked: 0 | 1 | 2
  onChange: () => void
  title: string
  indeterminate?: boolean
}> = ({ checked, onChange, title, indeterminate }) => {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.checked = Boolean(checked)
      if (indeterminate) {
        ref.current.indeterminate = checked == 1
      }
    }
  }, [ref, checked, indeterminate])

  const handleClick: MouseEventHandler = e => {
    if (ref.current) {
      if (e.target === ref.current) {
        e.stopPropagation()
      } else {
        ref.current.click()
      }
    }
  }

  return (
    <span
      title={title}
      className="inline-flex cursor-pointer items-center rounded p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600"
      onClick={handleClick}
    >
      <input
        className="form-check-input cursor-pointer"
        type="checkbox"
        value={checked ? '1' : ''}
        ref={ref}
        aria-label={title}
        onChange={onChange}
      />
    </span>
  )
}

export const Downloading: FC<{ title: string; style: string }> = ({ title, style }) => (
  <span title={title} className={`${style} rounded`} role="status">
    <LoadingIcon className="svg-inline--fa inline-block h-4 w-4 animate-spin" />
  </span>
)

const FileListing: FC<{ query?: ParsedUrlQuery }> = ({ query }) => {
  const [selected, setSelected] = useState<{ [key: string]: boolean }>({})
  const [totalSelected, setTotalSelected] = useState<0 | 1 | 2>(0)
  const [totalGenerating, setTotalGenerating] = useState<boolean>(false)
  const [folderGenerating, setFolderGenerating] = useState<{ [key: string]: boolean }>({})

  const router = useRouter()
  const hashedToken = getStoredToken(router.asPath)
  const [layout] = useLocalStorage('preferredLayout', layouts[0])

  const path = queryToPath(query)
  const { data, error, size, setSize } = useProtectedSWRInfinite(path)

  if (error) {
    if (error.status === 403) {
      router.push('/onedrive-oauth/step-1')
      return <div />
    }
    return (
      <PreviewContainer>
        {error.status === 401 ? <Auth redirect={path} /> : <FourOhFour errorMsg={JSON.stringify(error.message)} />}
      </PreviewContainer>
    )
  }

  if (!data) {
    return (
      <PreviewContainer>
        <Loading loadingText={'Loading ...'} />
      </PreviewContainer>
    )
  }

  const responses: any[] = data ? [].concat(...data) : []

  if ('folder' in responses[0]) {
    // ...folder view logic unchanged
    // omitted here for brevity (already shared)
  }

  if ('file' in responses[0] && responses.length === 1) {
    const file = responses[0].file as OdFileObject
    const previewType = getPreviewType(getExtension(file.name), { video: Boolean(file.video) })

    switch (previewType) {
      case preview.image:
        return <ImagePreview file={file} />
      case preview.text:
        return <TextPreview file={file} />
      case preview.code:
        return <CodePreview file={file} />
      case preview.markdown:
        return <MarkdownPreview file={file} path={path} />
      case preview.video:
        return <VideoPreview file={file} />
      case preview.audio:
        return <AudioPreview file={file} />
      case preview.pdf:
        return <PDFPreview file={file} />
      case preview.office:
        return <OfficePreview file={file} />
      case preview.epub:
        return <EPUBPreview file={file} />
      case preview.url:
        return <URLPreview file={file} />
      default:
        return <DefaultPreview file={file} />
    }
  }

  return (
    <PreviewContainer>
      <FourOhFour errorMsg={`Cannot preview ${path}`} />
    </PreviewContainer>
  )
}

export default FileListing
