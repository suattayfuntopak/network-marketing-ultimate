/** Title-style headings: capitalize the first letter of each whitespace-delimited segment (TR/EN aware). */
export function toHeadingCase(text: string, locale: 'tr' | 'en'): string {
  const loc = locale === 'tr' ? 'tr-TR' : 'en-US'
  return text
    .split(/\s+/)
    .map((word) => {
      if (!word) return word
      if (!/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/.test(word)) return word
      const letters = word.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '')
      if (letters.length > 1 && letters === letters.toLocaleUpperCase(loc)) {
        return word
      }
      const first = word.charAt(0).toLocaleUpperCase(loc)
      const rest = word.slice(1).toLocaleLowerCase(loc)
      return first + rest
    })
    .join(' ')
}
