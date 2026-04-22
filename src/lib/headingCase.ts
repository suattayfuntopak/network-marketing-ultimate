/** Title-style headings: capitalize the first letter of each whitespace-delimited segment (TR/EN aware). */
export function toHeadingCase(text: string, locale: 'tr' | 'en'): string {
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'

  function capitalizeWord(word: string): string {
    if (!word) return word
    if (!/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/.test(word)) return word
    if (word.includes('-')) {
      return word.split('-').map((part) => capitalizeWord(part)).join('-')
    }
    const letters = word.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '')
    if (letters.length > 1 && letters === letters.toLocaleUpperCase(loc)) {
      return word
    }
    const first = word.charAt(0).toLocaleUpperCase(loc)
    const rest = word.slice(1).toLocaleLowerCase(loc)
    return first + rest
  }

  return text
    .split(/\s+/)
    .map((word) => capitalizeWord(word))
    .join(' ')
}
