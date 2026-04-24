/**
 * Strips surrounding quotation marks from model output (straight/curly/single)
 * so send-ready text does not carry leading/trailing " or " characters.
 */
const QUOTE_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['"', '"'],
  ['\u201c', '\u201d'], // “ ”
  ['\u201e', '\u201c'], // „ “
  ['\u00ab', '\u00bb'], // « »
  ['\u2039', '\u203a'], // ‹ ›
  ["'", "'"],
  ['\u2018', '\u2019'], // ‘ ’
]

export function stripAiMessageQuotes(input: string): string {
  let s = input.trim()
  for (let depth = 0; depth < 6; depth += 1) {
    let changed = false
    for (const [open, close] of QUOTE_PAIRS) {
      if (s.length >= open.length + close.length && s.startsWith(open) && s.endsWith(close)) {
        s = s.slice(open.length, s.length - close.length).trim()
        changed = true
        break
      }
    }
    if (!changed) break
  }
  return s
}
