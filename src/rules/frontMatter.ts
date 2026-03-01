import type { Config } from '../domain/config'
import type { LintError } from '../domain/error'
import type { PromptIR } from '../domain/ir'
import type { Rule } from './types'

export const frontMatterRule: Rule = (ir: PromptIR, config: Config): LintError[] => {
  if (!ir.frontMatter) return []

  const maxLen = config.front_matter?.constraints?.element?.text?.max_length_per_line
  if (maxLen == null) return []

  const fm = ir.frontMatter
  const errors: LintError[] = []
  fm.lines.forEach((line, idx) => {
    if (line.length > maxLen) {
      errors.push({
        file: ir.filePath,
        line: fm.startLine + idx,
        code: 'line-too-long',
        message: `front matter line exceeds ${maxLen} characters`,
        severity: 'error'
      })
    }
  })
  return errors
}
