import type { Config, LevelConfig } from '../domain/config'
import type { LintError } from '../domain/error'
import type { HeadingIR, PromptIR } from '../domain/ir'
import type { Rule } from './types'

function flattenHeadings(headings: HeadingIR[]): HeadingIR[] {
  return headings.flatMap(h => [h, ...flattenHeadings(h.children)])
}

function headingsAtLevel(ir: PromptIR, level: number): HeadingIR[] {
  return flattenHeadings(ir.headings).filter(h => h.level === level)
}

export const structureRule: Rule = (ir: PromptIR, config: Config): LintError[] => {
  const errors: LintError[] = []
  const mdConstraints = config.markdown?.constraints
  const allFlat = flattenHeadings(ir.headings)

  // no_duplicate_headings
  if (mdConstraints?.no_duplicate_headings) {
    const seen = new Map<string, number>()
    for (const h of allFlat) {
      const key = `${h.level}:${h.title}`
      seen.set(key, (seen.get(key) ?? 0) + 1)
    }
    for (const [key, count] of seen) {
      if (count > 1) {
        const title = key.split(':').slice(1).join(':')
        errors.push({
          file: ir.filePath,
          code: 'duplicate-heading',
          message: `"${title}" appears more than once`,
          severity: 'error'
        })
      }
    }
  }

  const levels = [1, 2, 3, 4] as const
  for (const level of levels) {
    const levelKey = `level${level}` as keyof NonNullable<Config['markdown']>['headings']
    const levelCfg: LevelConfig = config.markdown?.headings?.[levelKey] ?? {}
    const headingsOfLevel = headingsAtLevel(ir, level)
    const titlesFound = new Set(headingsOfLevel.map(h => h.title))

    // level.required: true → at least 1 heading of this level must exist
    if (levelCfg.required && headingsOfLevel.length === 0) {
      errors.push({
        file: ir.filePath,
        code: 'missing-heading',
        message: `at least one level-${level} heading is required`,
        severity: 'error'
      })
    }

    // items[].required
    for (const item of levelCfg.items ?? []) {
      if (item.required && !titlesFound.has(item.title)) {
        errors.push({
          file: ir.filePath,
          code: 'missing-heading',
          message: `"${item.title}" heading is required`,
          severity: 'error'
        })
      }
    }

    // allow_additional_headings: false → headings not in items are forbidden
    if (mdConstraints?.allow_additional_headings === false && levelCfg.items) {
      const allowedTitles = new Set(levelCfg.items.map(i => i.title))
      for (const h of headingsOfLevel) {
        if (!allowedTitles.has(h.title)) {
          errors.push({
            file: ir.filePath,
            code: 'extra-heading',
            message: `"${h.title}" is not defined in the schema`,
            severity: 'error'
          })
        }
      }
    }
  }

  return errors
}
