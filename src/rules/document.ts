import type { Config } from '../domain/config'
import type { LintError } from '../domain/error'
import type { PromptIR } from '../domain/ir'
import type { Rule } from './types'

export const documentRule: Rule = (ir: PromptIR, config: Config): LintError[] => {
  const errors: LintError[] = []
  const len = config.constraints?.length
  if (!len) return errors

  if (len.min_lines != null && ir.totalLineCount < len.min_lines) {
    errors.push({
      file: ir.filePath,
      code: 'doc-too-short',
      message: `document has ${ir.totalLineCount} lines, minimum is ${len.min_lines}`,
      severity: 'error'
    })
  }
  if (len.max_lines != null && ir.totalLineCount > len.max_lines) {
    errors.push({
      file: ir.filePath,
      code: 'doc-too-long',
      message: `document has ${ir.totalLineCount} lines, maximum is ${len.max_lines}`,
      severity: 'error'
    })
  }
  return errors
}
