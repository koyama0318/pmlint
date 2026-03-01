import type { LintError } from './types'

export function formatText(errors: LintError[]): string {
  return errors
    .map(e => {
      const location = e.line != null ? `${e.file}:${e.line}` : e.file
      return `${e.severity}  ${location}  ${e.code}  ${e.message}`
    })
    .join('\n')
}
