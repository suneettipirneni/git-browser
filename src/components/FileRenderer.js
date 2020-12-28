import '../style/file-renderer.scss'
import React from 'react'
import PropTypes from 'prop-types'
import PDFRenderer from './renderers/PDFRenderer'
import ImageRenderer from './renderers/ImageRenderer'
import VideoRenderer from './renderers/VideoRenderer'
import AudioRenderer from './renderers/AudioRenderer'
import MarkdownRenderer from './renderers/MarkdownRenderer'
import { noop, base64DecodeUnicode } from '../scripts/util'
import { VscCode } from 'react-icons/vsc'

class FileRenderer extends React.Component {
  static validEditorExtensions = ['.svg', '.md', '.mdx']

  constructor(props) {
    super(props)

    this.getComponent = this.getComponent.bind(this)
    this.forceRenderEditor = this.forceRenderEditor.bind(this)
    this.renderUnsupported = this.renderUnsupported.bind(this)
    this.renderPreviewButton = this.renderPreviewButton.bind(this)
  }

  getComponent() {
    const { content, title, extension } = this.props

    switch (extension) {
      case '.apng':
      case '.avif':
      case '.gif':
      case '.png':
      case '.webp':
      case '.jpg':
      case '.jpeg':
      case '.jfif':
      case '.pjpeg':
      case '.pjp':
      case '.svg':
      case '.ico':
        return (
          <ImageRenderer content={content} extension={extension} alt={title} />
        )
      case '.pdf':
        return <PDFRenderer content={content} />
      case '.mp4':
      case '.webm':
        return <VideoRenderer content={content} extension={extension} />
      case '.mp3':
      case '.wav':
      case '.ogg':
        return <AudioRenderer content={content} extension={extension} />
      case '.md':
      case '.mdx':
        return <MarkdownRenderer content={base64DecodeUnicode(content)} />
      default:
        return this.renderUnsupported()
    }
  }

  renderUnsupported() {
    return (
      <div className="unsupported">
        <p>
          This file is not displayed because it&apos;s either binary or uses an
          unknown text encoding.
        </p>
        <button className="render-editor-btn" onClick={this.forceRenderEditor}>
          Do you want to load it anyway?
        </button>
      </div>
    )
  }

  renderPreviewButton() {
    if (!FileRenderer.validEditorExtensions.includes(this.props.extension)) {
      return null
    }

    return (
      <button
        className="editor-preview-btn"
        title="View as code"
        onClick={this.forceRenderEditor}
      >
        <VscCode />
      </button>
    )
  }

  forceRenderEditor() {
    // Let the App component know that ths file should
    // be rendered by the editor
    let content

    // The content may not be able to be properly decoded. If it
    // can't, we'll "force" decoding with atob
    try {
      content = base64DecodeUnicode(this.props.content)
    } catch (e) {
      content = atob(this.props.content)
    }

    this.props.onForceRender(content, true)
  }

  render() {
    return (
      <div className="file-renderer">
        {this.getComponent()}
        {this.renderPreviewButton()}
      </div>
    )
  }
}

FileRenderer.propTypes = {
  content: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  extension: PropTypes.string.isRequired,
  onForceRender: PropTypes.func
}

FileRenderer.defaultProps = {
  onForceRender: noop
}

export default FileRenderer
