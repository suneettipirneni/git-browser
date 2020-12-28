import '../../style/markdown-renderer.scss'
import 'highlight.js/styles/stackoverflow-light.css'
import React from 'react'
import MarkdownIt from 'markdown-it'
import markdownPluginCheckbox from 'markdown-it-checkbox'
import markdownPluginFrontMatter from 'markdown-it-front-matter'
import PropTypes from 'prop-types'
import hljs from 'highlight.js'
import { noop } from '../../scripts/util'

const md = new MarkdownIt({
  html: true,
  typographer: true,
  linkify: true,
  breaks: false,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (e) {
        // Ignored
      }
    }
    return ''
  }
})

md.use(markdownPluginCheckbox, {
  divWrap: true,
  divClass: 'markdown-checkbox'
})

md.use(markdownPluginFrontMatter, noop)

// Opens all links in a new tab when clicked
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrPush(['target', '_blank'])
  tokens[index].attrPush(['rel', 'noopener noreferrer'])
  return self.renderToken(tokens, index, options, env, self)
}

const MarkdownRenderer = props => (
  <div className="markdown-renderer">
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: md.render(props.content) }}
    />
  </div>
)

MarkdownRenderer.propTypes = {
  content: PropTypes.string.isRequired
}

export default MarkdownRenderer
