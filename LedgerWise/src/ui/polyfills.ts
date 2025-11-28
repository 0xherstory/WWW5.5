// Polyfills for Web3 libraries
if (typeof window !== 'undefined') {
  window.global = window
  global.Buffer = global.Buffer || require('buffer').Buffer
}
