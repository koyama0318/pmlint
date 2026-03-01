import type { LintError } from './types'

export function formatText(errors: LintError[]): string {
  return errors.map(e => `${e.severity}  ${e.file}  ${e.code}  ${e.message}`).join('\n')
}
