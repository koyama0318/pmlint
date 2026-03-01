import type { Config, LintError, PromptIR } from './types'

export function validate(ir: PromptIR, config: Config, typeName: string): LintError[] {
  const typeDef = config.types[typeName]
  if (!typeDef) return []

  const sectionNames = new Set(ir.sections.map(s => s.name))
  const errors: LintError[] = []

  for (const required of typeDef.required) {
    if (!sectionNames.has(required)) {
      errors.push({
        file: ir.filePath,
        code: 'missing-section',
        message: `"${required}" section is required`,
        severity: 'error'
      })
    }
  }

  return errors
}
