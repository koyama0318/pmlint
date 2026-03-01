import type { LintError, PromptIR, SectionIR } from './types'

export function parse(filePath: string, content: string): { ir: PromptIR; errors: LintError[] } {
  const lines = content.split('\n')
  const sections: SectionIR[] = []
  const errors: LintError[] = []
  const seen = new Map<string, number>() // name → first order

  let order = 0
  let current: { name: string; lines: string[] } | null = null

  const flushCurrent = () => {
    if (current === null) return
    const { name, lines } = current
    if (seen.has(name)) {
      errors.push({
        file: filePath,
        code: 'duplicate-section',
        message: `"${name}" section appears more than once`,
        severity: 'error'
      })
    } else {
      seen.set(name, order)
      sections.push({ name, order, content: lines.join('\n').trim() })
      order++
    }
    current = null
  }

  let inCodeBlock = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
    }

    if (!inCodeBlock && line.startsWith('## ')) {
      flushCurrent()
      const name = line.slice(3).trim()
      current = { name, lines: [] }
    } else {
      current?.lines.push(line)
    }
  }

  flushCurrent()

  return { ir: { filePath, sections }, errors }
}
