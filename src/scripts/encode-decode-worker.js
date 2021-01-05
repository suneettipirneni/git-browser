/* eslint-disable no-var, semi */
import { base64DecodeUnicode, base64EncodeUnicode } from './util'

// Encoding/decoding a large string can take time and it blocks the main thread.
// Because of this, we have to encode/decode it using a worker and post
// the result when it's finished.
onmessage = function (event) {
  const { message, type, raw = false } = event.data
  let content = null

  switch (type.toLowerCase()) {
    case 'encode':
      content = encode(message, raw)
      break
    case 'decode':
      content = decode(message, raw)
      break
    default:
      throw new Error(
        `Invalid type ${type}. Must be either 'encode' or 'decode'`
      )
  }

  postMessage(content)
}

function encode(content, raw) {
  if (raw) {
    return btoa(content)
  }

  try {
    return base64EncodeUnicode(content)
  } catch (e) {
    return null
  }
}

function decode(content, raw) {
  if (raw) {
    return atob(content)
  }

  try {
    return base64DecodeUnicode(content)
  } catch (e) {
    return null
  }
}
